/**
 * PONTO DIGITAL - MÓDULO DE ACESSIBILIDADE TOTAL (WCAG AAA & CID H54)
 * Recursos para Pessoas Cegas e com Baixa Visão:
 * - Narrador por Voz (Web Speech API) ATIVO POR PADRÃO com divisão inteligente de sentenças
 * - Início automático com boas-vindas faladas e suporte a políticas de autoplay do navegador
 * - Leitura de TODAS as seções, cards, parágrafos, botões e títulos
 * - Modo "Ler Página Toda" sequencial
 * - Bipes Sonoros Espaciais (Web Audio API nativa)
 * - Regiões Vivas (ARIA Live Regions) para Leitores de Tela
 * - Navegação Completa por Teclado e Atalhos Globais
 * - Modos de Alto Contraste (Amarelo/Preto, Branco/Preto, Invertido)
 * - Ampliação Dinâmica de Fonte e Régua de Leitura
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. ESTADO GLOBAL DE ACESSIBILIDADE
  // =========================================================================
  const a11yState = {
    speechEnabled: true, // INICIA NARRADOR ATIVO POR PADRÃO
    soundEffectsEnabled: true,
    speechRate: 1.0,
    currentUtterance: null,
    isSpeaking: false,
    fontSizeLevel: 0,
    fontSizeClasses: ['normal', 'medium', 'large', 'extra-large'],
    activeTheme: 'default',
    rulerActive: false,
    hyperlegibleActive: false,
    audioCtx: null,
    speechQueue: [],
    currentQueueIndex: 0,
    hasWelcomed: false,
    currentHighlightedEl: null,
    heartbeatTimer: null,
    isReadingFullPage: false,
    fullPageSectionIndex: 0
  };

  // =========================================================================
  // 2. ELEMENTOS DOM PRINCIPAIS
  // =========================================================================
  const politeAnnouncer = document.getElementById('sr-announcements-polite');
  const assertiveAnnouncer = document.getElementById('sr-announcements-assertive');
  const themeSelect = document.getElementById('theme-select');
  const btnToggleSpeech = document.getElementById('btn-toggle-speech');
  const btnReadFullPage = document.getElementById('btn-read-full-page');
  const btnToggleSound = document.getElementById('btn-toggle-sound-effects');
  const btnFontInc = document.getElementById('btn-font-inc');
  const btnFontDec = document.getElementById('btn-font-dec');
  const btnFontReset = document.getElementById('btn-font-reset');
  const btnToggleRuler = document.getElementById('btn-toggle-ruler');
  const btnToggleHyperlegible = document.getElementById('btn-toggle-hyperlegible');
  const readingRuler = document.getElementById('reading-ruler');
  
  // Player flutuante de narração
  const playerContainer = document.getElementById('narrator-floating-player');
  const playerText = document.getElementById('player-current-text');
  const btnNarratorPause = document.getElementById('btn-narrator-pause');
  const btnNarratorStop = document.getElementById('btn-narrator-stop');
  const narratorSpeedSelect = document.getElementById('narrator-speed-select');

  // Modal de atalhos
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
  const btnCloseShortcuts = document.getElementById('modal-close-btn');
  const btnModalOk = document.getElementById('modal-ok-btn');
  const footerBtnShortcuts = document.getElementById('footer-btn-shortcuts');
  const footerBtnSpeech = document.getElementById('footer-btn-speech');
  const footerBtnContrast = document.getElementById('footer-btn-contrast');

  let lastFocusedElementBeforeModal = null;

  // =========================================================================
  // 3. ANÚNCIOS PARA LEITORES DE TELA (NVDA, JAWS, TALKBACK, VOICE OVER)
  // =========================================================================
  function announceToScreenReader(message, assertive = false) {
    if (!message) return;
    const region = assertive ? assertiveAnnouncer : politeAnnouncer;
    if (region) {
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 50);
    }
  }

  // =========================================================================
  // 4. SINTETIZADOR DE SONS ESPACIAIS (EARCONS COM WEB AUDIO API)
  // =========================================================================
  function initAudioContext() {
    if (!a11yState.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        a11yState.audioCtx = new AudioCtxClass();
      }
    }
    if (a11yState.audioCtx && a11yState.audioCtx.state === 'suspended') {
      a11yState.audioCtx.resume();
    }
  }

  function playEarcon(type) {
    if (!a11yState.soundEffectsEnabled) return;
    try {
      initAudioContext();
      if (!a11yState.audioCtx) return;
      const ctx = a11yState.audioCtx;
      const now = ctx.currentTime;

      if (type === 'focus') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'toggle') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.09, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.35);
        });
      } else if (type === 'alert' || type === 'error') {
        [220, 185].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.07, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.15);
        });
      }
    } catch (e) {
      console.warn('Áudio não suportado ou bloqueado pelo navegador:', e);
    }
  }

  // =========================================================================
  // 5. MOTOR DE FALA INTELIGENTE (CHUNKING & RESOLUÇÃO DE TRUNCAMENTO)
  // =========================================================================
  function getPortugueseVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const ptBrVoice = voices.find(v => v.lang.toLowerCase() === 'pt-br' || v.lang.toLowerCase() === 'pt_br');
    if (ptBrVoice) return ptBrVoice;
    return voices.find(v => v.lang.toLowerCase().startsWith('pt')) || null;
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      getPortugueseVoice();
    };
  }

  // Divide textos longos em frases completas para não truncar no navegador
  function splitIntoSentences(text) {
    if (!text) return [];
    const normalized = text.replace(/\s+/g, ' ').trim();
    // Separa por pontos, pontos e vírgula, exclamações, interrogações ou quebras
    const rawMatches = normalized.match(/[^.!?\n;:]+[.!?\n;:]*|[^.!?\n;:]+$/g) || [normalized];
    const sentences = [];

    rawMatches.forEach(item => {
      const clean = item.trim();
      if (!clean) return;
      if (clean.length > 150) {
        // Se ainda for muito grande, quebra por vírgulas
        const commaSplits = clean.split(/,/);
        commaSplits.forEach(cs => {
          const cTrim = cs.trim();
          if (cTrim) sentences.push(cTrim);
        });
      } else {
        sentences.push(clean);
      }
    });

    return sentences.length > 0 ? sentences : [normalized];
  }

  function highlightElement(el) {
    clearHighlight();
    if (el && el.nodeType === 1) {
      el.classList.add('reading-active');
      a11yState.currentHighlightedEl = el;
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {}
    }
  }

  function clearHighlight() {
    if (a11yState.currentHighlightedEl) {
      a11yState.currentHighlightedEl.classList.remove('reading-active');
      a11yState.currentHighlightedEl = null;
    }
  }

  function startSpeechHeartbeat() {
    stopSpeechHeartbeat();
    // Impede o Chrome de adormecer ou cortar fala após 14 segundos
    a11yState.heartbeatTimer = setInterval(() => {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }

  function stopSpeechHeartbeat() {
    if (a11yState.heartbeatTimer) {
      clearInterval(a11yState.heartbeatTimer);
      a11yState.heartbeatTimer = null;
    }
  }

  function speakText(text, targetElement = null, onComplete = null) {
    if (!('speechSynthesis' in window)) {
      announceToScreenReader('Síntese de voz não suportada no seu navegador.');
      return;
    }

    stopSpeech(false); // Para fala atual sem desligar o modo

    if (!text || text.trim() === '') return;

    if (targetElement) {
      highlightElement(targetElement);
    }

    const sentences = splitIntoSentences(text);
    a11yState.speechQueue = sentences;
    a11yState.currentQueueIndex = 0;
    a11yState.isSpeaking = true;

    if (playerContainer) {
      playerContainer.classList.remove('hidden');
      if (playerText) {
        playerText.textContent = sentences[0].substring(0, 45) + '...';
      }
    }

    startSpeechHeartbeat();
    playNextSentenceInQueue(onComplete);
  }

  function playNextSentenceInQueue(onComplete) {
    if (!a11yState.speechEnabled) {
      stopSpeech();
      return;
    }

    if (a11yState.currentQueueIndex >= a11yState.speechQueue.length) {
      a11yState.isSpeaking = false;
      stopSpeechHeartbeat();
      clearHighlight();
      if (playerContainer) playerContainer.classList.add('hidden');
      if (onComplete) onComplete();
      return;
    }

    const sentence = a11yState.speechQueue[a11yState.currentQueueIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'pt-BR';
    utterance.rate = a11yState.speechRate;

    const voice = getPortugueseVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      if (playerText) {
        playerText.textContent = sentence.substring(0, 45) + '...';
      }
    };

    utterance.onend = () => {
      a11yState.currentQueueIndex++;
      playNextSentenceInQueue(onComplete);
    };

    utterance.onerror = (e) => {
      console.warn('Erro ao reproduzir frase:', e);
      a11yState.currentQueueIndex++;
      playNextSentenceInQueue(onComplete);
    };

    a11yState.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech(resetQueue = true) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopSpeechHeartbeat();
    clearHighlight();
    a11yState.isSpeaking = false;
    if (resetQueue) {
      a11yState.speechQueue = [];
      a11yState.currentQueueIndex = 0;
      a11yState.isReadingFullPage = false;
    }
    if (playerContainer) playerContainer.classList.add('hidden');
  }

  function toggleSpeechNarrator() {
    a11yState.speechEnabled = !a11yState.speechEnabled;
    updateSpeechButtonUI();

    if (a11yState.speechEnabled) {
      playEarcon('toggle');
      announceToScreenReader('Narrador de voz ativado. Todas as seções e botões serão lidos.');
      speakText('Narrador de voz ativado. Use Tab para navegar ou clique em qualquer seção para ouvi-la.');
    } else {
      stopSpeech();
      playEarcon('toggle');
      announceToScreenReader('Narrador de voz desativado.');
    }
  }

  function updateSpeechButtonUI() {
    if (btnToggleSpeech) {
      btnToggleSpeech.setAttribute('aria-pressed', a11yState.speechEnabled ? 'true' : 'false');
      btnToggleSpeech.classList.toggle('active', a11yState.speechEnabled);
    }
  }

  // =========================================================================
  // 6. LEITURA COMPLETA DA PÁGINA (SEQUENCIAL)
  // =========================================================================
  const pageSectionsToRead = [
    { id: 'hero', name: 'Início e Apresentação da Ponto Digital' },
    { id: 'sobre', name: 'Sobre a Empresa e Missão de Acessibilidade' },
    { id: 'produtos-b2b', name: 'Catálogo de Softwares Corporativos B2B' },
    { id: 'ods-sustentabilidade', name: 'Compromisso com o Meio Ambiente e ODS 12' },
    { id: 'dinamicas-acessibilidade', name: 'Dinâmicas e Jogos da Feira' },
    { id: 'mvp-interativo', name: 'Demonstração Prática do ERP' },
    { id: 'equipe', name: 'Equipe de Desenvolvimento e Liderança' },
    { id: 'contato', name: 'Informações de Contato e Localização' }
  ];

  function startFullPageReading() {
    a11yState.speechEnabled = true;
    updateSpeechButtonUI();
    a11yState.isReadingFullPage = true;
    a11yState.fullPageSectionIndex = 0;

    announceToScreenReader('Iniciando leitura completa da página, seção por seção.', true);
    readNextPageSection();
  }

  function readNextPageSection() {
    if (!a11yState.isReadingFullPage || a11yState.fullPageSectionIndex >= pageSectionsToRead.length) {
      a11yState.isReadingFullPage = false;
      speakText('Leitura completa da página concluída. Ponto Digital: Conectando você ao Futuro!');
      return;
    }

    const secInfo = pageSectionsToRead[a11yState.fullPageSectionIndex];
    const secEl = document.getElementById(secInfo.id);

    if (secEl) {
      const sectionText = `Seção ${a11yState.fullPageSectionIndex + 1}: ${secInfo.name}. ` + extractCleanText(secEl);
      speakText(sectionText, secEl, () => {
        a11yState.fullPageSectionIndex++;
        setTimeout(readNextPageSection, 800);
      });
    } else {
      a11yState.fullPageSectionIndex++;
      readNextPageSection();
    }
  }

  // Extrai texto limpo e conciso de qualquer elemento ignorando botões de áudio duplicados
  function extractCleanText(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);
    // Remove botões de áudio redundantes dentro do texto clonado
    clone.querySelectorAll('.speech-reader-btn, .skip-links, .reading-ruler, .narrator-player, script, style').forEach(n => n.remove());
    return clone.innerText || clone.textContent || '';
  }

  // =========================================================================
  // 7. BOAS-VINDAS AUTOMÁTICAS AO INICIAR O SITE
  // =========================================================================
  function initiateWelcomeSpeech() {
    if (a11yState.hasWelcomed) return;
    a11yState.hasWelcomed = true;

    updateSpeechButtonUI();

    const welcomeMessage = 
      'Bem-vindo ao site da Ponto Digital! O narrador de voz está ativado. ' +
      'Softwares inteligentes B2B com total acessibilidade para pessoas cegas e com baixa visão. ' +
      'Pressione a tecla Tab para navegar, Alt de 1 a 5 para saltar seções, ou clique em qualquer parte do site para ouvi-la.';

    announceToScreenReader(welcomeMessage, true);

    try {
      speakText(welcomeMessage, document.getElementById('hero-heading'));
    } catch (e) {
      console.warn('Bloqueio temporário de áudio pelo navegador:', e);
    }
  }

  // Trata política de autoplay de navegadores modernos:
  // Se o navegador bloquear o som no onload sem gesto prévio,
  // inicia a narração imediatamente no primeiríssimo clique ou tecla do usuário!
  function setupAutoplayFallback() {
    const handleFirstGesture = () => {
      initAudioContext();
      if (!a11yState.hasWelcomed || ('speechSynthesis' in window && !window.speechSynthesis.speaking)) {
        initiateWelcomeSpeech();
      }
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
  }

  // =========================================================================
  // 8. CONTROLE DE TAMANHO DE FONTE (BAIXA VISÃO / CID H54)
  // =========================================================================
  function setFontSizeLevel(level) {
    if (level < 0) level = 0;
    if (level >= a11yState.fontSizeClasses.length) level = a11yState.fontSizeClasses.length - 1;
    a11yState.fontSizeLevel = level;

    const currentClass = a11yState.fontSizeClasses[level];
    document.documentElement.setAttribute('data-font-size', currentClass);

    playEarcon('toggle');
    const scaleDescriptions = ['Tamanho padrão 100%', 'Tamanho aumentado 120%', 'Tamanho grande 140%', 'Tamanho extra grande 165%'];
    announceToScreenReader('Tamanho da fonte ajustado para: ' + scaleDescriptions[level]);
  }

  // =========================================================================
  // 9. SELEÇÃO DE TEMAS E ALTO CONTRASTE (WCAG AAA)
  // =========================================================================
  function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    a11yState.activeTheme = themeName;
    if (themeSelect) themeSelect.value = themeName;

    playEarcon('toggle');
    const themeNamesPt = {
      'default': 'Tema Padrão Clean',
      'dark': 'Modo Escuro Moderno',
      'high-contrast-yellow': 'Alto Contraste Amarelo sobre Preto',
      'high-contrast-white': 'Alto Contraste Branco sobre Preto',
      'high-contrast-invert': 'Contraste Invertido Preto sobre Branco'
    };
    announceToScreenReader('Tema de visualização alterado para: ' + (themeNamesPt[themeName] || themeName));
  }

  function cycleHighContrast() {
    const contrastThemes = ['default', 'high-contrast-yellow', 'high-contrast-white', 'high-contrast-invert', 'dark'];
    const currentIndex = contrastThemes.indexOf(a11yState.activeTheme);
    const nextIndex = (currentIndex + 1) % contrastThemes.length;
    setTheme(contrastThemes[nextIndex]);
  }

  // =========================================================================
  // 10. RÉGUA DE LEITURA & FONTE ATKINSON HYPERLEGIBLE
  // =========================================================================
  function toggleReadingRuler() {
    a11yState.rulerActive = !a11yState.rulerActive;
    readingRuler.classList.toggle('active', a11yState.rulerActive);
    btnToggleRuler.setAttribute('aria-pressed', a11yState.rulerActive ? 'true' : 'false');
    btnToggleRuler.classList.toggle('active', a11yState.rulerActive);

    playEarcon('toggle');
    announceToScreenReader(a11yState.rulerActive ? 'Régua guia de leitura ativada.' : 'Régua de leitura desativada.');
  }

  window.addEventListener('mousemove', (e) => {
    if (a11yState.rulerActive && readingRuler) {
      readingRuler.style.top = e.clientY + 'px';
    }
  });

  function toggleHyperlegibleFont() {
    a11yState.hyperlegibleActive = !a11yState.hyperlegibleActive;
    document.body.classList.toggle('font-hyperlegible', a11yState.hyperlegibleActive);
    btnToggleHyperlegible.setAttribute('aria-pressed', a11yState.hyperlegibleActive ? 'true' : 'false');
    btnToggleHyperlegible.classList.toggle('active', a11yState.hyperlegibleActive);

    playEarcon('toggle');
    announceToScreenReader(a11yState.hyperlegibleActive ? 'Fonte de hiperlegibilidade ativada.' : 'Fonte padrão restabelecida.');
  }

  // =========================================================================
  // 11. MODAL DE ATALHOS DE TECLADO
  // =========================================================================
  function openShortcutsModal() {
    lastFocusedElementBeforeModal = document.activeElement;
    shortcutsModal.classList.remove('hidden');
    btnOpenShortcuts.setAttribute('aria-expanded', 'true');
    playEarcon('toggle');
    announceToScreenReader('Guia de atalhos de teclado aberto. Pressione Escape para fechar.', true);

    setTimeout(() => {
      if (btnCloseShortcuts) btnCloseShortcuts.focus();
    }, 100);
  }

  function closeShortcutsModal() {
    shortcutsModal.classList.add('hidden');
    btnOpenShortcuts.setAttribute('aria-expanded', 'false');
    playEarcon('toggle');
    announceToScreenReader('Guia de atalhos fechado.');

    if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === 'function') {
      lastFocusedElementBeforeModal.focus();
    }
  }

  // =========================================================================
  // 12. ATALHOS GLOBAIS DE TECLADO
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!shortcutsModal.classList.contains('hidden')) {
        closeShortcutsModal();
      } else {
        stopSpeech();
      }
      return;
    }

    if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      if (shortcutsModal.classList.contains('hidden')) {
        openShortcutsModal();
      } else {
        closeShortcutsModal();
      }
      return;
    }

    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      switch (e.key.toLowerCase()) {
        case '1':
          e.preventDefault();
          btnToggleSpeech.focus();
          speakText('Barra de ferramentas de acessibilidade focada.');
          break;
        case '2':
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
            speakText('Conteúdo principal: ' + document.getElementById('hero-heading')?.innerText);
          }
          break;
        case '3':
          e.preventDefault();
          const produtosSec = document.getElementById('produtos-b2b');
          if (produtosSec) {
            produtosSec.scrollIntoView({ behavior: 'smooth' });
            produtosSec.focus();
            speakText('Catálogo de Soluções B2B da Ponto Digital: ERP, Gestão de Contratos com IA e Ponto Digital.');
          }
          break;
        case '4':
          e.preventDefault();
          const dinamicasSec = document.getElementById('dinamicas-acessibilidade');
          if (dinamicasSec) {
            dinamicasSec.scrollIntoView({ behavior: 'smooth' });
            dinamicasSec.focus();
            speakText('Dinâmicas da feira: Simulador de baixa visão, Quiz de inclusão e bipes sonoros espaciais.');
          }
          break;
        case '5':
          e.preventDefault();
          const contatoInput = document.getElementById('contact-name');
          if (contatoInput) {
            contatoInput.scrollIntoView({ behavior: 'smooth' });
            contatoInput.focus();
            speakText('Formulário de contato focado. Digite seu nome completo.');
          }
          break;
        case 'l':
          e.preventDefault();
          if (a11yState.isReadingFullPage) {
            stopSpeech();
          } else {
            startFullPageReading();
          }
          break;
        case 'v':
          e.preventDefault();
          toggleSpeechNarrator();
          break;
        case 'c':
          e.preventDefault();
          cycleHighContrast();
          break;
        case 's':
          e.preventDefault();
          a11yState.soundEffectsEnabled = !a11yState.soundEffectsEnabled;
          btnToggleSound.classList.toggle('active', a11yState.soundEffectsEnabled);
          btnToggleSound.setAttribute('aria-pressed', a11yState.soundEffectsEnabled ? 'true' : 'false');
          playEarcon('toggle');
          announceToScreenReader(a11yState.soundEffectsEnabled ? 'Bipes sonoros de navegação ligados.' : 'Bipes sonoros desligados.');
          break;
      }
    }
  });

  // =========================================================================
  // 13. NAVEGAÇÃO POR FOCO DO TECLADO (TAB)
  // =========================================================================
  document.addEventListener('focusin', (e) => {
    if (a11yState.soundEffectsEnabled) {
      playEarcon('focus');
    }

    if (a11yState.speechEnabled) {
      const target = e.target;
      if (target.classList.contains('reading-ruler') || target.id === 'reading-ruler') return;

      let label = target.getAttribute('aria-label') || target.getAttribute('title') || target.getAttribute('placeholder');
      let text = target.innerText || target.value || '';

      let textToRead = label || text;
      if (textToRead && textToRead.trim().length > 0 && textToRead.trim().length < 250) {
        speakText(textToRead.trim(), target);
      }
    }
  });

  // =========================================================================
  // 14. LEITURA AO CLICAR EM QUALQUER TEXTO OU SEÇÃO
  // =========================================================================
  document.addEventListener('click', (e) => {
    if (!a11yState.speechEnabled) return;
    
    // Se clicou em controles do próprio player, botões de ação ou links de salto, deixa os eventos dedicados agirem
    if (e.target.closest('.narrator-player, .a11y-tools-row, .modal-backdrop, .skip-links')) {
      return;
    }

    // Se clicou diretamente em um botão de leitura de trecho
    if (e.target.closest('.speech-reader-btn')) {
      return; // O listener do botão tratará
    }

    // Se clicou em um parágrafo, título, card, badge ou item de lista
    const readableTarget = e.target.closest('h1, h2, h3, h4, p, .info-card, .product-card, .team-card, .metric-card, .detail-item, .trans-item, li, address');
    if (readableTarget) {
      const text = extractCleanText(readableTarget);
      if (text && text.trim().length > 0) {
        speakText(text.trim(), readableTarget);
      }
    }
  });

  // =========================================================================
  // 15. INICIALIZAÇÃO DE EVENTOS DE INTERFACE
  // =========================================================================
  function initListeners() {
    updateSpeechButtonUI();

    if (btnToggleSpeech) {
      btnToggleSpeech.addEventListener('click', toggleSpeechNarrator);
    }

    if (btnReadFullPage) {
      btnReadFullPage.addEventListener('click', () => {
        if (a11yState.isReadingFullPage) {
          stopSpeech();
        } else {
          startFullPageReading();
        }
      });
    }

    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        a11yState.soundEffectsEnabled = !a11yState.soundEffectsEnabled;
        btnToggleSound.classList.toggle('active', a11yState.soundEffectsEnabled);
        btnToggleSound.setAttribute('aria-pressed', a11yState.soundEffectsEnabled ? 'true' : 'false');
        playEarcon('toggle');
        announceToScreenReader(a11yState.soundEffectsEnabled ? 'Sons espaciais ativados.' : 'Sons desativados.');
      });
    }

    if (btnFontInc) btnFontInc.addEventListener('click', () => setFontSizeLevel(a11yState.fontSizeLevel + 1));
    if (btnFontDec) btnFontDec.addEventListener('click', () => setFontSizeLevel(a11yState.fontSizeLevel - 1));
    if (btnFontReset) btnFontReset.addEventListener('click', () => setFontSizeLevel(0));

    if (themeSelect) themeSelect.addEventListener('change', (e) => setTheme(e.target.value));

    if (btnToggleRuler) btnToggleRuler.addEventListener('click', toggleReadingRuler);
    if (btnToggleHyperlegible) btnToggleHyperlegible.addEventListener('click', toggleHyperlegibleFont);

    if (btnOpenShortcuts) btnOpenShortcuts.addEventListener('click', openShortcutsModal);
    if (btnCloseShortcuts) btnCloseShortcuts.addEventListener('click', closeShortcutsModal);
    if (btnModalOk) btnModalOk.addEventListener('click', closeShortcutsModal);
    if (shortcutsModal) {
      shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) closeShortcutsModal();
      });
    }

    if (footerBtnShortcuts) footerBtnShortcuts.addEventListener('click', openShortcutsModal);
    if (footerBtnSpeech) footerBtnSpeech.addEventListener('click', toggleSpeechNarrator);
    if (footerBtnContrast) footerBtnContrast.addEventListener('click', cycleHighContrast);

    if (btnNarratorStop) btnNarratorStop.addEventListener('click', () => stopSpeech());
    if (btnNarratorPause) {
      btnNarratorPause.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            btnNarratorPause.textContent = '⏸️';
            announceToScreenReader('Leitura retomada.');
          } else {
            window.speechSynthesis.pause();
            btnNarratorPause.textContent = '▶️';
            announceToScreenReader('Leitura pausada.');
          }
        }
      });
    }

    if (narratorSpeedSelect) {
      narratorSpeedSelect.addEventListener('change', (e) => {
        a11yState.speechRate = parseFloat(e.target.value);
        announceToScreenReader('Velocidade de voz ajustada para ' + e.target.value + ' vezes.');
      });
    }

    // Botões dedicados de leitura ("Ouvir Seção / Ler este trecho")
    document.querySelectorAll('.speech-reader-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        let targetEl = null;

        if (targetId) {
          targetEl = document.getElementById(targetId);
        }
        if (!targetEl) {
          targetEl = btn.closest('article, section, .info-card, .team-card, .product-card, div');
        }

        const textToRead = extractCleanText(targetEl);

        if (textToRead) {
          playEarcon('toggle');
          speakText(textToRead, targetEl);
          announceToScreenReader('Iniciando leitura em áudio do trecho selecionado.');
        }
      });
    });

    // Testador de earcons
    document.querySelectorAll('.test-sound-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const soundType = btn.getAttribute('data-sound');
        playEarcon(soundType);
      });
    });

    // Inicia fala de boas-vindas e configura fallback para restrições de autoplay
    setTimeout(() => {
      initiateWelcomeSpeech();
      setupAutoplayFallback();
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initListeners);
  } else {
    initListeners();
  }

  window.A11Y = {
    announce: announceToScreenReader,
    playEarcon: playEarcon,
    speak: speakText,
    stopSpeech: stopSpeech,
    setTheme: setTheme
  };
})();
