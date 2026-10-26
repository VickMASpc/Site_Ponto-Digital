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
console.log('Syntax, source, navigation and token-origin checks passed.');
