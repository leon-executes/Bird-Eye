// Desktop and bulk presentation only. Caption engine remains unchanged.
let bulkFiles=[],bulkPlan=null,bulkImported=[],bulkBusy=false,stopBulk=false,bulkTypes=new Map();
function renderBulkPlan(){
 try{
 bulkPlan=planBulk(bulkFiles,$('input[name=bulkMode]:checked').value);
 $('#bulkSummary').textContent=bulkPlan.tasks.length+' tasks · '+bulkPlan.images+' images · '+bulkPlan.ignored.length+' non-image files ignored';
 $('#bulkPlan').innerHTML=bulkPlan.tasks.map((t,i)=>'<article class="bulk-task '+(t.errors.length?'invalid':'')+'"><div class="bulk-task-title"><span class="task-number">'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(t.title)+'</strong><span class="muted">'+t.files.length+' input'+(t.files.length===1?'':'s')+'</span></div>'+t.files.map(f=>'<div class="bulk-file"><span>'+esc(f.name)+'</span><small>'+Math.round(f.size/1024)+' KB</small><select aria-label="Modality for '+esc(f.name)+'" data-bulk-type="'+f.index+'">'+['UNKNOWN','RGB','TIR','NIR','SAR','MISC'].map(m=>'<option'+(m===(bulkTypes.get(f.index)||$('#bulkModality').value)?' selected':'')+'>'+m+'</option>').join('')+'</select></div>').join('')+t.errors.map(e=>'<p class="error-text">'+esc(e)+'</p>').join('')+'</article>').join('')||'<p class="muted">No supported images found.</p>';
 if(bulkPlan.ignored.length)$('#bulkPlan').insertAdjacentHTML('beforeend','<details><summary>Ignored non-image files ('+bulkPlan.ignored.length+')</summary><div class="detail-body">'+bulkPlan.ignored.map(esc).join('<br>')+'</div></details>');
 $$('[data-bulk-type]').forEach(el=>el.onchange=()=>bulkTypes.set(Number(el.dataset.bulkType),el.value));
 $('#bulkImport').disabled=bulkBusy||!bulkPlan.valid;
 }catch(e){bulkPlan=null;$('#bulkImport').disabled=true;notice(e.message);}
}
function receiveBulk(files){bulkFiles=[...files];bulkImported=[];bulkTypes.clear();$('#bulkRun').disabled=true;renderBulkPlan();}
$('#bulkChooseFiles').onclick=()=>$('#bulkFiles').click();
$('#bulkChooseFolder').onclick=()=>$('#bulkFolder').click();
$('#bulkFiles').onchange=e=>receiveBulk(e.target.files);
$('#bulkFolder').onchange=e=>receiveBulk(e.target.files);
$$('input[name=bulkMode]').forEach(el=>el.onchange=()=>{if(bulkBusy)return;bulkImported=[];$('#bulkRun').disabled=true;$('#bulkChooseFiles').disabled=el.value==='folders'&&el.checked;if(bulkFiles.length)renderBulkPlan();});
$('#bulkModality').onchange=()=>{bulkTypes.clear();if(bulkFiles.length)renderBulkPlan();};
const file64=f=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('Could not read '+f.name));r.readAsDataURL(f);});
$('#bulkStopImport').onclick=()=>{stopBulk=true;$('#bulkStatus').textContent='Stopping after the current task…';};
$('#bulkImport').onclick=async()=>{
 if(!bulkPlan?.valid||bulkBusy)return;
 bulkBusy=true;stopBulk=false;$('#bulkStopImport').hidden=false;
 const controls=$$('#bulk input,#bulk select,#bulkChooseFiles,#bulkChooseFolder,#bulkImport,#bulkRun');
 controls.forEach(x=>x.disabled=true);
 const errors=[],already=new Set(bulkImported.map(x=>x.planIndex));
 try{
 for(const [i,t] of bulkPlan.tasks.entries()){
  if(stopBulk)break;if(already.has(i))continue;
  $('#bulkStatus').textContent='Importing '+(i+1)+' / '+bulkPlan.tasks.length;
  try{const files=[];for(const f of t.files)files.push({base64:await file64(bulkFiles[f.index]),modality:bulkTypes.get(f.index)||$('#bulkModality').value,domain:$('#bulkDomain').value,polarity:$('#bulkPolarity').value,generated:false});
   const s=await api('/api/import',{title:t.title,files});bulkImported.push({sceneId:s.id,planIndex:i});
  }catch(e){errors.push(t.title+': '+e.message);}
 }
 await refresh(true);$('#bulkStatus').textContent=bulkImported.length+' tasks imported'+(stopBulk?' · import stopped':'')+(errors.length?' · '+errors.length+' rejected':'');
 if(errors.length)notice(errors.join('; '));
 }finally{bulkBusy=false;controls.forEach(x=>x.disabled=false);$('#bulkStopImport').hidden=true;$('#bulkRun').disabled=!bulkImported.length;$('#bulkImport').disabled=bulkImported.length===bulkPlan.tasks.length;$('#bulkChooseFiles').disabled=$('input[name=bulkMode]:checked').value==='folders';}
};
$('#bulkRun').onclick=async()=>{try{if(bulkBusy||!bulkImported.length)return;const j=await api('/api/bulk',{tasks:bulkImported.map(t=>({sceneId:t.sceneId,mode:$('#bulkAnalysis').value}))});jobId=j.id;showJob(j);$('#bulkRun').disabled=true;await renderBulkHistory();}catch(e){notice(e.message);}};
async function renderBulkHistory(){
 const batches=await api('/api/batches');
 $('#bulkHistory').innerHTML=batches.length?batches.map(j=>'<article class="batch-row"><div><strong>'+esc(new Date(j.created).toLocaleString())+'</strong><p class="muted">'+esc(j.status)+' · '+j.completed+'/'+j.total+' processed · '+j.reports.length+' reports · '+j.errors.length+' errors</p>'+(j.errors.length?'<details><summary>Task errors</summary><div class="detail-body">'+j.errors.map(e=>esc(e.scene)+': '+esc(e.error)).join('<br>')+'</div></details>':'')+'</div><div class="buttonline"><button class="quiet bordered" data-batch-export="'+j.id+'">Export JSON</button>'+(j.status!=='running'&&j.reports.length<j.total?'<button class="quiet bordered" data-resume="'+j.id+'">Resume unfinished</button>':'')+'</div></article>').join(''):'<p class="muted">No batches have run in this installation.</p>';
 $$('[data-resume]').forEach(b=>b.onclick=async()=>{try{const old=batches.find(j=>j.id===b.dataset.resume);const done=new Set();for(const id of old.reports){const r=await api('/api/report/'+id);done.add(r.scene_id+'|'+r.mode);}const tasks=old.tasks.filter(t=>!done.has(t.sceneId+'|'+t.mode));if(!tasks.length)return notice('All tasks already have reports.');const j=await api('/api/bulk',{tasks});jobId=j.id;showJob(j);await renderBulkHistory();}catch(e){notice(e.message);}});
 $$('[data-batch-export]').forEach(b=>b.onclick=async()=>{try{const batch=batches.find(j=>j.id===b.dataset.batchExport);const reports=[];for(const id of batch.reports)reports.push(await api('/api/report/'+id));const url=URL.createObjectURL(new Blob([JSON.stringify({application:'Bird Eye',batch,reports},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='BirdEye-batch-'+batch.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){notice(e.message);}});
}
window.birdEye?.onNavigate(name=>{
 if(name==='import'){$('#importDialog').showModal();return;}
 if(name.startsWith('bulk-')){tab('bulk');const mode=name==='bulk-folders'?'folders':'individual';$('input[name=bulkMode][value='+mode+']').checked=true;$('#bulkChooseFiles').disabled=mode==='folders';if(bulkFiles.length)renderBulkPlan();return;}
 tab(name);
});
setInterval(()=>{if($('#bulk').classList.contains('active'))renderBulkHistory().catch(()=>{});},4000);

