"""Matched native base/adapter check on a separately frozen aerial thermal manifest.
Run after training exits. No references or human boxes are provided to the model.
"""
import argparse,json,hashlib,os,time,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def digest(p):
 h=hashlib.sha256()
 with Path(p).open('rb') as f:
  while b:=f.read(4*1024*1024):h.update(b)
 return h.hexdigest()
def write(p,value):
 p=Path(p);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(value,indent=2),encoding='utf-8');tmp.replace(p)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--checkpoint',required=True);ap.add_argument('--manifest',default='data/domain-adaptation/prospective-thermal-evaluation.json');ap.add_argument('--output',required=True);args=ap.parse_args()
 checkpoint=Path(args.checkpoint).resolve();manifest=Path(args.manifest).resolve();out=Path(args.output).resolve()
 if not checkpoint.is_relative_to(ROOT/'models') or not manifest.is_relative_to(ROOT/'data') or not out.is_relative_to(ROOT/'work'):raise SystemExit('Use local model/data paths and a work/ output directory')
 run=read(checkpoint/'run.json');base=Path(run['base']).resolve()
 if not base.is_relative_to(ROOT/'models'):raise SystemExit('Base must be local')
 rows=read(manifest)
 if any(r['modality']!='TIR' or r.get('domain')!='aerial-thermal' for r in rows):raise SystemExit('This evaluation is scoped to declared aerial thermal only')
 for r in rows:
  image=(ROOT/r['image']).resolve()
  if not image.is_relative_to(ROOT/'data') or digest(image)!=r['sha256']:raise SystemExit('Input path/hash mismatch')
 meta={'checkpoint':str(checkpoint),'adapter_sha256':digest(checkpoint/'adapter_model.safetensors'),'manifest_sha256':digest(manifest),'base':str(base),'pixels':run['max_pixels'],'prompt':run['prompt_tir_aerial'],'script_sha256':digest(__file__),'note':'Frozen prospective development subset, not population accuracy; references excluded from inference.'}
 if out.exists() and (out/'evaluation.json').exists() and read(out/'evaluation.json')!=meta:raise SystemExit('Output belongs to a different evaluation; use a new directory')
 out.mkdir(exist_ok=True);write(out/'evaluation.json',meta)
 os.environ['HF_HUB_OFFLINE']='1';os.environ['TOKENIZERS_PARALLELISM']='false'
 import torch
 from PIL import Image
 from transformers import Qwen3VLForConditionalGeneration,AutoProcessor,BitsAndBytesConfig
 from peft import PeftModel
 torch.set_num_threads(8)
 if not torch.cuda.is_available() or torch.cuda.mem_get_info()[0]<6*2**30:raise SystemExit('Need 6 GiB free CUDA memory; unload inference first')
 processor=AutoProcessor.from_pretrained(base,min_pixels=64*32*32,max_pixels=run['max_pixels'],local_files_only=True)
 quant=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=torch.bfloat16,llm_int8_skip_modules=['visual','lm_head'])
 model=Qwen3VLForConditionalGeneration.from_pretrained(base,quantization_config=quant,device_map={'':'cuda'},torch_dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
 model=PeftModel.from_pretrained(model,checkpoint).eval()
 def evaluate(stage):
  file=out/(stage+'.json');results=read(file) if file.exists() else []
  for row in rows:
   if any(r['id']==row['id'] for r in results):continue
   with Image.open(ROOT/row['image']) as im:image=im.convert('RGB')
   messages=[{'role':'user','content':[{'type':'image','image':image},{'type':'text','text':meta['prompt']}]}]
   batch=processor.apply_chat_template(messages,tokenize=True,add_generation_prompt=True,return_dict=True,return_tensors='pt')
   batch={k:v.to('cuda',dtype=torch.bfloat16) if v.is_floating_point() else v.to('cuda') for k,v in batch.items()};started=time.monotonic()
   with torch.inference_mode(),torch.autocast('cuda',dtype=torch.bfloat16):tokens=model.generate(**batch,max_new_tokens=192,do_sample=False,use_cache=True)
   generated=tokens[0,batch['input_ids'].shape[1]:];caption=processor.decode(generated,skip_special_tokens=True)
   results.append({'id':row['id'],'sha256':row['sha256'],'caption':caption,'seconds':round(time.monotonic()-started,2),'truncated':len(generated)>=192});write(file,results);print(json.dumps({'stage':stage,'id':row['id'],'caption':caption}),flush=True)
 with model.disable_adapter():evaluate('base')
 evaluate('adapter')
if __name__=='__main__':
 lock=ROOT/'work/benchmark.lock.json';training=ROOT/'work/training.lock.json'
 if lock.exists() or training.exists():raise SystemExit('Another compute lock exists; no evaluation started')
 token=str(uuid.uuid4())
 with lock.open('x') as f:json.dump({'pid':os.getpid(),'token':token,'started':time.time(),'kind':'prospective-adapter-evaluation'},f)
 try:
  if training.exists():raise SystemExit('Training started concurrently')
  main()
 finally:
  if lock.exists() and read(lock).get('token')==token:lock.unlink()
