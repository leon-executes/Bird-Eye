import fs from 'node:fs';
import {createHash} from 'node:crypto';
const repo='Qwen/Qwen3-VL-8B-Instruct-GGUF',revision='f982a07559d4a2f6c8744d840bf6fccab30eea96';
const files=[['Qwen3VL-8B-Instruct-Q4_K_M.gguf',5027784800,'67d1659bfe71b89d50b45a4ad1a9e5b997e5bb16ce5da66a6a6167abd569e9e2'],['mmproj-Qwen3VL-8B-Instruct-F16.gguf',1159029824,'ca524100ebf825c9a870db1c580d03879e0da0ab2541697e2458e64891cf9d38']];
async function digest(file){const h=createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);return h.digest('hex');}
for(const[name,total,expected]of files){const dest='models/'+name;if(fs.existsSync(dest)){if(await digest(dest)!==expected)throw Error('Existing checksum mismatch');continue;}
 const prefix=fs.existsSync(dest+'.partial')?fs.statSync(dest+'.partial').size:0;
 const jobs=[];for(let start=prefix;start<total;start+=67108864)jobs.push({start,end:Math.min(total-1,start+67108863)});
 let next=0,complete=0;
 async function worker(){while(next<jobs.length){const j=jobs[next++],part=dest+'.range-'+j.start;const size=j.end-j.start+1;if(fs.existsSync(part)&&fs.statSync(part).size===size){complete++;continue;}let lastError;
 for(let attempt=0;attempt<3;attempt++){try{const url='https://huggingface.co/'+repo+'/resolve/'+revision+'/'+name;const r=await fetch(url,{headers:{Range:'bytes='+j.start+'-'+j.end},signal:AbortSignal.timeout(180000)});if(r.status!==206||!r.headers.get('content-range')?.startsWith('bytes '+j.start+'-'+j.end+'/'))throw Error('Range request rejected: '+r.status+' '+r.headers.get('content-range'));const out=fs.createWriteStream(part);let n=0;for await(const b of r.body){if(!out.write(b))await new Promise(r=>out.once('drain',r));n+=b.length;}await new Promise((resolve,reject)=>{out.on('error',reject);out.end(resolve);});if(n!==size)throw Error('Incomplete range');lastError=null;break;}catch(e){lastError=e;await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}
 if(lastError)throw lastError;complete++;if(complete%8===0||complete===jobs.length)console.log(name,complete+'/'+jobs.length+' chunks');}}
 await Promise.all(Array.from({length:8},worker));
 const out=fs.createWriteStream(dest+'.assembling'),h=createHash('sha256');for(const source of [...(prefix?[dest+'.partial']:[]),...jobs.map(j=>dest+'.range-'+j.start)])for await(const b of fs.createReadStream(source)){h.update(b);if(!out.write(b))await new Promise(r=>out.once('drain',r));}
 await new Promise((resolve,reject)=>{out.on('error',reject);out.end(resolve);});if(h.digest('hex')!==expected)throw Error('Full-file checksum mismatch');fs.renameSync(dest+'.assembling',dest);fs.writeFileSync(dest+'.sha256',expected+'\n');for(const source of [...(prefix?[dest+'.partial']:[]),...jobs.map(j=>dest+'.range-'+j.start)])fs.unlinkSync(source);console.log('Verified',name);
}
fs.writeFileSync('models/quality-manifest.json',JSON.stringify({repo,revision,files:files.map(([path,size,sha256])=>({path,size,sha256})),license:'Apache-2.0',downloaded:new Date().toISOString()},null,2));
