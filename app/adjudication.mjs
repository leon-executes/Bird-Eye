// A claim ledger tracks provenance, not truth. No agreement score is presented as probability.
export function modelIdentity(profile){return profile.modelFile||profile.checkpoint||profile.model;}
export function familyIdentity(profile){if(profile.family)return profile.family;const name=modelIdentity(profile)||'';if(/qwen/i.test(name))return 'Qwen';if(/earthdial|internvl/i.test(name))return 'InternVL';if(/gemma/i.test(name))return 'Gemma';return name;}
export function buildLedger(passes){
 const ledger=[];
 for(let i=0;i<passes.length;i++){const p=passes[i];if(!p.opinion||!p.independent_observation)continue;
  const source={pass:i+1,role:p.role,model:p.model,identity:p.identity,family:p.family,input_assets:p.input_assets,scope:p.scope};
  if(!p.structured_objects)ledger.push({id:'P'+(i+1)+'S',claim:p.opinion.scene,kind:'scene',confidence:'UNSCORED',evidence:p.input_assets,...source});
  for(let j=0;j<p.opinion.findings.length;j++){const f=p.opinion.findings[j];ledger.push({id:'P'+(i+1)+'F'+(j+1),...f,kind:'feature',external_object:!!p.structured_objects,...source});}
 }
 return ledger;
}
export function reviewPacket(passes){
 const ledger=buildLedger(passes);
 return {sources:[...new Map(ledger.map(c=>[c.pass,{pass:c.pass,role:c.role,model:c.model,family:c.family,scope:c.scope}])).values()],policy:'Every entry is a hypothesis, not a fact. Source models may share training and failure modes. Repeated wording, same-model roles and multiple renderings are not independent confirmation. Resolve using original pixels, modality, resolution and observable discriminating features. No majority vote.',ledger:ledger.map(({id,claim,kind,confidence,evidence,region,alternatives,hypotheses,pass,external_object,object_class,proposal_count,boxes})=>({id,claim,kind,confidence,evidence,region,alternatives,hypotheses,pass,external_object,object_class,proposal_count,boxes})),reviews:passes.filter(p=>p.opinion&&!p.independent_observation).map(p=>({role:p.role,model:p.model,opinion:p.opinion}))};
}
export function judgeDecisions(raw,ledger,opinion){
 const ids=new Set(ledger.map(c=>c.id));const seen=new Set();const errors=[];const decisions=[];
 for(const d of (Array.isArray(raw.decisions)?raw.decisions:Object.entries(raw.decisions||{}).map(([claim_id,value])=>({claim_id,...value})))){if(!ids.has(d.claim_id)||seen.has(d.claim_id)||!['accepted','qualified','rejected','unresolved'].includes(d.verdict)||typeof d.reason!=='string'||!d.reason.trim()){errors.push('Invalid or duplicated adjudication entry.');continue;}seen.add(d.claim_id);decisions.push({claim_id:d.claim_id,verdict:d.verdict,reason:d.reason.slice(0,300)});}
 const missing=ledger.filter(c=>!seen.has(c.id)).map(c=>c.id);if(missing.length)errors.push('Unreviewed claims: '+missing.join(', '));
 const verdicts=new Map(decisions.map(d=>[d.claim_id,d.verdict]));
 for(const f of opinion.findings){const original=raw.findings?.find(x=>x.claim===f.claim);const refs=original?.source_claims;
  if(!Array.isArray(refs)||!refs.length||refs.some(id=>!ids.has(id)||!['accepted','qualified'].includes(verdicts.get(id)))){errors.push('Final finding lacks accepted source claims: '+f.claim);f.confidence='TENTATIVE';f.source_claims=[];}
  else{f.source_claims=refs;if(refs.some(id=>verdicts.get(id)==='qualified')&&f.confidence==='CLEAR')f.confidence='LIKELY';}
 }
 for(const c of ledger.filter(c=>c.external_object)){const d=decisions.find(d=>d.claim_id===c.id);if(d?.verdict==='rejected'&&!/shape|silhouette|morpholog|elongat|rectang|edge|size|scale|pixel|resol|locat|align|overlap|duplicate|shadow|vegetat|roof|ground|structure|position|width|height|limb|head|wheel|road/i.test(d.reason))errors.push('External object rejection needs concrete morphology, scale or location evidence; otherwise mark unresolved: '+c.id);if(['accepted','qualified'].includes(verdicts.get(c.id))&&!opinion.findings.some(f=>f.source_claims?.includes(c.id)))errors.push('Accepted external object group omitted from final findings: '+c.id);}
 const captionSources=raw.caption_sources||[];if(!captionSources.length||captionSources.some(id=>!ids.has(id)||!['accepted','qualified'].includes(verdicts.get(id))))errors.push('Caption lacks accepted or qualified source claims.');
 return {status:errors.length?'incomplete':'complete',caption_sources:captionSources,decisions,errors,note:'Decision trace is model-authored evidence review, not independent factual verification. Caption entailment is not mechanically proven.'};
}
export function scopedAssets(assets,profile,role){
 let selected=assets;
 if(role==='Thermal review')selected=assets.filter(a=>a.modality==='TIR');
 if(role==='Spectral/radar review')selected=assets.filter(a=>['NIR','SAR'].includes(a.modality));
 if(profile.modalities?.length)selected=selected.filter(a=>profile.modalities.includes(a.modality));
 if(profile.inputDomainsByModality)selected=selected.filter(a=>!profile.inputDomainsByModality[a.modality]?.length||profile.inputDomainsByModality[a.modality].includes(a.domain||'unknown')); 
 if(role==='Thermal review'&&!selected.some(a=>a.modality==='TIR'))return [];
 if(role==='Spectral/radar review'&&!selected.some(a=>['NIR','SAR'].includes(a.modality)))return [];
 return selected;
}
export function authority(profile,assets){return {trained_domains:profile.trainedDomains||[],validated_domains:profile.validatedDomains||[],input_modalities:assets.map(a=>a.modality),allowed_domains:profile.inputDomainsByModality||null,specialist_claim:!!profile.specialist,warning:'Training-domain fit is a prior; it does not verify this prediction. Validation on other images does not establish accuracy here.'};}
