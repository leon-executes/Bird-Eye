import fs from 'node:fs';
const base='http://127.0.0.1:43187';const state=await(await fetch(base+'/api/state')).json();
const response=await fetch(base+'/api/benchmark',{method:'POST',headers:{'content-type':'application/json','x-council-token':state.token},body:JSON.stringify({sceneIds:['user-sheet-row-1','eurosat-000','rsicd-000','hituav-000','landsat-000','control-low-resolution','control-misc','s2-000','s1-000'].filter(id=>state.library.scenes.some(s=>s.id===id)),compare:true})});
const job=await response.json();if(!response.ok)throw Error(JSON.stringify(job));fs.writeFileSync('work/smoke-job.json',JSON.stringify(job,null,2));console.log(JSON.stringify(job));

