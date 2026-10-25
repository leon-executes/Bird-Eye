import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,inspectAsset} from '../app/core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const m=JSON.parse(fs.readFileSync(path.join(root,'data','manifest.json')));const seen=new Set();let n=0;
for(const s of m.scenes){if(seen.has(s.id))throw Error('Duplicate scene '+s.id);seen.add(s.id);for(const a of s.assets){const b=fs.readFileSync(path.join(root,'data',a.path));if(hash(b)!==a.sha256)throw Error('Checksum mismatch '+a.id);const x=await inspectAsset(a,path.join(root,'data'));if(x.metrics.width!==a.width||x.metrics.height!==a.height)throw Error('Dimensions mismatch '+a.id);if(a.radiometric&&!x.metrics.temperature_c)throw Error('No valid calibrated pixels '+a.id);n++;}}
console.log(JSON.stringify({ok:true,scenes:m.scenes.length,assets:n,datasets:Object.fromEntries([...new Set(m.scenes.map(s=>s.dataset))].map(d=>[d,m.scenes.filter(s=>s.dataset===d).length])),open_download_errors:m.errors},null,2));
