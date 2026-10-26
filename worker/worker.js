/**
 * Cloudflare Worker: token temporário para uma sessão Live.
 * Configure GEMINI_API_KEY como segredo (wrangler secret put GEMINI_API_KEY).
 * Aceita chamadas da própria origem do Worker e do domínio GitHub Pages em SITE_ORIGIN.
 * RATE_LIMIT é um binding Cloudflare Rate Limiting, obrigatório (fail closed).
 * Restrinja publicamente também por WAF/Turnstile e por cotas do projeto Google.
 */
const MODELS = new Set(['gemini-3.8-live', 'gemini-3.8-live-extended-thinking']);

/** Nunca devolva a mensagem bruta do Google: ela pode conter dados da conta.
 * Devolva HTTP e razão (não secreta), mais uma ação útil para quem administra.
 */
function explainGoogleError(status, reason, detail='') {
  const code = String(reason||'').slice(0,48).replace(/[^A-Z0-9_]/gi,'');
  const text = String(detail||'');
  if (/leak|compromis|block/i.test(text)) return 'O Google bloqueou a chave exposta. Gere outra chave no AI Studio e substitua o Secret GEMINI_API_KEY no Cloudflare.';
  if (status === 400) return 'O Google recusou os parâmetros do token (400). Verifique o acesso ao Live API e a configuração enviada.';
  if (status === 401) return 'O Google não reconheceu a chave do Gemini (401). Confira o Secret GEMINI_API_KEY no Cloudflare.';
  if (status === 402) return 'O projeto Gemini precisa de créditos ou configuração de cobrança (402). Verifique o AI Studio.';
  if (status === 403) return 'O Google negou acesso à chave ou ao projeto (403). Verifique permissões, situação da chave e elegibilidade no AI Studio.';
  if (status === 404) return 'O modelo ou a rota de emissão de tokens não está disponível para este projeto (404).';
  if (status === 429) return 'O Google limitou as requisições ou esgotou a cota (429). Confira os limites no AI Studio.';
  if (status >= 500) return 'O serviço Gemini falhou temporariamente (Google '+status+'). Tente novamente depois.';
  return 'Não foi possível criar token Gemini. Google HTTP '+status+(code?' ('+code+')':'')+'.';
}

function json(body, status, origin='') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'Vary':'Origin',
      ...(origin ? {'Access-Control-Allow-Origin':origin} : {})
    }
  });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const ownOrigin = new URL(request.url).origin;
    if (!origin || (origin !== ownOrigin && origin !== env.SITE_ORIGIN)) return json({error:'Origem não autorizada'},403);
    if (request.method === 'OPTIONS') return new Response(null, {
      status:204,
      headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}
    });
    if (new URL(request.url).pathname !== '/token' || request.method !== 'POST') return json({error:'Rota não encontrada'}, 404, origin);
    if (!env.GEMINI_API_KEY || !env.RATE_LIMIT) return json({error:'Servidor ainda não configurado'},503,origin);
    const address = request.headers.get('CF-Connecting-IP') || 'unknown';
    const permitted = await env.RATE_LIMIT.limit({key:address});
    if (!permitted.success) return json({error:'Limite de sessões atingido. Tente novamente mais tarde.'},429,origin);
    let body;
    try { body = await request.json(); } catch { return json({error:'JSON inválido'},400,origin); }
    if (!MODELS.has(body.model)) return json({error:'Modelo indisponível'},400,origin);
    const now=Date.now();
    const payload = {
      uses:1,
      newSessionExpireTime:new Date(now+60_000).toISOString(),
      expireTime:new Date(now+30*60_000).toISOString(),
      liveConnectConstraints:{
        model:'models/'+body.model,
        config:{sessionResumption:{},responseModalities:['AUDIO']}
      }
    };
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
        method:'POST',
        headers:{'x-goog-api-key':env.GEMINI_API_KEY,'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      if (!response.ok) {
        let googleError = {};
        try { const rejected=await response.json(); googleError=rejected?.error||{}; } catch {}
        const reason=String(googleError.status||'').replace(/[^A-Z0-9_]/gi,'').slice(0,48);
        const message=explainGoogleError(response.status,reason,googleError.message);
        console.warn('Gemini token rejected', {httpStatus:response.status,reason,model:body.model});
        return json({error:message,upstreamStatus:response.status,upstreamReason:reason},502,origin);
      }
      const token = await response.json();
      if (!token.name) return json({error:'Resposta inválida do provedor'},502,origin);
      return json({token:token.name},200,origin);
    } catch { return json({error:'Provedor inacessível'},502,origin); }
  }
};