import { NAV, CONTENT } from './data.js';

const guidePages = NAV.map(({id}) => id);
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

export const guideSchema = {
  type: 'object',
  properties: {
    actions: {
      type: 'array', maxItems: 5,
      items: {
        type: 'object',
        properties: {
          name: {type: 'string', enum: Object.keys(actionFields)},
          page: {type: 'string', enum: guidePages},
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

export const guideInstructions = `Você é o Gemini que decide as ações do guia acessível do site Ponto Digital. Decida semanticamente a partir do último pedido, da página atual e da conversa, inclusive referências como "a anterior", "essa outra" ou "a segunda seção". Use somente o último pacote com a fala e o histórico do visitante. As falas anteriores nesta sessão não entram na decisão, exceto se vierem no histórico do pacote.
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
  const rule = guideSchema.properties.actions.items.properties[field];
  if (rule.enum) return rule.enum.includes(value);
  if (rule.type === 'number') return Number.isFinite(value) && value >= rule.minimum && value <= rule.maximum;
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 160;
}

export function normalizeGuidePlan(decision) {
  if (!decision || typeof decision.respond !== 'boolean' || !Array.isArray(decision.actions) ||
      decision.actions.length > 5 || !decision.actions.every(isAction)) return null;
  return {
    respond: decision.respond,
    actions: decision.actions.map(action => {
      const field = actionFields[action.name];
      return field ? {name: action.name, [field]: action[field]} : {name: action.name};
    })
  };
}
