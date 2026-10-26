/**
 * Cloudflare Worker: token temporário para uma sessão Live.
 * Configure GEMINI_API_KEY como segredo (wrangler secret put GEMINI_API_KEY).
 * SITE_ORIGIN deve ser a origem exata, exemplo https://vickmaspc.github.io.
 * RATE_LIMIT é um binding Cloudflare Rate Limiting, obrigatório (fail closed).
 * Restrinja publicamente também por WAF/Turnstile e por cotas do projeto Google.
 */
const MODELS = new Set(['gemini-3.8-live', 'gemini-3.8-live-extended-thinking']);
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
    if (!env.SITE_ORIGIN || origin !== env.SITE_ORIGIN) return json({error:'Origem não autorizada'}, 403);
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
      liveConnectConstraints:{model:'models/'+body.model}
    };
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
        method:'POST',
        headers:{'x-goog-api-key':env.GEMINI_API_KEY,'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      if (!response.ok) return json({error:'Falha ao emitir token temporário',status:response.status},502,origin);
      const token = await response.json();
      if (!token.name) return json({error:'Resposta inválida do provedor'},502,origin);
      return json({token:token.name},200,origin);
    } catch { return json({error:'Provedor inacessível'},502,origin); }
  }
};