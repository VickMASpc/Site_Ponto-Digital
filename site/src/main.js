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
let previousDialogFocus=null;
let ignoreMicClick=false;
const load=(key,fallback)=>{try{const x=localStorage.getItem('pd.'+key);return x==null?fallback:JSON.parse(x);}catch{return fallback;}};
const state={
 page: CONTENT[location.hash.replace('#','')]?location.hash.slice(1):'inicio',
 theme:load('theme','light'),font:load('font',1),micMode:load('micMode',mobile?'toggle':'hold'),
 tts:load('tts',true),rate:load('rate',1),shortcut:load('shortcut','j'),model:load('model','gemini-3.8-live'),
 thinking:load('thinking','medium'),settings:false,help:false,menu:false,activity:false,
 status:'offline',transcript:[],demo:[],notice:'',intro:true
};
let holdRequested=false, speaking=false, speechQueue=[],speechVersion=0;
const $=(id)=>document.getElementById(id);
const persist=(key,value)=>{try{localStorage.setItem('pd.'+key,JSON.stringify(value));}catch{}};
function statusText(){
 return {offline:'Assistente desconectado',connecting:'Conectando ao Gemini…',ready:'Conectado — pronto para conversar',listening:'Ouvindo você…',busy:'Processando sua solicitação…'}[state.status]||'';
}
const bridge=new LiveBridge({
 onState(value){state.status=value;syncLive();},
 onError(message){notify(message);},
 onText(who,text){addActivity(who,text);},
 onTool:executeTool,
 onAudio(){if(speaking)stopSpeech();}
});
function notify(text){
 state.notice=text;
 const box=$('notice');
 if(box){box.textContent=text;box.hidden=false;}
 console.info('[Ponto Digital]',text);
}
function applyPrefs() {
 document.documentElement.dataset.theme=['light','dark','contrast'].includes(state.theme)?state.theme:'light';
 document.documentElement.style.setProperty('--font-scale',String(state.font));
}
function introText() {
 return mobile
 ? 'Bem-vindo à Ponto Digital, empresa de desenvolvimento de software para negócios. Você pode navegar com gestos do leitor de tela e ativar botões com toque duplo. A primeira opção da página é ouvir este guia. O botão de microfone se chama Ativar microfone e permite conversar quando a conexão estiver disponível. Um toque liga e outro desliga. Todas as páginas também podem ser lidas sem Gemini.'
 : 'Bem-vindo à Ponto Digital, empresa de desenvolvimento de software para negócios. Para navegar, use Tab até os links e Enter para abrir. O primeiro botão da página permite ouvir estas orientações novamente. A tecla J, marcada por uma saliência tátil, ativa a conversa por voz; Alt mais J é uma alternativa. Use o botão de microfone se seu leitor de tela interceptar J. Também é possível ler páginas sem Gemini e ajustar contraste e texto nas preferências.';
}
function stopSpeech(){
 ++speechVersion;speaking=false;speechQueue=[];
 if('speechSynthesis' in window) speechSynthesis.cancel();
 const label=$('tts-indicator');if(label)label.textContent='';
}
function speak(text,{force=false}={}){
 if(!('speechSynthesis' in window)){notify('A leitura por voz não está disponível neste navegador.');return;}
 if(!state.tts&&!force)return;
 stopSpeech();
 bridge.stopPlayback();
 const chunks=String(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.reduce((list,piece)=>{
   const words=piece.trim().split(/\s+/);
   while(words.length){list.push(words.splice(0,Math.min(35,words.length)).join(' '));}
   return list;
 },[])||[];
 speechQueue=chunks;const v=speechVersion;speaking=true;
 const label=$('tts-indicator');if(label)label.textContent='Leitura em andamento';
 const voices=speechSynthesis.getVoices();
 const voice=voices.find(x=>x.lang.toLowerCase()==='pt-br')||voices.find(x=>x.lang.startsWith('pt'));
 function next(){
   if(v!==speechVersion)return;
   const chunk=speechQueue.shift();
   if(!chunk){speaking=false;const box=$('tts-indicator');if(box)box.textContent='';return;}
   const u=new SpeechSynthesisUtterance(chunk);
   u.lang='pt-BR';u.rate=state.rate; if(voice)u.voice=voice;
   u.onend=next;u.onerror=next;
   speechSynthesis.speak(u);
 }
 next();
}
function addActivity(who,text) {
 if(!text?.trim())return;
 const last=state.transcript.at(-1);
 if(last?.who===who && last.text===text)return;
 state.transcript.push({who,text:String(text).slice(0,1200)});
 state.transcript=state.transcript.slice(-18);
 const list=$('activity-list');
 if(list){list.innerHTML=activityMarkup();list.scrollTop=list.scrollHeight;}
}
function activityMarkup(){
 return state.transcript.length
 ? state.transcript.map(x=>`<div class="message ${x.who==='Você'?'user-message':'agent-message'}"><span>${esc(x.who)}</span><p>${esc(x.text)}</p></div>`).join('')
 : '<p class="empty-activity">Sua conversa aparecerá aqui, com transcrições quando o Gemini fornecê-las.</p>';
}
function syncLive() {
 const label=$('voice-status');if(label)label.textContent=statusText();
 const dot=$('voice-dot');if(dot)dot.dataset.status=state.status;
 const btn=$('mic-button');if(btn){
   btn.setAttribute('aria-pressed',bridge.recording?'true':'false');
   btn.setAttribute('aria-label',bridge.recording?'Parar de falar':'Ativar microfone');
   btn.dataset.active=bridge.recording?'true':'false';
 }
 const desc=$('mic-hint');if(desc)desc.textContent=bridge.recording?'Microfone ativo. Fale agora.':(mobile?'Toque para conversar':state.micMode==='hold'?'Segure J para falar':'Pressione J para ligar ou desligar');
 const talk=document.querySelector('.access-talk');
 if(talk){talk.setAttribute('aria-pressed',bridge.recording?'true':'false');talk.textContent=bridge.recording?'Parar microfone':'Conversar por voz (opcional)';}
 const disconnect=$('disconnect');if(disconnect)disconnect.hidden=!bridge.connected;
}
function navItems(){
 return NAV.map(x=>`<a href="#${x.id}" data-nav="${x.id}" class="nav-link ${state.page===x.id?'selected':''}" ${state.page===x.id?'aria-current="page"':''}>${x.label}</a>`).join('');
}
function sectionHTML(items) {
 return items.map((item,i)=>`<article class="info-card ${i===0?'large-card':''}">
  <div class="card-index">${String(i+1).padStart(2,'0')}</div><h2>${esc(item.title)}</h2><p>${esc(item.body)}</p>
  <button class="text-action" data-read-section="${i}">${ico('sound',17)} Ouvir esta seção</button>
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
        <p class="hero-lead">Criamos soluções em software para ajudar empresas a organizar processos, reduzir tarefas repetitivas e trabalhar melhor.</p>
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
  <section class="next-section"><span>CONTINUE EXPLORANDO</span><h2>O próximo passo pode ser uma conversa.</h2><button class="btn btn-outline" data-action="help">Como usar a navegação por voz ${ico('arrow',19)}</button></section>
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
 <div class="balance-card"><span>SALDO DA SIMULAÇÃO</span><strong>${money(balance)}</strong><p>${state.demo.length} lançamento(s) nesta sessão</p>
 <div class="transactions">${state.demo.length?state.demo.slice().reverse().map(x=>`<div><span>${esc(x.description)}</span><b class="${x.type==='income'?'positive':'negative'}">${x.type==='income'?'+':'−'} ${money(x.value)}</b></div>`).join(''):'<p>Ainda não há lançamentos.</p>'}</div>
 <button class="quiet-button" data-action="clear-demo">Limpar simulação</button></div></div></section>`;
}
function settingsMarkup() {
 return `<div class="scrim" data-action="close-overlay"></div><aside class="side-panel" role="dialog" aria-modal="true" aria-label="Configurações de acessibilidade">
  <div class="panel-head"><div><span class="section-kicker">PREFERÊNCIAS</span><h2>Seu jeito de navegar.</h2></div><button class="icon-button" data-action="close-overlay" aria-label="Fechar configurações">${ico('x')}</button></div>
  <div class="setting-group"><h3>Visual</h3><label for="theme-select">Tema do site</label><select id="theme-select" data-setting="theme"><option value="light" ${state.theme==='light'?'selected':''}>Claro</option><option value="dark" ${state.theme==='dark'?'selected':''}>Escuro</option><option value="contrast" ${state.theme==='contrast'?'selected':''}>Alto contraste</option></select>
  <label for="font-select">Tamanho do texto</label><select id="font-select" data-setting="font"><option value="1" ${state.font==1?'selected':''}>Padrão (100%)</option><option value="1.18" ${state.font==1.18?'selected':''}>Grande (118%)</option><option value="1.36" ${state.font==1.36?'selected':''}>Muito grande (136%)</option><option value="1.55" ${state.font==1.55?'selected':''}>Máximo (155%)</option></select></div>
  <div class="setting-group"><h3>Microfone</h3><label for="mic-select">Como ativar</label><select id="mic-select" data-setting="micMode"><option value="toggle" ${state.micMode==='toggle'?'selected':''}>Alternar: um toque liga, outro desliga</option><option value="hold" ${state.micMode==='hold'?'selected':''}>Segurar para falar</option></select><p class="setting-note">J possui uma saliência tátil no teclado. Alt + J funciona como alternativa para tecnologias assistivas. Todos os controles também funcionam com Tab e Enter.</p>
  <label for="shortcut-select">Atalho de uma letra</label><select id="shortcut-select" data-setting="shortcut"><option value="j" ${state.shortcut==='j'?'selected':''}>J habilitado</option><option value="off" ${state.shortcut==='off'?'selected':''}>Desativar J isolado (manter Alt + J)</option></select></div>
  <div class="setting-group"><h3>Assistente Gemini</h3><label for="model-select">Modelo de voz</label><select id="model-select" data-setting="model"><option value="gemini-3.8-live" ${state.model==='gemini-3.8-live'?'selected':''}>Gemini 3.8 Live · rápido</option><option value="gemini-3.8-live-extended-thinking" ${state.model.includes('extended')?'selected':''}>Gemini 3.8 Live · Extended Thinking</option></select>
  ${state.model.includes('extended')? `<label for="think-select">Raciocínio avançado</label><select id="think-select" data-setting="thinking"><option value="low" ${state.thinking==='low'?'selected':''}>Baixo</option><option value="medium" ${state.thinking==='medium'?'selected':''}>Médio</option><option value="high" ${state.thinking==='high'?'selected':''}>Alto</option></select>`:''}
  <p class="setting-note">Alterar o modelo desconecta a sessão atual. Conecte novamente usando o microfone.</p></div>
  <div class="setting-group"><h3>Leitura por voz do navegador</h3><label class="switch-line"><input type="checkbox" data-setting="tts" ${state.tts?'checked':''}> Ativar narrador local</label><label for="rate-select">Velocidade do narrador local</label><select id="rate-select" data-setting="rate"><option value="0.7" ${state.rate===.7?'selected':''}>Lenta (0,7×)</option><option value="1" ${state.rate===1?'selected':''}>Normal (1×)</option><option value="1.2" ${state.rate===1.2?'selected':''}>Rápida (1,2×)</option><option value="1.4" ${state.rate===1.4?'selected':''}>Muito rápida (1,4×)</option></select></div>
  <button class="btn btn-primary panel-cta" data-action="close-overlay">Concluir ${ico('check',19)}</button>
 </aside>`;
}
function helpMarkup(){
 return `<div class="scrim" data-action="close-overlay"></div><div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
 <button class="icon-button help-close" data-action="close-overlay" aria-label="Fechar instruções">${ico('x')}</button>
 <div class="help-icon">${ico('headphones',33)}</div><span class="section-kicker">GUIA DE PRIMEIRO ACESSO</span>
 <h2 id="help-title">Como navegar neste site.</h2>
 <p>${esc(introText())}</p>
 <div class="help-shortcuts"><div>${ico('keyboard',24)}<strong>Computador</strong><span>Tab e Enter · J ou Alt + J para conversar</span></div><div>${ico('mic',24)}<strong>Celular</strong><span>Leitor de tela · toque duplo nos botões</span></div></div>
 <div class="help-buttons"><button class="btn btn-primary" data-action="intro">${ico('sound',19)} Ouvir instruções</button><button class="btn btn-secondary" data-action="close-overlay">Começar a explorar</button></div>
 <p class="help-footnote">Ao ativar o microfone, o áudio é processado pela API Gemini. O áudio automático de instruções pode ser bloqueado pelo navegador; nesse caso, use “Ouvir instruções”.</p>
 </div>`;
}
function render() {
 applyPrefs();
 document.title=(NAV.find(x=>x.id===state.page)?.label||'Início')+' | Ponto Digital';
 $('app').innerHTML=`
 <div class="access-start" role="region" aria-label="Orientações de acessibilidade">
  <div class="access-start-inner">
   <p><strong>Bem-vindo à Ponto Digital.</strong> Este site funciona com leitor de tela, teclado e toque.</p>
   <div class="access-start-actions"><button class="access-guide" data-action="intro">${ico('sound',19)} Ouvir instruções de navegação</button><button class="access-read" data-action="read-page">Ler a página atual</button><button class="access-talk" data-action="mic" aria-pressed="false">Conversar por voz (opcional)</button></div>
  </div>
 </div>
 <header class="site-header"><div class="header-inner">
  <a href="#inicio" data-nav="inicio" class="brand" aria-label="Ponto Digital, voltar ao início"><span class="brand-symbol" aria-hidden="true"><span></span><span></span><span></span></span><strong>PONTO<span>DIGITAL</span><small>SOLUÇÕES EM SOFTWARE</small></strong></a>
  <nav class="desktop-nav" aria-label="Navegação principal">${navItems()}</nav>
  <div class="header-actions"><button class="icon-button settings-trigger" data-action="settings" aria-label="Abrir preferências de acessibilidade">${ico('cog',21)}</button><button class="header-voice" data-action="help">${ico('headphones',19)} Guia de voz</button><button class="icon-button mobile-toggle" data-action="menu" aria-label="Abrir menu de navegação" aria-expanded="${state.menu}">${ico(state.menu?'x':'menu',24)}</button></div>
 </div>${state.menu?`<nav class="mobile-nav" aria-label="Navegação móvel">${navItems()}</nav>`:''}</header>
 <div id="notice" class="notice" role="alert" ${state.notice?'':'hidden'}>${esc(state.notice)}</div>
 <main id="main" tabindex="-1">${pageMarkup()}</main>
 <footer class="site-footer"><div class="footer-top"><div class="footer-brand"><span class="footer-logo">PD<span>.</span></span><h2>Conectando pessoas ao futuro.</h2><p>Desenvolvimento de software B2B com um olhar para acessibilidade e inclusão.</p></div><div class="footer-links"><strong>NAVEGUE</strong>${NAV.map(x=>`<a href="#${x.id}" data-nav="${x.id}">${x.label}</a>`).join('')}</div><div class="footer-links"><strong>EXPERIÊNCIA</strong><button data-action="settings">Acessibilidade</button><button data-action="help">Ajuda e atalhos</button><button data-action="read-page">Ouvir página atual</button></div></div><div class="footer-bottom"><span>© 2026 Ponto Digital · Projeto acadêmico de Desenvolvimento de Sistemas</span><span>Feito para ser acessível, não apenas bonito.</span></div></footer>
 <div class="voice-shell">
  <div class="voice-dock" role="group" aria-label="Controles de leitura e conversa por voz">
   <div class="voice-indicator"><span class="voice-status-dot" id="voice-dot" data-status="${state.status}"></span><div><strong id="voice-status" role="status" aria-live="polite" aria-atomic="true">${statusText()}</strong><span id="mic-hint">${mobile?'Toque para conversar':state.micMode==='hold'?'Segure J para falar':'Pressione J para ligar ou desligar'}</span></div></div>
   <div class="voice-controls"><button class="small-voice-button" data-action="read-page" title="Ouvir página" aria-label="Ler página atual">${ico('sound',21)}</button><button class="small-voice-button" data-action="stop-speech" title="Parar leitura" aria-label="Parar leitura">${ico('stop',18)}</button><button class="mic-main" id="mic-button" data-action="mic" data-active="${bridge.recording}" aria-pressed="${bridge.recording}" aria-label="${bridge.recording?'Parar de falar':'Ativar microfone'}">${ico('mic',25)}</button><button class="small-voice-button" data-action="activity" title="Ver conversa" aria-label="Abrir histórico da conversa">${ico('sparkle',21)}</button></div>
  </div>
  <div class="dock-subtext"><span id="tts-indicator"></span><span>Leitura local sem conexão</span></div>
 </div>
 ${state.activity?`<section class="activity-panel" aria-label="Conversa do assistente"><div class="activity-head"><div><span class="section-kicker">RECURSO OPCIONAL</span><h2>Conversa por voz</h2></div><button class="icon-button" data-action="activity" aria-label="Fechar conversa">${ico('x')}</button></div><div id="activity-list" class="activity-list" role="log" aria-live="polite">${activityMarkup()}</div><form id="chat-form" class="chat-form"><label for="chat-text" class="sr-only">Digite uma mensagem para o assistente</label><input id="chat-text" maxlength="600" placeholder="Ou digite sua pergunta…" autocomplete="off" required><button type="submit" aria-label="Enviar mensagem">${ico('arrow',21)}</button></form><button class="quiet-button" id="disconnect" data-action="disconnect" ${bridge.connected?'':'hidden'}>Encerrar sessão de voz</button></section>`:''}
 ${state.settings?settingsMarkup():''}
 ${state.help?helpMarkup():''}
 <div class="sr-only" role="status" aria-live="polite" id="screen-announcement"></div>
 `;
 syncLive();
}
function announce(text){const e=$('screen-announcement');if(e){e.textContent='';requestAnimationFrame(()=>{if(e)e.textContent=text;});}}
function navigate(id,{historyMode='push'}={}){
 if(!CONTENT[id]){notify('Esta página não existe.');return false;}
 state.page=id;state.menu=false;state.help=false;state.settings=false;
 if(historyMode==='push' && location.hash!==('#'+id))history.pushState({page:id},'','#'+id);
 render();window.scrollTo({top:0,behavior:'instant'});
 const heading=$('main-heading');if(heading)heading.focus({preventScroll:true});
 announce('Página '+NAV.find(x=>x.id===id)?.label+'. '+CONTENT[id].title);
 return true;
}
async function beginMicrophone(isHold=false){
 if(bridge.recording){if(!isHold)bridge.stopMicrophone();return;}
 stopSpeech();
 try {
   await bridge.connect(state.model,state.thinking);
   if(isHold&&!holdRequested){speak('Conexão pronta. Segure a tecla J novamente para falar.',{force:true});return;}
   await bridge.startMicrophone();
 } catch(e){notify(e.message||'Não foi possível ativar o microfone.');}
}
function endMicrophone(){bridge.stopMicrophone();}
async function executeTool(name,args){
 const current=CONTENT[state.page];
 switch(name){
  case 'navigate_to': {
    const ok=navigate(String(args.page||'').toLowerCase().trim());
    return ok?{success:true,page:state.page,title:CONTENT[state.page].title,description:CONTENT[state.page].description}:{success:false,error:'Página inexistente',available:NAV.map(x=>x.id)};
  }
  case 'get_navigation_options':return NAV.map(x=>({page:x.id,label:x.label}));
  case 'get_page_content':{
    const id=args.page&&CONTENT[args.page]?args.page:state.page;
    return {page:id,title:CONTENT[id].title,description:CONTENT[id].description,sections:CONTENT[id].sections};
  }
  case 'read_section':
  case 'summarize_section':{
    const query=String(args.section||'').trim().toLocaleLowerCase('pt-BR');
    const match=current.sections.find(x=>x.title.toLocaleLowerCase('pt-BR').includes(query))||(!query?current.sections[0]:null);
    return match?{page:state.page,title:match.title,text:match.body,instruction:name==='read_section'?'Recite o conteúdo para o visitante.':'Resuma de forma clara para o visitante.'}:{error:'Seção não encontrada',available:current.sections.map(x=>x.title)};
  }
  case 'set_theme': {
    if(!['light','dark','contrast'].includes(args.theme))return {error:'Tema inválido'};
    state.theme=args.theme;persist('theme',state.theme);render();return {success:true,theme:state.theme};
  }
  case 'set_font_scale':{
    const scale=Number(args.scale);if(!Number.isFinite(scale))return {error:'Escala inválida'};
    state.font=Math.max(1,Math.min(1.55,scale));persist('font',state.font);render();return {success:true,scale:state.font};
  }
  case 'set_microphone_mode':{
    if(!['toggle','hold'].includes(args.mode))return {error:'Modo inválido'};
    state.micMode=args.mode;persist('micMode',state.micMode);render();return {success:true,microphoneMode:state.micMode};
  }
  case 'set_narration_speed':{
    const rate=Number(args.rate);if(!Number.isFinite(rate))return {error:'Taxa inválida'};
    state.rate=Math.max(.7,Math.min(1.4,rate));persist('rate',state.rate);render();return {success:true,localNarratorSpeed:state.rate,note:'Ajusta TTS do navegador, não a voz nativa do Gemini.'};
  }
  case 'get_accessibility_settings':return {theme:state.theme,font:state.font,microphoneMode:state.micMode,keyboardShortcut:state.shortcut,localSpeechEnabled:state.tts,localSpeechRate:state.rate,model:state.model};
  default:return {error:'Ferramenta não autorizada'};
 }
}
function openDialog(kind,trigger){
 previousDialogFocus=trigger?.getAttribute('data-action')||'settings';
 state.help=kind==='help';state.settings=kind==='settings';render();
 const focusTarget=kind==='settings'?document.querySelector('.side-panel .icon-button'):document.querySelector('.help-close');
 focusTarget?.focus();
 document.getElementById('main')?.setAttribute('inert','');
 document.querySelector('.site-header')?.setAttribute('inert','');
 document.querySelector('.access-start')?.setAttribute('inert','');
 document.querySelector('.voice-shell')?.setAttribute('inert','');
 document.querySelector('.site-footer')?.setAttribute('inert','');
 document.querySelector('.activity-panel')?.setAttribute('inert','');
}
function closeDialog(){
 const restore=previousDialogFocus;
 state.help=false;state.settings=false;render();
 const selector=restore==='help'?'[data-action="help"]':restore==='settings'?'[data-action="settings"]':'[data-action="intro"]';
 document.querySelector(selector)?.focus();
}
function setSetting(key,value){
 const focusedId=document.activeElement?.id;
 if(['font','rate'].includes(key))value=Number(value);
 if(key==='tts')value=Boolean(value);
 if(key==='model' || key==='thinking')bridge.disconnect();
 if(key==='tts'&&!value)stopSpeech();
 state[key]=value;persist(key,value);render();
 if(focusedId)document.getElementById(focusedId)?.focus();
 if(state.settings){
  document.getElementById('main')?.setAttribute('inert','');
  document.querySelector('.site-header')?.setAttribute('inert','');
  document.querySelector('.access-start')?.setAttribute('inert','');
  document.querySelector('.voice-shell')?.setAttribute('inert','');
  document.querySelector('.site-footer')?.setAttribute('inert','');
  document.querySelector('.activity-panel')?.setAttribute('inert','');
 }
 announce('Configuração alterada: '+key);
}
const app=$('app');
app.addEventListener('click',event=>{
 const nav=event.target.closest('[data-nav]');
 if(nav){event.preventDefault();navigate(nav.dataset.nav);return;}
 const read=event.target.closest('[data-read-section]');
 if(read){const section=CONTENT[state.page].sections[Number(read.dataset.readSection)];if(section)speak(section.title+'. '+section.body,{force:true});return;}
 const prompt=event.target.closest('[data-prompt]');
 if(prompt){state.activity=true;render();bridge.connect(state.model,state.thinking).then(()=>bridge.sendText(prompt.dataset.prompt)).catch(e=>notify(e.message||'Não foi possível conectar ao Gemini.'));return;}
 const btn=event.target.closest('[data-action]');if(!btn)return;
 switch(btn.dataset.action){
  case 'menu':state.menu=!state.menu;render();break;
  case 'settings':openDialog('settings',btn);break;
  case 'help':openDialog('help',btn);break;
  case 'close-overlay':closeDialog();break;
  case 'intro':if(state.help)closeDialog();speak(introText(),{force:true});break;
  case 'read-page':speak(pageText(state.page),{force:true});break;
  case 'mic':if(ignoreMicClick){ignoreMicClick=false;break;} beginMicrophone();break;
  case 'activity':state.activity=!state.activity;render();break;
  case 'disconnect':bridge.disconnect();notify('Sessão encerrada.');break;
  case 'clear-demo':state.demo=[];render();announce('Simulação limpa.');break;
  case 'stop-speech':stopSpeech();break;
 }
});
app.addEventListener('pointerdown',event=>{
 const btn=event.target.closest('#mic-button');
 if(!btn||state.micMode!=='hold'||event.pointerType==='mouse')return;
 ignoreMicClick=true;holdRequested=true;beginMicrophone(true);
});
window.addEventListener('pointerup',()=>{
 if(state.micMode==='hold'&&holdRequested){holdRequested=false;endMicrophone();}
});
window.addEventListener('pointercancel',()=>{holdRequested=false;endMicrophone();});
app.addEventListener('change',event=>{
 const control=event.target.closest('[data-setting]');
 if(control)setSetting(control.dataset.setting,control.type==='checkbox'?control.checked:control.value);
});
app.addEventListener('submit',event=>{
 if(event.target.id==='demo-form'){
   event.preventDefault();const data=new FormData(event.target);
   const value=Number(data.get('amount'));const description=String(data.get('description')||'').trim();
   if(!Number.isFinite(value)||value<=0||!description)return;
   state.demo.push({value,description,type:data.get('type')==='income'?'income':'expense'});render();announce('Lançamento adicionado.');}
 if(event.target.id==='chat-form'){
   event.preventDefault();const value=$('chat-text')?.value.trim();
   if(!value)return;
   const input=$('chat-text');if(input)input.value='';
   bridge.connect(state.model,state.thinking).then(()=>bridge.sendText(value)).catch(e=>{notify(e.message||'Não foi possível enviar a mensagem.'); const box=$('chat-text');if(box)box.value=value;});
 }
});
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
   if(state.help||state.settings){closeDialog();}
   else if(state.menu||state.activity){state.menu=state.activity=false;render();}
   else stopSpeech();
   return;
 }
 if((state.help||state.settings)&&event.key==='Tab'){
   const dialog=document.querySelector('[role="dialog"][aria-modal="true"]');
   const choices=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(x=>x.getClientRects().length);
   if(choices.length){
     const first=choices[0],last=choices.at(-1);
     if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
     else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
   }
   return;
 }
 if(state.help||state.settings)return;
 if(event.altKey&&event.key.toLowerCase()==='j'){
   event.preventDefault();beginMicrophone();return;
 }
 if(state.shortcut==='off'||event.key.toLowerCase()!=='j'||event.altKey||event.ctrlKey||event.metaKey||event.repeat)return;
 if(['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return;
 event.preventDefault();
 if(state.micMode==='hold'){holdRequested=true;beginMicrophone(true);}
 else beginMicrophone();
});
window.addEventListener('keyup',event=>{
 if(event.key.toLowerCase()==='j'&&state.micMode==='hold'&&holdRequested){holdRequested=false;endMicrophone();}
});
function syncUrl(){const page=location.hash.replace('#','');if(CONTENT[page]&&page!==state.page)navigate(page,{historyMode:'none'});}
window.addEventListener('hashchange',syncUrl);
window.addEventListener('popstate',syncUrl);
window.addEventListener('pagehide',()=>{bridge.disconnect();stopSpeech();});
render();
setTimeout(()=>{if(state.tts)speak(introText());},600);
