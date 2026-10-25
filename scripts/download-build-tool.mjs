// Bird Eye · Parham (Leon) Faraji · leon-executes
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const info=await(await fetch('https://registry.npmjs.org/rcedit/5.0.2')).json();
const r=await fetch(info.dist.tarball);if(!r.ok)throw Error('rcedit download failed');const bytes=Buffer.from(await r.arrayBuffer());
const digest=createHash('sha512').update(bytes).digest('base64');if(info.dist.integrity!=='sha512-'+digest)throw Error('rcedit package integrity mismatch');
const dir=path.join(root,'work/rcedit');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'package.tgz'),bytes);
const p=spawnSync('tar.exe',['-xf',path.join(dir,'package.tgz'),'-C',dir],{windowsHide:true});if(p.status)throw Error('rcedit extract failed');
fs.writeFileSync(path.join(root,'desktop/build-tool-lock.json'),JSON.stringify({rcedit:{version:info.version,url:info.dist.tarball,integrity:info.dist.integrity}},null,2));
console.log('rcedit verified',info.version);

