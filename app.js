/**
 * PONTO DIGITAL - LÓGICA DA APLICAÇÃO & DINÂMICAS DA FEIRA
 * Funcionalidades:
 * 1. Menu Mobile Acessível
 * 2. Calculadora Interativa de Sustentabilidade ODS 12
 * 3. Dinâmicas e Jogos da Feira (Simulador de Baixa Visão & Quiz Inclusivo)
 * 4. MVP Operacional do ERP com Feedback em Áudio
 * 5. Formulário de Contato com Validação Acessível em Tempo Real
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initOdsCalculator();
    initFairTabs();
    initVisionSimulator();
    initAccessibleQuiz();
    initMvpDashboard();
    initContactForm();
  });

  // =========================================================================
  // 1. MENU MOBILE ACESSÍVEL
  // =========================================================================
  function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const navList = document.getElementById('primary-nav-list');
    if (!toggleBtn || !navList) return;

    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      navList.classList.toggle('active', !isExpanded);
      if (window.A11Y) {
        window.A11Y.playEarcon('toggle');
        window.A11Y.announce(!isExpanded ? 'Menu de navegação aberto.' : 'Menu fechado.');
      }
    });

    // Fecha o menu ao clicar em um link
    navList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navList.classList.contains('active')) {
          navList.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // =========================================================================
  // 2. CALCULADORA DE SUSTENTABILIDADE ODS 12
  // =========================================================================
  function initOdsCalculator() {
    const slider = document.getElementById('input-folhas-mes');
    const labelVal = document.getElementById('label-folhas-val');
    const resArvores = document.getElementById('res-arvores');
    const resAgua = document.getElementById('res-agua');
    const resCo2 = document.getElementById('res-co2');
    const btnReadCalc = document.getElementById('btn-read-calc-results');

    if (!slider) return;

    function updateCalculations() {
      const sheetsPerMonth = parseInt(slider.value, 10);
      const sheetsPerYear = sheetsPerMonth * 12;

      // Métricas ambientais médias do setor:
      // ~8.300 folhas A4 = 1 árvore cortada
      // 1 folha A4 = ~10 litros de água no processo de celulose
      // 1 folha A4 = ~0,045 kg de emissão de CO2
      const arvoresAno = (sheetsPerYear / 8333).toFixed(1).replace('.', ',');
      const aguaLitros = (sheetsPerYear * 10).toLocaleString('pt-BR') + ' L';
      const co2Kg = Math.round(sheetsPerYear * 0.045).toLocaleString('pt-BR') + ' kg';

      labelVal.textContent = sheetsPerMonth.toLocaleString('pt-BR') + ' folhas/mês';
      slider.setAttribute('aria-valuenow', sheetsPerMonth);
      slider.setAttribute('aria-valuetext', `${sheetsPerMonth} folhas por mês`);

      resArvores.textContent = arvoresAno;
      resAgua.textContent = aguaLitros;
      resCo2.textContent = co2Kg;
    }

    slider.addEventListener('input', () => {
      updateCalculations();
    });

    slider.addEventListener('change', () => {
      if (window.A11Y) {
        window.A11Y.playEarcon('focus');
        const textToAnnounce = `Cálculo ODS 12 atualizado para ${slider.value} folhas. Impacto anual: ${resArvores.textContent} árvores salvas, ${resAgua.textContent} de água preservados e ${resCo2.textContent} de CO2 evitados.`;
        window.A11Y.announce(textToAnnounce);
      }
    });

    if (btnReadCalc) {
      btnReadCalc.addEventListener('click', () => {
        const text = `Com a eliminação de ${slider.value} folhas por mês, sua empresa poupará aproximadamente ${resArvores.textContent} árvores por ano, preservará ${resAgua.textContent} de água e evitará a emissão de ${resCo2.textContent} de gás carbônico na atmosfera. Parabéns pelo compromisso com a ODS 12!`;
        if (window.A11Y) {
          window.A11Y.playEarcon('toggle');
          window.A11Y.speak(text);
        }
      });
    }

    updateCalculations();
  }

  // =========================================================================
  // 3. ABAS DA FEIRA (INTERATIVIDADE E DINÂMICAS)
  // =========================================================================
  function initFairTabs() {
    const tabButtons = document.querySelectorAll('.fair-activities-tabs [role="tab"]');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPanelId = btn.getAttribute('aria-controls');

        // Atualiza botões
        tabButtons.forEach(b => {
          b.setAttribute('aria-selected', 'false');
          b.classList.remove('active');
          b.setAttribute('tabindex', '-1');
        });
        btn.setAttribute('aria-selected', 'true');
        btn.classList.add('active');
        btn.setAttribute('tabindex', '0');

        // Atualiza painéis
        tabPanels.forEach(panel => {
          if (panel.id === targetPanelId) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        });

        if (window.A11Y) {
          window.A11Y.playEarcon('toggle');
          window.A11Y.announce(`Aba selecionada: ${btn.textContent.trim()}`);
        }
      });

      // Suporte a setas do teclado para navegar nas abas (Padrão W3C Tabs)
      btn.addEventListener('keydown', (e) => {
        const tabsArray = Array.from(tabButtons);
        const index = tabsArray.indexOf(btn);
        let nextIndex = null;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          nextIndex = (index + 1) % tabsArray.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          nextIndex = (index - 1 + tabsArray.length) % tabsArray.length;
        }

        if (nextIndex !== null) {
          e.preventDefault();
          tabsArray[nextIndex].focus();
          tabsArray[nextIndex].click();
        }
      });
    });
  }

  // =========================================================================
  // 4. SIMULADOR DE BAIXA VISÃO (CID H54)
  // =========================================================================
  function initVisionSimulator() {
    const filterButtons = document.querySelectorAll('.vision-filters-row .filter-btn');
    const previewBox = document.getElementById('simulation-preview-box');
    const descEl = document.getElementById('filter-status-desc');
    const btnResolve = document.getElementById('btn-resolve-sim');

    if (!previewBox) return;

    const descriptions = {
      'none': 'Visão Normal: Nenhum filtro de simulação aplicado.',
      'blur': 'Visão Embaçada: Simula perda de nitidez decorrente de catarata, alta miopia ou retinopatia.',
      'tunnel': 'Visão Tubular: Simula perda de campo visual periférico (comum em glaucoma avançado).',
      'low-contrast': 'Perda Severa de Contraste: Simula dificuldade em discernir texto claro em fundo sutil.'
    };

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filterType = btn.getAttribute('data-filter');

        filterButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        if (filterType === 'none') {
          previewBox.removeAttribute('data-vision');
        } else {
          previewBox.setAttribute('data-vision', filterType);
        }

        const msg = descriptions[filterType] || '';
        if (descEl) descEl.textContent = msg;

        if (window.A11Y) {
          window.A11Y.playEarcon('toggle');
          window.A11Y.announce(msg);
        }
      });
    });

    if (btnResolve) {
      btnResolve.addEventListener('click', () => {
        if (window.A11Y) {
          window.A11Y.setTheme('high-contrast-yellow');
          window.A11Y.playEarcon('success');
          window.A11Y.speak('Modo alto contraste amarelo sobre preto ativado! Observe como os textos agora saltam aos olhos mesmo sob baixa visão.');
        }
      });
    }
  }

  // =========================================================================
  // 5. QUIZ INTERATIVO DE INCLUSÃO DIGITAL
  // =========================================================================
  function initAccessibleQuiz() {
    const questions = [
      {
        question: 'O que representa o código CID H54 abordado no projeto da Ponto Digital?',
        options: [
          'Cegueira e baixa visão',
          'Deficiência auditiva severa',
          'Problemas de ergonomia no trabalho',
          'Código tributário de software'
        ],
        correct: 0,
        explanation: 'Exato! CID H54 é a Classificação Internacional de Doenças para Cegueira e Visão Subnormal. Nosso site foi desenvolvido com alto contraste e narração para atender a esse público com dignidade.'
      },
      {
        question: 'De que forma a Ponto Digital apoia diretamente a ODS 12 da ONU?',
        options: [
          'Plantando mudas nos escritórios',
          'Digitalizando processos corporativos e eliminando o consumo de papel físico',
          'Vendendo impressoras com desconto',
          'Construindo barragens sustentáveis'
        ],
        correct: 1,
        explanation: 'Correto! A ODS 12 foca no Consumo e Produção Responsáveis. Ao transformar contratos e rotinas de ponto em dados 100% digitais, evitamos o corte de milhares de árvores e toneladas de lixo.'
      },
      {
        question: 'Qual atalho universal deste site permite alternar o Alto Contraste imediatamente?',
        options: [
          'Ctrl + P',
          'Alt + C',
          'F12',
          'Shift + Delete'
        ],
        correct: 1,
        explanation: 'Perfeito! Pressionar Alt + C alterna os esquemas de alto contraste instantaneamente sem precisar do mouse!'
      }
    ];

    let currentQIdx = 0;
    let score = 0;

    const progressEl = document.getElementById('quiz-progress');
    const questionTextEl = document.getElementById('quiz-question-text');
    const optionsGroupEl = document.getElementById('quiz-options-group');
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const feedbackText = document.getElementById('quiz-feedback-text');
    const btnNext = document.getElementById('btn-quiz-next');

    if (!questionTextEl || !optionsGroupEl) return;

    function renderQuestion(idx) {
      if (idx >= questions.length) {
        showFinalScore();
        return;
      }

      const q = questions[idx];
      progressEl.textContent = `Pergunta ${idx + 1} de ${questions.length}`;
      questionTextEl.textContent = q.question;
      optionsGroupEl.innerHTML = '';
      feedbackBox.classList.add('hidden');
      btnNext.classList.add('hidden');

      q.options.forEach((optText, oIdx) => {
        const btnOpt = document.createElement('button');
        btnOpt.className = 'quiz-opt-btn';
        btnOpt.setAttribute('role', 'radio');
        btnOpt.setAttribute('aria-checked', 'false');
        btnOpt.innerHTML = `<span aria-hidden="true">${String.fromCharCode(65 + oIdx)})</span> <span>${optText}</span>`;
        btnOpt.addEventListener('click', () => selectAnswer(idx, oIdx, btnOpt));
        optionsGroupEl.appendChild(btnOpt);
      });

      if (window.A11Y) {
        window.A11Y.announce(`Pergunta ${idx + 1}: ${q.question}`);
      }
    }

    function selectAnswer(qIdx, selectedIdx, clickedBtn) {
      const q = questions[qIdx];
      const allBtns = optionsGroupEl.querySelectorAll('.quiz-opt-btn');
      allBtns.forEach(b => {
        b.disabled = true;
        b.setAttribute('aria-checked', 'false');
      });

      clickedBtn.setAttribute('aria-checked', 'true');
      feedbackBox.classList.remove('hidden');

      if (selectedIdx === q.correct) {
        score++;
        clickedBtn.classList.add('correct');
        feedbackBox.className = 'quiz-feedback success';
        feedbackText.textContent = `🎉 Resposta Correta! ${q.explanation}`;
        if (window.A11Y) {
          window.A11Y.playEarcon('success');
          window.A11Y.announce(`Correto! ${q.explanation}`, true);
        }
      } else {
        clickedBtn.classList.add('incorrect');
        allBtns[q.correct].classList.add('correct');
        feedbackBox.className = 'quiz-feedback error';
        feedbackText.textContent = `❌ Ops, não foi desta vez. A resposta certa era a letra ${String.fromCharCode(65 + q.correct)}. ${q.explanation}`;
        if (window.A11Y) {
          window.A11Y.playEarcon('alert');
          window.A11Y.announce(`Incorreto. A resposta certa é a alternativa ${String.fromCharCode(65 + q.correct)}.`, true);
        }
      }

      btnNext.classList.remove('hidden');
      btnNext.focus();
    }

    function showFinalScore() {
      progressEl.textContent = 'Quiz Concluído!';
      questionTextEl.textContent = `Parabéns por testar a dinâmica! Você acertou ${score} de ${questions.length} perguntas.`;
      optionsGroupEl.innerHTML = `
        <div style="padding: 1.5rem; text-align: center;">
          <p style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem;">Obrigado por apoiar a acessibilidade digital e a inclusão na Feira da Ponto Digital!</p>
          <button id="btn-restart-quiz" class="btn btn-primary">🔄 Reiniciar Quiz</button>
        </div>
      `;
      feedbackBox.classList.add('hidden');
      btnNext.classList.add('hidden');

      const restartBtn = document.getElementById('btn-restart-quiz');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          currentQIdx = 0;
          score = 0;
          renderQuestion(0);
        });
      }

      if (window.A11Y) {
        window.A11Y.playEarcon('success');
        window.A11Y.speak(`Você concluiu o quiz da Ponto Digital com ${score} acertos de ${questions.length}. Muito obrigado pela participação!`);
      }
    }

    btnNext.addEventListener('click', () => {
      currentQIdx++;
      renderQuestion(currentQIdx);
    });

    renderQuestion(0);
  }

  // =========================================================================
  // 6. DEMO MVP ERP MODULAR (SIMULADOR OPERACIONAL)
  // =========================================================================
  function initMvpDashboard() {
    const form = document.getElementById('mvp-transaction-form');
    const inputDesc = document.getElementById('mvp-desc');
    const inputValor = document.getElementById('mvp-valor');
    const selectTipo = document.getElementById('mvp-tipo');
    const listEl = document.getElementById('mvp-transactions-list');
    const totalRecEl = document.getElementById('mvp-total-receitas');
    const totalDespEl = document.getElementById('mvp-total-despesas');
    const saldoEl = document.getElementById('mvp-saldo-liquido');
    const btnReadMvp = document.getElementById('btn-read-mvp-summary');

    let state = {
      receitas: 5420.00,
      despesas: 1630.00
    };

    function updateMetricsUI() {
      const saldo = state.receitas - state.despesas;
      totalRecEl.textContent = `R$ ${state.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      totalDespEl.textContent = `R$ ${state.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      saldoEl.textContent = `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = inputDesc.value.trim();
        const valor = parseFloat(inputValor.value);
        const tipo = selectTipo.value;

        if (!desc || isNaN(valor) || valor <= 0) {
          if (window.A11Y) {
            window.A11Y.playEarcon('alert');
            window.A11Y.announce('Por favor, informe uma descrição válida e um valor maior que zero.', true);
          }
          return;
        }

        if (tipo === 'receita') {
          state.receitas += valor;
        } else {
          state.despesas += valor;
        }

        // Adiciona à lista
        const li = document.createElement('li');
        li.className = `trans-item ${tipo}`;
        li.innerHTML = `
          <span class="trans-desc">${desc}</span>
          <span class="trans-val">${tipo === 'receita' ? '+' : '-'} R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        `;
        listEl.prepend(li);

        updateMetricsUI();
        inputDesc.value = '';
        inputValor.value = '';

        if (window.A11Y) {
          window.A11Y.playEarcon('success');
          const saldo = state.receitas - state.despesas;
          const msg = `Lançamento registrado: ${desc}, valor de R$ ${valor.toFixed(2)}. Novo saldo da empresa: R$ ${saldo.toFixed(2)}.`;
          window.A11Y.announce(msg, true);
        }
      });
    }

    if (btnReadMvp) {
      btnReadMvp.addEventListener('click', () => {
        const saldo = state.receitas - state.despesas;
        const speech = `Resumo financeiro do ERP Ponto Digital: Total de receitas: R$ ${state.receitas.toFixed(2)}. Total de despesas: R$ ${state.despesas.toFixed(2)}. Saldo líquido atual em caixa: R$ ${saldo.toFixed(2)}.`;
        if (window.A11Y) {
          window.A11Y.playEarcon('toggle');
          window.A11Y.speak(speech);
        }
      });
    }
  }

  // =========================================================================
  // 7. FORMULÁRIO DE CONTATO COM VALIDAÇÃO ACESSÍVEL
  // =========================================================================
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const inputName = document.getElementById('contact-name');
    const inputEmail = document.getElementById('contact-email');
    const inputMessage = document.getElementById('contact-message');
    const nameErr = document.getElementById('name-error');
    const emailErr = document.getElementById('email-error');
    const msgErr = document.getElementById('message-error');
    const successAlert = document.getElementById('contact-success-alert');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let hasError = false;

      // Limpa mensagens anteriores
      nameErr.textContent = '';
      emailErr.textContent = '';
      msgErr.textContent = '';
      successAlert.classList.add('hidden');

      if (!inputName.value.trim()) {
        nameErr.textContent = 'Por favor, digite seu nome completo.';
        hasError = true;
        inputName.focus();
      } else if (!inputEmail.value.trim() || !inputEmail.value.includes('@') || !inputEmail.value.includes('.')) {
        emailErr.textContent = 'Por favor, informe um e-mail válido com @ e domínio.';
        hasError = true;
        if (!nameErr.textContent) inputEmail.focus();
      } else if (!inputMessage.value.trim() || inputMessage.value.trim().length < 5) {
        msgErr.textContent = 'Por favor, escreva uma mensagem detalhada com pelo menos 5 caracteres.';
        hasError = true;
        if (!nameErr.textContent && !emailErr.textContent) inputMessage.focus();
      }

      if (hasError) {
        if (window.A11Y) {
          window.A11Y.playEarcon('alert');
          window.A11Y.announce('O formulário contém erros de preenchimento. Por favor, revise os campos assinalados.', true);
        }
        return;
      }

      // Sucesso no envio
      successAlert.classList.remove('hidden');
      form.reset();

      if (window.A11Y) {
        window.A11Y.playEarcon('success');
        const confirmMsg = 'Sua mensagem foi enviada com sucesso! A equipe da Ponto Digital agradece seu contato e retornará em breve.';
        window.A11Y.announce(confirmMsg, true);
        window.A11Y.speak(confirmMsg);
      }
    });
  }
})();
