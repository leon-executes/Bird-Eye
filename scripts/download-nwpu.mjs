import fs from 'node:fs';import {download} from './download-verified.mjs';
const m=JSON.parse(fs.readFileSync('scripts/nwpu-downloads.json'));fs.mkdirSync('data/corpora/nwpu',{recursive:true});
for(const f of m.files)await download('https://huggingface.co/datasets/'+m.repo+'/resolve/'+m.revision+'/'+f.name,'data/corpora/nwpu/'+f.name.split('/').at(-1),f.sha256,f.bytes);
fs.writeFileSync('data/corpora/nwpu/provenance.json',JSON.stringify(m,null,2));
