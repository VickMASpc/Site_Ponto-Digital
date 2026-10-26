import { GoogleGenAI, Modality } from '@google/genai';

const tools = [{
  functionDeclarations: [
    {name:'navigate_to',description:'Navegar para uma página do site. IDs válidos: inicio, empresa, solucoes, acessibilidade, impacto, laboratorio.',parameters:{type:'OBJECT',properties:{page:{type:'STRING',description:'ID da página de destino'}},required:['page']}},
    {name:'get_page_content',description:'Receber título e conteúdo de uma página ou da página atual para explicar ou resumir.',parameters:{type:'OBJECT',properties:{page:{type:'STRING',description:'ID opcional da página; por padrão a atual'}}}},
    {name:'read_section',description:'Pedir o conteúdo completo de uma seção para lê-lo em voz alta pelo modelo.',parameters:{type:'OBJECT',properties:{section:{type:'STRING',description:'Nome ou parte do título da seção'}}}},
    {name:'summarize_section',description:'Obter o texto de uma seção a ser resumido em voz alta.',parameters:{type:'OBJECT',properties:{section:{type:'STRING'}}}},
    {name:'get_navigation_options',description:'Listar todas as páginas disponíveis.',parameters:{type:'OBJECT',properties:{}}},
    {name:'set_theme',description:'Alterar o tema visual.',parameters:{type:'OBJECT',properties:{theme:{type:'STRING',description:'light, dark ou contrast'}},required:['theme']}},
    {name:'set_font_scale',description:'Alterar a escala de texto.',parameters:{type:'OBJECT',properties:{scale:{type:'NUMBER',description:'Escala entre 1 e 1.55'}},required:['scale']}},
    {name:'set_microphone_mode',description:'Alterar o comportamento do microfone.',parameters:{type:'OBJECT',properties:{mode:{type:'STRING',description:'toggle ou hold'}},required:['mode']}},
    {name:'set_narration_speed',description:'Alterar velocidade do narrador TTS do navegador.',parameters:{type:'OBJECT',properties:{rate:{type:'NUMBER',description:'0.7 até 1.4'}},required:['rate']}},
    {name:'get_accessibility_settings',description:'Consultar configurações de acessibilidade.',parameters:{type:'OBJECT',properties:{}}}
  ].map(f=>({...f,behavior:'NON_BLOCKING'}))
}];

const instructions = `Você é o guia de voz do próprio site Ponto Digital, no idioma português brasileiro.
Converse naturalmente com visitantes. Seja objetivo, gentil, proativo e profundamente útil para pessoas cegas ou com baixa visão.
Você tem ferramentas para navegar, ler o conteúdo REAL da página e configurar a interface. Use-as para ações e para consultar fatos do site; nunca finja ter executado algo.
Diferencie a atividade principal da Ponto Digital (desenvolvimento B2B) de conceitos de produtos em avaliação. ERP e gestão de contratos são ideias, não produtos comerciais comprovadamente lançados.
Dê descrições úteis de onde o usuário está após a navegação. Não invente preços, endereço exato, clientes, certificações WCAG ou impacto ecológico.
O site funciona com teclas, leitura local e outras rotas mesmo sem você. Não instrua usuários a expor uma chave de API.
Se o usuário pedir uma alteração que não há ferramenta para executar, explique a limitação em vez de afirmar sucesso.
Ao receber texto de seção, recite ou resuma conforme solicitado. Evite discursos longos sem necessidade.
`;

function encodePCM(samples, sampleRate) {
  const outLength = Math.floor(samples.length * 16000 / sampleRate);
  if (!outLength) return null;
  const out = new Int16Array(outLength);
  const ratio = sampleRate / 16000;
  for (let i=0; i<outLength; i++) {
    const value = Math.max(-1,Math.min(1,samples[Math.min(samples.length-1,Math.floor(i*ratio))]));
    out[i] = value < 0 ? value*32768 : value*32767;
  }
  const bytes = new Uint8Array(out.buffer);
  let binary='';
  for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
}
function decodePCM(base64) {
  const binary=atob(base64);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  const sampleCount=Math.floor(bytes.byteLength/2);
  const output=new Float32Array(sampleCount);
  const data=new DataView(bytes.buffer);
  for(let i=0;i<sampleCount;i++) output[i]=data.getInt16(i*2,true)/32768;
  return output;
}

export class LiveBridge {
  constructor({onState,onText,onTool,onError,onAudio}) {
    this.onState=onState; this.onText=onText; this.onTool=onTool; this.onError=onError; this.onAudio=onAudio;
    this.session=null; this.connected=false; this.recording=false;
    this.inputStream=null; this.inputContext=null; this.worklet=null; this.source=null;
    this.outputContext=null; this.nextPlayTime=0; this.scheduled=new Set();
    this.opening=null; this.sessionId=0;
  }
  async connect(model,level) {
    if(this.connected) return;
    if(this.opening) return this.opening;
    const endpoint=import.meta.env.VITE_TOKEN_ENDPOINT || (location.hostname.endsWith('.github.io') ? null : '/token');
    if(!endpoint) throw new Error('Conversa Live não configurada no servidor. O narrador local continua disponível.');
    const attempt=++this.sessionId;
    this.onState('connecting');
    this.opening=(async()=>{
      const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model})});
      let payload={};
      try{payload=await res.json()}catch{}
      if(!res.ok || !payload.token) throw new Error(payload.error || 'Não foi possível criar a sessão de voz.');
      const client=new GoogleGenAI({apiKey:payload.token,httpOptions:{apiVersion:'v1beta'}});
      await this.initOutput();
      if(attempt!==this.sessionId) return;
      const config={
        responseModalities:[Modality.AUDIO],
        systemInstruction:instructions,
        tools,
        inputAudioTranscription:{},
        outputAudioTranscription:{},
        sessionResumption:{},
        speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Aoede'}}}
      };
      if(model==='gemini-3.8-live-extended-thinking') config.thinkingConfig={thinkingLevel:level.toUpperCase()};
      const session=await client.live.connect({
        model,config,
        callbacks:{
          onopen:()=>{},
          onmessage:(message)=>{if(attempt===this.sessionId) this.processMessage(message).catch(e=>this.onError(e.message));},
          onerror:(e)=>{if(attempt===this.sessionId) this.onError('Falha na conexão Live: '+(e.message||'erro de rede'));},
          onclose:()=>{if(attempt===this.sessionId){this.connected=false;this.stopMicrophone();this.stopPlayback();this.onState('offline');}}
        }
      });
      if(attempt!==this.sessionId){session.close();return;}
      this.session=session; this.connected=true; this.onState('ready');
    })();
    try {await this.opening;}catch(e){this.onState('offline');throw e;}finally{this.opening=null;}
  }
  async initOutput() {
    if (!this.outputContext) this.outputContext=new AudioContext();
    if(this.outputContext.state==='suspended') this.outputContext.resume().catch(()=>{});
  }
  playAudio(base64,mime='') {
    if (!base64 || !this.outputContext) return;
    const rate=Number((mime.match(/rate=(\d+)/)||[])[1])||24000;
    const samples=decodePCM(base64);
    if(!samples.length) return;
    const buffer=this.outputContext.createBuffer(1,samples.length,rate);
    buffer.copyToChannel(samples,0);
    const source=this.outputContext.createBufferSource();
    source.buffer=buffer;source.connect(this.outputContext.destination);
    const start=Math.max(this.outputContext.currentTime+0.03,this.nextPlayTime);
    source.start(start);this.nextPlayTime=start+buffer.duration;
    this.scheduled.add(source);
    source.onended=()=>this.scheduled.delete(source);
  }
  stopPlayback() {
    for(const source of this.scheduled){try{source.stop()}catch{}}
    this.scheduled.clear();this.nextPlayTime=0;
  }
  async processMessage(msg) {
    if(msg.serverContent?.interrupted) this.stopPlayback();
    const interactionStatus=msg.interactionStatus||msg.serverContent?.interactionStatus;
    if(interactionStatus==='IN_PROGRESS' && !this.recording) this.onState('busy');
    if(interactionStatus==='IDLE') this.onState(this.recording?'listening':'ready');
    const content=msg.serverContent;
    if(content?.inputTranscription?.text) this.onText('Você',content.inputTranscription.text);
    if(content?.outputTranscription?.text) this.onText('Ponto',content.outputTranscription.text);
    if(content?.modelTurn?.parts) for(const part of content.modelTurn.parts) {
      if(part.inlineData?.data && (part.inlineData.mimeType||'').startsWith('audio/')) {this.onAudio?.();this.playAudio(part.inlineData.data,part.inlineData.mimeType);}
    }
    if(msg.toolCall?.functionCalls?.length) {
      const responses=await Promise.all(msg.toolCall.functionCalls.map(async call=>{
        try {const response=await this.onTool(call.name,call.args||{});return {id:call.id,name:call.name,response:{result:response}};}
        catch(error){return {id:call.id,name:call.name,response:{error:String(error.message||error)}};}
      }));
      if(this.session?.sendToolResponse) this.session.sendToolResponse({functionResponses:responses});
    }
  }
  async startMicrophone() {
    if(this.recording) return;
    if(!this.connected||!this.session) throw new Error('A sessão não está conectada.');
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não disponibiliza microfone.');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    let ctx;
    try {
      ctx=new AudioContext();
      await ctx.resume();
      await ctx.audioWorklet.addModule(import.meta.env.BASE_URL+'pcm-worklet.js');
      const source=ctx.createMediaStreamSource(stream);
      const node=new AudioWorkletNode(ctx,'ponto-pcm');
      const silent=ctx.createGain();silent.gain.value=0;
      node.port.onmessage=(e)=>{
        if(!this.recording||!this.session) return;
        const pcm=encodePCM(e.data,ctx.sampleRate);
        if(pcm) this.session.sendRealtimeInput({audio:{data:pcm,mimeType:'audio/pcm;rate=16000'}});
      };
      source.connect(node);node.connect(silent);silent.connect(ctx.destination);
      this.inputStream=stream;this.inputContext=ctx;this.source=source;this.worklet=node;
      this.recording=true;this.onState('listening');
    } catch(e) {stream.getTracks().forEach(track=>track.stop()); if(ctx) await ctx.close();throw e;}
  }
  stopMicrophone() {
    if(!this.recording && !this.inputStream) return;
    this.recording=false;
    this.inputStream?.getTracks().forEach(track=>track.stop());
    this.inputStream=null;
    try{this.worklet?.disconnect();this.source?.disconnect()}catch{}
    this.worklet=null;this.source=null;
    this.inputContext?.close().catch(()=>{});this.inputContext=null;
    if(this.session&&this.connected) {
      try{this.session.sendRealtimeInput({audioStreamEnd:true})}catch{}
      this.onState('ready');
    }
  }
  sendText(text) {
    if(!this.connected||!this.session) throw new Error('Conecte o assistente primeiro.');
    this.onText('Você',text);
    this.session.sendClientContent({turns:[{role:'user',parts:[{text}]}],turnComplete:true});
  }
  disconnect() {
    this.sessionId++;this.stopMicrophone();this.stopPlayback();
    try{this.session?.close()}catch{}
    this.session=null;this.connected=false;
    this.outputContext?.close().catch(()=>{});this.outputContext=null;
    this.onState('offline');
  }
}
