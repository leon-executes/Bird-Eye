// Bird Eye · Parham (Leon) Faraji · leon-executes
import assert from 'node:assert/strict';import fs from 'node:fs';
const root=new URL('../',import.meta.url),log=JSON.parse(fs.readFileSync(new URL('logs/server.json',root))),base='http://127.0.0.1:'+log.port;
const checks=[];async function check(name,url,options,expected){const r=await fetch(base+url,options);assert.equal(r.status,expected,name);checks.push({name,status:r.status});return r;}
await check('health','/api/health',{},200);await check('cross origin denied','/api/state',{headers:{origin:'https://example.invalid'}},403);
await check('mutation without token denied','/api/cancel',{method:'POST'},403);await check('private settings excluded','/local-settings.json',{},404);
await check('asset traversal denied','/asset/..%2Flocal-settings.json',{},400);await check('artwork traversal denied','/artwork/..%2Fpackage.json',{},400);
const s=await(await fetch(base+'/api/state')).json(),post=b=>({method:'POST',headers:{'x-council-token':s.token,'content-type':'application/json'},body:JSON.stringify(b)});
await check('invalid bulk task rejected before enqueue','/api/bulk',post({tasks:[{sceneId:'does-not-exist'}]}),400);
await check('bulk limit enforced','/api/bulk',post({tasks:Array(1001).fill({sceneId:'landsat-000'})}),400);
await check('empty bulk rejected','/api/bulk',post({tasks:[]}),400);
await check('oversized related group rejected','/api/import',post({files:Array(5).fill({base64:'',modality:'RGB'})}),400);
assert(s.library.scenes.filter(x=>x.dataset!=='Your imagery').length===63);assert(s.settings.profiles.every(p=>!p.apiKey||p.apiKey==='[stored]'));
for(const scene of s.library.scenes.filter(x=>x.dataset!=='Your imagery'))for(const a of scene.assets){const r=await fetch(base+'/asset/'+a.id);assert.equal(r.status,200);assert((r.headers.get('content-type')||'').startsWith('image/'));}
checks.push({name:'all 77 public panels served with image MIME',status:'pass'});
fs.writeFileSync(new URL('work/desktop-http-checks.json',root),JSON.stringify(checks,null,2));console.log(checks.length+' HTTP and public library checks passed.');

