import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {download} from './download-verified.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const catalog=JSON.parse(fs.readFileSync('scripts/model-downloads.json'));
const wanted=process.argv.slice(2);const ids=wanted.length?wanted:['caprl'];
for(const id of ids){const item=catalog.find(x=>x.id===id);if(!item)throw Error('Unknown candidate '+id);fs.mkdirSync(item.directory,{recursive:true});
 for(const f of item.files){const url='https://huggingface.co/'+item.repo+'/resolve/'+item.revision+'/'+f.name,dest=path.join(item.directory,f.destination);
  if(f.sha256)await download(url,dest,f.sha256,f.bytes);
  else{const r=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error(r.status+' '+url);const b=Buffer.from(await r.arrayBuffer());const gitHash=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');if(f.git_sha1&&gitHash!==f.git_sha1)throw Error('Repository blob mismatch: '+f.name);fs.writeFileSync(dest,b);}
 }
 fs.writeFileSync(path.join(item.directory,id==='caprl-training-base'?'provenance.json':id+'.provenance.json'),JSON.stringify(item,null,2));console.log('Verified candidate installed:',id,'; not automatically promoted.');
}
