// Bird Eye · Parham (Leon) Faraji · leon-executes
import fs from 'node:fs';import path from 'node:path';import {createHash,randomBytes} from 'node:crypto';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),version='1.0.2';
const localFull=process.argv.includes('--personal');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'docs/engine-baseline.json')));
for(const [name,sha] of Object.entries(baseline.files))if(createHash('sha256').update(fs.readFileSync(path.join(root,'app',name))).digest('hex')!==sha)throw Error('Caption engine changed: '+name);
const skip=new Set(['__pycache__','.cache','.ignored','.pnpm','bird-eye-prepare.mjs','apply-desktop-ui.mjs','build-portable.mjs','export-source.mjs','launch.mjs','evaluate-council-ablation.mjs','test-permissive-helper.mjs','test-thermal-rtdetr.py']);
const copy=(src,dst)=>{fs.mkdirSync(path.dirname(dst),{recursive:true});fs.cpSync(src,dst,{recursive:true,dereference:true,filter:p=>!p.split(path.sep).some(x=>skip.has(x))&&!p.endsWith('.pyc')});};
function sampleFiles(){const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/manifest.json'))),paths=new Set(['manifest.json']);function visit(o){if(!o||typeof o!=='object')return;for(const [k,v]of Object.entries(o)){if(typeof v==='string'&&(k==='path'||k.endsWith('_path'))&&fs.existsSync(path.join(root,'data',v))){if(path.isAbsolute(v)||v.split(/[\\/]/).includes('..'))throw Error('Unsafe sample path');paths.add(v);if(v.endsWith('.json'))visit(JSON.parse(fs.readFileSync(path.join(root,'data',v))));}else if(v&&typeof v==='object')visit(v);}}manifest.scenes.forEach(visit);return paths;}
const samples=sampleFiles();
function project(dst,withRuntime){
 fs.mkdirSync(dst,{recursive:true});
 for(const name of ['app','desktop','artwork','docs','scripts','tests','.github','README.md','NOTICE','LICENSE','package.json','package-lock.json','.gitignore','Launch Bird Eye.cmd','Setup models.cmd','Build Windows.cmd'])if(fs.existsSync(path.join(root,name)))copy(path.join(root,name),path.join(dst,name));
 for(const name of samples)copy(path.join(root,'data',name),path.join(dst,'data',name));
 copy(path.join(root,'data/examples'),path.join(dst,'data/examples'));
 if(withRuntime){copy(path.join(root,'node_modules'),path.join(dst,'node_modules'));for(const name of ['node.exe','llama-cpu','llama-vulkan'])copy(path.join(root,'runtime',name),path.join(dst,'runtime',name));}
}
async function digest(file){const h=createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);return h.digest('hex');}
async function manifest(dir){const files=[];async function visit(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())await visit(p);else if(e.name!=='PACKAGE-MANIFEST.json')files.push({path:path.relative(dir,p).replaceAll('\\','/'),bytes:fs.statSync(p).size,sha256:await digest(p)});}}await visit(dir);fs.writeFileSync(path.join(dir,'PACKAGE-MANIFEST.json'),JSON.stringify({product:'Bird Eye',version,created:new Date().toISOString(),files},null,2));}
function zip(stage,name,store=false){const dest=path.join(root,'dist',name);const args=['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(root,'scripts/zip-windows.ps1'),'-Stage',stage,'-Destination',dest];if(store)args.push('-Store');const p=spawnSync('powershell.exe',args,{windowsHide:true,stdio:'inherit'});if(p.status)throw Error('ZIP creation failed '+dest);return dest;}
const stamp=Date.now(),source=path.join(root,'work','release-source-'+stamp);project(source,false);copy(path.join(root,'integrations'),path.join(source,'integrations'));await manifest(source);
const zips=[zip(source,'github/BirdEye-'+version+'-Source.zip')];
const stage=path.join(root,'portable','Bird Eye 1.0.2');if(fs.existsSync(stage))throw Error('Build target already exists; preserve it and choose a fresh build folder before rebuilding: '+stage);fs.mkdirSync(stage,{recursive:true});
for(const e of fs.readdirSync(path.join(root,'runtime/electron'),{withFileTypes:true})){if(e.name==='resources')continue;copy(path.join(root,'runtime/electron',e.name),path.join(stage,e.name==='electron.exe'?'Bird Eye.exe':e.name==='LICENSE'?'LICENSE.electron':e.name));}
fs.mkdirSync(path.join(stage,'resources/app'),{recursive:true});
fs.writeFileSync(path.join(stage,'resources/app/package.json'),JSON.stringify({name:'bird-eye',version,main:'index.cjs'}));
fs.writeFileSync(path.join(stage,'resources/app/index.cjs'),"require('../../_internal/desktop/main.cjs');\n");
const internal=path.join(stage,'_internal');project(internal,true);
for(const d of ['reports','logs','models','work'])fs.mkdirSync(path.join(internal,d),{recursive:true});
for(const name of ['README.md','LICENSE','NOTICE'])copy(path.join(root,name),path.join(stage,name));
let readme=fs.readFileSync(path.join(stage,'README.md'),'utf8');for(const prefix of ['docs/','artwork/','data/'])readme=readme.replaceAll('('+prefix,'(_internal/'+prefix).replaceAll('src="'+prefix,'src="_internal/'+prefix);fs.writeFileSync(path.join(stage,'README.md'),readme);
fs.writeFileSync(path.join(stage,'Setup models.cmd'),'@echo off\r\nrem Bird Eye - Parham (Leon) Faraji - leon-executes\r\ncall "%~dp0_internal\\Setup models.cmd"\r\n');
const rc=path.join(root,'work/rcedit/package/bin/rcedit-x64.exe');if(!fs.existsSync(rc))throw Error('Run download-build-tool.mjs first');
const edited=spawnSync(rc,[path.join(stage,'Bird Eye.exe'),'--set-icon',path.join(root,'artwork/bird-eye.ico'),'--set-version-string','ProductName','Bird Eye','--set-version-string','FileDescription','Bird Eye — Satellite and infrared interpretation','--set-version-string','CompanyName','Parham (Leon) Faraji · leon-executes','--set-version-string','LegalCopyright','Copyright 2026 Parham (Leon) Faraji','--set-version-string','OriginalFilename','Bird Eye.exe','--set-file-version',version+'.0','--set-product-version',version+'.0'],{windowsHide:true,stdio:'inherit'});if(edited.status)throw Error('Executable branding failed');
await manifest(stage);zips.push(zip(stage,'github/BirdEye-'+version+'-Windows-x64.zip'));
if(localFull){
 const settings=JSON.parse(fs.readFileSync(path.join(root,'desktop/default-settings.json')));
 const names=new Set(settings.profiles.flatMap(p=>[p.modelFile,p.projectorFile]));
 for(const n of ['remoteclip-scene.onnx','remoteclip-scene.json'])names.add(n);
 for(const n of names){if(!n||!fs.existsSync(path.join(root,'models',n)))throw Error('Missing local model '+n);copy(path.join(root,'models',n),path.join(internal,'models',n));if(fs.existsSync(path.join(root,'models',n+'.sha256')))copy(path.join(root,'models',n+'.sha256'),path.join(internal,'models',n+'.sha256'));}
 const addon=path.join(stage,'detector-addon');copy(path.join(root,'integrations/thermal-addon'),addon);copy(path.join(root,'node_modules'),path.join(addon,'node_modules'));copy(path.join(root,'runtime/node.exe'),path.join(addon,'runtime/node.exe'));copy(path.join(root,'docs/licenses'),path.join(addon,'licenses'));
 for(const n of ['hituav-thermal-detector.onnx','hituav-thermal-detector.json'])copy(path.join(root,'work/council-ablation/retired-models',n),path.join(addon,'models',n));
 const token=randomBytes(32).toString('hex');fs.writeFileSync(path.join(addon,'service.json'),JSON.stringify({port:41731,token},null,2));settings.externalDetector={enabled:true,url:'http://127.0.0.1:41731/v1/detect',token};fs.writeFileSync(path.join(internal,'local-settings.json'),JSON.stringify(settings,null,2));
 fs.writeFileSync(path.join(stage,'Launch with detector.cmd'),'@echo off\r\nrem Personal optional add-on launcher - Parham (Leon) Faraji\r\ncd /d "%~dp0"\r\ndetector-addon\\runtime\\node.exe detector-addon\\launch-personal.mjs\r\nif errorlevel 1 pause\r\n');
 fs.writeFileSync(path.join(stage,'PERSONAL.txt'),'PERSONAL EDITION. All council models are installed. Use Launch with detector.cmd for the separate optional thermal service. The detector is outside Bird Eye, with AGPL-3.0 weights and its own model licence. This archive is excluded from the GitHub upload set.\n');
 await manifest(stage);zips.push(zip(stage,'personal/BirdEye-'+version+'-Windows-x64-Personal-Full.zip',true));
}
const sums=[];for(const p of zips)sums.push((await digest(p))+'  '+path.relative(path.join(root,'dist'),p).replaceAll('\\','/'));
fs.writeFileSync(path.join(root,'dist/SHA256SUMS-1.0.2.txt'),sums.join('\n')+'\n');
console.log(zips.join('\n'));

