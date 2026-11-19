import { GoogleGenAI, Modality } from '@google/genai';
import { NAV } from './data.js';

export const LIVE_FAST = 'gemini-3.8-live';
export const LIVE_EXTENDED = 'gemini-3.8-live-extended-thinking';
const pages = NAV.map(({id}) => id);
const pageParameter = {type:'STRING',enum:pages};

const tools = [{
  functionDeclarations: [
    {name:'navigate_to',description:'Abrir uma página real do site e mover o foco para seu título.',parameters:{type:'OBJECT',properties:{page:pageParameter},required:['page']}},
    {name:'get_page_content',description:'Receber título e conteúdo de uma página ou da página atual para explicar ou resumir.',parameters:{type:'OBJECT',properties:{page:{type:'STRING',description:'ID opcional da página; por padrão a atual'}}}},
    {name:'read_page',description:'Iniciar imediatamente o narrador local para ler a página atual em voz alta.'},
    {name:'read_section',description:'Iniciar imediatamente o narrador local para ler uma seção da página atual em voz alta.',parameters:{type:'OBJECT',properties:{section:{type:'STRING',description:'Nome ou parte do título da seção'}}}},
    {name:'summarize_section',description:'Obter o texto de uma seção a ser resumido em voz alta.',parameters:{type:'OBJECT',properties:{section:{type:'STRING'}}}},
    {name:'get_navigation_options',description:'Listar todas as páginas disponíveis.'},
    {name:'set_theme',description:'Alterar o tema visual.',parameters:{type:'OBJECT',properties:{theme:{type:'STRING',description:'light, dark ou contrast'}},required:['theme']}},
    {name:'set_font_scale',description:'Alterar a escala de texto.',parameters:{type:'OBJECT',properties:{scale:{type:'NUMBER',description:'Escala entre 1 e 1.55'}},required:['scale']}},
    {name:'set_microphone_mode',description:'Alterar o comportamento do microfone.',parameters:{type:'OBJECT',properties:{mode:{type:'STRING',description:'toggle ou hold'}},required:['mode']}},
    {name:'set_narration_speed',description:'Alterar velocidade do narrador TTS do navegador.',parameters:{type:'OBJECT',properties:{rate:{type:'NUMBER',description:'0.7 até 1.4'}},required:['rate']}},
    {name:'get_accessibility_settings',description:'Consultar configurações de acessibilidade.'}
  ]
}];

const instructions = `Você é o guia de voz do próprio site Ponto Digital, no idioma português brasileiro.
Converse naturalmente com visitantes. Seja objetivo, gentil, proativo e profundamente útil para pessoas cegas ou com baixa visão.
Você tem ferramentas para navegar, ler o conteúdo REAL da página e configurar a interface. Use-as para ações e para consultar fatos do site; nunca finja ter executado algo.
Diferencie a atividade principal da Ponto Digital (desenvolvimento B2B) de conceitos de produtos em avaliação. ERP e gestão de contratos são ideias, não produtos comerciais comprovadamente lançados.
Dê descrições úteis de onde o usuário está após a navegação. Não invente preços, endereço exato, clientes, certificações WCAG ou impacto ecológico.
O site funciona com teclas, leitura local e outras rotas mesmo sem você. Não instrua usuários a expor uma chave de API.
Se o usuário pedir uma alteração que não há ferramenta para executar, explique a limitação em vez de afirmar sucesso.
Use navigate_to por iniciativa própria quando mostrar a página correspondente ajudar na tarefa do visitante. Por exemplo, se ele quiser explorar soluções B2B ou perguntar onde ajustar o tamanho do texto, abra Soluções ou Acessibilidade. Use get_page_content para uma pergunta que só exige informação, sem mudar a página à toa.
Use read_page ou read_section para iniciar o narrador local quando o visitante quiser ouvir a página ou quando a leitura for pertinente a um pedido de ajuda para acompanhar a tela. Para abrir e ler, chame navigate_to primeiro e read_page depois, ou envie as duas chamadas nessa ordem. Não solicite outro clique. Se o narrador começar, deixe-o ler sem recitar o mesmo texto. Se a ferramenta informar que o navegador bloqueou a leitura, use o conteúdo retornado para ler pela voz do Gemini. Resuma somente quando a pessoa pedir um resumo.
As mensagens de contexto que começam com [Ponto Digital] registram ações realizadas pela interface. Use-as apenas para acompanhar o estado da página.
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
  constructor({onState,onText,onTool,onError,allowAudio,onVoiceCommand,onVoiceInput}) {
    this.onState=onState; this.onText=onText; this.onTool=onTool; this.onError=onError;
    this.allowAudio=allowAudio; this.onVoiceCommand=onVoiceCommand; this.onVoiceInput=onVoiceInput;
    this.session=null; this.connected=false; this.recording=false;
    this.inputStream=null; this.inputContext=null; this.worklet=null; this.source=null;
    this.outputContext=null; this.nextPlayTime=0; this.scheduled=new Set();
    this.opening=null; this.sessionId=0;
    this.model=null;
    this.voiceText=''; this.voiceCommandTimer=null; this.actionsThisTurn=new Set();
  }
  async connect(model,level) {
    if(this.connected) return true;
    if(this.opening) return this.opening.promise;
    const endpoint=import.meta.env.VITE_TOKEN_ENDPOINT || (location.hostname.endsWith('.github.io') ? null : '/token');
    if(!endpoint) throw new Error('Conversa Live não configurada no servidor. O narrador local continua disponível.');
    const attempt=++this.sessionId;
    const controller=new AbortController();
    const opening={controller};
    this.opening=opening;
    this.onState('connecting');
    const timeout=setTimeout(()=>controller.abort(new Error('O Gemini demorou para confirmar a sessão. Tente conectar novamente.')),15000);
    opening.promise=(async()=>{
      this.initOutput();
      const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model}),signal:controller.signal});
      let payload={};
      try{payload=await res.json()}catch{}
      if(!res.ok || !payload.token) {
        const errorText=typeof payload.error==='string'?payload.error:'Não foi possível criar a sessão de voz.';
        throw new Error(errorText);
      }
      controller.signal.throwIfAborted();
      const client=new GoogleGenAI({apiKey:payload.token,httpOptions:{apiVersion:'v1beta'}});
      const extended=model===LIVE_EXTENDED;
      const functionDeclarations=tools[0].functionDeclarations.map(tool=>extended?{...tool,behavior:'NON_BLOCKING'}:tool);
      const config={
        responseModalities:[Modality.AUDIO],
        systemInstruction:instructions,
        tools:[{functionDeclarations}],
        inputAudioTranscription:{},
        outputAudioTranscription:{},
        speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Aoede'}}}
      };
      if(extended) config.thinkingConfig={thinkingLevel:(['low','medium','high'].includes(level)?level:'medium').toUpperCase()};
      let session;
      const setup=new Promise((resolve,reject)=>{
        controller.signal.addEventListener('abort',()=>reject(controller.signal.reason),{once:true});
        const connecting=client.live.connect({
          model,config,
          callbacks:{
            onmessage:(message)=>{
              if(attempt!==this.sessionId || controller.signal.aborted) return;
              if(message.setupComplete) {resolve();return;}
              if(this.connected) this.processMessage(message).catch(e=>this.onError(e.message));
            },
            onerror:()=>{
              if(!this.connected) reject(new Error('Falha ao abrir a conexão com o Gemini.'));
            },
            onclose:(event)=>{
              if(attempt!==this.sessionId || controller.signal.aborted) return;
              const reason=event.reason?.replace(/[\r\n]+/g,' ').slice(0,200);
              const error='O Gemini encerrou a conexão ('+event.code+').'+(reason?' '+reason:'');
              if(this.connected) {this.disconnect();this.onError(error);}
              else reject(new Error(error));
            }
          }
        });
        connecting.then(value=>{
          session=value;
          if(controller.signal.aborted) {try{session.close();}catch{}}
        },reject);
      });
      try {await setup;controller.signal.throwIfAborted();}
      catch(error){controller.abort();try{session?.close();}catch{}throw error;}
      this.session=session;this.model=model;this.connected=true;this.onState('ready');
      return true;
    })();
    try {return await opening.promise;}
    catch(e){
      if(attempt!==this.sessionId) return false;
      this.onState('offline');
      throw e;
    } finally {
      clearTimeout(timeout);
      if(this.opening===opening) this.opening=null;
    }
  }
  initOutput() {
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
    const session=this.session;
    const content=msg.serverContent;
    if(content?.interrupted) {
      this.stopPlayback();
      clearTimeout(this.voiceCommandTimer);
      this.voiceText='';
      this.actionsThisTurn.clear();
      this.onVoiceInput?.();
    }
    const input=content?.inputTranscription;
    if(input?.text) {
      if(!this.voiceText) {clearTimeout(this.voiceCommandTimer);this.actionsThisTurn.clear();}
      this.onText('Você',input.text);
      this.voiceText+=input.text;
    }
    if(input?.finished || content?.turnComplete) this.scheduleVoiceCommand(session);
    const status=content?.interactionStatus ?? msg.interactionStatus;
    if(status==='IN_PROGRESS' && !this.recording) this.onState('busy');
    if(status==='IDLE' || (content?.turnComplete && this.model===LIVE_FAST)) this.onState(this.recording?'listening':'ready');
    if(content?.outputTranscription?.text) this.onText('Ponto',content.outputTranscription.text);
    for(const part of content?.modelTurn?.parts ?? []) {
      if(part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/') && this.allowAudio?.()!==false) {
        this.playAudio(part.inlineData.data,part.inlineData.mimeType);
      }
    }
    if(msg.toolCall?.functionCalls?.length) {
      const functionResponses=[];
      for(const {id,name,args} of msg.toolCall.functionCalls) {
        if(session!==this.session) return;
        try {
          const result=await this.onTool(name,args||{});
          if(result?.success) this.actionsThisTurn.add(name);
          functionResponses.push({id,name,response:{result}});
        } catch(error){
          functionResponses.push({id,name,response:{error:String(error.message||error)}});
        }
      }
      if(session===this.session) session.sendToolResponse({functionResponses});
    }
  }
  scheduleVoiceCommand(session) {
    const text=this.voiceText.trim();
    if(!text) return;
    this.voiceText='';
    if(this.model!==LIVE_EXTENDED) return;
    clearTimeout(this.voiceCommandTimer);
    this.voiceCommandTimer=setTimeout(()=>{
      if(session!==this.session) return;
      const actions=new Set(this.actionsThisTurn);
      this.actionsThisTurn.clear();
      this.onVoiceCommand?.(text,actions);
    },1800);
  }
  async startMicrophone() {
    if(this.recording) return;
    if(!this.connected||!this.session) throw new Error('A sessão não está conectada.');
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não disponibiliza microfone.');
    const session=this.session;
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    let ctx;
    try {
      ctx=new AudioContext();
      await ctx.resume();
      await ctx.audioWorklet.addModule(import.meta.env.BASE_URL+'pcm-worklet.js');
      if(session!==this.session || !this.connected) {stream.getTracks().forEach(track=>track.stop());await ctx.close();return;}
      const source=ctx.createMediaStreamSource(stream);
      const node=new AudioWorkletNode(ctx,'ponto-pcm');
      const silent=ctx.createGain();silent.gain.value=0;
      node.port.onmessage=(e)=>{
        if(!this.recording||this.session!==session || this.allowAudio?.('microphone')===false) return;
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
    clearTimeout(this.voiceCommandTimer);this.voiceText='';this.actionsThisTurn.clear();
    this.onText('Você',text);
    this.session.sendRealtimeInput({text});
  }
  noteSiteAction(text) {
    if(this.connected) this.session.sendClientContent({turns:[{role:'model',parts:[{text:'[Ponto Digital] '+text}]}],turnComplete:false});
  }
  disconnect() {
    this.sessionId++;
    this.opening?.controller.abort();this.opening=null;
    clearTimeout(this.voiceCommandTimer);this.voiceText='';this.actionsThisTurn.clear();
    this.stopMicrophone();this.stopPlayback();
    try{this.session?.close()}catch{}
    this.session=null;this.connected=false;this.model=null;
    this.outputContext?.close().catch(()=>{});this.outputContext=null;
    this.onState('offline');
  }
}
