import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { NAV,CONTENT,pageText } from '../site/src/data.js';
import { execFileSync } from 'node:child_process';
for (const path of ['main.js','data.js','live.js','styles.css']) assert(existsSync('site/src/'+path), 'Missing '+path);
for (const path of ['site/src/main.js','site/src/data.js','site/src/live.js','worker/worker.js']) {
  const source=readFileSync(path,'utf8');
  assert(!/AIza[A-Za-z0-9_-]{30,}/.test(source), 'API key found in '+path);
  execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
}
assert(readFileSync('vite.config.js','utf8').includes("../docs"), 'Build must output into docs');
assert(NAV.length>=6 && NAV.every(x=>CONTENT[x.id]),'Navigation must resolve');
assert(pageText('acessibilidade').includes('tecla J'),'Voice instructions missing');
const { default:worker } = await import('../worker/worker.js');
const response=await worker.fetch(new Request('https://example.workers.dev/token',{method:'POST',headers:{Origin:'https://unauthorized.invalid','Content-Type':'application/json'},body:'{}'}),{SITE_ORIGIN:'https://vickmaspc.github.io'});
assert.equal(response.status,403,'Worker must reject other origins');
const main=readFileSync('site/src/main.js','utf8');
const styles=readFileSync('site/src/styles.css','utf8');
const html=readFileSync('site/index.html','utf8');
assert(main.includes('access-start') && main.includes('Ouvir instruções de navegação'),'First-screen accessibility guide missing');
assert(main.includes('access-talk') && main.includes('Ler a página atual'),'Voice and local reading must be discoverable');
assert(main.includes("previousDialogFocus") && main.includes("aria-modal"),'Dialog accessible focus control missing');
assert(main.includes("history.pushState") && main.includes("syncUrl"),'Page navigation history must work');
assert(main.includes("state.shortcut==='off'") && main.includes("event.altKey&&event.key.toLowerCase()==='j'"),'Shortcut disable / modifier required');
assert(main.includes('TECNOLOGIA PARA EMPRESAS') && main.includes('Conheça nossas soluções'),'Home must lead with B2B');
assert(styles.includes('--teal:#155bd4') && styles.includes('.business-art'), 'Blue company identity missing');
assert(html.includes('lang="pt-BR"') && html.includes('href="#main"'), 'Language and skip link required');
const wrangler=readFileSync('wrangler.toml','utf8');
assert(wrangler.includes('name = "site-ponto-digital"'),'Worker project name must match Cloudflare');
assert(wrangler.includes('directory = "./docs"') && wrangler.includes('run_worker_first = ["/token"]'),'Worker assets and API route must be configured');
assert(wrangler.includes('main = "worker/worker.js"'),'Worker entrypoint must be from repository root');
const okOrigin=await worker.fetch(new Request('https://site-ponto-digital.example.workers.dev/token',{method:'POST',headers:{Origin:'https://site-ponto-digital.example.workers.dev','Content-Type':'application/json'},body:'{}'}),{SITE_ORIGIN:'https://vickmaspc.github.io'});
assert.equal(okOrigin.status,503,'Worker should accept same-origin and reject if the API secret is unconfigured');
const oldFetch=globalThis.fetch;
const testEnv={SITE_ORIGIN:'https://vickmaspc.github.io',GEMINI_API_KEY:'synthetic-test-key',RATE_LIMIT:{limit:async()=>({success:true})}};
try {
  let observedPayload;
  globalThis.fetch=async (url,options)=>{
    assert(String(url).includes('/v1beta/auth_tokens'));
    observedPayload=JSON.parse(options.body);
    assert.equal(options.headers['x-goog-api-key'],testEnv.GEMINI_API_KEY);
    return new Response(JSON.stringify({error:{code:403,status:'PERMISSION_DENIED',message:'Key blocked for leaked credentials'}}),{status:403,headers:{'Content-Type':'application/json'}});
  };
  const diagnosticResponse=await worker.fetch(new Request('https://site-ponto-digital.example.workers.dev/token',{method:'POST',headers:{Origin:'https://site-ponto-digital.example.workers.dev','Content-Type':'application/json'},body:JSON.stringify({model:'gemini-3.8-live'})}),testEnv);
  assert.equal(diagnosticResponse.status,502,'Upstream non-200 must remain an error');
  const diagnosis=await diagnosticResponse.json();
  assert.equal(diagnosis.upstreamStatus,403,'Preserve upstream HTTP for diagnosis');
  assert.equal(diagnosis.upstreamReason,'PERMISSION_DENIED','Preserve non-secret reason');
  assert(diagnosis.error.includes('bloqueou'),'Identify leaked/blocked key');
  assert(!JSON.stringify(diagnosis).includes('synthetic-test-key'),'Never expose server key');
  assert.equal(observedPayload.liveConnectConstraints.model,'models/gemini-3.8-live');
  assert.deepEqual(observedPayload.liveConnectConstraints.config.responseModalities,['AUDIO']);
  assert.deepEqual(observedPayload.liveConnectConstraints.config.sessionResumption,{});
} finally {globalThis.fetch=oldFetch;}
console.log('Syntax, accessibility, Worker config, Google token payload, sanitized diagnostics and origin tests passed.');
