// Derived only from executed passes; configured-but-unused models never count.
export function modelReceipt(passes=[]){
 const groups=new Map();
 for(const p of passes){
  if(p.status==='skipped')continue;
  const key=p.identity||p.checkpoint||p.model;if(!key)continue;
  const row=groups.get(key)||{model:p.model,identity:p.identity||null,checkpoint:p.checkpoint||null,adapter:p.adapter||null,family:p.family||null,external:!!p.external,license:p.license||null,roles:[],assets:[],completed:0,failed:0,seconds:0};
  if(!row.roles.includes(p.role))row.roles.push(p.role);
  row.assets=[...new Set([...row.assets,...p.input_assets||[]])];
  if(p.status==='complete')row.completed++;else row.failed++;
  row.seconds=+(row.seconds+(p.seconds||0)).toFixed(2);groups.set(key,row);
 }
 return [...groups.values()];
}
