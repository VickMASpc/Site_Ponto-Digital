/**
 * PONTO DIGITAL - MÓDULO DE ACESSIBILIDADE TOTAL (WCAG AAA & CID H54)
 * Recursos para Pessoas Cegas e com Baixa Visão:
 * - Sintetizador de Fala (Web Speech API) com voz em Português (pt-BR)
 * - Earcons e Bipes Sonoros Espaciais (Web Audio API nativa)
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
    speechEnabled: false,
    soundEffectsEnabled: true,
    speechRate: 1.0,
    currentUtterance: null,
    isSpeaking: false,
    fontSizeLevel: 0, // -1: pequeno, 0: normal, 1: médio, 2: grande, 3: extra-grande
    fontSizeClasses: ['normal', 'medium', 'large', 'extra-large'],
    activeTheme: 'default',
    rulerActive: false,
    hyperlegibleActive: false,
    audioCtx: null
  };

  // =========================================================================
  // 2. ELEMENTOS DOM PRINCIPAIS
  // =========================================================================
  const politeAnnouncer = document.getElementById('sr-announcements-polite');
  const assertiveAnnouncer = document.getElementById('sr-announcements-assertive');
  const themeSelect = document.getElementById('theme-select');
  const btnToggleSpeech = document.getElementById('btn-toggle-speech');
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
        // Bipe sutil e suave de 440Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'toggle') {
        // Tom ascendente de confirmação
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
        // Acorde harmônico maior de celebração (C5 - E5 - G5)
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
        // Tom de atenção com duas repetições breves
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
  // 5. NARRADOR POR VOZ (WEB SPEECH API)
  // =========================================================================
  function getPortugueseVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prioriza vozes em pt-BR (Google português, Luciana, Felipe, etc)
    const ptBrVoice = voices.find(v => v.lang.toLowerCase() === 'pt-br' || v.lang.toLowerCase() === 'pt_br');
    if (ptBrVoice) return ptBrVoice;
    return voices.find(v => v.lang.toLowerCase().startsWith('pt')) || null;
  }

  // Carrega vozes no evento do navegador caso assíncrono
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      getPortugueseVoice();
    };
  }

  function speakText(text, onStart, onEnd) {
    if (!('speechSynthesis' in window)) {
      announceToScreenReader('Síntese de voz não suportada neste navegador.');
      return;
    }

    window.speechSynthesis.cancel(); // Cancela falas anteriores
    if (!text || text.trim() === '') return;

    // Remove caracteres especiais ou quebras redundantes
    const cleanText = text.replace(/\s+/g, ' ').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = a11yState.speechRate;
    
    const ptVoice = getPortugueseVoice();
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      a11yState.isSpeaking = true;
      if (playerContainer) {
        playerContainer.classList.remove('hidden');
        if (playerText) {
          playerText.textContent = cleanText.substring(0, 45) + '...';
        }
      }
      if (onStart) onStart();
    };

    utterance.onend = () => {
      a11yState.isSpeaking = false;
      if (playerContainer) {
        playerContainer.classList.add('hidden');
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Erro na síntese de voz:', e);
      a11yState.isSpeaking = false;
      if (playerContainer) playerContainer.classList.add('hidden');
    };

    a11yState.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      a11yState.isSpeaking = false;
      if (playerContainer) playerContainer.classList.add('hidden');
    }
  }

  function toggleSpeechNarrator() {
    a11yState.speechEnabled = !a11yState.speechEnabled;
    btnToggleSpeech.setAttribute('aria-pressed', a11yState.speechEnabled ? 'true' : 'false');
    btnToggleSpeech.classList.toggle('active', a11yState.speechEnabled);

    if (a11yState.speechEnabled) {
      playEarcon('toggle');
      announceToScreenReader('Narrador de voz ativado. Ao clicar ou focar em elementos, o texto será lido.');
      speakText('Narrador de voz da Ponto Digital ativado. Bem-vindo ao nosso site.');
    } else {
      stopSpeech();
      playEarcon('toggle');
      announceToScreenReader('Narrador de voz desativado.');
    }
  }

  // =========================================================================
  // 6. CONTROLE DE TAMANHO DE FONTE (BAIXA VISÃO / CID H54)
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
  // 7. SELEÇÃO DE TEMAS E ALTO CONTRASTE (WCAG AAA)
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
  // 8. RÉGUA DE LEITURA & FONTE ATKINSON HYPERLEGIBLE
  // =========================================================================
  function toggleReadingRuler() {
    a11yState.rulerActive = !a11yState.rulerActive;
    readingRuler.classList.toggle('active', a11yState.rulerActive);
    btnToggleRuler.setAttribute('aria-pressed', a11yState.rulerActive ? 'true' : 'false');
    btnToggleRuler.classList.toggle('active', a11yState.rulerActive);

    playEarcon('toggle');
    announceToScreenReader(a11yState.rulerActive ? 'Régua guia de leitura ativada.' : 'Régua de leitura desativada.');
  }

  // Acompanhamento do ponteiro pela régua
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
  // 9. MODAL DE ATALHOS DE TECLADO (COM TRAP DE FOCO)
  // =========================================================================
  function openShortcutsModal() {
    lastFocusedElementBeforeModal = document.activeElement;
    shortcutsModal.classList.remove('hidden');
    btnOpenShortcuts.setAttribute('aria-expanded', 'true');
    playEarcon('toggle');
    announceToScreenReader('Guia de atalhos de teclado aberto. Pressione Escape para fechar.', true);

    // Foca no botão de fechar dentro do modal
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
  // 10. ATALHOS GLOBAIS DE TECLADO
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    // Tecla ESC fecha modais ou interrompe fala
    if (e.key === 'Escape') {
      if (!shortcutsModal.classList.contains('hidden')) {
        closeShortcutsModal();
      } else {
        stopSpeech();
      }
      return;
    }

    // Tecla '?' abre guia de atalhos (se não estiver digitando em campo de texto)
    if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      if (shortcutsModal.classList.contains('hidden')) {
        openShortcutsModal();
      } else {
        closeShortcutsModal();
      }
      return;
    }

    // Atalhos com tecla ALT
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      switch (e.key.toLowerCase()) {
        case '1':
          e.preventDefault();
          const a11yBar = document.getElementById('accessibility-controls');
          if (a11yBar) {
            btnToggleSpeech.focus();
            announceToScreenReader('Focado na barra de acessibilidade.');
          }
          break;
        case '2':
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
            announceToScreenReader('Focado no conteúdo principal.');
          }
          break;
        case '3':
          e.preventDefault();
          const produtosSec = document.getElementById('produtos-b2b');
          if (produtosSec) {
            produtosSec.scrollIntoView({ behavior: 'smooth' });
            produtosSec.focus();
            announceToScreenReader('Seção de produtos B2B.');
          }
          break;
        case '4':
          e.preventDefault();
          const dinamicasSec = document.getElementById('dinamicas-acessibilidade');
          if (dinamicasSec) {
            dinamicasSec.scrollIntoView({ behavior: 'smooth' });
            dinamicasSec.focus();
            announceToScreenReader('Seção de dinâmicas da feira.');
          }
          break;
        case '5':
          e.preventDefault();
          const contatoInput = document.getElementById('contact-name');
          if (contatoInput) {
            contatoInput.scrollIntoView({ behavior: 'smooth' });
            contatoInput.focus();
            announceToScreenReader('Focado no formulário de contato.');
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

  // Foco global dispara bipe de navegação espacial (se ativado)
  document.addEventListener('focusin', (e) => {
    if (a11yState.soundEffectsEnabled) {
      playEarcon('focus');
    }

    // Se o narrador automático estiver ligado, lê o texto ou rótulo do elemento focado
    if (a11yState.speechEnabled) {
      const target = e.target;
      const textToRead = target.getAttribute('aria-label') || target.innerText || target.getAttribute('placeholder') || target.getAttribute('title');
      if (textToRead && textToRead.trim().length > 0) {
        speakText(textToRead.trim());
      }
    }
  });

  // =========================================================================
  // 11. INICIALIZAÇÃO DE EVENTOS DE INTERFACE
  // =========================================================================
  function initListeners() {
    // Botão de síntese de fala
    if (btnToggleSpeech) {
      btnToggleSpeech.addEventListener('click', toggleSpeechNarrator);
    }

    // Botão de sons / earcons
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        a11yState.soundEffectsEnabled = !a11yState.soundEffectsEnabled;
        btnToggleSound.classList.toggle('active', a11yState.soundEffectsEnabled);
        btnToggleSound.setAttribute('aria-pressed', a11yState.soundEffectsEnabled ? 'true' : 'false');
        playEarcon('toggle');
        announceToScreenReader(a11yState.soundEffectsEnabled ? 'Sons espaciais ativados.' : 'Sons desativados.');
      });
    }

    // Controle de fonte
    if (btnFontInc) {
      btnFontInc.addEventListener('click', () => setFontSizeLevel(a11yState.fontSizeLevel + 1));
    }
    if (btnFontDec) {
      btnFontDec.addEventListener('click', () => setFontSizeLevel(a11yState.fontSizeLevel - 1));
    }
    if (btnFontReset) {
      btnFontReset.addEventListener('click', () => setFontSizeLevel(0));
    }

    // Seletor de temas
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => setTheme(e.target.value));
    }

    // Régua e Fonte Especial
    if (btnToggleRuler) {
      btnToggleRuler.addEventListener('click', toggleReadingRuler);
    }
    if (btnToggleHyperlegible) {
      btnToggleHyperlegible.addEventListener('click', toggleHyperlegibleFont);
    }

    // Modal de atalhos
    if (btnOpenShortcuts) btnOpenShortcuts.addEventListener('click', openShortcutsModal);
    if (btnCloseShortcuts) btnCloseShortcuts.addEventListener('click', closeShortcutsModal);
    if (btnModalOk) btnModalOk.addEventListener('click', closeShortcutsModal);
    if (shortcutsModal) {
      shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) closeShortcutsModal();
      });
    }

    // Rodapé botões rápidos
    if (footerBtnShortcuts) footerBtnShortcuts.addEventListener('click', openShortcutsModal);
    if (footerBtnSpeech) footerBtnSpeech.addEventListener('click', toggleSpeechNarrator);
    if (footerBtnContrast) footerBtnContrast.addEventListener('click', cycleHighContrast);

    // Controles do player de áudio flutuante
    if (btnNarratorStop) btnNarratorStop.addEventListener('click', stopSpeech);
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

    // Botões dedicados de leitura em trechos específicos ("Ler este trecho")
    document.querySelectorAll('.speech-reader-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-target');
        let textToRead = '';

        if (targetId) {
          const el = document.getElementById(targetId);
          if (el) {
            textToRead = el.innerText || el.textContent;
          }
        }
        if (!textToRead) {
          textToRead = btn.closest('article, section, div')?.innerText || '';
        }

        if (textToRead) {
          playEarcon('toggle');
          speakText(textToRead);
          announceToScreenReader('Iniciando leitura em voz alta do trecho selecionado.');
        }
      });
    });

    // Botões de teste de som na seção de dinâmicas
    document.querySelectorAll('.test-sound-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const soundType = btn.getAttribute('data-sound');
        playEarcon(soundType);
      });
    });
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initListeners);
  } else {
    initListeners();
  }

  // Exporta utilitários globais para o app.js
  window.A11Y = {
    announce: announceToScreenReader,
    playEarcon: playEarcon,
    speak: speakText,
    stopSpeech: stopSpeech,
    setTheme: setTheme
  };
})();
