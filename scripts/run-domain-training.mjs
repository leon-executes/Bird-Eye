import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawn} from 'node:child_process';import {backgroundWork} from '../app/resource-lock.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);const mode=process.argv[2]||'pilot';if(!['pilot','revised-pilot','full'].includes(mode))throw Error('Use pilot, revised-pilot or full');
if(backgroundWork(root))throw Error('Another training/evaluation job is active. Use the app to view or pause it.');
const python=path.join(root,'work/train-env/Scripts/python.exe');if(!fs.existsSync(python))throw Error('Optional training environment is missing. Follow docs/SHALLOW_ADAPTATION.md; app inference does not require Python.');
const output='models/'+(mode==='pilot'?'caprl-domain-pilot-20261025':mode==='revised-pilot'?'caprl-semantic-v2-pilot-20261025':'caprl-semantic-v2-50k-20261025');
const train='data/domain-adaptation/'+(mode==='pilot'?'pilot-train.json':mode==='revised-pilot'?'semantic-v2-pilot.json':'semantic-v2-50k.json');
const args=['-u',mode==='pilot'?'scripts/train-domain-adapter.py':'scripts/train-semantic-adapter.py','--model','models/caprl-training-base','--train',train,'--validation',mode==='pilot'?'data/domain-adaptation/pilot-validation.json':'data/domain-adaptation/semantic-v2-validation.json','--evaluation','data/domain-adaptation/pilot-evaluation.json','--output',output,'--examples',mode==='full'?'50000':'2048','--microbatch',mode==='pilot'?'4':'2'];
if(mode==='full')args.push('--allow-multiple-captions','--stop-after','1250');
if(mode!=='pilot'&&fs.existsSync('models/caprl-domain-pilot-20261025/captions-base.json'))args.push('--reuse-baseline','models/caprl-domain-pilot-20261025/captions-base.json');
const latest=path.join(output,'latest.json');if(fs.existsSync(latest)){const j=JSON.parse(fs.readFileSync(latest));if(j.complete&&fs.existsSync(path.join(output,'result.json'))&&JSON.parse(fs.readFileSync(path.join(output,'result.json'))).complete){console.log('Training already completed. Inspect '+output+' and run the comparison report before any deployment.');process.exit(0);}args.push('--resume',j.checkpoint);}
for(const file of [train,'data/domain-adaptation/pilot-validation.json','data/domain-adaptation/pilot-evaluation.json','models/caprl-training-base/model.safetensors.index.json'])if(!fs.existsSync(file))throw Error('Required local asset missing: '+file);
let state;try{state=await(await fetch('http://127.0.0.1:43187/api/state',{signal:AbortSignal.timeout(1500)})).json();}catch{}
if(state?.active)throw Error('A caption job is active; wait for it to complete.');
if(state)await fetch('http://127.0.0.1:43187/api/unload',{method:'POST',headers:{'content-type':'application/json','x-council-token':state.token},body:'{}'});
fs.mkdirSync('logs',{recursive:true});const log='logs/domain-training-'+mode+'.log',fd=fs.openSync(log,'a');
const child=spawn(python,args,{cwd:root,detached:true,windowsHide:true,stdio:['ignore',fd,fd]});child.unref();fs.closeSync(fd);
// The trainer owns the compute lock and validates all input hashes before loading.
console.log('Training worker started; PID '+child.pid+'. Progress and safe pause are in the app. Log: '+log+'. No automatic model promotion.');
spawn(process.execPath,['scripts/launch.mjs'],{cwd:root,detached:true,windowsHide:true,stdio:'ignore'}).unref();
