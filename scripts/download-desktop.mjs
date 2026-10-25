// Bird Eye · Parham (Leon) Faraji · leon-executes
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),version='45.0.0';
async function get(url,file,expected){const r=await fetch(url);if(!r.ok)throw Error(url+' '+r.status);const b=Buffer.from(await r.arrayBuffer());const sha=createHash('sha256').update(b).digest('hex');if(expected&&sha!==expected)throw Error('Checksum mismatch '+file);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);return sha;}
const name='electron-v'+version+'-win32-x64.zip',base='https://github.com/electron/electron/releases/download/v'+version+'/';
const sums=await(await fetch(base+'SHASUMS256.txt')).text(),line=sums.split('\n').find(x=>x.trim().endsWith('*'+name)||x.trim().endsWith(' '+name));if(!line)throw Error('Official checksum missing');
const sha=await get(base+name,path.join(root,'work',name),line.split(/\s+/)[0]);
fs.mkdirSync(path.join(root,'runtime/electron'),{recursive:true});
const extract=spawnSync('tar.exe',['-xf',path.join(root,'work',name),'-C',path.join(root,'runtime/electron')],{windowsHide:true,stdio:'inherit'});if(extract.status)throw Error('Extraction failed');
await get('https://assets.science.nasa.gov/dynamicimage/assets/science/psd/lunar-science/2023/09/apollo8_earthrise.jpg',path.join(root,'artwork/earthrise.jpg'));
await get('https://polyformproject.org/licenses/noncommercial/1.0.0.txt',path.join(root,'LICENSE'));
await get('https://raw.githubusercontent.com/phelber/EuroSAT/master/LICENSE',path.join(root,'docs/licenses/EuroSAT-MIT.txt'));
fs.writeFileSync(path.join(root,'desktop/runtime-lock.json'),JSON.stringify({electron:{version,platform:'win32-x64',url:base+name,sha256:sha}},null,2));
const boot=path.join(root,'runtime/electron/resources/app');fs.mkdirSync(boot,{recursive:true});fs.writeFileSync(path.join(boot,'package.json'),JSON.stringify({name:'bird-eye-launcher',version:'1.0.0',main:'index.cjs'}));fs.writeFileSync(path.join(boot,'index.cjs'),"require('../../../../desktop/main.cjs');\n");
console.log('Official Electron verified',version,sha);

