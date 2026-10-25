// Bird Eye · Parham (Leon) Faraji · leon-executes
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('birdEye',Object.freeze({
 version:'1.0.2',pick:kind=>ipcRenderer.invoke('bird:pick',kind),read:id=>ipcRenderer.invoke('bird:read',id),quit:()=>ipcRenderer.invoke('bird:quit'),
 menu:(name,point)=>ipcRenderer.invoke('bird:menu',name,point),
 openData:()=>ipcRenderer.invoke('bird:open-data'),
 onNavigate:fn=>ipcRenderer.on('bird:navigate',(_event,name)=>fn(name))
}));

