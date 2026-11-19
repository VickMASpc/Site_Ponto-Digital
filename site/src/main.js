import './styles.css';
import { NAV, CONTENT, pageText } from './data.js';
import { LiveBridge } from './live.js';

const icons={
  mic:'<path d="M12 19v3m-5-3h10M9 9v4a3 3 0 0 0 6 0V9a3 3 0 0 0-6 0Zm-4 4a7 7 0 0 0 14 0"/>',
  sound:'<path d="M11 5 6 9H3v6h3l5 4V5Zm4 4a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.86l.06.07-2.8 2.8-.08-.07a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.05 1.55V21h-4v-.12A1.7 1.7 0 0 0 9 19.32a1.7 1.7 0 0 0-1.86.34l-.08.07-2.8-2.8.07-.08a1.7 1.7 0 0 0 .34-1.86A1.7 1.7 0 0 0 3.12 14H3v-4h.12a1.7 1.7 0 0 0 1.55-1.05 1.7 1.7 0 0 0-.34-1.87l-.07-.08 2.8-2.8.08.07A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.12V3h4v.12a1.7 1.7 0 0 0 1.05 1.55 1.7 1.7 0 0 0 1.87-.34L17 4.26l2.8 2.8-.07.08A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 21 10h.12v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/>',
  sparkle:'<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Zm7 14 .7 1.5L21 19l-1.3.5L19 21l-.7-1.5L17 19l1.3-.5L19 17Z"/>',
  layers:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  heart:'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3 4 7 4 10s-1 7-4 10c-3-3-4-7-4-10s1-7 4-10Z"/>',
  shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-4-11 3 3 5-5"/>',
  headphones:'<path d="M3 14v-3a9 9 0 0 1 18 0v3m-18 0v4a2 2 0 0 0 2 2h2v-8H5a2 2 0 0 0-2 2Zm18 0v4a2 2 0 0 1-2 2h-2v-8h2a2 2 0 0 1 2 2Z"/>',
  pause:'<path d="M8 5v14m8-14v14"/>',
  stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  leaf:'<path d="M20 4c-8 0-14 3-14 11a5 5 0 0 0 5 5c8 0 11-6 9-16ZM4 21c4-6 8-9 13-12"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  text:'<path d="M4 7V4h16v3M12 4v16m-4 0h8"/>',
  help:'<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1"/>'
};
const ico=(name,size=20)=>`<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.sparkle}</svg>`;
const esc=(s)=>String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mobile=matchMedia('(pointer: coarse)').matches;
const load=(key,fallback)=>{try{const x=localStorage.getItem('pd.'+key);return x==null?fallback:JSON.parse(x);}catch{return fallback;}};
const state={
 page: Object.hasOwn(CONTENT,location.hash.slice(1))?location.hash.slice(1):'inicio',
 theme:load('theme','light'),font:load('font',1),tts:load('tts',true),rate:load('rate',1),
 shortcut:load('shortcut','j'),menu:false,activity:false,status:'offline',
 transcript:[],demo:[],notice:'',draft:''
};
let microphoneOpening, chatTrigger, previousDialogFocus;
let speaking=false, speechQueue=[], speechVersion=0, speechStart=null;
const streamingActivity=new Map();
let activityId=0;
const $=(id)=>document.getElementById(id);
const persist=(key,value)=>{try{localStorage.setItem('pd.'+key,JSON.stringify(value));}catch{}};
function statusText(){
 if(bridge.recording)return 'Microfone ligado. Fale agora.';
 if(microphoneOpening)return microphoneOpening.stage;
 return {
   offline:'Assistente desconectado',connecting:'Conectando ao Gemini…',
   ready:'Microfone desligado. Pronto para conversar.',
   waiting:'Microfone desligado. Aguardando a resposta…',
   busy:'Aguardando a resposta do assistente…'
 }[state.status]||'';
}
const bridge=new LiveBridge({
 onState(value){state.status=value;syncLive();},
 onError:notify,
 onText:addActivity,
 onTurnEnd:finishActivity,
 onStalled({reason,retryText}){
   if(retryText && !state.draft){
     state.draft=retryText;
     $('chat-text').value=retryText;
   }
   notify(reason);
 },
 onTextOnly(text){speak(text).then(started=>{if(!started && !bridge.silenceOutput)announce('Ponto. '+text);});},
 onAudio(){if(speaking)stopSpeech();}
});
function notify(text){
 state.notice=text;
 const box=$('notice');
 if(!box)return;
 const notice=$('notice-text');
 if(text){
   box.hidden=false;
   notice.textContent=text;
 } else {
   notice.textContent='';
   box.hidden=true;
 }
}
function applyPrefs() {
 document.documentElement.dataset.theme=['light','dark','contrast'].includes(state.theme)?state.theme:'light';
 document.documentElement.style.setProperty('--font-scale',String(state.font));
}
function introText() {
 const common='Explore as páginas pelo menu. O botão Ler a página atual usa a voz do navegador. Abra a conversa por texto para perguntar sobre a Ponto Digital sem usar o microfone.';
 const mic='Ative o botão Microfone do assistente. Aguarde o aviso de microfone ligado, fale e ative de novo para desligar. Use Parar áudio para interromper a fala.';
 if(mobile)return 'Com TalkBack ou VoiceOver, deslize para percorrer os elementos e dê dois toques para ativar um botão. '+mic+' '+common;
 const key=state.shortcut==='j'?'J ou Alt mais J liga e desliga o microfone. ':'Alt mais J liga e desliga o microfone. ';
 return 'Use Tab para percorrer os controles e Enter para ativá-los. '+key+'Se seu leitor de tela usar esse atalho, use o botão de microfone. '+mic+' '+common;
}
function readingStatus(){
 return speaking?(speechStart?'Preparando leitura em voz alta':'Leitura em andamento'):'';
}
function syncReadingStatus(){
 const label=$('tts-indicator');
 if(label && label.textContent!==readingStatus())label.textContent=readingStatus();
}
function stopAudio(){
 stopSpeech();
 bridge.mutePlayback();
}
function stopSpeech(){
 ++speechVersion;
 speaking=false;
 speechQueue=[];
 speechStart?.(false);
 if('speechSynthesis' in window) speechSynthesis.cancel();
 syncReadingStatus();
}
function speak(text,{force=false}={}){
 if(!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance){
   if(force)notify('A voz do navegador está indisponível. Você pode ler o conteúdo com seu leitor de tela.');
   return Promise.resolve(false);
 }
 if(!state.tts&&!force)return Promise.resolve(false);
 const chunks=String(text).trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.flatMap(piece=>{
   const words=piece.trim().split(/\s+/);
   const parts=[];
   while(words.length)parts.push(words.splice(0,35).join(' '));
   return parts;
 })||[];
 if(!chunks.length)return Promise.resolve(false);
 if(force){
   if(bridge.recording)bridge.stopMicrophone();
   stopAudio();
 }else stopSpeech();
 speechQueue=chunks;
 const version=speechVersion;
 speaking=true;
 const voices=speechSynthesis.getVoices();
 const voice=voices.find(x=>x.lang.toLowerCase()==='pt-br')||voices.find(x=>x.lang.startsWith('pt'));
 const deadline=setTimeout(()=>{if(version===speechVersion)fail();},2500);
 const started=new Promise(resolve=>{
   speechStart=ok=>{clearTimeout(deadline);speechStart=null;resolve(ok);syncReadingStatus();};
 });
 syncReadingStatus();
 function fail(){
   stopSpeech();
   if(force)notify('A voz do navegador não iniciou. Você pode ler o conteúdo com seu leitor de tela.');
 }
 function next(){
   if(version!==speechVersion)return;
   const chunk=speechQueue.shift();
   if(!chunk){stopSpeech();return;}
   const utterance=new SpeechSynthesisUtterance(chunk);
   utterance.lang='pt-BR';
   utterance.rate=state.rate;
   if(voice)utterance.voice=voice;
   utterance.onstart=()=>{if(version===speechVersion)speechStart?.(true);};
   utterance.onend=next;
   utterance.onerror=()=>{if(version===speechVersion)fail();};
   try{speechSynthesis.speak(utterance);}catch{if(version===speechVersion)fail();}
 }
 next();
 return started;
}
function addActivity(who,text,{stream=false,newSegment=false}={}) {
 if(!text)return;
 const list=$('activity-list');
 const atBottom=list && list.scrollHeight-list.scrollTop-list.clientHeight<48;
 const active=stream?streamingActivity.get(who):null;
 if(active){
   // Deltas inside a segment carry their own whitespace. New segments may omit it.
   const separator=newSegment && !/\s$/.test(active.text) && /^\S/.test(text)?' ':'';
   active.text+=separator+text;
   const paragraph=$('activity-'+active.id)?.querySelector('p');
   if(paragraph)paragraph.textContent=active.text;
 } else {
   if(!text.trim())return;
   const entry={id:++activityId,who,text};
   state.transcript.push(entry);
   if(stream)streamingActivity.set(who,entry);
   if(list){
     list.querySelector('.empty-activity')?.remove();
     list.insertAdjacentHTML('beforeend',activityMessage(entry));
   }
   if(state.transcript.length>18){
     const removed=state.transcript.shift();
     $('activity-'+removed.id)?.remove();
     if(streamingActivity.get(removed.who)===removed)finishActivity(removed.who);
   }
 }
 if(atBottom || (!stream && who==='Você')){if(list)list.scrollTop=list.scrollHeight;}
}
function finishActivity(who){
 if(who)streamingActivity.delete(who);
 else streamingActivity.clear();
}
function activityMessage(entry){
 const role=entry.who==='Você'?'user-message':'agent-message';
 return `<div id="activity-${entry.id}" class="message ${role}"><span>${esc(entry.who)}</span><p>${esc(entry.text)}</p></div>`;
}
function activityMarkup(){
 return state.transcript.length
 ? state.transcript.map(activityMessage).join('')
 : '<p class="empty-activity">Sua conversa aparecerá aqui, com transcrições quando o Gemini fornecê-las.</p>';
}
function syncLive() {
 const status=statusText();
 const label=$('voice-status');
 if(label && label.textContent!==status)label.textContent=status;
 const chatStatus=$('chat-voice-status');
 if(chatStatus)chatStatus.textContent=status;
 const dot=$('voice-dot');
 if(dot)dot.dataset.status=bridge.recording?'listening':state.status;
 const keys=state.shortcut==='j'?'J Alt+J':'Alt+J';
 for(const button of document.querySelectorAll('button[data-action="mic"]')){
   button.setAttribute('aria-pressed',String(bridge.recording));
   button.dataset.active=String(bridge.recording);
   if(!mobile)button.setAttribute('aria-keyshortcuts',keys);
 }
 const hint=$('mic-hint');
 if(hint)hint.textContent=mobile?'Um toque liga ou desliga':state.shortcut==='j'?'J liga ou desliga':'Alt + J liga ou desliga';
 const disconnect=$('disconnect');
 if(disconnect)disconnect.hidden=!bridge.connected && !bridge.opening;
}

function navItems(){
 return NAV.map(x=>`<a href="#${x.id}" data-nav="${x.id}" class="nav-link ${state.page===x.id?'selected':''}" ${state.page===x.id?'aria-current="page"':''}>${x.label}</a>`).join('');
}
function sectionHTML(items) {
 return items.map((item,i)=>`<article class="info-card ${i===0?'large-card':''}">
  <div class="card-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</div><h2>${esc(item.title)}</h2><p>${esc(item.body)}</p>
  <button class="text-action" data-read-section="${i}" aria-label="Ouvir esta seção: ${esc(item.title)}">${ico('sound',17)} Ouvir esta seção</button>
 </article>`).join('');
}
function pageMarkup() {
 const p=CONTENT[state.page];
 if(state.page==='inicio') return `
  <section class="hero" aria-labelledby="main-heading">
    <div class="hero-inner">
      <div class="hero-copy">
        <div class="eyebrow"><span class="signal-mark" aria-hidden="true"></span> TECNOLOGIA PARA EMPRESAS <span class="eyebrow-line" aria-hidden="true"></span> PONTO DIGITAL</div>
        <h1 id="main-heading" tabindex="-1">Sua empresa mais <em>digital.</em> Seu trabalho mais simples.</h1>
        <p class="hero-lead">${esc(p.description)}</p>
        <div class="hero-actions">
          <button data-nav="solucoes" class="btn btn-primary">Conheça nossas soluções ${ico('arrow',19)}</button>
          <button data-nav="empresa" class="btn btn-secondary">Sobre a Ponto Digital</button>
        </div>
        <p class="hero-caption"><span class="caption-dot" aria-hidden="true"></span> Desenvolvimento B2B · Software sob medida · Brasil</p>
      </div>
      <div class="business-art" aria-hidden="true">
        <div class="art-grid"></div>
        <div class="business-window">
          <div class="window-top"><span class="window-brand">ponto<span>.</span></span><div class="window-dots"><i></i><i></i><i></i></div></div>
          <div class="window-body">
            <div class="window-sidebar"><i></i><i></i><i></i><i></i></div>
            <div class="window-content"><div class="window-caption"></div><div class="window-title"></div><div class="window-stats"><div><i></i><strong></strong><span></span></div><div><i></i><strong></strong><span></span></div></div><div class="window-chart"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>
          </div>
        </div>
        <div class="business-sticker sticker-one">${ico('shield',21)} Software para negócios</div>
        <div class="business-sticker sticker-two">${ico('check',21)} Processos mais eficientes</div>
      </div>
    </div>
  </section>
  <section class="intro-strip" aria-label="Áreas de atuação">
    <div><span>01 —</span><strong>Desenvolvimento B2B</strong><p>Aplicações para atender desafios de empresas.</p></div>
    <div><span>02 —</span><strong>Soluções digitais</strong><p>Mais organização para processos do dia a dia.</p></div>
    <div><span>03 —</span><strong>Inclusão de verdade</strong><p>Navegação acessível para diferentes pessoas.</p></div>
  </section>
  <section class="home-section" aria-labelledby="home-services-heading">
    <div class="section-heading"><span class="section-kicker">O QUE FAZEMOS</span><h2 id="home-services-heading">Tecnologia para <em>resolver.</em></h2><p>Nosso foco é o desenvolvimento de software empresarial. Estes são os caminhos que orientam nossas propostas.</p></div>
    <div class="prompt-grid">
      <button class="prompt-card" data-nav="solucoes">${ico('layers',24)}<strong>Desenvolvimento de software</strong><span>Conheça a área de atuação ${ico('chevron',18)}</span></button>
      <button class="prompt-card" data-nav="solucoes">${ico('globe',24)}<strong>Soluções SaaS para empresas</strong><span>Veja os conceitos estudados ${ico('chevron',18)}</span></button>
      <button class="prompt-card" data-nav="laboratorio">${ico('shield',24)}<strong>Protótipos e demonstrações</strong><span>Experimente o projeto ${ico('chevron',18)}</span></button>
    </div>
  </section>
  <section class="featured-section">
    <div><span class="section-kicker">NOSSA VISÃO</span><h2>Mais do que criar sistemas, queremos <em>abrir caminhos.</em></h2><p>Uma empresa que trabalha com tecnologia também precisa pensar em quem a utiliza. Acessibilidade é parte da experiência, não seu único produto.</p><button class="inline-arrow" data-nav="empresa">Conheça nossa empresa ${ico('arrow',20)}</button></div>
    <div class="featured-graphic" aria-hidden="true">${ico('globe',80)}<span>SOFTWARE B2B / FEITO PARA PESSOAS</span></div>
  </section>
  <section class="support-section" aria-labelledby="support-heading">
    <div><span class="section-kicker">ACESSIBILIDADE DO SITE</span><h2 id="support-heading">Prefere ouvir? Estamos aqui.</h2><p>Use teclado, toque, leitor de tela ou o narrador do navegador. Você pode ativar a conversa por voz, se estiver disponível, sem depender dela para navegar.</p></div>
    <div class="support-actions"><button class="btn btn-secondary" data-action="intro">${ico('sound',19)} Ouvir como usar</button><button class="btn btn-secondary" data-action="settings">${ico('cog',19)} Configurar acessibilidade</button></div>
  </section>
 `;
 return `
  <section class="page-hero">
   <div class="page-hero-left"><div class="eyebrow"><span class="signal-mark"></span> PONTO DIGITAL / ${esc(state.page.toUpperCase())}</div>
    <h1 id="main-heading" tabindex="-1">${esc(p.title)}</h1><p>${esc(p.description)}</p>
    <div class="page-hero-actions"><button class="btn btn-primary" data-action="read-page">${ico('sound',18)} Ouvir página</button><button class="btn btn-secondary" data-action="settings">${ico('cog',18)} Ajustar leitura</button></div>
   </div>
   <div class="page-hero-mark">${ico(({empresa:'globe',solucoes:'layers',acessibilidade:'heart',impacto:'leaf',laboratorio:'sparkle'})[state.page],112)}</div>
  </section>
  <section class="content-layout"><div class="content-title"><span class="section-kicker">CONTEÚDO / ${String(p.sections.length).padStart(2,'0')} PARTES</span><h2>Explore no seu ritmo.</h2><p>Leia, ouça ou peça um resumo ao assistente.</p></div><div class="info-grid">${sectionHTML(p.sections)}</div></section>
  ${state.page==='laboratorio'?labMarkup():''}
  <section class="next-section"><span>CONTINUE EXPLORANDO</span><h2>O próximo passo pode ser uma conversa.</h2><button class="btn btn-outline" data-action="help">Como usar os recursos de acessibilidade ${ico('arrow',19)}</button></section>
 `;
}
function labMarkup(){
 const balance=state.demo.reduce((sum,x)=>sum+(x.type==='income'?x.value:-x.value),0);
 const money=(n)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
 return `<section class="lab"><div class="section-heading"><span class="section-kicker">DEMONSTRAÇÃO INTERATIVA</span><h2>MVP financeiro.</h2><p>Simulação didática com dados fictícios. Nenhum lançamento é enviado a um servidor.</p></div>
 <div class="lab-grid"><form id="demo-form" class="lab-form"><h3>Novo lançamento</h3>
 <label for="demo-description">Descrição</label><input id="demo-description" name="description" maxlength="70" placeholder="Ex.: compra de materiais" required>
 <label for="demo-value">Valor em reais</label><input id="demo-value" name="amount" inputmode="decimal" type="number" min="0.01" step="0.01" placeholder="0,00" required>
 <label for="demo-type">Tipo</label><select id="demo-type" name="type"><option value="income">Receita</option><option value="expense">Despesa</option></select>
 <button class="btn btn-primary" type="submit">${ico('plus',18)} Adicionar lançamento</button></form>
 <div class="balance-card"><span>SALDO DA SIMULAÇÃO</span><strong id="demo-balance">${money(balance)}</strong><p>${state.demo.length} lançamento(s) nesta sessão</p>
 <div class="transactions">${state.demo.length?state.demo.slice().reverse().map(x=>`<div><span>${esc(x.description)}</span><b class="${x.type==='income'?'positive':'negative'}">${x.type==='income'?'+':'−'} ${money(x.value)}</b></div>`).join(''):'<p>Ainda não há lançamentos.</p>'}</div>
 <button class="quiet-button" data-action="clear-demo">Limpar simulação</button></div></div></section>`;
}
function settingsMarkup() {
 return `<div class="scrim" data-action="close-overlay"></div><aside class="side-panel" role="dialog" aria-modal="true" aria-label="Configurações de acessibilidade">
  <div class="panel-head"><div><span class="section-kicker">PREFERÊNCIAS</span><h2>Seu jeito de navegar.</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Fechar configurações">${ico('x')}</button></div>
  <div class="setting-group"><h3>Visual</h3><label for="theme-select">Tema do site</label><select id="theme-select" data-setting="theme"><option value="light" ${state.theme==='light'?'selected':''}>Claro</option><option value="dark" ${state.theme==='dark'?'selected':''}>Escuro</option><option value="contrast" ${state.theme==='contrast'?'selected':''}>Alto contraste</option></select>
  <label for="font-select">Tamanho do texto</label><select id="font-select" data-setting="font"><option value="1" ${state.font==1?'selected':''}>Padrão (100%)</option><option value="1.18" ${state.font==1.18?'selected':''}>Grande (118%)</option><option value="1.36" ${state.font==1.36?'selected':''}>Muito grande (136%)</option><option value="1.55" ${state.font==1.55?'selected':''}>Máximo (155%)</option></select></div>
  <div class="setting-group"><h3>Atalho do microfone</h3>
  <label for="shortcut-select">Atalho de uma letra</label><select id="shortcut-select" data-setting="shortcut"><option value="j" ${state.shortcut==='j'?'selected':''}>J habilitado</option><option value="off" ${state.shortcut==='off'?'selected':''}>Desativar J isolado (manter Alt + J)</option></select>
  <p class="setting-note">J tem uma saliência tátil. Se o leitor de tela capturar o atalho, use Tab até o botão Microfone do assistente e pressione Enter ou Espaço.</p></div>
  <div class="setting-group"><h3>Leitura por voz do navegador</h3><label class="switch-line"><input type="checkbox" data-setting="tts" ${state.tts?'checked':''}> Ler em voz alta respostas que chegarem só em texto</label><label for="rate-select">Velocidade do narrador local</label><select id="rate-select" data-setting="rate"><option value="0.7" ${state.rate===.7?'selected':''}>Lenta (0,7×)</option><option value="1" ${state.rate===1?'selected':''}>Normal (1×)</option><option value="1.2" ${state.rate===1.2?'selected':''}>Rápida (1,2×)</option><option value="1.4" ${state.rate===1.4?'selected':''}>Muito rápida (1,4×)</option></select></div>
  <button class="btn btn-primary panel-cta" data-action="close-overlay">Concluir ${ico('check',19)}</button>
 </aside>`;
}
function helpMarkup(){
 return `<div class="scrim" data-action="close-overlay"></div><div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
 <button class="icon-button help-close" data-action="close-overlay" aria-label="Fechar instruções">${ico('x')}</button>
 <div class="help-icon">${ico('headphones',33)}</div><span class="section-kicker">GUIA DE PRIMEIRO ACESSO</span>
 <h2 id="help-title">Como navegar neste site.</h2>
 <p>${esc(introText())}</p>
 <div class="help-shortcuts"><div>${ico('keyboard',24)}<strong>Computador</strong><span>Tab e Enter · ${state.shortcut==='j'?'J ou Alt + J':'Alt + J'} para ligar e desligar</span></div><div>${ico('mic',24)}<strong>Celular</strong><span>Leitor de tela · toque duplo nos botões</span></div></div>
 <div class="help-buttons"><button class="btn btn-primary" data-action="intro">${ico('sound',19)} Ouvir instruções</button><button class="btn btn-secondary" data-action="close-overlay">Começar a explorar</button></div>
 <p class="help-footnote">Com o microfone ligado, o áudio da conversa é enviado ao Gemini.</p>
 </div>`;
}
function render() {
 applyPrefs();
 document.title=(NAV.find(x=>x.id===state.page)?.label||'Início')+' | Ponto Digital';
 $('app').innerHTML=`
 <div class="access-start" role="region" aria-label="Orientações de acessibilidade">
  <div class="access-start-inner">
   <p><strong>Bem-vindo à Ponto Digital.</strong> Este site funciona com leitor de tela, teclado e toque.</p>
   <div class="access-start-actions"><button class="access-guide" data-action="intro">${ico('sound',19)} Ouvir instruções de navegação</button><button class="access-read" data-action="read-page">Ler a página atual</button><button class="access-talk" data-action="mic" aria-pressed="false" aria-describedby="voice-status">Microfone do assistente</button><button data-action="activity" aria-controls="conversation" aria-expanded="${state.activity}">Conversa por texto</button></div>
  </div>
 </div>
 <header class="site-header"><div class="header-inner">
  <a href="#inicio" data-nav="inicio" class="brand" aria-label="Ponto Digital Soluções em Software, início"><span class="brand-symbol" aria-hidden="true"><span></span><span></span><span></span></span><strong>PONTO <span>DIGITAL</span> <small>SOLUÇÕES EM SOFTWARE</small></strong></a>
  <nav class="desktop-nav" aria-label="Navegação principal">${navItems()}</nav>
  <div class="header-actions"><button class="icon-button settings-trigger" data-action="settings" aria-label="Abrir preferências de acessibilidade">${ico('cog',21)}</button><button class="header-voice" data-action="help">${ico('headphones',19)} Guia de voz</button><button class="icon-button mobile-toggle" data-action="menu" aria-label="${state.menu?'Fechar':'Abrir'} menu de navegação" aria-controls="mobile-nav" aria-expanded="${state.menu}">${ico(state.menu?'x':'menu',24)}</button></div>
 </div><nav id="mobile-nav" class="mobile-nav" aria-label="Navegação principal" ${state.menu?'':'hidden'}>${navItems()}</nav></header>
 <div id="notice" class="notice" ${state.notice?'':'hidden'}><div id="notice-text" role="alert">${esc(state.notice)}</div></div>
 ${chatMarkup()}
 <main id="main" tabindex="-1">${pageMarkup()}</main>
 <footer class="site-footer"><div class="footer-top"><div class="footer-brand"><span class="footer-logo">PD<span>.</span></span><h2>Conectando pessoas ao futuro.</h2><p>Desenvolvimento de software B2B com um olhar para acessibilidade e inclusão.</p></div><div class="footer-links"><strong>NAVEGUE</strong>${NAV.map(x=>`<a href="#${x.id}" data-nav="${x.id}">${x.label}</a>`).join('')}</div><div class="footer-links"><strong>EXPERIÊNCIA</strong><button data-action="settings">Acessibilidade</button><button data-action="help">Ajuda e atalhos</button><button data-action="read-page">Ouvir página atual</button></div></div><div class="footer-bottom"><span>© 2026 Ponto Digital · Projeto acadêmico de Desenvolvimento de Sistemas</span><span>Feito para ser acessível, não apenas bonito.</span></div></footer>
 <div class="voice-shell">
  <div class="voice-dock" role="group" aria-label="Controles de leitura e conversa por voz">
   <div class="voice-indicator"><span class="voice-status-dot" id="voice-dot" data-status="${state.status}"></span><div><strong id="voice-status" role="status" aria-live="polite" aria-atomic="true">${statusText()}</strong><span id="mic-hint"></span></div></div>
   <div class="voice-controls"><button class="small-voice-button" data-action="read-page" title="Ouvir página" aria-label="Ler página atual">${ico('sound',21)}</button><button class="small-voice-button" data-action="stop-speech" title="Parar áudio" aria-label="Parar áudio">${ico('stop',18)}</button><button class="mic-main" id="mic-button" data-action="mic" data-active="${bridge.recording}" aria-pressed="${bridge.recording}" aria-label="Microfone do assistente" aria-describedby="voice-status">${ico('mic',25)}</button><button class="small-voice-button" data-action="activity" title="Conversa por texto" aria-label="Conversa por texto" aria-controls="conversation" aria-expanded="${state.activity}">${ico('sparkle',21)}</button></div>
  </div>
  <div class="dock-subtext"><span id="tts-indicator" role="status" aria-live="polite">${readingStatus()}</span><span>Leitura local sem conexão</span></div>
 </div>
 <div id="overlay"></div>
 `;
 syncLive();
}
function chatMarkup(){
 return `<section id="conversation" class="activity-panel" aria-labelledby="conversation-title" ${state.activity?'':'hidden'}>
  <div class="activity-head"><h2 id="conversation-title">Conversa sobre a Ponto Digital</h2><button class="icon-button" data-action="close-activity" aria-label="Fechar conversa">${ico('x')}</button></div>
  <div id="activity-list" class="activity-list" role="log" aria-label="Histórico de mensagens" aria-live="off" tabindex="0">${activityMarkup()}</div>
  <form id="chat-form" class="chat-form">
   <label for="chat-text" class="sr-only">Pergunta sobre a Ponto Digital</label>
   <input id="chat-text" type="text" maxlength="600" enterkeyhint="send" placeholder="Digite sua pergunta…" autocomplete="off" required value="${esc(state.draft)}">
   <button type="submit" aria-label="Enviar mensagem">${ico('arrow',21)}</button>
  </form>
  <p id="chat-voice-status" class="chat-voice-status" aria-hidden="true"></p>
  <div class="chat-actions"><button class="quiet-button" data-action="mic" aria-pressed="${bridge.recording}" aria-describedby="voice-status">Microfone do assistente</button><button class="quiet-button" data-action="stop-speech">Parar áudio</button><button class="quiet-button" id="disconnect" data-action="disconnect" hidden>Encerrar sessão</button></div>
 </section>`;
}
function announce(text){
 const region=$('screen-announcement');
 region.textContent='';
 requestAnimationFrame(()=>{region.textContent=text;});
}
function navigate(id,{historyMode='push'}={}){
 if(!Object.hasOwn(CONTENT,id))return;
 if(state.page!==id && speaking)stopSpeech();
 state.page=id;
 state.menu=false;
 if(historyMode==='push' && location.hash!=='#'+id)history.pushState({page:id},'','#'+id);
 render();
 $('main-heading').focus();
 $('main-heading').scrollIntoView({block:'start'});
}
const microphoneDenied='Sem permissão de microfone. Você pode enviar sua pergunta por texto.';
function cancelMicrophone(){
 if(!microphoneOpening)return;
 const {controller,stream}=microphoneOpening;
 microphoneOpening=null;
 controller.abort();
 stream?.getTracks().forEach(track=>track.stop());
 syncLive();
 announce('Ativação do microfone cancelada.');
}
async function toggleMicrophone(trigger){
 if(bridge.recording){bridge.stopMicrophone();return;}
 if(microphoneOpening){cancelMicrophone();return;}
 const controller=new AbortController();
 const attempt={controller,stage:'Aguardando permissão do microfone…'};
 microphoneOpening=attempt;
 syncLive();
 stopAudio();
 notify('');
 try{
   bridge.prepareAudio();
   attempt.stream=await bridge.requestMicrophone();
   controller.signal.throwIfAborted();
   attempt.stage='Preparando microfone. Aguarde para falar.';
   syncLive();
   if(!await bridge.connect())return;
   controller.signal.throwIfAborted();
   if(await bridge.startMicrophone(attempt.stream,controller.signal))attempt.stream=null;
 }catch(error){
   if(controller.signal.aborted)return;
   const permission=['NotAllowedError','PermissionDeniedError'].includes(error.name);
   const captureError=['NotFoundError','NotReadableError','NotSupportedError','SecurityError'].includes(error.name);
   if(permission || captureError){
     setActivity(true,trigger);
     notify(permission?microphoneDenied:'O microfone está indisponível. Você pode enviar sua pergunta por texto.');
   }else notify(error.message||'Não foi possível ativar o microfone.');
 }finally{
   attempt.stream?.getTracks().forEach(track=>track.stop());
   if(microphoneOpening===attempt)microphoneOpening=null;
   syncLive();
 }
}
function setActivity(open,trigger){
 if(open && trigger?.getClientRects().length && trigger!==document.body && !$('conversation').contains(trigger))chatTrigger=trigger;
 state.activity=open;
 $('conversation').hidden=!open;
 for(const button of document.querySelectorAll('[data-action="activity"]'))button.setAttribute('aria-expanded',String(open));
 if(open){
   const log=$('activity-list');
   log.scrollTop=log.scrollHeight;
   $('chat-text').focus();
 }else{
   const restore=chatTrigger?.isConnected?chatTrigger:document.querySelector('[data-action="activity"]');
   restore?.focus();
 }
}
function setMenu(open){
 state.menu=open;
 $('mobile-nav').hidden=!open;
 const button=document.querySelector('.mobile-toggle');
 button.setAttribute('aria-expanded',String(open));
 button.setAttribute('aria-label',(open?'Fechar':'Abrir')+' menu de navegação');
 button.innerHTML=ico(open?'x':'menu',24);
 button.focus();
}
function openDialog(kind,trigger){
 previousDialogFocus=trigger;
 const overlay=$('overlay');
 overlay.innerHTML=kind==='settings'?settingsMarkup():helpMarkup();
 for(const element of overlay.parentElement.children){
   if(element!==overlay)element.inert=true;
 }
 document.querySelector('.skip-link').inert=true;
 overlay.querySelector('[data-action="close-overlay"]:is(button)').focus();
}
function closeDialog(){
 const overlay=$('overlay');
 overlay.replaceChildren();
 for(const element of overlay.parentElement.children)element.inert=false;
 document.querySelector('.skip-link').inert=false;
 previousDialogFocus?.focus();
 previousDialogFocus=null;
}
function setSetting(key,value){
 if(['font','rate'].includes(key))value=Number(value);
 if(key==='tts'&&!value)stopSpeech();
 state[key]=value;
 persist(key,value);
 applyPrefs();
 syncLive();
}
function refreshLab(focusSelector,message){
 document.querySelector('.lab').outerHTML=labMarkup();
 document.querySelector(focusSelector)?.focus();
 announce(message+' Saldo '+$('demo-balance').textContent+'.');
}
const app=$('app');
document.querySelector('.skip-link').addEventListener('click',event=>{
 event.preventDefault();
 $('main').focus();
 $('main').scrollIntoView({block:'start'});
});
app.addEventListener('click',event=>{
 const nav=event.target.closest('[data-nav]');
 if(nav){
   if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   event.preventDefault();
   navigate(nav.dataset.nav);
   return;
 }
 const read=event.target.closest('[data-read-section]');
 if(read){
   const section=CONTENT[state.page].sections[Number(read.dataset.readSection)];
   if(section)speak(section.title+'. '+section.body,{force:true});
   return;
 }
 const button=event.target.closest('[data-action]');
 if(!button)return;
 switch(button.dataset.action){
  case 'menu':setMenu(!state.menu);break;
  case 'settings':openDialog('settings',button);break;
  case 'help':openDialog('help',button);break;
  case 'close-overlay':closeDialog();break;
  case 'intro':speak(introText(),{force:true});break;
  case 'read-page':speak(pageText(state.page),{force:true});break;
  case 'mic':toggleMicrophone(button);break;
  case 'activity':setActivity(!state.activity,button);break;
  case 'close-activity':setActivity(false);break;
  case 'disconnect':
   cancelMicrophone();
   stopAudio();
   bridge.disconnect();
   $('chat-text').focus();
   announce('Sessão do assistente encerrada.');
   break;
  case 'clear-demo':
   state.demo=[];
   refreshLab('[data-action="clear-demo"]','Simulação limpa.');
   break;
  case 'stop-speech':
   stopAudio();
   announce('Áudio interrompido.');
   break;
 }
});
app.addEventListener('change',event=>{
 const control=event.target.closest('[data-setting]');
 if(control)setSetting(control.dataset.setting,control.type==='checkbox'?control.checked:control.value);
});
app.addEventListener('input',event=>{
 if(event.target.id==='chat-text')state.draft=event.target.value;
});
let sendingText=false;
async function sendChatMessage(text){
 if(sendingText)return;
 sendingText=true;
 state.draft='';
 $('chat-text').value='';
 try{
   cancelMicrophone();
   notify('');
   bridge.prepareAudio();
   stopAudio();
   if(bridge.recording)bridge.stopMicrophone();
   if(await bridge.connect())bridge.sendText(text);
   else if(!state.draft)state.draft=$('chat-text').value=text;
 }catch(error){
   if(!state.draft)state.draft=$('chat-text').value=text;
   notify(error.message||'Não foi possível enviar a mensagem.');
 }finally{
   sendingText=false;
 }
}
app.addEventListener('submit',event=>{
 if(event.target.id==='demo-form'){
   event.preventDefault();
   const data=new FormData(event.target);
   const value=Number(data.get('amount'));
   const description=String(data.get('description')||'').trim();
   if(!Number.isFinite(value)||value<=0||!description)return;
   state.demo.push({value,description,type:data.get('type')==='income'?'income':'expense'});
   refreshLab('#demo-description','Lançamento adicionado.');
 }
 if(event.target.id==='chat-form'){
   event.preventDefault();
   const value=$('chat-text').value.trim();
   if(value)sendChatMessage(value);
 }
});
window.addEventListener('keydown',event=>{
 const dialog=$('overlay').querySelector('[role="dialog"]');
 if(event.key==='Escape'){
   if(dialog)closeDialog();
   else if(microphoneOpening)cancelMicrophone();
   else if(bridge.recording)bridge.stopMicrophone();
   else if(speaking || bridge.scheduled.size || (bridge.turn && !bridge.silenceOutput))stopAudio();
   else if(state.menu)setMenu(false);
   else if(state.activity)setActivity(false);
   return;
 }
 if(dialog){
   if(event.key==='Tab'){
     const choices=[...dialog.querySelectorAll('a[href],button,input,select')].filter(element=>!element.disabled && element.getClientRects().length);
     const first=choices[0], last=choices.at(-1);
     if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
     else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
   }
   return;
 }
 if(event.defaultPrevented || event.key.toLowerCase()!=='j' || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.shiftKey)return;
 if(!event.altKey && state.shortcut==='off')return;
 if(event.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;
 event.preventDefault();
 toggleMicrophone(document.activeElement);
});
function syncUrl(){
 const page=location.hash.slice(1)||'inicio';
 if(Object.hasOwn(CONTENT,page)&&page!==state.page){
   if($('overlay').firstElementChild)closeDialog();
   navigate(page,{historyMode:'none'});
 }
}
window.addEventListener('hashchange',syncUrl);
window.addEventListener('popstate',syncUrl);
window.addEventListener('pagehide',()=>{
 cancelMicrophone();
 stopAudio();
 bridge.disconnect();
});
render();
