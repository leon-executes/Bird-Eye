import {foreignBackgroundWork} from './resource-lock.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
export const opinionSchema={"type":"object","additionalProperties":false,"required":["scene","findings","limits","next"],"properties":{"scene":{"type":"string","maxLength":500},"findings":{"type":"array","maxItems":5,"items":{"type":"object","additionalProperties":false,"required":["claim","confidence","basis","evidence","region","alternatives"],"properties":{"claim":{"type":"string","maxLength":350},"confidence":{"type":"string","enum":["CLEAR","LIKELY","TENTATIVE","UNKNOWN"]},"basis":{"type":"string","enum":["visual-interpretation","measurement"]},"evidence":{"type":"array","minItems":1,"maxItems":4,"items":{"type":"string","maxLength":100}},"region":{"type":"string","maxLength":80},"alternatives":{"type":"array","maxItems":2,"items":{"type":"string","maxLength":150}}}}},"limits":{"type":"array","maxItems":4,"items":{"type":"string","maxLength":250}},"next":{"type":"string","maxLength":250}}};
export const judgmentSchema=structuredClone(opinionSchema);
judgmentSchema.required.push('decisions','caption_sources');
judgmentSchema.properties.caption_sources={type:'array',minItems:1,maxItems:8,items:{type:'string'}};
judgmentSchema.properties.decisions={type:'array',maxItems:64,items:{type:'object',additionalProperties:false,required:['claim_id','verdict','reason'],properties:{claim_id:{type:'string'},verdict:{type:'string',enum:['accepted','qualified','rejected','unresolved']},reason:{type:'string',maxLength:240}}}};
judgmentSchema.properties.findings.items.required.push('source_claims');
judgmentSchema.properties.findings.items.properties.source_claims={type:'array',minItems:1,maxItems:8,items:{type:'string'}};
export function schemaForJudgment(ids=[]){
 const schema=structuredClone(judgmentSchema);
 if(ids.length){const decision={type:'object',additionalProperties:false,required:['verdict','reason'],properties:{verdict:{type:'string',enum:['accepted','qualified','rejected','unresolved']},reason:{type:'string',maxLength:240}}};schema.properties.decisions={type:'object',additionalProperties:false,required:ids,properties:Object.fromEntries(ids.map(id=>[id,decision]))};schema.properties.findings.items.properties.source_claims.items.enum=ids;schema.properties.caption_sources.items.enum=ids;}
 return schema;
}
export function samplingFor(profile){const allowed=['top_p','top_k','min_p','presence_penalty','repeat_penalty','seed'];return Object.fromEntries(Object.entries(profile.sampling||{}).filter(([k,v])=>allowed.includes(k)&&typeof v==='number'&&Number.isFinite(v)));}
export function memoryRequirement(profile,backend){return {total:Number(profile.minRAMGB)||0,free:backend==='cpu'?Number(profile.minCPUFreeRAMGB)||Number(profile.minFreeRAMGB)||0:Number(profile.minFreeRAMGB)||0};}
export function memorySufficient(profile,backend,total=os.totalmem()/2**30,free=os.freemem()/2**30){const need=memoryRequirement(profile,backend);return total>=need.total&&free>=need.free;}
export function visionBudget(profile={}){const max=Math.max(64,Math.min(4096,Number(profile.imageMaxTokens)||1024));return {max,min:Math.max(64,Math.min(max,Number(profile.imageMinTokens)||256))};}
export async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
function findExe(dir){if(!fs.existsSync(dir))return null;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(['llama-server.exe','llama-server'].includes(e.name))return p;if(e.isDirectory()){const found=findExe(p);if(found)return found;}}return null;}
export class Engine{
 constructor(root){this.apiKey=randomBytes(32).toString('hex');this.root=root;this.child=null;this.url=null;this.state='idle';this.error=null;this.backend=null;this.logfile=path.join(root,'logs','engine.log');fs.mkdirSync(path.dirname(this.logfile),{recursive:true});}
 modelPaths(profile={}){const dir=path.join(this.root,'models');const names=[profile.modelFile||'Qwen3VL-4B-Instruct-Q4_K_M.gguf',profile.projectorFile||'mmproj-Qwen3VL-4B-Instruct-F16.gguf'];return names.map(name=>{const p=path.resolve(dir,name);if(!p.startsWith(dir+path.sep))throw Error('GGUF files must be within models/');return p;});}
 ready(profile){return this.modelPaths(profile).every(p=>fs.existsSync(p))&&!!findExe(path.join(this.root,'runtime','llama-cpu'));}
 async start(signal,preferred='vulkan',profile={}){
 if(foreignBackgroundWork(this.root))throw Error('Background model training or evaluation is active. Wait for it to finish before captioning.');
 const [modelFile,projectorFile]=this.modelPaths(profile);const {min:visionMin,max:visionMax}=visionBudget(profile);const key=modelFile+'|'+projectorFile+'|'+visionMin+'|'+visionMax+'|'+(profile.contextSize||8192)+'|'+(profile.gpuLayers??99)+'|'+!!profile.projectorCPU+'|'+!!profile.cpuMoe+'|'+preferred;if(this.loadedKey!==key||this.exiting?.size)await this.release();this.loadedKey=key;
 if(this.child&&this.state==='ready')return this.url;
 if(!this.ready(profile))throw Error('Local engine/model download is incomplete. Run Setup models.cmd, or configure an existing local vision endpoint.');
 this.error=null;
 for(const backend of [...new Set([preferred,'cpu'])]){
 const exe=findExe(path.join(this.root,'runtime','llama-'+backend));if(!exe)continue;if(!memorySufficient(profile,backend)){const need=memoryRequirement(profile,backend);this.error='This profile needs at least '+need.total+' GiB system RAM and '+need.free+' GiB currently free for '+backend+'. Choose a smaller model or close other applications.';continue;}
 this.error=null;this.state='loading';this.backend=backend;const port=await freePort();this.url='http://127.0.0.1:'+port+'/v1';
 const args=['--api-key',this.apiKey,'-m',modelFile,'--mmproj',projectorFile,'--host','127.0.0.1','--port',String(port),'-c',String(Math.max(4096,Math.min(16384,Number(profile.contextSize)||8192))),'-np','1','-t',String(Math.min(8,os.availableParallelism())),'--jinja','--no-webui','--image-min-tokens',String(visionMin),'--image-max-tokens',String(visionMax),'--n-gpu-layers',backend==='cpu'?'0':String(Math.max(0,Math.min(99,profile.gpuLayers??99)))];
 if(backend==='cpu'||profile.projectorCPU)args.push('--no-mmproj-offload');
 if(backend!=='cpu'&&profile.cpuMoe)args.push('--cpu-moe');
 const fd=fs.openSync(this.logfile,'a');this.child=spawn(exe,args,{cwd:path.dirname(exe),windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 this.child.on('error',e=>{this.error=e.message;});this.child.on('exit',()=>{if(this.state==='ready')this.state='idle';});
 try{
 const started=Date.now();while(Date.now()-started<180000){signal?.throwIfAborted();if(this.child.exitCode!==null||this.error)throw Error(this.error||'Engine exited; see logs/engine.log');try{const r=await fetch('http://127.0.0.1:'+port+'/health',{signal:AbortSignal.timeout(1000)});if(r.ok){this.state='ready';return this.url;}}catch{}await new Promise(r=>setTimeout(r,750));}throw Error('Engine startup timed out');
 }catch(e){await this.release();if(signal?.aborted)throw e;this.error=e.message;}
 }
 this.state='error';throw Error(this.error||'No compatible inference runtime');
 }
 async release(){this.stop();if(this.exiting?.size)await Promise.all([...this.exiting.values()].map(async exited=>{let timer;try{await Promise.race([exited,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Previous model did not exit; refusing overlapping model load.')),15000);})]);}finally{clearTimeout(timer);}}));}
 stop(){const child=this.child;this.child=null;this.url=null;this.state='idle';if(child&&child.exitCode===null){this.exiting??=new Map();if(!this.exiting.has(child)){const exited=new Promise(resolve=>{child.once('exit',()=>{this.exiting.delete(child);resolve();});});this.exiting.set(child,exited);}child.kill();}}
 async chat(profile,messages,signal,backend='vulkan',options={}){
 let base;if(['bundled','gguf'].includes(profile.kind))base=await this.start(signal,backend,profile);else{base=profile.url.replace(/\/$/,'');const u=new URL(base);if(!['http:','https:'].includes(u.protocol))throw Error('Invalid endpoint protocol');if(!['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&!profile.allowRemote)throw Error('Remote endpoint requires allowRemote=true. Images leave this machine.');}
 const headers={'content-type':'application/json'};if(['bundled','gguf'].includes(profile.kind))headers.authorization='Bearer '+this.apiKey;if(profile.apiKey)headers.authorization='Bearer '+profile.apiKey;
 const timeout=AbortSignal.timeout(300000);const combined=signal?AbortSignal.any([signal,timeout]):timeout;
 const r=await fetch(base+'/chat/completions',{method:'POST',headers,body:JSON.stringify({model:profile.model||'local',messages,temperature:profile.temperature??0,...samplingFor(profile),max_tokens:profile.maxTokens||2200,stream:false,...(profile.enableThinking!==undefined?{chat_template_kwargs:{enable_thinking:profile.enableThinking}}:{}),...(!profile.captionOnly&&(['bundled','gguf'].includes(profile.kind)||profile.structured)?{response_format:{type:'json_schema',json_schema:{name:'opinion',strict:true,schema:options.judgment?schemaForJudgment(options.claimIds):opinionSchema}}}:{})}),signal:combined});
 if(!r.ok)throw Error('Model HTTP '+r.status+': '+(await r.text()).slice(0,400));
 const j=await r.json();const text=j.choices?.[0]?.message?.content;if(typeof text!=='string')throw Error('Endpoint returned no text');if(j.choices?.[0]?.finish_reason==='length'&&!options.allowTruncatedReturn)throw Error('Model response exceeded the output token budget; shorten the task or use another model.');return {text,usage:j.usage||null,finish_reason:j.choices?.[0]?.finish_reason||null};
 }
}
