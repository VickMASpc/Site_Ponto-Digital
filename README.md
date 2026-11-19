# Ponto Digital — versão 2.0

Site institucional da Ponto Digital, com identidade visual **azul**, conteúdo B2B em primeiro plano e navegação acessível, leitura local e conversa institucional com **Gemini 3.8 Live** (base).

## Estrutura

- `site/` — aplicativo Vite (JS modular + CSS responsivo; não é HTML estático de apresentação).
- `site/src/data.js` — conteúdo das páginas e fonte de conhecimento do assistente.
- `site/src/main.js` — interface, navegação, teclado J, TTS, configurações, demo.
- `site/src/live.js` — WebSocket via SDK GenAI, áudio PCM bidirecional e transcrição.
- `worker/` — backend de tokens temporários Cloudflare, executado em `/token` quando implantado no Worker.
- `wrangler.toml` (raiz) — configuração para implantar a interface Vite e o endpoint `/token` **juntos no Worker `site-ponto-digital`** usando os comandos já configurados no painel.
- `docs/` — **build gerado pelo Vite** (não editar manualmente).
- `.github/workflows/build.yml` — instala dependências, roda verificações, compila e publica o build em `docs/`.

O `index.html` da raiz é somente compatibilidade: quem ainda estiver usando GitHub Pages em `main /root` é redirecionado para `docs/`. Recomenda-se configurar **Settings → Pages → Deploy from a branch → main → /docs**.

## Uso e acessibilidade

- O primeiro link salta para o conteúdo. A região de orientações oferece instruções faladas, leitura da página, botão de microfone e conversa por texto.
- **J** alterna o microfone no computador. **Alt + J** continua disponível ao desligar o J isolado nas preferências. O atalho respeita campos de edição. Enter, Espaço e os gestos habituais dos leitores de tela ativam os botões nativos.
- No celular, ative **Microfone do assistente**, aguarde o aviso **Microfone ligado. Fale agora.** e ative novamente para enviar. Se o microfone estiver bloqueado, a conversa abre no campo de texto.
- O Gemini conversa sobre a empresa com o conteúdo de todas as páginas. Os botões de leitura usam a voz do navegador. **Parar áudio** interrompe a fala do navegador ou do assistente.
- O foco segue para o título da nova página e volta ao controle de origem ao fechar menu ou diálogo. Preferências incluem tema, contraste, tamanho de texto e velocidade da leitura.
- O laboratório mantém os lançamentos fictícios em memória e anuncia o saldo após cada alteração.

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

1. No Cloudflare, abra o Worker já criado chamado `site-ponto-digital`. **Não crie outro projeto.** A configuração correta agora está em `wrangler.toml` na raiz. Adicione `GEMINI_API_KEY` em **Settings → Variables and Secrets → Add → Secret**. **Se uma chave real foi compartilhada em chat, revogue-a e crie uma nova antes de usá-la.**
2. O arquivo `wrangler.toml` já define o nome, os arquivos de `docs/`, a rota `/token`, o domínio de origem do GitHub Pages e o binding de limitação de sessões. Não coloque a chave em **Build Variables**; somente em **Variables and Secrets** do Worker, no tipo Secret. Restrinja uso por limites/cotas no Google Cloud e regras de abuso na Cloudflare.
3. A integração com GitHub dispara a compilação e a implantação automaticamente após commits: **Build command** `npm run build`; **Deploy command** `npx wrangler deploy`; **Root directory** `/`. Não precisa abrir o editor de código do Worker.
4. Na URL do **Cloudflare Worker** (em Domains), a interface chamará automaticamente o endpoint `/token` da mesma origem. Não é necessário criar `VITE_TOKEN_ENDPOINT` para essa hospedagem. Se quiser habilitar o Gemini também no **GitHub Pages**, configure a URL do Worker terminada em `/token` em GitHub → Settings → Secrets and variables → Actions → Variables → `VITE_TOKEN_ENDPOINT` e execute o build.
5. Abra **Deployments**, confira a última implantação como Success, e abra a URL em **Domains**. O GitHub Pages continua funcionando separadamente.

**Estado de implantação:** no GitHub Pages, sem `VITE_TOKEN_ENDPOINT` a leitura local funciona e a conversa informa que não está configurada; no Cloudflare Workers, a rota `/token` fica pronta depois de configurar `GEMINI_API_KEY`. Sem segredo, o Worker retorna erro 503 sem expor a chave.

Tokens efêmeros são distribuídos somente depois da validação do Worker (origem permitida e limitação de frequência). Controle de origem **não** autentica visitantes nem substitui proteção antiabuso em produção.

## Limitações conhecidas / próximos testes

- Precisamos validar leitores de tela (NVDA, TalkBack e VoiceOver), Safari iOS, permissões de microfone, fluxos de interrupção e reconexão WebSocket reais em dispositivos. A integração foi construída a partir da documentação oficial; compilação não comprova uma sessão Live real.
- Sessões Live são temporárias; o visitante deve reconectar quando a autenticação expirar.
- Não divulgar conformidade WCAG AA/AAA sem auditoria.
- Produtos em avaliação e números de impacto não são apresentados como lançamentos comprovados.

Referências:
- https://ai.google.dev/gemini-api/docs/live-api
- https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live

## Design e acessibilidade como requisitos

A identidade corporativa é azul. A home comunica a atividade principal (software B2B); a assistência por voz é um recurso adicional, não o tema da página.

Todos os recursos principais devem funcionar com teclado e leitor de tela mesmo sem conexão com o Gemini. A página inicial contém orientações acessíveis logo no início e um controle de leitura local. A navegação usa landmarks semânticos, headings e foco de página. A tecla J pode ser desativada (WCAG 2.2 SC 2.1.4), permanecendo Alt + J e os botões nomeados.

**Validação pendente:** testar com pessoas cegas e leitores de tela reais (NVDA/Firefox e Chrome, TalkBack/Android e VoiceOver/iOS). Os checks do GitHub não substituem esses testes nem comprovam certificação WCAG.
