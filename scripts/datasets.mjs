import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {fromUrl} from 'geotiff';
import proj4 from 'proj4';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=path.join(root,'data');fs.mkdirSync(data,{recursive:true});
let manifest={version:1,created:new Date().toISOString(),purpose:'Small stratified engineering test pack. Not an unbiased performance benchmark.',scenes:[],sources:[],errors:[]};
if(process.argv.includes('--resume')&&fs.existsSync(path.join(data,'manifest.json')))manifest=JSON.parse(fs.readFileSync(path.join(data,'manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error(r.status+' '+url);return r.json();}
async function bytes(url){const r=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error(r.status+' '+url);return Buffer.from(await r.arrayBuffer());}
function save(){manifest.scenes=[...new Map(manifest.scenes.map(s=>[s.id,s])).values()];manifest.sources=[...new Map(manifest.sources.map(s=>[s.name,s])).values()];fs.writeFileSync(path.join(data,'manifest.json'),JSON.stringify(manifest,null,2));}
async function asset(id,b,modality,extra={}){const file=id+'.png';await sharp(b).png().toFile(path.join(data,file));const out=fs.readFileSync(path.join(data,file));const m=await sharp(out).metadata();return {id,path:file,modality,sha256:hash(out),width:m.width,height:m.height,provenance:'observed',radiometric:false,...extra};}
async function stage(name,fn){const expected={EuroSAT:30,RSICD:30,'HIT-UAV':18,'Robustness controls':4};const dataset=name==='Robustness controls'?'Controls':name;if(process.argv.includes('--resume')&&expected[name]&&manifest.scenes.filter(s=>s.dataset===dataset).length>=expected[name])return;if(expected[name])manifest.scenes=manifest.scenes.filter(s=>s.dataset!==dataset);try{await fn();console.log(name,'done:',manifest.scenes.length);save();}catch(e){console.error(name,e.message);manifest.errors.push({stage:name,error:e.message});save();}}
await stage('EuroSAT',async()=>{
 const repo='timm/eurosat-rgb',info=await json('https://huggingface.co/api/datasets/'+repo);
 let rows=[],labels;
 for(let offset=0;offset<400;offset+=100){const j=await json('https://datasets-server.huggingface.co/rows?dataset='+encodeURIComponent(repo)+'&config=default&split=test&offset='+offset+'&length=100');rows.push(...j.rows);labels=j.features.find(f=>f.name==='label').type.names;}
 const counts={};let n=0;
 for(const {row,row_idx} of rows){if((counts[row.label]||0)>=3)continue;counts[row.label]=(counts[row.label]||0)+1;const id='eurosat-'+String(n++).padStart(3,'0');
 const a=await asset(id,await bytes(row.image.src),'RGB');
 manifest.scenes.push({id,title:'Sentinel-2 land cover '+n,dataset:'EuroSAT',group:row.image_id,split:'test',assets:[a],tags:['satellite','land-cover','64px'],reference:{class:labels[row.label]},source:{url:'https://huggingface.co/datasets/'+repo,revision:info.sha,row:row_idx,original_id:row.image_id},license:'MIT (mirror; preserve original EuroSAT citation)'});}
 manifest.sources.push({name:'EuroSAT',url:'https://github.com/phelber/EuroSAT',mirror:repo,license:'MIT',selection:'First 3 examples per class encountered in first 400 test rows',role:'10 land-cover classes; class labels, no human captions'});
});
await stage('RSICD',async()=>{
 const repo='caglarmert/RSICD-captions';const info=await json('https://huggingface.co/api/datasets/'+repo);
 const j=await json('https://datasets-server.huggingface.co/rows?dataset='+encodeURIComponent(repo)+'&config=default&split=test&offset=0&length=100');
 const counts={};let n=0;const terms=['airport','beach','bridge','church','commercial','residential','desert','farmland','forest','industrial','meadow','mountain','park','parking','playground','port','railway','river','stadium','storage','viaduct','school','square'];
 for(const {row,row_idx} of j.rows){const captions=[1,2,3,4,5].map(k=>row['caption_'+k]).filter(Boolean);const text=captions.join(' ').toLowerCase();const cls=terms.find(t=>text.includes(t))||'other';if((counts[cls]||0)>=2)continue;counts[cls]=(counts[cls]||0)+1;if(n>=30)break;const id='rsicd-'+String(n++).padStart(3,'0');const a=await asset(id,await bytes(row.image.src),'RGB');manifest.scenes.push({id,title:'High-resolution scene '+n,dataset:'RSICD',group:row.file_name,split:'test',assets:[a],tags:['satellite','caption-reference'],reference:{captions},source:{url:'https://huggingface.co/datasets/'+repo,revision:info.sha,row:row_idx,original_id:row.file_name},license:'Upstream imagery rights apply; mirror has no license card. Local evaluation only; excluded from source release.'});}
 manifest.sources.push({name:'RSICD',url:'https://github.com/201528014227051/RSICD_optimal',mirror:repo,license:'Not established for redistribution; do not bundle images with GitHub source',selection:'Up to 2 per keyword stratum from first 100 test rows; max 30',role:'Human reference captions; overlap with training of specialists is possible'});
});
await stage('HIT-UAV',async()=>{
 const repo='suojiashun/HIT-UAV-Infrared-Thermal-Dataset',meta=await json('https://api.github.com/repos/'+repo+'/commits/main'),rev=meta.sha;
 const base='https://raw.githubusercontent.com/'+repo+'/'+rev+'/';
 const ann=await json(base+'normal_json/annotations/test.json');const cats=Object.fromEntries(ann.categories.map(x=>[x.id,x.name]));
 const groups={};let n=0;
 for(const im of ann.images){const name=path.basename(im.file_name||im.filename),parts=name.split('_'),g=parts.slice(0,3).join('_');if(groups[g])continue;groups[g]=1;if(n>=18)break;const id='hituav-'+String(n++).padStart(3,'0');const a=await asset(id,await bytes(base+'normal_json/test/'+name),'TIR',{polarity:'unknown',sensor:'UAV thermal camera'});
 const objects=(ann.annotations||ann.annotation).filter(x=>x.image_id===im.id).map(x=>({category:cats[x.category_id],bbox:x.bbox}));
 manifest.scenes.push({id,title:'Aerial thermal scene '+n,dataset:'HIT-UAV',group:name,split:'test',assets:[a],tags:['aerial','thermal',parts[0]==='1'?'night':'day'],reference:{objects},source:{url:'https://github.com/'+repo,revision:rev,original_id:name,altitude_m:Number(parts[1]),camera_angle_deg:Number(parts[2])},license:'CC-BY-4.0 (current upstream repository; attribution retained)'});}
 manifest.sources.push({name:'HIT-UAV',url:'https://github.com/'+repo,license:'CC-BY-4.0 current upstream',selection:'One per day/night, altitude and angle group, capped at 18 test images',role:'Real aerial thermal imagery; object boxes. Not satellite scale, not calibrated temperature.'});
});
await stage('Landsat RGB + surface temperature',async()=>{
 const sites=[['Phoenix',-112.08,33.45],['Imperial Valley',-115.55,32.95],['Salton Sea',-115.83,33.30],['Yellowstone',-110.83,44.46],['Rotterdam',4.25,51.94],['Amazon',-60.04,-3.10]];
 let n=manifest.scenes.filter(s=>s.dataset==='Landsat C2').length;
 const sas=await json('https://planetarycomputer.microsoft.com/api/sas/v1/token/landsateuwest/landsat-c2');
 for(const [name,lon,lat] of sites){if(manifest.scenes.some(s=>s.dataset==='Landsat C2'&&s.title.startsWith(name+' ')))continue;try{
 const query='https://planetarycomputer.microsoft.com/api/stac/v1/search?collections=landsat-c2-l2&bbox='+[lon-.02,lat-.02,lon+.02,lat+.02].join(',')+'&datetime=2024-05-01T00:00:00Z/2024-09-30T23:59:59Z&limit=30';
 const j=await json(query);const item=j.features.filter(i=>i.assets.lwir11&&i.properties['landsat:correction']==='L2SP').sort((a,b)=>a.properties['eo:cloud_cover']-b.properties['eo:cloud_cover'])[0];if(!item)throw Error('No L2SP item');
 const epsg=item.properties['proj:epsg'],zone=epsg%100;const xy=proj4('EPSG:4326','+proj=utm +zone='+zone+(epsg>=32700?' +south':'')+' +datum=WGS84 +units=m +no_defs',[lon,lat]);
 const size=256,rasters={};let transform;
 for(const key of ['red','green','blue','lwir11','qa_pixel','qa_radsat','qa']){if(!item.assets[key])continue;
 const href=item.assets[key].href;const signed={href:href+'?'+sas.token};
 const tif=await fromUrl(signed.href,{allowFullFile:false});const im=await tif.getImage();const origin=im.getOrigin(),res=im.getResolution();const x=Math.round((xy[0]-origin[0])/res[0])-size/2,y=Math.round((xy[1]-origin[1])/res[1])-size/2;
 rasters[key]=(await im.readRasters({window:[x,y,x+size,y+size],samples:[0]}))[0];transform=[res[0],0,origin[0]+x*res[0],0,res[1],origin[1]+y*res[1]];
 }
 const rgb=Buffer.alloc(size*size*3),ir=Buffer.alloc(size*size);const temperatures=[],valid=[];
 for(let i=0;i<size*size;i++){const ok=rasters.lwir11[i]!==0&&(rasters.qa_pixel[i]&63)===0&&(!rasters.qa_radsat||rasters.qa_radsat[i]===0);valid.push(ok?1:0);const t=rasters.lwir11[i]*.00341802+149-273.15;temperatures.push(ok?t:null);for(let c=0;c<3;c++){const dn=rasters[['red','green','blue'][c]][i];const reflectance=dn*.0000275-.2;rgb[i*3+c]=Math.round(255*Math.pow(Math.max(0,Math.min(1,reflectance/.35)),1/2.2));}}
 const vals=temperatures.filter(x=>x!==null).sort((a,b)=>a-b);if(vals.length<100)throw Error('Too little QA-valid temperature');
 const lo=vals[Math.floor(vals.length*.02)],hi=vals[Math.floor(vals.length*.98)];
 for(let i=0;i<ir.length;i++)ir[i]=temperatures[i]===null?0:Math.round(Math.max(0,Math.min(255,(temperatures[i]-lo)/(hi-lo)*255)));
 const id='landsat-'+String(n++).padStart(3,'0');
 const a=await asset(id+'-rgb',await sharp(rgb,{raw:{width:size,height:size,channels:3}}).png().toBuffer(),'RGB',{gsd_m:30,acquired:item.properties.datetime,derived:true});
 const b=await asset(id+'-tir',await sharp(ir,{raw:{width:size,height:size,channels:1}}).png().toBuffer(),'TIR',{gsd_m:30,effective_resolution_m:100,acquired:item.properties.datetime,polarity:'white-hot',radiometric:true,radiometry_path:id+'-radiometry.json',display_range_c:[lo,hi],derived:true});
 const uncertainty=rasters.qa?Array.from(rasters.qa,x=>x*.01):null;
 fs.writeFileSync(path.join(data,id+'-radiometry.json'),JSON.stringify({width:size,height:size,units:'C',product:'Landsat Collection 2 Level-2 ST_B10',values:temperatures,valid,uncertainty_k:uncertainty,epsg,transform,scale:.00341802,offset_kelvin:149,source:item.id,qa_rule:'Exclude fill, dilated cloud, cirrus, cloud, cloud shadow, snow; exclude nonzero QA_RADSAT where available',note:'30 m output grid; native TIRS resolution approximately 100 m. Spatial spread is not temperature uncertainty.'}));
 fs.writeFileSync(path.join(data,id+'-stac.json'),JSON.stringify(item,null,2));
 manifest.scenes.push({id,title:name+' · Landsat RGB + thermal',dataset:'Landsat C2',group:item.id+'-'+name,split:'engineering-holdout',assets:[a,b],tags:['satellite','paired','radiometric','30m-grid'],alignment:'Same scene and common grid; independent registration accuracy not measured',source:{url:'https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2',item:item.id,center:[lon,lat],date:item.properties.datetime},reference:{caption_status:'No human scene-caption ground truth; thermal statistics are deterministic product-derived values'},license:'USGS Landsat data: public domain; preserve source attribution'});
 console.log('Landsat',name,vals.length,'valid pixels');save();
 }catch(e){console.error('Landsat',name,e.message);manifest.errors.push({stage:'Landsat '+name,error:e.message});}}
 manifest.sources.push({name:'Landsat C2',url:'https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature',license:'Public domain USGS Landsat imagery',selection:'Six named environmental contexts; lowest scene cloud fraction among first 30 returned 2024 May–September items',role:'Registered RGB and real surface-temperature products with QA; no geothermal-cause labels'});
});
await stage('Robustness controls',async()=>{
 const base=manifest.scenes.find(s=>s.dataset==='RSICD')||manifest.scenes[0];if(!base)return;
 const source=path.join(data,base.assets[0].path);
 for(const [variant,op] of [['blur',s=>s.blur(4)],['low-resolution',async s=>sharp(await s.resize(32,32).png().toBuffer()).resize(224,224,{kernel:'nearest'})],['inverted',s=>s.negate()]]){
 const id='control-'+variant;const b=await (await op(sharp(source))).png().toBuffer();const a=await asset(id,b,'RGB',{...(variant==='low-resolution'?{effective_pixel_grid:[32,32]}:{}),provenance:'derived-control',parent_asset:base.assets[0].id});manifest.scenes.push({id,title:'Robustness · '+variant,dataset:'Controls',group:base.group,split:'derived-control',assets:[a],tags:['robustness',variant],reference:{expected_behavior:'Reduce confidence as appropriate; do not treat as independent evidence',parent:base.id},license:base.license});}
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#172b3a"/><text x="35" y="70" font-size="32" fill="white">NOT A SATELLITE IMAGE</text><circle cx="160" cy="240" r="60" fill="#f2b84b"/><rect x="300" y="180" width="180" height="120" fill="#35ac9a"/></svg>';
 const id='control-misc';manifest.scenes.push({id,title:'Miscellaneous routing control',dataset:'Controls',group:id,split:'synthetic-control',assets:[await asset(id,Buffer.from(svg),'MISC',{provenance:'synthetic-control'})],tags:['misc','routing'],reference:{expected_behavior:'Identify diagram/shapes; do not invent landscape or temperature'},license:'Project-created CC0 fixture'});
});
save();console.log('COMPLETE',manifest.scenes.length,'scenes',manifest.errors.length,'download errors.');
