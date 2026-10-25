import {modelReceipt} from './model-receipt.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
export const hash=b=>createHash('sha256').update(b).digest('hex');
export function safePath(root,relative){if(typeof relative!=='string'||relative.includes('\0'))throw Error('Invalid path');const p=path.resolve(root,relative);if(!p.startsWith(path.resolve(root)+path.sep))throw Error('Path outside asset directory');return p;}
export function percentile(sorted,p){return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))];}
export function numericalSummary(values){const v=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!v.length)return null;return {count:v.length,min:v[0],p05:percentile(v,.05),median:percentile(v,.5),p95:percentile(v,.95),max:v.at(-1),mean:v.reduce((a,b)=>a+b,0)/v.length};}
export async function inspectAsset(asset,dataRoot){
 const file=safePath(dataRoot,asset.path);const original=fs.readFileSync(file);const m=await sharp(original,{limitInputPixels:40000000}).metadata();
 const {data,info}=await sharp(original).rotate().resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).removeAlpha().greyscale().raw().toBuffer({resolveWithObject:true});
 const hist=Array(256).fill(0);let sum=0,sq=0;for(const x of data){hist[x]++;sum+=x;sq+=x*x;}
 const mean=sum/data.length;let entropy=0;for(const n of hist)if(n){const p=n/data.length;entropy-=p*Math.log2(p);}
 let gx=0,gy=0;for(let y=0;y<info.height-1;y++)for(let x=0;x<info.width-1;x++){const p=y*info.width+x;gx+=Math.abs(data[p+1]-data[p]);gy+=Math.abs(data[p+info.width]-data[p]);}
 const metrics={id:asset.id,width:m.width,height:m.height,sha256:hash(original),modality:asset.modality,provenance:asset.provenance||'unknown',analysis_grid:[info.width,info.height],mean_display_intensity:+mean.toFixed(2),display_stddev:+Math.sqrt(Math.max(0,sq/data.length-mean*mean)).toFixed(2),entropy_bits:+entropy.toFixed(3),black_fraction:+(hist[0]/data.length).toFixed(4),white_fraction:+(hist[255]/data.length).toFixed(4),horizontal_gradient:+(gx/data.length).toFixed(3),vertical_gradient:+(gy/data.length).toFixed(3),radiometric:!!asset.radiometric,polarity:asset.polarity||'unknown'};
 const limits=['Display intensity is not temperature or reflectance. Quality metrics describe the rendered image; no semantic cloud mask is inferred.'];
 if(asset.effective_pixel_grid)limits.push('Content was degraded to '+asset.effective_pixel_grid.join(' × ')+' pixels before enlargement; displayed size does not restore detail.');
 if(Math.min(m.width,m.height)<128)limits.push('Low native resolution; small-object interpretation is limited.');
 if(asset.provenance?.includes('generated')||asset.provenance?.includes('synthetic'))limits.push('Synthetic/generated asset; not an independent sensor observation.');
 if(asset.modality==='TIR'&&!asset.radiometric)limits.push('No radiometric calibration; temperatures and hot/cold ordering are unavailable unless polarity is verified.');
 if(asset.radiometric&&asset.radiometry_path){const raw=JSON.parse(fs.readFileSync(safePath(dataRoot,asset.radiometry_path),'utf8'));if(raw.units!=='C'||raw.values?.length!==raw.width*raw.height||!Array.isArray(raw.valid)||raw.valid.length!==raw.values.length)throw Error('Radiometry dimension mismatch');metrics.temperature_c=numericalSummary(raw.values.map((x,i)=>raw.valid?.[i]===0?null:x));metrics.valid_fraction=metrics.temperature_c?metrics.temperature_c.count/raw.values.length:0;metrics.temperature_product=raw.product;metrics.grid_area_km2=asset.gsd_m?m.width*m.height*asset.gsd_m**2/1e6:null;metrics.effective_resolution_m=asset.effective_resolution_m??null;metrics.qa_rule=raw.qa_rule;metrics.uncertainty_k=raw.uncertainty_k?numericalSummary(raw.uncertainty_k.filter((x,i)=>raw.valid[i])):null;limits.push('Temperature spread is spatial variation, not uncertainty. '+(raw.note||''));}
 if(asset.modality==='SAR'&&asset.measurements_path){const raw=JSON.parse(fs.readFileSync(safePath(dataRoot,asset.measurements_path),'utf8'));if(raw.units==='dB'&&raw.values?.length===m.width*m.height)metrics.backscatter_db=numericalSummary(raw.values);limits.push('Radar backscatter is affected by geometry, roughness and moisture; it is not temperature.');}
 const prepared=await sharp(original).rotate().resize({width:768,height:768,fit:'inside',withoutEnlargement:true}).png().toBuffer();
 return {metrics,limits,image:'data:image/png;base64,'+prepared.toString('base64')};
}
export function parseModelJSON(text){const stripped=text.replace(/<think>[\s\S]*?<\/think>/g,'').trim();const start=stripped.indexOf('{'),end=stripped.lastIndexOf('}');if(start<0||end<start)throw Error('Model returned no JSON object');const j=JSON.parse(stripped.slice(start,end+1));if(typeof j.scene!=='string'||!Array.isArray(j.findings))throw Error('Model response missing scene/findings');return j;}
export function validateOpinion(opinion,assetIds,measurements){
 const warnings=[];const allowed=new Set(assetIds);const calibrated=measurements.some(m=>m.temperature_c);
 const numericTemperature=/-?\d+(?:\.\d+)?\s*(?:°\s*[CFK]?|[CFK]\b|degrees?\s*(?:Celsius|Fahrenheit|C|F)|kelvin|Celsius|Fahrenheit)/i;
 const hasTIR=measurements.some(m=>m.modality==='TIR');const contradictsTIR=t=>hasTIR&&/\b(?:not (?:a )?(?:thermal|infrared)|no thermal (?:data|imagery)|no infrared (?:data|imagery))\b/i.test(t);
 const unsupportedThermal=(text,ids)=>{
  const thermal=measurements.filter(m=>ids.includes(m.id)&&m.modality==='TIR');if(!thermal.length)return false;
  const uncalibrated=thermal.some(m=>(!m.temperature_c&&!['white-hot','black-hot'].includes(m.polarity))||/generated|synthetic/.test(m.provenance||''));
  return text.split(/[.;,]|\b(?:but|and|although|while|yet)\b/i).some(clause=>{
   if(/cannot (?:establish|determine|infer|confirm)|not (?:established|known|measured)|unknown|unverified|no (?:verified |confirmed )?(?:hot spots?|heat sources?)/i.test(clause))return false;
   const order=/\b(?:hotter|colder|warmer|cooler|hot spots?|heat sources?)\b|\b(?:warm|hot|cold|cool) (?:thermal )?(?:signatures?|spots?|regions?|areas?|patches?|pixels?|objects?|surfaces?|bodies)\b/i.test(clause);
   return /\b(?:low|high)[ -]emissivity\b/i.test(clause)||(order&&uncalibrated);
  });
 };
 const findings=(opinion.findings||[]).slice(0,12).filter(f=>{
 if(typeof f.claim!=='string'||!Array.isArray(f.evidence)||!f.evidence.some(e=>allowed.has(e))){warnings.push('Removed claim without a valid asset evidence ID.');return false;}
 if(f.evidence.some(id=>measurements.some(m=>m.id===id&&m.modality==='UNKNOWN'))&&/\b(?:SAR|NIR)\b/i.test(f.claim)){warnings.push('Removed sensor attribution for an UNKNOWN-modality input; source metadata is required.');return false;}
 if(contradictsTIR(f.claim)){warnings.push('Removed claim contradicting the supplied TIR modality. Uncalibrated thermal imagery is still thermal.');return false;}
 if(unsupportedThermal(f.claim,f.evidence)){warnings.push('Removed unsupported thermal ordering/emissivity assertion; display brightness alone is insufficient.');return false;}
 if(numericTemperature.test(f.claim)){warnings.push('Removed model-written numerical temperature; use the deterministic measurement panel.');return false;}return true;
 }).map(f=>{let confidence=['CLEAR','LIKELY','TENTATIVE','UNKNOWN'].includes(f.confidence)?f.confidence:'TENTATIVE';if(/\d/.test(f.claim)){confidence='TENTATIVE';warnings.push('Numerical model claim capped at TENTATIVE; use the separate tool-derived measurement panel.');}return {claim:f.claim.slice(0,450),confidence,basis:f.basis==='measurement'?'measurement':'visual-interpretation',evidence:f.evidence.filter(e=>allowed.has(e)),region:typeof f.region==='string'?f.region.slice(0,80):'whole image',alternatives:Array.isArray(f.alternatives)?f.alternatives.filter(x=>typeof x==='string').slice(0,3):[]};});
 for(const f of findings)if(f.basis==='measurement'){f.basis='interpretation-of-measurements';if(f.confidence==='CLEAR')f.confidence='LIKELY';}
 let scene=opinion.scene.slice(0,600);if(contradictsTIR(scene)){scene='Scene summary withheld: contradicts supplied thermal modality. Review supported findings below.';warnings.push('Withheld modality-contradicting summary.');}if(numericTemperature.test(scene)){scene='Scene summary withheld: use the deterministic temperature panel and the supported findings below.';warnings.push('Withheld temperature-bearing summary.');}
 if(unsupportedThermal(scene,assetIds)){scene='Scene summary withheld because it asserts unsupported heat ordering or emissivity. Review the retained object and landform findings.';warnings.push('Withheld unsupported physical thermal summary.');}
 const strings=a=>Array.isArray(a)?a.filter(x=>typeof x==='string').map(x=>x.slice(0,350)).slice(0,6):[];
 return {scene,findings,limits:strings(opinion.limits),next:typeof opinion.next==='string'?opinion.next.slice(0,350):'Review the original pixels and sensor metadata.',warnings:[...new Set(warnings)],confidence_note:'Evidence grades are model judgements, not calibrated probabilities; CLEAR still requires human verification.'};
}
export function modelEvidence(scene,assets,measurements){return {assets:assets.map(a=>({id:a.id,modality:a.modality,domain:a.domain||null,provenance:a.provenance,radiometric:!!a.radiometric,polarity:a.polarity||'unknown',effective_pixel_grid:a.effective_pixel_grid||null,rendering:a.rendering||null,band:a.band||null,polarization:a.polarization||null,native_size:[a.width,a.height],gsd_m:a.gsd_m??null,effective_resolution_m:a.effective_resolution_m??null,acquired:a.acquired??null})),pair_alignment:scene.alignment||'Not verified',measurements:measurements.map(({mean_display_intensity,display_stddev,entropy_bits,black_fraction,white_fraction,horizontal_gradient,vertical_gradient,analysis_grid,sha256,...physical})=>physical)};}
export function reportMarkdown(r){
 const f=r.final;return ['# Satellite Council — '+r.id,'', '**Status:** '+r.status+' · '+r.mode+' · '+(r.independent?'Multiple model families; errors can still correlate':'Shared or related models; role reviews are not independent experts'),'','**CAPTION:** '+(r.evaluation?.human_review?.caption_override||f.scene),'',...r.passes.filter(p=>p.opinion&&((r.mode==='council'&&p.role==='Satellite first opinion'&&p.scope?.specialist_claim&&p.opinion.scene!==f.scene)||p.role==='Thermal object proposals')).flatMap(p=>['**'+p.role+' · '+p.model+':** '+p.opinion.scene,...p.opinion.findings.map(x=>'- '+x.claim+' '+(x.region||'')), '']),...['CLEAR','LIKELY','TENTATIVE','UNKNOWN'].map(g=>'**'+g+':** '+(f.findings.filter(x=>x.confidence===g).map(x=>x.claim+' ['+x.evidence.join(', ')+']').join(' ')||'No claims.')),'','**LIMITS:** '+[...new Set([...r.limits,...f.limits,...f.warnings])].join(' '),'','**NEXT:** '+f.next,'','## Models used',...(r.models_used||modelReceipt(r.passes)).map(m=>'- '+m.model+' — '+m.roles.join(', ')+'; '+m.seconds+'s; '+m.completed+' completed, '+m.failed+' failed'+(m.checkpoint?'; checkpoint '+m.checkpoint:'')+(m.adapter?'; adapter '+m.adapter:'')),'','## Claim decisions',JSON.stringify(r.adjudication||{},null,2),'','## Claim ledger',JSON.stringify(r.claim_ledger||[],null,2),'','## Measurements',JSON.stringify(r.measurements,null,2),'','## Provenance',JSON.stringify({assets:r.assets,models:r.passes.map(p=>({role:p.role,model:p.model,seconds:p.seconds})),elapsed:r.seconds},null,2)].join('\n');
}
export function evaluateReport(report,reference={}){
 const text=[report.final.scene,...report.final.findings.map(f=>f.claim)].join(' ').toLowerCase();
 const tokenSet=s=>new Set((s.toLowerCase().match(/[a-z]+/g)||[]).filter(x=>x.length>2&&!['the','and','are','with','there','image','this','some','many'].includes(x)));
 let overlap=null;if(reference.captions?.length){const a=tokenSet(text);overlap=Math.max(...reference.captions.map(c=>{const b=tokenSet(c),inter=[...a].filter(x=>b.has(x)).length;return a.size+b.size?2*inter/(a.size+b.size):0;}));}
 const label=reference.class?.replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase();
 return {reference_class:reference.class||null,class_literal_mention:label?text.includes(label):null,caption_token_f1:overlap,claim_count:report.final.findings.length,guardrail_warnings:report.final.warnings.length,seconds:report.seconds,metric_note:'Token F1 and literal class mention are diagnostics, not factual accuracy. Ground truth was withheld from all inference prompts.',human_review:{unsupported_claims:null,important_misses:null,spatial_errors:null,thermal_errors:null,usefulness_1_to_5:null}};
}
