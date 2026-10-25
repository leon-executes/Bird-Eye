"""Resumable domain adaptation of a verified Qwen3-VL-family caption checkpoint.
One model on GPU, answer-only loss, modality-labelled inputs, held-out evaluation.
No adapter is activated by this script. Use local data with documented rights.
"""
import argparse,hashlib,json,math,os,random,time,importlib.metadata
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def digest(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  while b:=f.read(4*1024*1024):h.update(b)
 return h.hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(p,v):
 p=Path(p);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(v,indent=2),encoding='utf-8');tmp.replace(p)
def prompt(modality,domain=None):
 if modality=='TIR':return ('This is an aerial thermal infrared image.' if domain=='aerial-thermal' else 'This is a ground-camera thermal infrared image.' if domain=='ground' else 'This is a thermal infrared image.')+' Describe the visible scene, objects and their spatial relationships in one or two concise sentences. Do not infer temperature, activity or physical heat sources from intensity alone.'
 if modality in ['MISC','UNKNOWN']:return 'Describe what is in this image in one or two concise sentences. Identify the actual objects and their arrangement. Do not invent a landscape or sensor modality.'
 if modality=='SAR':return 'This is satellite radar imagery. Describe visible scene structure in one or two concise sentences. Do not interpret radar brightness as temperature.'
 if modality=='NIR':return 'This is near-infrared reflectance imagery. Describe visible landforms and objects in one or two concise sentences. It does not measure temperature.'
 return 'Describe this aerial or satellite image of Earth in one or two concise sentences. Identify the main scene, visible objects and their spatial relationships. Do not invent details.'
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--model',required=True);ap.add_argument('--train',required=True);ap.add_argument('--validation',required=True);ap.add_argument('--evaluation',required=True);ap.add_argument('--output',required=True);ap.add_argument('--resume');ap.add_argument('--examples',type=int,default=50000);ap.add_argument('--stop-after',type=int,default=0,help='Bound this invocation to N optimizer steps; resume later');ap.add_argument('--accumulation',type=int,default=8);ap.add_argument('--microbatch',type=int,default=2);ap.add_argument('--pixels',type=int,default=448*448);ap.add_argument('--lr',type=float,default=2e-5);ap.add_argument('--checkpoint-every',type=int,default=250);ap.add_argument('--eval-only',action='store_true');ap.add_argument('--smoke',action='store_true',help='One-step implementation/memory check, never a quality result');ap.add_argument('--allow-multiple-captions',action='store_true',help='Allow distinct human captions of a training image; report unique images separately');ap.add_argument('--profile-steps',type=int,default=0,help='1-32 optimizer steps without generation; resource profiling only');args=ap.parse_args()
 if args.profile_steps:
  if not 1<=args.profile_steps<=32:raise SystemExit('Profiling budget must be 1-32 steps')
  args.smoke=True
 if not 1<=args.examples<=100000 or not 1<=args.accumulation<=32 or not 1<=args.microbatch<=args.accumulation or not 65536<=args.pixels<=512*512:raise SystemExit('Invalid training budget')
 out=Path(args.output).resolve();source=Path(args.model).resolve()
 if not out.is_relative_to(ROOT/'models') or not source.is_relative_to(ROOT/'models'):raise SystemExit('Model paths must stay inside models/')
 if out.exists() and not args.resume and not args.eval_only:raise SystemExit('Use a new output directory or explicit checkpoint resume')
 if args.resume:
  resume_path=Path(args.resume).resolve()
  if not resume_path.is_relative_to(ROOT/'models') or not (resume_path/'run.json').is_file():raise SystemExit('Resume requires an existing local model checkpoint')
  args.resume=str(resume_path)
 if (args.resume or args.eval_only) and (out/'STOP').exists():(out/'STOP').unlink()
 out.mkdir(parents=True,exist_ok=True)
 write(ROOT/'work/training.lock.json',{**read(ROOT/'work/training.lock.json'),'output':str(out.relative_to(ROOT))})
 write(out/'status.json',{'phase':'loading'})
 train=read(args.train);validation=read(args.validation);evaluation=read(args.evaluation)
 if len(train)<128 or len(validation)<24:raise SystemExit('Insufficient train/validation examples')
 for label,rows in [('train',train),('validation',validation),('evaluation',evaluation)]:
  for row in rows:
   p=(ROOT/row['image']).resolve()
   if not p.is_relative_to(ROOT/'data') or digest(p)!=row['sha256']:raise SystemExit(label+' path/hash mismatch: '+row['id'])
 hashes={x['sha256'] for x in train}
 if len(hashes)!=len(train) and not args.allow_multiple_captions:raise SystemExit('Repeated training images require --allow-multiple-captions; pairs are not unique images')
 if len({(x['sha256'],' '.join(x['caption'].lower().split())) for x in train})!=len(train):raise SystemExit('Duplicate image/caption training pairs')
 if hashes & {x['sha256'] for x in validation+evaluation}:raise SystemExit('Train/held-out image overlap')
 if {x['sha256'] for x in validation}&{x['sha256'] for x in evaluation}:raise SystemExit('Validation/test image overlap')
 if args.examples>len(train):raise SystemExit('Requested examples exceed curated image/caption pairs; no silent repetition to inflate data count')
 if args.smoke:
  args.stop_after=args.profile_steps or 1;validation=[r for m in ['RGB','TIR'] for r in validation if r['modality']==m][:2]+[r for r in validation if r['modality']=='TIR'][:2];evaluation=[r for r in evaluation if r['modality']=='RGB'][:2]+[r for r in evaluation if r['modality']=='TIR'][:2]
 seed=20261025;random.Random(seed).shuffle(train);train=train[:args.examples]
 os.environ['HF_HUB_OFFLINE']='1';os.environ['TOKENIZERS_PARALLELISM']='false'
 import torch
 from PIL import Image
 from transformers import AutoProcessor,Qwen3VLForConditionalGeneration,BitsAndBytesConfig
 from peft import LoraConfig,get_peft_model,prepare_model_for_kbit_training,PeftModel
 torch.manual_seed(seed);torch.set_num_threads(8)
 if not torch.cuda.is_available() or torch.cuda.mem_get_info()[0]<6*2**30:raise SystemExit('Need CUDA and 6 GiB free VRAM; unload inference first')
 processor=AutoProcessor.from_pretrained(source,min_pixels=64*32*32,max_pixels=args.pixels,local_files_only=True)
 quant=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=torch.bfloat16,llm_int8_skip_modules=['visual','lm_head'])
 model=Qwen3VLForConditionalGeneration.from_pretrained(source,quantization_config=quant,device_map={'':'cuda'},torch_dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
 model=prepare_model_for_kbit_training(model,use_gradient_checkpointing=True,gradient_checkpointing_kwargs={'use_reentrant':False})
 for p in model.parameters():
  if p.dtype==torch.float32:p.data=p.data.to(torch.bfloat16)
 # Train low-rank language projections plus visual-to-language merger projections.
 # Encoder attention/MLP remain frozen, preserving speed and memory on 8 GiB.
 targets=[n for n,m in model.named_modules() if n.endswith(('.q_proj','.k_proj','.v_proj','.o_proj','.gate_proj','.up_proj','.down_proj')) and 'language_model' in n]
 targets += [n for n,m in model.named_modules() if ('visual.merger.' in n or 'visual.deepstack_merger_list.' in n) and n.endswith(('.linear_fc1','.linear_fc2'))]
 if not targets or not any('merger' in n for n in targets):raise RuntimeError('Unexpected model layout; refusing incomplete adapter target selection')
 if args.resume:model=PeftModel.from_pretrained(model,args.resume,is_trainable=not args.eval_only)
 else:model=get_peft_model(model,LoraConfig(r=8,lora_alpha=16,lora_dropout=0.05,target_modules=targets,bias='none',task_type='CAUSAL_LM'))
 model.config.use_cache=False;model.print_trainable_parameters();out.mkdir(parents=True,exist_ok=True)
 run={'trainer_sha256':digest(__file__),'packages':{x:importlib.metadata.version(x) for x in ['torch','transformers','peft','bitsandbytes']},'prompt_rgb':prompt('RGB'),'prompt_tir':prompt('TIR'),'prompt_tir_aerial':prompt('TIR','aerial-thermal'),'prompt_tir_ground':prompt('TIR','ground'),'base':str(source),'base_provenance':read(source/'provenance.json') if (source/'provenance.json').exists() else None,'train_manifest_sha256':digest(args.train),'validation_manifest_sha256':digest(args.validation),'evaluation_manifest_sha256':digest(args.evaluation),'allow_multiple_captions':args.allow_multiple_captions,'unique_images':len({x['sha256'] for x in train}),'examples':len(train),'max_pixels':args.pixels,'accumulation':args.accumulation,'microbatch':args.microbatch,'rank':8,'alpha':16,'lr':args.lr,'seed':seed,'target_modules':targets,'train_modalities':{m:sum(x['modality']==m for x in train) for m in ['RGB','TIR']},'profile_steps':args.profile_steps,'smoke':args.smoke,'promotion':'not-evaluated-not-active'}
 if args.resume:
  prior=read(Path(args.resume)/'run.json')
  for k in ['trainer_sha256','prompt_rgb','prompt_tir','smoke','base','train_manifest_sha256','validation_manifest_sha256','evaluation_manifest_sha256','allow_multiple_captions','examples','max_pixels','accumulation','microbatch','lr','seed']:
   if prior[k]!=run[k]:raise SystemExit('Resume configuration differs: '+k)
 write(out/'run.json',run)
 def inputs(row,answer=False):
  with Image.open(ROOT/row['image']) as im:image=im.convert('RGB')
  messages=[{'role':'user','content':[{'type':'image','image':image},{'type':'text','text':prompt(row['modality'],row.get('domain') or ('aerial-thermal' if row.get('source',{}).get('dataset')=='HIT-UAV' else None))}]}]
  prefix=processor.apply_chat_template(messages,tokenize=True,add_generation_prompt=True,return_dict=True,return_tensors='pt')
  if answer:
   full=processor.apply_chat_template(messages+[{'role':'assistant','content':[{'type':'text','text':row['caption']}]}],tokenize=True,add_generation_prompt=False,return_dict=True,return_tensors='pt');n=prefix['input_ids'].shape[1]
   if not torch.equal(prefix['input_ids'],full['input_ids'][:,:n]):raise RuntimeError('Answer mask mismatch')
   if full['input_ids'].shape[1]>1024:raise RuntimeError('Curated sample exceeds 1024 tokens: '+row['id'])
   full['labels']=full['input_ids'].clone();full['labels'][:,:n]=-100;prefix=full
  return {k:v.to('cuda',dtype=torch.bfloat16) if v.is_floating_point() else v.to('cuda') for k,v in prefix.items()}
 def training_batch(rows):
  samples=[inputs(r,True) for r in rows]
  if len(samples)==1:return samples[0]
  length=max(x['input_ids'].shape[1] for x in samples);result={}
  for key in samples[0]:
   if key in ['input_ids','attention_mask','labels']:
    value=processor.tokenizer.pad_token_id if key=='input_ids' else (-100 if key=='labels' else 0)
    result[key]=torch.cat([torch.nn.functional.pad(x[key],(0,length-x[key].shape[1]),value=value) for x in samples],dim=0)
   elif key in ['pixel_values','image_grid_thw']:result[key]=torch.cat([x[key] for x in samples],dim=0)
   else:raise RuntimeError('Unexpected multimodal batch field: '+key)
  return result
 @torch.inference_mode()
 def evaluate(stage):
  if args.profile_steps:return {}
  write(out/'status.json',{'phase':'evaluating-'+stage})
  def stop_evaluation():
   if (out/'STOP').exists():
    write(out/'status.json',{'phase':'paused','note':'Existing checkpoint retained; evaluation may be incomplete'})
    raise SystemExit('Paused during evaluation; existing checkpoint retained')
  model.eval();results=[];losses={}
  for row in validation[:64]:
   stop_evaluation()
   with torch.autocast('cuda',dtype=torch.bfloat16):loss=float(model(**inputs(row,True)).loss)
   losses.setdefault(row['modality'],[]).append(loss)
  for row in evaluation:
   stop_evaluation()
   batch=inputs(row);start=time.monotonic()
   with torch.autocast('cuda',dtype=torch.bfloat16):tokens=model.generate(**batch,max_new_tokens=192,do_sample=False,use_cache=True)
   generated=tokens[0,batch['input_ids'].shape[1]:];caption=processor.decode(generated,skip_special_tokens=True)
   results.append({'id':row['id'],'caption':caption,'sha256':row['sha256'],'modality':row['modality'],'seconds':round(time.monotonic()-start,2),'truncated':len(generated)>=192})
   write(out/('captions-'+stage+'.json'),results);print(json.dumps({'stage':stage,'id':row['id'],'caption':caption}),flush=True)
  score={m:sum(v)/len(v) for m,v in losses.items()};write(out/('validation-'+stage+'.json'),score);return score
 start_step=0;total=math.ceil(len(train)/args.accumulation);optimizer=torch.optim.AdamW([p for p in model.parameters() if p.requires_grad],lr=args.lr,weight_decay=.01)
 if args.resume and not args.eval_only:
  saved=torch.load(Path(args.resume)/'optimizer.pt',map_location='cpu',weights_only=True);optimizer.load_state_dict(saved['optimizer']);start_step=saved['step'];torch.set_rng_state(saved['rng']);torch.cuda.set_rng_state(saved['cuda_rng'])
 if args.eval_only:evaluate('evaluation');return
 if not args.resume:
  with model.disable_adapter():evaluate('base')
 write(out/'status.json',{'phase':'training'})
 started=time.monotonic();torch.cuda.reset_peak_memory_stats();model.train();end=min(total,start_step+args.stop_after) if args.stop_after else total
 for step in range(start_step,end):
  batch_rows=train[step*args.accumulation:(step+1)*args.accumulation];optimizer.zero_grad(set_to_none=True);loss_sum=0
  warmup=max(1,int(total*.05));factor=(step+1)/warmup if step<warmup else .5*(1+math.cos(math.pi*(step-warmup)/max(1,total-warmup)))
  for group in optimizer.param_groups:group['lr']=args.lr*factor
  for offset in range(0,len(batch_rows),args.microbatch):
   chunk=batch_rows[offset:offset+args.microbatch]
   with torch.autocast('cuda',dtype=torch.bfloat16):loss=model(**training_batch(chunk)).loss*len(chunk)/len(batch_rows)
   if not torch.isfinite(loss):raise RuntimeError('Non-finite loss; no promotion')
   loss.backward();loss_sum+=float(loss.detach())
  torch.nn.utils.clip_grad_norm_(model.parameters(),1);optimizer.step()
  progress={'step':step+1,'total_steps':total,'examples_seen':min((step+1)*args.accumulation,len(train)),'loss':loss_sum,'lr':optimizer.param_groups[0]['lr'],'seconds_this_invocation':round(time.monotonic()-started,1),'peak_reserved_mib':round(torch.cuda.max_memory_reserved()/2**20)}
  with (out/'training.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(progress)+'\n')
  if (step+1)%10==0:print(json.dumps(progress),flush=True)
  write(out/'progress.json',progress)
  if (step+1)%args.checkpoint_every==0 or step+1==end or (out/'STOP').exists():
   ckpt=out/f'checkpoint-{step+1:06d}';ckpt.mkdir(exist_ok=False);model.save_pretrained(ckpt);processor.save_pretrained(ckpt);write(ckpt/'run.json',run);torch.save({'optimizer':optimizer.state_dict(),'step':step+1,'rng':torch.get_rng_state(),'cuda_rng':torch.cuda.get_rng_state()},ckpt/'optimizer.pt');write(out/'latest.json',{'checkpoint':str(ckpt),'step':step+1,'complete':step+1==total})
   if (out/'STOP').exists():write(out/'status.json',{'phase':'paused','checkpoint':str(ckpt.relative_to(ROOT))});print('Stopped at requested safe checkpoint',flush=True);return
 evaluate('step-'+str(end));write(out/'result.json',{'status':'resource-profile-only' if args.profile_steps else 'candidate-not-promoted','steps':end,'complete':end==total,'examples_seen':min(end*args.accumulation,len(train)),'peak_reserved_mib':round(torch.cuda.max_memory_reserved()/2**20)});write(out/'status.json',{'phase':'candidate-awaiting-review','active':False})
if __name__=='__main__':
 import uuid
 lock=ROOT/'work/training.lock.json';lock.parent.mkdir(exist_ok=True)
 # Windows sandbox process enumeration can hide active workers. A lock file is
 # active until its owner removes it; PID lookup is not safe stale-lock evidence.
 def other_work():return (ROOT/'work/benchmark.lock.json').exists()
 if other_work():raise SystemExit('Model evaluation lock exists; training did not start')
 if lock.exists():raise SystemExit('Training lock exists; verify the previous worker before recovering a crash lock')
 token=str(uuid.uuid4())
 with lock.open('x') as f:json.dump({'pid':os.getpid(),'token':token,'started':time.time(),'kind':'domain-adaptation'},f)
 try:
  if other_work():raise SystemExit('Model evaluation started concurrently; training did not start')
  main()
 finally:
  if lock.exists() and read(lock).get('token')==token:lock.unlink()
