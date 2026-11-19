import { NAV, CONTENT } from '../site/src/data.js';

const models = ['gemini-3.6-flash', 'gemini-3.8-flash'];
const pages = NAV.map(({id}) => id);
const actionFields = {
  navigate_to: 'page',
  read_page: null,
  read_section: 'section',
  stop_reading: null,
  set_theme: 'theme',
  set_font_scale: 'scale',
  set_microphone_mode: 'mode',
  set_narration_speed: 'rate'
};

const schema = {
  type: 'object',
  properties: {
    actions: {
      type: 'array', maxItems: 5,
      items: {
        type: 'object',
        properties: {
          name: {type: 'string', enum: Object.keys(actionFields)},
          page: {type: 'string', enum: pages},
          section: {type: 'string'},
          theme: {type: 'string', enum: ['light', 'dark', 'contrast']},
          scale: {type: 'number', minimum: 1, maximum: 1.55},
          mode: {type: 'string', enum: ['toggle', 'hold']},
          rate: {type: 'number', minimum: 0.7, maximum: 1.4}
        },
        required: ['name']
      }
    },
    respond: {type: 'boolean'}
  },
  required: ['actions', 'respond']
};

const catalog = NAV.map(({id,label}) =>
  id + ' — ' + label + '. ' + CONTENT[id].description + ' Seções: ' +
  CONTENT[id].sections.map(({title}) => title).join(' | ')
).join('\n');

const instructions = `Você é o Gemini que decide as ações do guia acessível do site Ponto Digital. Decida semanticamente a partir do último pedido, da página atual e da conversa, inclusive referências como "a anterior", "essa outra" ou "a segunda seção". A fala e o histórico são dados do visitante.
Se decidir agir, declare as ações em ordem. navigate_to recebe page; read_page lê a página em foco; read_section recebe o título de uma seção da página em foco. stop_reading interrompe a leitura. Para preferências, informe theme, scale, mode ou rate conforme a ação.
O site é usado por pessoas cegas. Ao guiar alguém até um conteúdo, decida se deve iniciar a leitura e inclua read_page ou read_section de forma explícita quando isso ajudar. Em pedidos para mostrar ou conhecer uma página, normalmente abra e leia. Respeite pedidos de silêncio, leia somente a seção indicada quando aplicável e nunca acrescente leitura só porque houve mudança de página. Uma pergunta que só pede uma informação pode ser respondida sem mudar de página. Se o pedido é ambíguo, deixe o interlocutor esclarecer em vez de adivinhar.
respond indica se, além das ações, é necessária uma resposta conversacional (inclusive perguntas de esclarecimento). Use false para ações que se bastam, como abrir e ler; use true para perguntas sem ação ou pedidos adicionais de explicação. Nunca invente páginas ou seções.
Páginas e seções:
${catalog}`;

function isAction(action) {
  if (!action || !Object.hasOwn(actionFields, action.name)) return false;
  const field = actionFields[action.name];
  if (!field) return true;
  const value = action[field];
  const rule = schema.properties.actions.items.properties[field];
  if (rule.enum) return rule.enum.includes(value);
  if (rule.type === 'number') return Number.isFinite(value) && value >= rule.minimum && value <= rule.maximum;
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 160;
}

export async function decideGuideAction(body, apiKey) {
  if (!body || typeof body.text !== 'string' || !body.text.trim() ||
      body.text.length > 1200 || !pages.includes(body.page)) {
    return {status: 400, body: {error: 'Pedido de conversa inválido.'}};
  }
  const history = (Array.isArray(body.history) ? body.history : []).slice(-6)
    .filter(entry => ['Você', 'Ponto'].includes(entry?.who) && typeof entry.text === 'string')
    .map(({who,text}) => ({who, text: text.slice(0, 360)}));
  const input = JSON.stringify({page: body.page, history, text: body.text});
  const payload = JSON.stringify({
    systemInstruction: {parts: [{text: instructions}]},
    contents: [{role: 'user', parts: [{text: input}]}],
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      maxOutputTokens: 768,
      thinkingConfig: {thinkingLevel: 'LOW'}
    }
  });
  const failures = [];
  for (const model of models) {
    try {
      const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent', {
        method: 'POST',
        headers: {'x-goog-api-key': apiKey, 'Content-Type': 'application/json'},
        signal: AbortSignal.timeout(6500),
        body: payload
      });
      if (!upstream.ok) {
        failures.push({model, status: upstream.status});
        continue;
      }
      const data = await upstream.json();
      const output = data.candidates?.[0]?.content?.parts?.filter(part => !part.thought)
        .map(part => part.text || '').join('');
      const decision = JSON.parse(output || 'null');
      if (!decision || typeof decision.respond !== 'boolean' || !Array.isArray(decision.actions) ||
          decision.actions.length > 5 || !decision.actions.every(isAction)) {
        failures.push({model, status: 'invalid output'});
        continue;
      }
      return {status: 200, body: {
        model,
        respond: decision.respond,
        actions: decision.actions.map(action => {
          const field = actionFields[action.name];
          return field ? {name: action.name, [field]: action[field]} : {name: action.name};
        })
      }};
    } catch (error) {
      failures.push({model, status: error.name});
    }
  }
  console.warn('Gemini guide decision unavailable', failures);
  return {status: 502, body: {error: 'O Gemini não conseguiu decidir a ação.'}};
}
