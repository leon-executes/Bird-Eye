import fs from 'node:fs';
import {Engine} from '../app/engine.mjs';
import {runCouncil} from '../app/council.mjs';
import {builtInProfiles} from '../app/profiles.mjs';
const root=process.cwd(),engine=new Engine(root);
let state;try{state=await(await fetch('http://127.0.0.1:43187/api/state')).json();}catch{}if(state?.active)throw Error('User job active; postpone evaluation.');if(state)await fetch('http://127.0.0.1:43187/api/unload',{method:'POST',headers:{'content-type':'application/json','x-council-token':state.token},body:'{}'});
const q=structuredClone(builtInProfiles.qwen35),e=builtInProfiles.earthdial,base=builtInProfiles.portable;
const which=process.argv[2]||'qwen35',mode=process.argv[3]||'single';if(which==='qwen35-detail')q.imageMinTokens=1024;if(which==='qwen35-think'||which==='qwen35-think-sampled'){q.imageMinTokens=1024;q.enableThinking=true;q.maxTokens=8000;q.contextSize=16384;if(which==='qwen35-think-sampled'){q.temperature=1;q.sampling={...q.sampling,top_p:0.95};}}
const profile=which.startsWith('earthdial')?e:which==='baseline'?base:which.startsWith('gemma4')?builtInProfiles.gemma4:q;
const settings={backend:'vulkan',lead:profile.id,critic:profile.id,strictEvidence:true,detectorFocus:which.includes('focus'),profiles:[profile],releaseAfterRun:true};if(mode==='council'&&which.includes('with-earthdial')&&engine.ready(e)){settings.satellite=e.id;settings.profiles.push(e);}
const scenes=[...(fs.existsSync('data/imports.json')?JSON.parse(fs.readFileSync('data/imports.json')):[]),...JSON.parse(fs.readFileSync('data/manifest.json')).scenes];
const ids=process.argv.slice(4);if(!ids.length)ids.push('rsicd-015','rsicd-000','rsicd-025','hituav-003','hituav-008','landsat-000','s2-002','s1-003','control-misc');
fs.mkdirSync('work',{recursive:true});
const output='work/upgrade-'+which+'-'+mode+'.json',results=fs.existsSync(output)?JSON.parse(fs.readFileSync(output)):[];
try{for(const id of ids){if(results.some(r=>r.scene_id===id))continue;const scene=scenes.find(s=>s.id===id);if(!scene)throw Error('Unknown test '+id);let assets=scene.assets;if(mode==='single'&&assets.some(a=>a.modality==='RGB'))assets=assets.filter(a=>a.modality==='RGB');if(which.startsWith('earthdial')&&!assets.some(a=>a.modality==='RGB'))continue;console.log('Testing',which,mode,id);try{const r=await runCouncil({scene,assets,root,engine,settings,mode,progress:x=>console.log(x)});results.push(r);fs.writeFileSync(output,JSON.stringify(results,null,2));console.log(JSON.stringify({id,caption:r.final.scene,status:r.status,seconds:r.seconds}));}catch(err){console.log('FAILED',id,err.message);results.push({scene_id:id,error:err.message});fs.writeFileSync(output,JSON.stringify(results,null,2));}}}finally{await engine.release();}
