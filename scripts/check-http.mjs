import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:43187',checks=[];
async function check(name,url,options,expected){const r=await fetch(base+url,options);assert.equal(r.status,expected,name);checks.push({name,status:r.status});}
await check('health','/api/health',{},200);
await check('cross-origin blocked','/api/state',{headers:{origin:'https://example.invalid'}},403);
await check('mutation without token blocked','/api/cancel',{method:'POST'},403);
await check('unknown asset/traversal blocked','/asset/..%2Flocal-settings.json',{},400);
await check('private settings not served','/local-settings.json',{},404);
const s=await(await fetch(base+'/api/state')).json();const a=s.library.scenes[0].assets[0];await check('known asset served','/asset/'+a.id,{},200);
assert(s.settings.profiles.every(p=>!p.apiKey||p.apiKey==='[stored]'));
checks.push({name:'API keys masked',status:'pass'});
fs.writeFileSync('work/http-checks.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
