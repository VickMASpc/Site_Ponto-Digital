import { GoogleGenAI, Modality } from '@google/genai';
import { companyKnowledge } from './data.js';

export const LIVE_MODEL = 'gemini-3.8-live';
const TURN_IDLE_TIMEOUT_MS = 15000;

export function liveConfig() {
  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction: [
      'Você é Ponto, o assistente institucional da Ponto Digital. Converse em português do Brasil.',
      'Responda diretamente sobre a empresa e o projeto com base nas informações abaixo. Use frases naturais para fala e adapte o nível de detalhe ao que a pessoa pedir.',
      'Se a pessoa disser “me mostre as soluções”, descreva em voz alta os serviços e os conceitos de produto. Diferencie fatos, propostas e demonstrações acadêmicas.',
      'Se faltar uma informação, diga que ela não consta no material. Para outros assuntos, convide a pessoa a perguntar sobre a Ponto Digital.',
      'Você conversa com a pessoa. Nunca afirme que abriu páginas, leu a tela, ajustou preferências ou executou ações no site.',
      companyKnowledge()
    ].join('\n\n'),
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Aoede'}}}
  };
}

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
  constructor({onState, onText, onTurnEnd, onError, onStalled, onTextOnly, onAudio}) {
    Object.assign(this, {onState, onText, onTurnEnd, onError, onStalled, onTextOnly, onAudio});
    this.sessionId = 0;
    this.connected = false;
    this.recording = false;
    this.scheduled = new Set();
    this.nextPlayTime = 0;
  }

  prepareAudio() {
    const Context = window.AudioContext ?? window.webkitAudioContext;
    if (!Context) return;
    this.context ??= new Context();
    if (this.context.state !== 'running') this.context.resume().catch(() => {});
  }

  async connect() {
    if (this.connected) return true;
    if (this.opening) return this.opening.promise;
    const endpoint = import.meta.env.VITE_TOKEN_ENDPOINT || (location.hostname.endsWith('.github.io') ? null : '/token');
    if (!endpoint) throw new Error('A conversa está indisponível nesta hospedagem. Você pode continuar a consultar o site.');
    const attempt = ++this.sessionId;
    const controller = new AbortController();
    const opening = {controller};
    this.opening = opening;
    this.onState('connecting');
    const timeout = setTimeout(() => controller.abort(new Error('O Gemini demorou para conectar. Tente novamente.')), 15000);
    opening.promise = (async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({model: LIVE_MODEL}),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      controller.signal.throwIfAborted();
      if (!response.ok || !payload.token) throw new Error(payload.error || 'Não foi possível abrir a conversa.');
      const client = new GoogleGenAI({apiKey: payload.token, httpOptions: {apiVersion: 'v1beta'}});
      let ready;
      let rejectSetup;
      const setup = new Promise((resolve, reject) => {ready = resolve; rejectSetup = reject;});
      const rejectOnAbort = () => rejectSetup(controller.signal.reason);
      controller.signal.addEventListener('abort', rejectOnAbort, {once:true});
      const active = () => attempt === this.sessionId && !controller.signal.aborted;
      const broken = message => {
        if (!active()) return;
        if (this.connected) this.failTurn(message);
        else rejectSetup(new Error(message));
      };
      const connection = client.live.connect({
        model: LIVE_MODEL,
        config: liveConfig(),
        callbacks: {
          onmessage: message => {
            if (!active()) return;
            if (message.setupComplete) ready();
            if (this.connected) {
              try {this.processMessage(message);}
              catch {this.failTurn('Não foi possível processar a resposta do Gemini.');}
            }
          },
          onerror: () => broken('A conexão com o Gemini falhou.'),
          onclose: () => broken('O Gemini encerrou a conexão. Envie uma mensagem ou use o microfone para reconectar.')
        }
      });
      connection.then(session => {
        if (!active()) {
          try {session.close();} catch {}
        }
      }, rejectSetup);
      try {
        const [session] = await Promise.all([connection, setup]);
        controller.signal.throwIfAborted();
        this.session = session;
      } catch (error) {
        controller.abort();
        connection.then(session => {try {session.close();} catch {}}, () => {});
        throw error;
      } finally {
        controller.signal.removeEventListener('abort', rejectOnAbort);
      }
      this.connected = true;
      this.onState('ready');
      return true;
    })();
    try {return await opening.promise;}
    catch (error) {
      if (attempt !== this.sessionId) return false;
      this.onState('offline');
      throw error;
    } finally {
      clearTimeout(timeout);
      if (this.opening === opening) this.opening = null;
    }
  }

  playAudio(base64, mime) {
    if (this.context?.state !== 'running' || this.silenceOutput) return false;
    const rate = Number(mime.match(/rate=(\d+)/)?.[1]) || 24000;
    const samples = decodePCM(base64);
    if (!samples.length) return false;
    const buffer = this.context.createBuffer(1, samples.length, rate);
    buffer.copyToChannel(samples, 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    const start = Math.max(this.context.currentTime + 0.03, this.nextPlayTime);
    source.start(start);
    this.nextPlayTime = start + buffer.duration;
    this.scheduled.add(source);
    source.onended = () => {
      this.scheduled.delete(source);
      source.disconnect();
    };
    this.onAudio?.();
    return true;
  }

  stopPlayback() {
    for (const source of this.scheduled) {
      try {source.stop(); source.disconnect();} catch {}
    }
    this.scheduled.clear();
    this.nextPlayTime = 0;
  }

  mutePlayback() {
    this.silenceOutput = true;
    this.stopPlayback();
  }

  beginTurn(retryText = '') {
    this.turn = {retryText, transcript: '', hasAudio: false};
    this.watchTurn();
  }

  watchTurn() {
    clearTimeout(this.turnTimer);
    this.turnTimer = setTimeout(() => {
      if (this.turn?.retryText) {
        this.failTurn('O Gemini ficou 15 segundos sem responder. Sua pergunta voltou para o campo de texto.');
        return;
      }
      this.turn = null;
      this.onTurnEnd?.();
      this.onState(this.recording ? 'listening' : 'ready');
      this.onError('O Gemini demorou para responder. Você pode falar novamente ou enviar sua pergunta por texto.');
    }, TURN_IDLE_TIMEOUT_MS);
  }

  failTurn(reason) {
    const {turn} = this;
    this.disconnect();
    if (turn) this.onStalled?.({reason, retryText: turn.retryText});
    else this.onError(reason);
  }

  processMessage(message) {
    const content = message.serverContent;
    if (!content) return;
    if (content.interrupted) {
      this.stopPlayback();
      this.onTurnEnd?.('Ponto');
      if (!this.turn?.retryText) {
        clearTimeout(this.turnTimer);
        this.turn = null;
      }
    }
    const input = content.inputTranscription;
    if (input?.text) {
      if (!this.turn) {
        if (this.recording) this.silenceOutput = false;
        this.beginTurn();
      }
      this.watchTurn();
      this.onText('Você', input.text, {stream:true});
    }
    if (input?.finished) this.onTurnEnd?.('Você');
    const transcription = content.outputTranscription?.text;
    const parts = (content.modelTurn?.parts ?? []).filter(part => !part.thought);
    const audioParts = parts.filter(part => part.inlineData?.data && part.inlineData.mimeType?.startsWith('audio/'));
    const output = transcription || (!audioParts.length ? parts.map(part => part.text || '').join('') : '');
    if (output || audioParts.length) {
      if (!this.turn) this.beginTurn();
      this.watchTurn();
      if (!this.recording) this.onState('busy');
      if (output) {
        const separator = this.newSegment && /\S$/.test(this.turn.transcript) && /^\S/.test(output) ? ' ' : '';
        this.turn.transcript += separator + output;
        this.onText('Ponto', output, {stream:true, newSegment:this.newSegment});
        this.newSegment = false;
      }
      for (const {inlineData} of audioParts) {
        if (this.playAudio(inlineData.data, inlineData.mimeType)) this.turn.hasAudio = true;
      }
    }
    if (content.generationComplete) this.newSegment = true;
    if (!content.turnComplete && content.interactionStatus !== 'IDLE') return;
    if (content.interrupted && this.turn?.retryText && !this.turn.hasAudio && !this.turn.transcript) return;
    clearTimeout(this.turnTimer);
    const turn = this.turn;
    this.turn = null;
    this.newSegment = false;
    this.onTurnEnd?.();
    this.onState(this.recording ? 'listening' : 'ready');
    if (turn?.transcript.trim() && !turn.hasAudio && !this.silenceOutput) this.onTextOnly?.(turn.transcript.trim());
  }

  requestMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não disponibiliza microfone.');
    return navigator.mediaDevices.getUserMedia({audio: {echoCancellation:true, noiseSuppression:true, autoGainControl:true}, video:false});
  }

  async startMicrophone(stream, signal) {
    const session = this.session;
    const context = this.context;
    if (!session || !context?.audioWorklet) throw new Error('A captura de áudio está indisponível neste navegador.');
    this.workletReady ??= context.audioWorklet.addModule(import.meta.env.BASE_URL + 'pcm-worklet.js').catch(error => {
      this.workletReady = null;
      throw error;
    });
    await this.workletReady;
    signal.throwIfAborted();
    if (session !== this.session) return false;
    if (context.state !== 'running') throw new Error('O navegador pausou o áudio. Ative o microfone novamente.');
    const source = context.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(context, 'ponto-pcm');
    const silent = context.createGain();
    silent.gain.value = 0;
    node.port.onmessage = ({data}) => {
      if (!this.recording || this.session !== session) return;
      const pcm = encodePCM(data, context.sampleRate);
      if (!pcm) return;
      try {session.sendRealtimeInput({audio:{data:pcm, mimeType:'audio/pcm;rate=16000'}});}
      catch {this.failTurn('A conexão caiu durante a gravação.');}
    };
    source.connect(node);
    node.connect(silent);
    silent.connect(context.destination);
    this.inputNodes = [source, node, silent];
    this.inputStream = stream;
    this.recording = true;
    this.silenceOutput = false;
    this.onState('listening');
    return true;
  }

  stopMicrophone({send = true} = {}) {
    if (!this.recording) return;
    this.recording = false;
    this.inputStream.getTracks().forEach(track => track.stop());
    this.inputStream = null;
    for (const node of this.inputNodes) node.disconnect();
    this.inputNodes = null;
    if (!send) return;
    try {
      this.session.sendRealtimeInput({audioStreamEnd:true});
      if (!this.turn) this.beginTurn();
      else this.watchTurn();
      this.onState('waiting');
    } catch {this.failTurn('A conexão caiu ao finalizar a gravação.');}
  }

  sendText(text) {
    if (!this.session) throw new Error('Abra a conversa novamente para enviar sua mensagem.');
    const replacing = Boolean(this.turn);
    this.stopPlayback();
    this.silenceOutput = false;
    this.newSegment = false;
    this.onTurnEnd?.();
    if (replacing) this.session.sendClientContent({turns:[{role:'user', parts:[{text}]}], turnComplete:true});
    else this.session.sendRealtimeInput({text});
    this.onText('Você', text);
    this.beginTurn(text);
    this.onState('busy');
  }

  disconnect() {
    this.sessionId++;
    clearTimeout(this.turnTimer);
    this.turn = null;
    this.newSegment = false;
    this.opening?.controller.abort();
    this.opening = null;
    this.stopMicrophone({send:false});
    this.stopPlayback();
    try {this.session?.close();} catch {}
    this.session = null;
    this.connected = false;
    this.silenceOutput = false;
    this.workletReady = null;
    this.context?.close().catch(() => {});
    this.context = null;
    this.onTurnEnd?.();
    this.onState('offline');
  }
}
