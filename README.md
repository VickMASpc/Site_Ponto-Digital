# Ponto Digital — versão 2.0

Site institucional da Ponto Digital, com identidade visual **azul**, conteúdo B2B em primeiro plano e recursos complementares de navegação por voz, leitura local e integração à API **Gemini 3.8 Live** / **Gemini 3.8 Live Extended Thinking**.

## Estrutura

- `site/` — aplicativo Vite (JS modular + CSS responsivo; não é HTML estático de apresentação).
- `site/src/data.js` — conteúdo das páginas; compartilhado com as ferramentas do assistente.
- `site/src/main.js` — interface, navegação, teclado J, TTS, configurações, demo.
- `site/src/live.js` — WebSocket via SDK GenAI, áudio PCM bidirecional e function calling.
- `worker/` — backend opcional de tokens temporários Cloudflare, necessário para ativar Live no site público.
- `docs/` — **build gerado pelo Vite** (não editar manualmente).
- `.github/workflows/build.yml` — instala dependências, roda verificações, compila e publica o build em `docs/`.

O `index.html` da raiz é somente compatibilidade: quem ainda estiver usando GitHub Pages em `main /root` é redirecionado para `docs/`. Recomenda-se configurar **Settings → Pages → Deploy from a branch → main → /docs**.

## Uso e acessibilidade

- A primeira região da interface apresenta instruções claras e controles acessíveis: **Ouvir instruções**, **Ler a página atual** e **Conversar por voz (opcional)**. O narrador local funciona sem Gemini. O navegador pode bloquear a reprodução automática; o botão inicial permanece acessível por teclado e leitor de tela.
- Em computadores, **J** ativa o microfone (segurar por padrão; alterável para alternância). **Alt + J** é um caminho alternativo; J isolado pode ser desativado nas preferências para evitar conflitos com tecnologias assistivas e entrada de fala. Controles com Tab/Enter sempre existem. Não interceptamos J isolado dentro de formulários ou botões.
- Em dispositivos de toque, o botão de microfone fixo permite toque para ligar/desligar ou modo segurar.
- Controles para tema, alto contraste, ampliação de letras, narrador local, atalho J, modelo e nível de pensamento do Extended. A navegação por páginas posiciona foco no título, e diálogos mantêm foco interno e devolvem ao controle de origem.
- Ferramentas reais: navigate_to, get_page_content, read_section, summarize_section, get_navigation_options, set_theme, set_font_scale, set_microphone_mode, set_narration_speed, get_accessibility_settings.
- Modo laboratório de lançamentos financeiros fictícios e apenas em memória.

## Desenvolvimento

```bash
npm install
npm run dev
npm run check
npm run build
```

O build aparece em `docs/` e pode ser servido com `npm run preview`.

## Ativar o Gemini Live em produção

**NUNCA** coloque uma chave de API em `site/`, `docs/`, variáveis `VITE_*` ou código-fonte público. Variáveis Vite fazem parte do bundle público.

1. Crie um Cloudflare Worker a partir de `worker/`. É necessário configurar `GEMINI_API_KEY` como segredo privado (por exemplo: `npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml`). **Se qualquer chave real foi compartilhada em chat, rotacione-a antes de usá-la.**
2. Configure `SITE_ORIGIN` na configuração do Worker para `https://vickmaspc.github.io`. Adicione o binding Cloudflare **Rate Limiting**, revise limites/WAF e configure cotas de consumo no Google Cloud. O Worker falha fechado sem segredo ou limitador.
3. Publique o Worker (por exemplo: `npx wrangler deploy --config worker/wrangler.toml`).
4. Em **Settings → Secrets and variables → Actions → Variables**, configure `VITE_TOKEN_ENDPOINT` com a URL HTTPS pública terminada em `/token`. Ela não é secreta; o Worker emite tokens de sessão limitados.
5. Execute a workflow `Vite build → docs` ou faça novo commit. O resultado fica no GitHub Pages.

**Estado de implantação:** sem `VITE_TOKEN_ENDPOINT`, a interface e o TTS funcionam, mas o microfone informa que a sessão Live não está configurada. Isso é intencional para não vazar uma chave de produção.

Tokens efêmeros são distribuídos somente depois da validação do Worker (origem permitida e limitação de frequência). Controle de origem **não** autentica visitantes nem substitui proteção antiabuso em produção.

## Limitações conhecidas / próximos testes

- O navegador pode bloquear autoplay até a primeira interação; o botão de boas-vindas é a alternativa.
- Precisamos validar leitores de tela (NVDA, TalkBack e VoiceOver), Safari iOS, permissões de microfone, fluxos de interrupção e reconexão WebSocket reais em dispositivos. A integração foi construída a partir da documentação oficial; compilação não comprova uma sessão Live real.
- Sessões Live são temporárias; o visitante deve reconectar quando a autenticação expirar.
- Não divulgar conformidade WCAG AA/AAA sem auditoria.
- Produtos em avaliação e números de impacto não são apresentados como lançamentos comprovados.

Referências:
- https://ai.google.dev/gemini-api/docs/live-api
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live-extended-thinking

## Design e acessibilidade como requisitos

A identidade corporativa é azul. A home comunica a atividade principal (software B2B); a assistência por voz é um recurso adicional, não o tema da página.

Todos os recursos principais devem funcionar com teclado e leitor de tela mesmo sem conexão com o Gemini. A página inicial contém orientações acessíveis logo no início e um controle de leitura local. A navegação usa landmarks semânticos, headings e foco de página. A tecla J pode ser desativada (WCAG 2.2 SC 2.1.4), permanecendo Alt + J e os botões nomeados.

**Validação pendente:** testar com pessoas cegas e leitores de tela reais (NVDA/Firefox e Chrome, TalkBack/Android e VoiceOver/iOS). Os checks do GitHub não substituem esses testes nem comprovam certificação WCAG.
