// Bird Eye · Parham (Leon) Faraji · leon-executes
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');fs.mkdirSync(path.join(root,'work'),{recursive:true});fs.mkdirSync(path.join(root,'runtime'),{recursive:true});
async function download(url,file,sha){if(!sha||!/^[a-f0-9]{64}$/.test(sha))throw Error('Expected upstream SHA-256 is required');if(fs.existsSync(file)){const h=createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);if(h.digest('hex')===sha)return;throw Error('Existing runtime download failed verification: '+file);}const r=await fetch(url);if(!r.ok)throw Error(url+' '+r.status);const out=fs.createWriteStream(file+'.partial'),h=createHash('sha256');for await(const b of r.body){h.update(b);if(!out.write(b))await new Promise(resolve=>out.once('drain',resolve));}await new Promise((resolve,reject)=>{out.once('error',reject);out.end(resolve);});if(h.digest('hex')!==sha)throw Error('Runtime checksum mismatch');fs.renameSync(file+'.partial',file);}
function extract(file,dir){fs.mkdirSync(dir,{recursive:true});if(spawnSync('tar.exe',['-xf',file,'-C',dir],{windowsHide:true,stdio:'inherit'}).status)throw Error('Runtime extraction failed');}
const nodeVersion='24.19.0',name='node-v'+nodeVersion+'-win-x64.zip',base='https://nodejs.org/dist/v'+nodeVersion+'/';
const sumResponse=await fetch(base+'SHASUMS256.txt');if(!sumResponse.ok)throw Error('Node checksum list unavailable');const sum=(await sumResponse.text()).split('\n').find(x=>x.trim().endsWith(' '+name))?.split(/\s+/)[0];
const zip=path.join(root,'work',name);await download(base+name,zip,sum);const expanded=path.join(root,'work/node-runtime');extract(zip,expanded);
const nodeDir=path.join(expanded,'node-v'+nodeVersion+'-win-x64');if(!fs.existsSync(path.join(root,'runtime/node.exe')))fs.copyFileSync(path.join(nodeDir,'node.exe'),path.join(root,'runtime/node.exe'));
fs.copyFileSync(path.join(nodeDir,'LICENSE'),path.join(root,'docs/licenses/Node-runtime-LICENSE.txt'));
const rel=await(await fetch('https://api.github.com/repos/ggml-org/llama.cpp/releases/tags/b11867')).json(),records=[];
for(const backend of ['cpu','vulkan']){const name='llama-b11867-bin-win-'+backend+'-x64.zip',a=rel.assets?.find(a=>a.name===name);if(!a)throw Error('Missing llama.cpp release asset '+name);const sha=a.digest?.replace('sha256:',''),file=path.join(root,'work',name);await download(a.browser_download_url,file,sha);extract(file,path.join(root,'runtime/llama-'+backend));records.push({name,url:a.browser_download_url,sha256:sha});}
fs.writeFileSync(path.join(root,'desktop/inference-runtime-lock.json'),JSON.stringify({node:{version:nodeVersion,url:base+name,sha256:sum},llama:{version:'b11867',assets:records}},null,2));
console.log('Node and llama.cpp runtime archives verified.');

