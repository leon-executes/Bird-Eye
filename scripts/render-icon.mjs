// Bird Eye · Parham (Leon) Faraji · leon-executes
import fs from 'node:fs';import sharp from 'sharp';import path from 'node:path';
const dir=path.resolve(import.meta.dirname,'../artwork'),svg=fs.readFileSync(path.join(dir,'bird-eye.svg'));
const sizes=[16,24,32,48,64,128,256],images=[];
for(const s of sizes)images.push(await sharp(svg,{density:384}).resize(s,s).png().toBuffer());
const header=Buffer.alloc(6+16*images.length);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);let offset=header.length;
images.forEach((b,i)=>{const p=6+i*16;header[p]=sizes[i]===256?0:sizes[i];header[p+1]=header[p];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(b.length,p+8);header.writeUInt32LE(offset,p+12);offset+=b.length;});
fs.writeFileSync(path.join(dir,'bird-eye.ico'),Buffer.concat([header,...images]));
await sharp(svg,{density:384}).resize(512,512).png().toFile(path.join(dir,'bird-eye.png'));
console.log('Transparent SVG/PNG and seven-size Windows ICO rendered.');

