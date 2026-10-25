// Bird Eye · Parham (Leon) Faraji · leon-executes
'use strict';
const {app,BrowserWindow,Menu,dialog,ipcMain,shell,desktopCapturer,screen,nativeTheme}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
let win,child,origin,token,exiting=false;const selections=new Map();const {randomUUID}=require('node:crypto');
nativeTheme.themeSource='dark';app.setName('Bird Eye');app.setAppUserModelId('leon-executes.BirdEye');
app.setPath('userData',path.join(root,'desktop-state-glass-v1'));
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',()=>{if(win){win.setIcon(path.join(root,'artwork/bird-eye.ico'));if(win.isMinimized())win.restore();const display=screen.getDisplayMatching(win.getBounds()),area=display.workArea,b=win.getBounds();if(b.x<area.x||b.y<area.y||b.x+b.width>area.x+area.width||b.y+b.height>area.y+area.height){win.setBounds({x:area.x+Math.max(0,Math.round((area.width-Math.min(b.width,area.width))/2)),y:area.y+Math.max(0,Math.round((area.height-Math.min(b.height,area.height))/2)),width:Math.min(b.width,area.width),height:Math.min(b.height,area.height)});}win.webContents.executeJavaScript("for(const l of document.querySelectorAll('link[rel=stylesheet]')){const u=new URL(l.href);u.searchParams.set('refresh',Date.now());l.href=u.href;}const mark=document.querySelector('.brand-mark');if(mark){const u=new URL(mark.src);u.searchParams.set('refresh',Date.now());mark.src=u.href;}").catch(()=>{});win.show();win.focus();}});
 app.whenReady().then(start).catch(e=>{dialog.showErrorBox('Bird Eye — startup failed',e.message+'\n\nExtract the complete release into a writable folder. See logs/desktop.log.');app.quit();});
}
async function start(){
 for(const d of ['logs','reports','data','desktop-state'])fs.mkdirSync(path.join(root,d),{recursive:true});
 if(!fs.existsSync(path.join(root,'local-settings.json')))fs.copyFileSync(path.join(root,'desktop/default-settings.json'),path.join(root,'local-settings.json'));
 for(const f of fs.readdirSync(path.join(root,'data/examples')))if(f.endsWith('.json')&&!fs.existsSync(path.join(root,'reports',f)))fs.copyFileSync(path.join(root,'data/examples',f),path.join(root,'reports',f));
 win=new BrowserWindow({width:1480,height:1000,minWidth:1000,minHeight:720,show:false,title:'Bird Eye',titleBarStyle:'hidden',titleBarOverlay:{color:'#153347',symbolColor:'#deebf3',height:34},autoHideMenuBar:true,backgroundColor:'#153347',icon:path.join(root,'artwork/bird-eye.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:false}});
 const log=fs.createWriteStream(path.join(root,'logs/desktop.log'),{flags:'a'});
 child=spawn(path.join(root,'runtime/node.exe'),[path.join(root,'app/server.mjs')],{cwd:root,windowsHide:true,env:{...process.env,COUNCIL_PORT:'0'},stdio:['pipe','pipe','pipe']});
 child.stderr.pipe(log);child.stdout.pipe(log);
 const ready=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(Error('Local engine did not become ready within 30 seconds.')),30000);child.once('error',e=>{clearTimeout(timeout);reject(e);});child.once('exit',code=>{clearTimeout(timeout);reject(Error('Engine exited during startup: '+code));});child.stdout.on('data',b=>{output+=b.toString();const m=output.match(/BIRD_EYE_READY (http:\/\/127\.0\.0\.1:\d+)/);if(m){clearTimeout(timeout);resolve(m[1]);}});});
 origin=ready;token=(await(await fetch(origin+'/api/state')).json()).token;
 const valid=e=>e.sender===win.webContents&&e.senderFrame?.url?.startsWith(origin+'/');
 ipcMain.handle('bird:pick',async(e,kind)=>{if(!valid(e)||!['files','folder'].includes(kind))throw Error('Invalid selection request');const result=await dialog.showOpenDialog(win,{title:kind==='folder'?'Select imagery folder':'Select imagery files',buttonLabel:'Select',properties:kind==='folder'?['openDirectory']:['openFile','multiSelections'],filters:kind==='files'?[{name:'Images',extensions:['png','jpg','jpeg','webp','tif','tiff']}]:undefined});if(result.canceled)return null;const list=[];const add=(file,relativePath)=>{const st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink())return;if(list.length>=1000)throw Error('Select at most 1,000 files.');const nativeId=randomUUID();list.push({nativeId,name:path.basename(file),relativePath,size:st.size});selections.set(nativeId,file);};selections.clear();if(kind==='files')for(const f of result.filePaths)add(f,path.basename(f));else{const base=result.filePaths[0];const walk=d=>{for(const ent of fs.readdirSync(d,{withFileTypes:true})){if(ent.isSymbolicLink())continue;const p=path.join(d,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile())add(p,path.basename(base)+'/'+path.relative(base,p).replaceAll('\\','/'));}};walk(base);}return list;});
 ipcMain.handle('bird:read',async(e,id)=>{if(!valid(e)||typeof id!=='string'||!selections.has(id))throw Error('File was not selected');const file=selections.get(id),st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.size>10000000)throw Error('Invalid file or size exceeds 10 MB');return fs.readFileSync(file).toString('base64');});
 ipcMain.handle('bird:quit',e=>{if(valid(e))win.close();});
 ipcMain.handle('bird:menu',async(e,name,point)=>{if(!valid(e)||!['Single','Bulk','View','File','Help'].includes(name))throw Error('Invalid menu');const item=Menu.getApplicationMenu()?.items.find(i=>i.label===name);if(!item?.submenu)return;const b=win.getContentBounds(),x=Math.max(0,Math.min(b.width-1,Math.round(Number(point?.x)||0))),y=Math.max(0,Math.min(b.height-1,Math.round(Number(point?.y)||34)));item.submenu.popup({window:win,x,y});});
 ipcMain.handle('bird:open-data',e=>{if(valid(e))return shell.openPath(path.join(root,'reports'));});
 const navigate=name=>win.webContents.send('bird:navigate',name);
 Menu.setApplicationMenu(Menu.buildFromTemplate([
 {label:'Single',submenu:[{label:'Image workspace',accelerator:'Ctrl+1',click:()=>navigate('workbench')},{label:'Import 1–4 related images…',accelerator:'Ctrl+O',click:()=>navigate('import')}]},
 {label:'Bulk',submenu:[{label:'One image per task',accelerator:'Ctrl+2',click:()=>navigate('bulk-individual')},{label:'One folder per task',click:()=>navigate('bulk-folders')}]},
 {label:'View',submenu:[{label:'Models',click:()=>navigate('models')},{label:'Evaluation',click:()=>navigate('benchmark')},{label:'Sources & method',click:()=>navigate('sources')},{type:'separator'},{role:'reload',label:'Refresh interface'},{role:'zoomIn'},{role:'zoomOut'},{role:'resetZoom'},{role:'togglefullscreen'}]},
 {label:'File',submenu:[{label:'Save window preview…',accelerator:'Ctrl+Shift+P',click:savePreview},{label:'Open reports folder',click:()=>shell.openPath(path.join(root,'reports'))},{type:'separator'},{role:'quit',label:'Exit Bird Eye'}]},
 {label:'Help',submenu:[{label:'Operating guide',click:()=>shell.openPath(path.join(root,'README.md'))},{label:'About Bird Eye',click:()=>dialog.showMessageBox(win,{type:'info',title:'Bird Eye',message:'Bird Eye 1.0.2',detail:'Satellite & infrared image interpretation.\nParham (Leon) Faraji · @leon-executes\nPolyForm Noncommercial 1.0.0\nEarthrise photograph: NASA / Apollo 8.\nModel, image and runtime licenses remain separate.'})}]}]));
 win.setMenuBarVisibility(false);
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 win.webContents.session.setPermissionCheckHandler(()=>false);
 const external=url=>{try{const u=new URL(url);if(u.protocol==='https:'||u.protocol==='http:'&&!['127.0.0.1','localhost'].includes(u.hostname))shell.openExternal(u.href);}catch{}};
 win.webContents.setWindowOpenHandler(({url})=>{external(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(origin+'/')){event.preventDefault();external(url);}});
 win.webContents.on('render-process-gone',(_e,details)=>dialog.showErrorBox('Bird Eye — display stopped',details.reason+'. Restart the app. Completed reports are saved.'));
 win.on('close',event=>{if(exiting)return;event.preventDefault();shutdown();});
 win.center();await win.loadURL(origin);win.show();
 child.on('exit',()=>{if(!exiting)dialog.showErrorBox('Bird Eye — engine stopped','Completed reports are saved. Restart the application to continue.');});
 // Explicit developer-only capture for documentation. No timer is installed in normal operation.
 if(process.env.BIRD_EYE_CAPTURE){setTimeout(async()=>{await win.webContents.executeJavaScript("document.fonts.ready");const img=await win.webContents.capturePage();fs.writeFileSync(process.env.BIRD_EYE_CAPTURE,img.toPNG());},6000);}
}
async function savePreview(){
 const {canceled,filePath}=await dialog.showSaveDialog(win,{title:'Save Bird Eye preview',defaultPath:path.join(root,'BirdEye-preview.png'),filters:[{name:'PNG image',extensions:['png']}]});if(canceled)return;
 await new Promise(resolve=>setTimeout(resolve,250));
 const b=win.getBounds(),scale=screen.getDisplayMatching(b).scaleFactor;
 const sources=await desktopCapturer.getSources({types:['window'],thumbnailSize:{width:Math.round(b.width*scale),height:Math.round(b.height*scale)}});
 const source=sources.find(s=>s.id===win.getMediaSourceId());
 if(!source||source.thumbnail.isEmpty())return dialog.showErrorBox('Preview unavailable','Could not capture this window.');
 fs.writeFileSync(filePath,source.thumbnail.toPNG());
}
async function shutdown(){
 if(exiting)return;exiting=true;
 try{await fetch(origin+'/api/shutdown',{method:'POST',headers:{'x-council-token':token,'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(3000)});}catch{}
 if(child&&child.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);setTimeout(()=>{child.kill();resolve();},3000);});
 win?.destroy();app.quit();
}
app.on('before-quit',e=>{if(!exiting&&win){e.preventDefault();shutdown();}});
app.on('window-all-closed',()=>{if(!exiting)shutdown();});

