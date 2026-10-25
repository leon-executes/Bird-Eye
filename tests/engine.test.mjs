import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {Engine} from '../app/engine.mjs';
test('remote endpoints require explicit outbound authorization before any fetch',async()=>{const e=new Engine(process.cwd());await assert.rejects(()=>e.chat({kind:'endpoint',url:'https://example.invalid/v1',model:'x'},[],null),/requires allowRemote/);});
test('GGUF paths cannot escape the model directory',()=>{const e=new Engine(process.cwd());assert.throws(()=>e.modelPaths({modelFile:'../local-settings.json'}),/within models/);});
test('endpoint adapter sends images, model, auth and optional structured schema',async()=>{let captured;const server=http.createServer(async(req,res)=>{let raw='';for await(const b of req)raw+=b;captured={url:req.url,auth:req.headers.authorization,body:JSON.parse(raw)};res.setHeader('content-type','application/json');res.end(JSON.stringify({choices:[{message:{content:'{"scene":"test","findings":[]}'},finish_reason:'stop'}]}));});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const e=new Engine(process.cwd());const messages=[{role:'user',content:[{type:'image_url',image_url:{url:'data:image/png;base64,fixture'}}]}];await e.chat({kind:'endpoint',url:'http://127.0.0.1:'+server.address().port+'/v1',model:'fixture',apiKey:'test-secret',structured:true},messages);assert.equal(captured.auth,'Bearer test-secret');assert.equal(captured.url,'/v1/chat/completions');assert.deepEqual(captured.body.messages,messages);assert.equal(captured.body.response_format.type,'json_schema');}finally{server.close();}});
import {EventEmitter} from 'node:events';
test('managed release waits for actual process exit before a replacement may load',async()=>{const e=new Engine(process.cwd());const child=new EventEmitter();child.exitCode=null;let exited=false;child.kill=()=>setTimeout(()=>{child.exitCode=0;exited=true;child.emit('exit',0);},20);e.child=child;await e.release();assert.equal(exited,true);assert.equal(e.child,null);});

test('UI stop retains pending exit so a subsequent release cannot overlap workers',async()=>{const e=new Engine(process.cwd());const child=new EventEmitter();child.exitCode=null;let exited=false;child.kill=()=>setTimeout(()=>{child.exitCode=0;exited=true;child.emit('exit',0);},20);e.child=child;e.stop();assert.equal(exited,false);await e.release();assert.equal(exited,true);assert.equal(e.exiting.size,0);});

import {samplingFor} from '../app/engine.mjs';
test('sampling settings cannot overwrite messages, model or structured output',()=>{assert.deepEqual(samplingFor({sampling:{top_p:.8,seed:42,messages:[],model:'other',response_format:null,top_k:NaN}}),{top_p:.8,seed:42});});
test('truncated captions fail production requests and remain explicitly marked in benchmark output',async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({choices:[{message:{content:'An unfinished scene'},finish_reason:'length'}]}));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const e=new Engine(process.cwd()),p={kind:'endpoint',url:'http://127.0.0.1:'+server.address().port+'/v1',model:'fixture'};await assert.rejects(()=>e.chat(p,[]),/token budget/);const result=await e.chat(p,[],null,'cpu',{allowTruncatedReturn:true});assert.equal(result.finish_reason,'length');assert.equal(result.text,'An unfinished scene');}finally{server.close();}
});
import {memorySufficient} from '../app/engine.mjs';
test('large expert-offload profile cannot silently fall back to CPU with insufficient RAM',()=>{const p={minRAMGB:28,minFreeRAMGB:12.5,minCPUFreeRAMGB:19};assert.equal(memorySufficient(p,'vulkan',31,15),true);assert.equal(memorySufficient(p,'cpu',31,15),false);assert.equal(memorySufficient(p,'vulkan',16,15),false);assert.equal(memorySufficient({},'cpu',8,3),true);});
import {visionBudget} from '../app/engine.mjs';
test('explicit training-compatible pixel budget is preserved without changing default inference budget',()=>{assert.deepEqual(visionBudget({imageMinTokens:64,imageMaxTokens:196}),{min:64,max:196});assert.deepEqual(visionBudget(),{min:256,max:1024});assert.deepEqual(visionBudget({imageMinTokens:1000,imageMaxTokens:128}),{min:128,max:128});});
