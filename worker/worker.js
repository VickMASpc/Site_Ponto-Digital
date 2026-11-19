import { decideGuideAction } from './guide.js';

/**
 * Cloudflare Worker: token temporário para uma sessão Live.
 * Configure GEMINI_API_KEY como segredo (wrangler secret put GEMINI_API_KEY).
 * Aceita chamadas da própria origem do Worker e do domínio GitHub Pages em SITE_ORIGIN.
 * RATE_LIMIT é um binding Cloudflare Rate Limiting, obrigatório (fail closed).
 * Restrinja publicamente também por WAF/Turnstile e por cotas do projeto Google.
 */
const MODELS = new Set(['gemini-3.8-live', 'gemini-3.8-live-extended-thinking']);

/**
 * Surface the *actual* validation reason safely. The previous 400 handler
 * swallowed Google's error text and made a malformed body impossible to debug.
 */
function explainGoogleError(status, reason, detail='') {
  const code = String(reason||'').replace(/[^A-Z0-9_]/gi,'').slice(0,48);
  const safe = String(detail||'')
    .replace(/AIza[A-Za-z0-9_-]+/g,'[chave omitida]')
    .replace(/AQ\.[A-Za-z0-9_.-]+/g,'[chave omitida]')
    .replace(/(?:key|token|credential)=([^\s&]+)/gi,'$1=[omisso]')
    .replace(/[\r\n]+/g,' ')
    .slice(0,300);
  return 'Gemini HTTP '+status+(code?' ('+code+')':'')+(safe?': '+safe:': solicitação recusada.');
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
    const {origin: ownOrigin, pathname} = new URL(request.url);
    if (!origin || (origin !== ownOrigin && origin !== env.SITE_ORIGIN)) return json({error:'Origem não autorizada'},403);
    if (request.method === 'OPTIONS') return new Response(null, {
      status:204,
      headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}
    });
    const guide = pathname === '/guide';
    if ((!guide && pathname !== '/token') || request.method !== 'POST') return json({error:'Rota não encontrada'}, 404, origin);
    const limiter = guide ? env.GUIDE_RATE_LIMIT : env.RATE_LIMIT;
    if (!env.GEMINI_API_KEY || !limiter) return json({error:'Servidor ainda não configurado'},503,origin);
    const address = request.headers.get('CF-Connecting-IP') || 'unknown';
    const permitted = await limiter.limit({key:address});
    if (!permitted.success) return json({error:'Limite de solicitações atingido. Tente novamente mais tarde.'},429,origin);
    let body;
    try {
      if (guide) {
        if (Number(request.headers.get('Content-Length')) > 8192) return json({error:'Pedido longo demais'},413,origin);
        const content = await request.text();
        if (content.length > 8192) return json({error:'Pedido longo demais'},413,origin);
        body = JSON.parse(content);
      } else body = await request.json();
    } catch { return json({error:'JSON inválido'},400,origin); }
    if (guide) {
      const result = await decideGuideAction(body, env.GEMINI_API_KEY);
      return json(result.body, result.status, origin);
    }
    if (!MODELS.has(body?.model)) return json({error:'Modelo indisponível'},400,origin);
    // Minimal body from Google's REST documentation for auth_tokens.create.
    // Token defaults: 1 use, 1 minute to start, 30 minutes of lifetime.
    // Previously we included liveConnectConstraints; the token server returned 400.
    // The selected model and session options are sent on the Live WebSocket.
    const payload = {uses:1};
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
        console.warn('Gemini token rejected', {httpStatus:response.status,reason,model:body.model,message});
        return json({error:message,upstreamStatus:response.status,upstreamReason:reason},502,origin);
      }
      const token = await response.json();
      if (!token.name) return json({error:'Resposta inválida do provedor'},502,origin);
      return json({token:token.name},200,origin);
    } catch { return json({error:'Provedor inacessível'},502,origin); }
  }
};