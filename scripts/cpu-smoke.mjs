import fs from 'node:fs';
import {Engine} from '../app/engine.mjs';
import {runCouncil} from '../app/council.mjs';
const root=process.cwd(),manifest=JSON.parse(fs.readFileSync('data/manifest.json')),scene=manifest.scenes.find(s=>s.id==='control-misc'),engine=new Engine(root);
try{const r=await runCouncil({scene,assets:scene.assets,root,engine,settings:{backend:'cpu',lead:'portable',profiles:[{id:'portable',kind:'bundled',model:'Qwen3-VL-4B-Instruct-Q4_K_M',name:'CPU baseline'}]},mode:'single',progress:x=>console.log(x)});fs.writeFileSync('work/cpu-smoke.json',JSON.stringify(r,null,2));console.log(JSON.stringify({status:r.status,seconds:r.seconds,caption:r.final.scene,backend:engine.backend}));}finally{engine.stop();}
