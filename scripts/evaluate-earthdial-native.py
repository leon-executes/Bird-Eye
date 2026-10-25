"""Native EarthDial check with pinned official code in an isolated legacy API path.
This checks an available specialist before blaming or promoting its GGUF conversion.
"""
import os,sys,json,time,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];os.chdir(ROOT)
sys.path[:0]=[str(ROOT/'work/earthdial-compat'),str(ROOT/'work/earthdial-native')]
os.environ['HF_HOME']=str(ROOT/'work/hf-cache');os.environ['HF_HUB_OFFLINE']='1';os.environ['TOKENIZERS_PARALLELISM']='false'
import psutil
lock=ROOT/'work/benchmark.lock.json';training=ROOT/'work/training.lock.json'
def active(p):
 return p.exists() # Do not interpret permission-limited Windows PID enumeration as process death.
started=time.monotonic()
while active(lock) or active(training):
 if '--wait' not in sys.argv or time.monotonic()-started>1800:raise SystemExit('Other model compute active')
 time.sleep(5)
if lock.exists():lock.unlink()
token=str(uuid.uuid4())
with lock.open('x') as f:json.dump({'pid':os.getpid(),'token':token,'started':time.time(),'kind':'native-EarthDial-evaluation'},f)
try:
 if active(training):raise RuntimeError('Training started concurrently')
 import torch,numpy as np
 from PIL import Image
 from transformers import AutoTokenizer,BitsAndBytesConfig
 from earthdial.model.internvl_chat import InternVLChatModel,InternVLChatConfig
 torch.set_num_threads(8)
 base=ROOT/'models/earthdial-source';config=InternVLChatConfig.from_pretrained(base,local_files_only=True);config.vision_config.use_flash_attn=False;config.llm_config._attn_implementation='eager'
 tokenizer=AutoTokenizer.from_pretrained(base,local_files_only=True,trust_remote_code=False,use_fast=False)
 quant=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type='nf4',bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=torch.bfloat16,llm_int8_skip_modules=['vision_model','mlp1','lm_head'])
 model=InternVLChatModel.from_pretrained(base,config=config,quantization_config=quant,torch_dtype=torch.bfloat16,device_map={'':'cuda'},local_files_only=True,low_cpu_mem_usage=True).eval()
 ids=set(os.environ.get('COUNCIL_EVAL_IDS','nwpu-test-000,nwpu-test-004,nwpu-test-007,nwpu-test-020,nwpu-test-023,nwpu-test-029,nwpu-test-034,fresh-test-219,user-sheet-row-2,user-sheet-row-5,user-sheet-row-6,user-sheet-row-3').split(','))
 rows=[r for r in json.loads((ROOT/'work/specialist-eval-manifest.json').read_text()) if r['id'] in ids and r['modality']=='RGB'];out=ROOT/'work/earthdial-native-caption.json';results=json.loads(out.read_text()) if out.exists() else []
 for row in rows:
  if any(r['id']==row['id'] for r in results):continue
  image=Image.open(ROOT/row['image']).convert('RGB').resize((448,448),Image.Resampling.BICUBIC)
  pixels=torch.from_numpy(np.array(image).copy()).permute(2,0,1).float()/255
  pixels=(pixels-torch.tensor([.485,.456,.406])[:,None,None])/torch.tensor([.229,.224,.225])[:,None,None]
  pixels=pixels[None].to('cuda',dtype=torch.bfloat16);t=time.monotonic()
  with torch.inference_mode():caption=model.chat(tokenizer,pixels,'This is an aerial or satellite image of Earth. Describe the main scene, visible objects and their arrangement in two concise sentences. Do not infer activity, named locations or heat sources.',{'max_new_tokens':192,'do_sample':False,'num_beams':1},verbose=False)
  result={**row,'caption':caption,'seconds':round(time.monotonic()-t,3),'model':'EarthDial 4B RGB native NF4','checkpoint':'akshaydudhane/EarthDial_4B_RGB@ae752c478051e573d30fc6b8478d733f32d7d651','code_revision':'hiyamdebary/EarthDial@92c1260703ae8b3ddcac17fce6e8234de717308b','preprocessing':'Official single-view recipe: RGB bicubic 448x448, ImageNet normalization; eager attention, greedy generation, NF4 decoder; no VLM training','truncated':None}
  results.append(result);out.write_text(json.dumps(results,indent=2),encoding='utf-8');print(json.dumps({'id':row['id'],'caption':caption,'seconds':result['seconds']}),flush=True)
finally:
 if lock.exists() and json.loads(lock.read_text()).get('token')==token:lock.unlink()
