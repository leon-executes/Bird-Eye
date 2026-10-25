import sharp from 'sharp';
export function iou(a,b){const x=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0])),y=Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));const area=x*y;return area/Math.max(1e-9,(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-area);}
export function decodeDetections(data,dims,names,geometry,threshold=.35){
 if(dims.length!==3||dims[0]!==1||dims[1]!==4+Object.keys(names).length)throw Error('Unexpected thermal detector output shape');
 const n=dims[2],all=[],{scale,left,top,width,height}=geometry;
 for(let i=0;i<n;i++){let best=0,score=0;for(let c=0;c<Object.keys(names).length;c++){const p=data[(4+c)*n+i];if(p>score){score=p;best=c;}}if(score<threshold||/dont.?care/i.test(names[best]||''))continue;
 const cx=data[i],cy=data[n+i],w=data[2*n+i],h=data[3*n+i];const box=[Math.max(0,(cx-w/2-left)/scale),Math.max(0,(cy-h/2-top)/scale),Math.min(width,(cx+w/2-left)/scale),Math.min(height,(cy+h/2-top)/scale)];if(box[2]<=box[0]||box[3]<=box[1])continue;all.push({class_id:best,category:names[best],score:+score.toFixed(4),bbox_xyxy:box.map(x=>+x.toFixed(2))});}
 all.sort((a,b)=>b.score-a.score);const kept=[];for(const box of all){if(kept.some(k=>k.class_id===box.class_id&&iou(k.bbox_xyxy,box.bbox_xyxy)>.45))continue;kept.push(box);if(kept.length>=100)break;}return kept;
}
export async function input(file){const {data,info}=await sharp(file).rotate().removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});const size=640,scale=Math.min(size/info.width,size/info.height),w=Math.round(info.width*scale),h=Math.round(info.height*scale),left=Math.round((size-w)/2-.1),top=Math.round((size-h)/2-.1),values=new Float32Array(3*size*size);values.fill(114/255);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sy=Math.max(0,Math.min(info.height-1,(y+.5)*info.height/h-.5)),sx=Math.max(0,Math.min(info.width-1,(x+.5)*info.width/w-.5)),x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(x0+1,info.width-1),y1=Math.min(y0+1,info.height-1),fx=sx-x0,fy=sy-y0;for(let c=0;c<3;c++){const v=(1-fy)*((1-fx)*data[(y0*info.width+x0)*3+c]+fx*data[(y0*info.width+x1)*3+c])+fy*((1-fx)*data[(y1*info.width+x0)*3+c]+fx*data[(y1*info.width+x1)*3+c]);values[c*size*size+(y+top)*size+x+left]=Math.round(v)/255;}}
 return {values,geometry:{scale,left,top,width:info.width,height:info.height}};
}
