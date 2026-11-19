import { GoogleGenAI, Modality } from '@google/genai';
import { NAV, CONTENT } from './data.js';

export const LIVE_FAST = 'gemini-3.8-live';
export const LIVE_EXTENDED = 'gemini-3.8-live-extended-thinking';
export const LIVE_FLASH = 'gemini-3.1-flash-live-preview';
const TURN_IDLE_TIMEOUT_MS = 15000;
const pages = NAV.map(({id}) => id);
const pageParameter = {type:'STRING',enum:pages};

const tools = [{
  functionDeclarations: [
    {
      name:'navigate_to',
      description:'Abrir uma página real. Para abrir e ler, decida ambas as ações nesta chamada com readAloud true.',
      parameters:{type:'OBJECT',required:['page'],properties:{
        page:pageParameter,
        readAloud:{type:'BOOLEAN',description:'Ativa a leitura da página após abrir. O padrão é false.'},
        section:{type:'STRING',description:'Título da seção a ler no lugar da página inteira, quando readAloud for true.'},
        silent:{type:'BOOLEAN',description:'Use true se o visitante pedir para navegar em silêncio, inclusive sem confirmação falada.'}
      }}
    },
    {name:'get_page_content',description:'Receber título e conteúdo de uma página ou da página atual para explicar ou resumir.',parameters:{type:'OBJECT',properties:{page:{type:'STRING',description:'ID opcional da página; por padrão a atual'}}}},
    {name:'read_page',description:'Iniciar imediatamente a leitura da página atual em voz alta.'},
    {name:'stop_reading',description:'Interromper a leitura em andamento.'},
    {name:'read_section',description:'Iniciar imediatamente o narrador local para ler uma seção da página atual em voz alta.',parameters:{type:'OBJECT',properties:{section:{type:'STRING',description:'Nome ou parte do título da seção'}},required:['section']}},
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
Diferencie a atividade principal da Ponto Digital (desenvolvimento B2B) de conceitos de produtos em avaliação. ERP e gestão de contratos são ideias, não produtos comerciais comprovadamente lançados.
Dê descrições úteis de onde o usuário está após a navegação. Não invente preços, endereço exato, clientes, certificações WCAG ou impacto ecológico.
O site funciona com teclas, leitura local e outras rotas mesmo sem você. Não instrua usuários a expor uma chave de API.
Se o usuário pedir uma alteração que não há ferramenta para executar, explique a limitação em vez de afirmar sucesso.
Para perguntas e comentários sobre conteúdo do site, fale diretamente com base no catálogo a seguir. Use uma ferramenta quando a ação realmente precisar do site ou faltar informação.
${NAV.map(({id,label})=>label+': '+CONTENT[id].description+' '+CONTENT[id].sections.map(({title,body})=>title+' — '+body).join(' ')).join('\n')}
Use as ferramentas para executar ações. Se levar o visitante até conteúdo útil, decida se também deve lê-lo. Quando for abrir e ler, chame navigate_to uma vez com readAloud true. Use section junto com readAloud para ler somente a seção indicada. Ao mostrar uma página a quem navega por voz, a leitura costuma ajudar. Respeite pedidos de silêncio com silent true e sem confirmação falada. Perguntas de informação podem ser respondidas sem trocar de página. Para ler a página atual, use read_page ou read_section.
Faça a chamada antes de afirmar que executou uma ação. Quando a ferramenta confirmar a leitura local, deixe-a tocar. Quando o resultado de leitura (ou result.narration) contiver text para leitura por voz do Gemini, leia esse conteúdo na própria resposta à ferramenta, sem pedir outra ação do visitante. Quando o resultado informar cancelamento, interrompa a leitura.
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
  constructor({onState,onText,onTurnEnd,onTool,onToolsComplete,onNarration,onError,onStalled,onTextOnly,allowAudio,onVoiceInput}) {
    this.onState=onState; this.onText=onText; this.onTurnEnd=onTurnEnd; this.onTool=onTool; this.onError=onError;
    this.onToolsComplete=onToolsComplete;this.onNarration=onNarration;
    this.onStalled=onStalled;this.onTextOnly=onTextOnly;
    this.allowAudio=allowAudio; this.onVoiceInput=onVoiceInput;
    this.session=null; this.connected=false; this.recording=false;
    this.inputStream=null; this.inputContext=null; this.worklet=null; this.source=null;
    this.outputContext=null; this.nextPlayTime=0; this.scheduled=new Set();
    this.opening=null; this.sessionId=0;
    this.model=null;
    this.nextOutputSegment=false;
    this.narration=null;this.narrationTimer=null;this.narrationIdle=false;this.silenceOutput=false;
    this.toolQueue=Promise.resolve();this.cancelledTools=new Set();
    this.turn=null;this.turnTimer=null;
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
      const config={
        responseModalities:[Modality.AUDIO],
        systemInstruction:instructions,
        tools:extended?tools.map(({functionDeclarations})=>({
          functionDeclarations:functionDeclarations.map(tool=>({...tool,behavior:'NON_BLOCKING'}))
        })):tools,
        inputAudioTranscription:{},
        outputAudioTranscription:{},
        speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Aoede'}}}
      };
      if(extended) config.thinkingConfig={thinkingLevel:(['low','medium','high'].includes(level)?level:'medium').toUpperCase()};
      else if(model===LIVE_FLASH)config.thinkingConfig={thinkingLevel:'MINIMAL'};
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
              if(this.connected)this.failTurn(error);
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
    if(typeof AudioContext!=='function')return;
    if (!this.outputContext) this.outputContext=new AudioContext();
    if(this.outputContext.state!=='running' && this.outputContext.state!=='closed')this.outputContext.resume().catch(()=>{});
  }
  playAudio(base64,mime='') {
    if (!base64 || !this.outputContext || this.silenceOutput) return;
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
    if(this.narration==='pending' && this.outputContext.state==='running')this.setNarration('playing');
    source.onended=()=>{
      this.scheduled.delete(source);
      if(this.narration==='playing' && this.narrationIdle && !this.scheduled.size)this.setNarration(null);
    };
    return this.outputContext.state==='running';
  }
  stopPlayback() {
    for(const source of this.scheduled){try{source.stop()}catch{}}
    this.scheduled.clear();this.nextPlayTime=0;
  }
  beginTurn(text='', typed=false, interrupting=false) {
    this.turn={text,typed,interrupting,hasTool:false,hasAudio:false,localNarration:false,transcript:''};
    this.watchTurn();
  }
  watchTurn() {
    clearTimeout(this.turnTimer);
    const turn=this.turn;
    if(!turn)return;
    this.turnTimer=setTimeout(()=>this.failTurn('O Gemini ficou 15 segundos sem avançar e a sessão foi encerrada.'),TURN_IDLE_TIMEOUT_MS);
  }
  failTurn(reason) {
    const {turn,model}=this;
    this.disconnect();
    if(turn)this.onStalled?.({model,retryText:turn.hasTool?'':turn.text.trim(),reason});
    else this.onError(reason);
  }
  markLocalNarration() {
    if(this.turn)this.turn.localNarration=true;
  }
  endTurn() {
    clearTimeout(this.turnTimer);
    const turn=this.turn;
    this.turn=null;
    if(turn?.transcript.trim() && !turn.hasAudio && !turn.localNarration && !this.silenceOutput){
      this.stopPlayback();
      if(this.narration==='pending')this.setNarration(null);
      this.onTextOnly?.(turn.transcript.trim());
    }
  }
  async processMessage(msg) {
    const session=this.session;
    const content=msg.serverContent;
    if(content?.interrupted) {
      if(this.turn && !this.turn.typed){
        clearTimeout(this.turnTimer);
        this.turn=null;
      }
      this.stopPlayback();
      this.onTurnEnd?.();
      this.onVoiceInput?.();
    }
    const input=content?.inputTranscription;
    if(input?.text) {
      this.silenceOutput=false;
      if(!this.turn || this.turn.typed || this.turn.transcript || this.turn.hasTool)this.beginTurn();
      this.turn.text+=input.text;
      this.watchTurn();
      this.onText('Você',input.text,{stream:true});
    }
    const status=content?.interactionStatus ?? msg.interactionStatus;
    if(status==='IN_PROGRESS'){
      if(!this.turn)this.beginTurn();
      if(!this.recording)this.onState('busy');
    }
    if(content?.outputTranscription?.text){
      const text=content.outputTranscription.text;
      if(this.turn){
        const separator=this.nextOutputSegment && /\S$/.test(this.turn.transcript) && /^\S/.test(text)?' ':'';
        this.turn.transcript+=separator+text;
        this.watchTurn();
      }
      this.onText('Ponto',text,{stream:true,newSegment:this.nextOutputSegment});
      this.nextOutputSegment=false;
    }
    if(content?.generationComplete || content?.turnComplete)this.nextOutputSegment=true;
    if(input?.finished)this.onTurnEnd?.('Você');
    // Extended can send several generation/turn completions while still processing one request.
    const idle=status==='IDLE' || (content?.turnComplete && !status && this.model!==LIVE_EXTENDED);
    for(const part of content?.modelTurn?.parts ?? []) {
      if(part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/')){
        if(this.turn)this.watchTurn();
        if(this.allowAudio?.()!==false && this.playAudio(part.inlineData.data,part.inlineData.mimeType) && this.turn)this.turn.hasAudio=true;
      }
    }
    const calls=msg.toolCall?.functionCalls;
    if(calls?.length && this.turn){
      this.turn.hasTool=true;
      this.watchTurn();
    }
    const previousTurnEnded=this.turn?.interrupting && !this.turn.transcript && !this.turn.hasAudio && !this.turn.hasTool;
    if(idle && !previousTurnEnded){
      this.onTurnEnd?.();
      this.onState(this.recording?'listening':'ready');
      this.endTurn();
    }
    if(idle && this.narration==='playing'){
      this.narrationIdle=true;
      if(!this.scheduled.size)this.setNarration(null);
    }
    for(const id of msg.toolCallCancellation?.ids??[])this.cancelledTools.add(id);
    if(calls?.length){
      const work=this.toolQueue.then(()=>this.executeTools(session,calls));
      this.toolQueue=work.catch(()=>{});
      await work;
    }
  }
  async executeTools(session,calls) {
    const functionResponses=[];
    for(const {id,name,args} of calls){
      if(!session || session!==this.session)return;
      if(this.cancelledTools.delete(id))continue;
      try {
        const result=await this.onTool(name,args||{});
        functionResponses.push({id,name,response:{result}});
      } catch(error){
        functionResponses.push({id,name,response:{error:String(error.message||error)}});
      }
    }
    if(session!==this.session)return;
    const active=functionResponses.filter(({id})=>!this.cancelledTools.delete(id));
    if(active.length){
      this.onToolsComplete?.(active);
      session.sendToolResponse({functionResponses:active});
    }
  }
  requestMicrophone() {
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não disponibiliza microfone.');
    return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  }
  async startMicrophone(stream) {
    if(this.recording)return false;
    if(!this.connected||!this.session) throw new Error('A sessão não está conectada.');
    const session=this.session;
    let ctx;
    try {
      ctx=new AudioContext();
      await ctx.resume();
      await ctx.audioWorklet.addModule(import.meta.env.BASE_URL+'pcm-worklet.js');
      if(session!==this.session || !this.connected) {stream.getTracks().forEach(track=>track.stop());await ctx.close();return false;}
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
      return true;
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
  sendText(text,{display=true}={}) {
    if(!this.connected||!this.session) throw new Error('Conecte o assistente primeiro.');
    const interrupting=this.model===LIVE_EXTENDED && Boolean(this.turn);
    this.onTurnEnd?.();
    if(display)this.onText('Você',text);
    this.silenceOutput=false;
    if(interrupting)this.stopPlayback();
    this.beginTurn(text,true,interrupting);
    this.onState('busy');
    if(interrupting || this.model===LIVE_FLASH){
      this.session.sendClientContent({turns:[{role:'user',parts:[{text}]}],turnComplete:true});
    } else this.session.sendRealtimeInput({text});
  }
  mutePlayback() {
    this.silenceOutput=true;
    this.stopPlayback();
  }
  setNarration(value) {
    clearTimeout(this.narrationTimer);
    this.narration=value;
    this.onNarration?.(value);
  }
  cancelNarration() {
    if(!this.narration)return;
    this.silenceOutput=true;
    this.stopPlayback();
    this.setNarration(null);
  }
  expectNarration() {
    this.stopPlayback();
    this.silenceOutput=false;
    this.narrationIdle=false;
    this.setNarration('pending');
    this.narrationTimer=setTimeout(()=>{
      this.cancelNarration();
      this.onNarration?.('failed');
    },15000);
  }
  disconnect() {
    this.sessionId++;
    clearTimeout(this.turnTimer);this.turn=null;
    this.onTurnEnd?.();
    this.opening?.controller.abort();this.opening=null;
    this.stopMicrophone();this.cancelNarration();this.stopPlayback();
    try{this.session?.close()}catch{}
    this.session=null;this.connected=false;this.model=null;this.silenceOutput=false;
    this.toolQueue=Promise.resolve();this.cancelledTools.clear();
    this.outputContext?.close().catch(()=>{});this.outputContext=null;
    this.onState('offline');
  }
}
