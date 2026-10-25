import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function download(url,dest,sha){
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 if(fs.existsSync(dest)){const h=createHash('sha256');for await(const b of fs.createReadStream(dest))h.update(b);const actual=h.digest('hex');const expected=sha||(fs.existsSync(dest+'.sha256')?fs.readFileSync(dest+'.sha256','utf8').trim():null);if(!expected||actual!==expected)throw Error('Existing file could not be verified; move it aside and rerun: '+dest);console.log('Verified existing:',path.basename(dest));return;}
 console.log('Downloading',url);const r=await fetch(url);if(!r.ok)throw Error(r.status+': '+url);
 const out=fs.createWriteStream(dest+'.partial');const hash=createHash('sha256');let total=0,last=Date.now();
 for await(const chunk of r.body){hash.update(chunk);if(!out.write(chunk))await new Promise(a=>out.once('drain',a));total+=chunk.length;if(Date.now()-last>15000){console.log(path.basename(dest),Math.round(total/1048576)+' MB');last=Date.now();}}
 await new Promise((a,b)=>{out.on('error',b);out.end(a);});
 const digest=hash.digest('hex');if(sha&&sha!==digest)throw Error('Checksum mismatch: '+dest);
 fs.renameSync(dest+'.partial',dest);fs.writeFileSync(dest+'.sha256',digest+'\n');console.log('Verified',path.basename(dest),total);
}
const repo='Qwen/Qwen3-VL-4B-Instruct-GGUF';
const info={sha:'1cd86afb9a95c410a6038ab3b40d8b578c892266'};
const files=await(await fetch('https://huggingface.co/api/models/'+repo+'/tree/'+info.sha+'?expand=true')).json();
const modelFiles=['Qwen3VL-4B-Instruct-Q4_K_M.gguf','mmproj-Qwen3VL-4B-Instruct-F16.gguf'];
const rel=await(await fetch('https://api.github.com/repos/ggml-org/llama.cpp/releases/tags/b11867')).json();
await Promise.all(modelFiles.map(name=>download('https://huggingface.co/'+repo+'/resolve/'+info.sha+'/'+name,path.join(root,'models',name),files.find(f=>f.path===name)?.lfs?.oid)));
for(const name of ['llama-b11867-bin-win-vulkan-x64.zip','llama-b11867-bin-win-cpu-x64.zip']){
 const asset=rel.assets.find(a=>a.name===name);if(!asset)throw Error('Release asset missing');
 const zip=path.join(root,'work',name);await download(asset.browser_download_url,zip,asset.digest?.replace('sha256:',''));
 const mode=name.includes('vulkan')?'vulkan':'cpu';const dest=path.join(root,'runtime','llama-'+mode);fs.mkdirSync(dest,{recursive:true});
 const p=spawnSync('tar.exe',['-xf',zip,'-C',dest],{windowsHide:true,stdio:'inherit'});if(p.status)throw Error('Extraction failed; Windows tar.exe is required');
}
fs.writeFileSync(path.join(root,'models','manifest.json'),JSON.stringify({repo,revision:info.sha,files:modelFiles,llama:'b11867',downloaded:new Date().toISOString()},null,2));
console.log('Portable inference engine ready.');
