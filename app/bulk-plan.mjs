// Bird Eye · Parham (Leon) Faraji · leon-executes
export const IMAGE_EXTENSION=/\.(png|jpe?g|webp|tiff?)$/i;
export function planBulk(files,mode='individual'){
 if(!['individual','folders'].includes(mode))throw Error('Unknown bulk mode');
 if(files.length>1000)throw Error('Select at most 1,000 files per import.');
 const groups=new Map(),ignored=[];
 for(const [index,file] of files.entries()){
  const rel=(file.webkitRelativePath||file.relativePath||file.name).replaceAll('\\','/');
  if(rel.split('/').some(x=>x==='..'))throw Error('Invalid relative path');
  if(!IMAGE_EXTENSION.test(file.name)){ignored.push(rel);continue;}
  const parent=rel.includes('/')?rel.slice(0,rel.lastIndexOf('/')):'';
  const key=mode==='individual'?String(index):parent;
  if(!groups.has(key))groups.set(key,{title:mode==='individual'?file.name:parent||'Selected folder',files:[],errors:[]});
  const group=groups.get(key);group.files.push({index,name:file.name,relativePath:rel,size:file.size});
  if(file.size>10000000)group.errors.push(file.name+': exceeds 10 MB');
  if(file.size===0)group.errors.push(file.name+': empty file');
 }
 const tasks=[...groups.values()];
 for(const t of tasks)if(t.files.length>4)t.errors.push(t.files.length+' images: maximum four per caption task');
 return {tasks,ignored,valid:tasks.length>0&&tasks.every(t=>!t.errors.length),images:tasks.reduce((n,t)=>n+t.files.length,0)};
}

