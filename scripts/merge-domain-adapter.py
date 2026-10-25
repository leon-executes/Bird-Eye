"""Merge a locally reviewed PEFT candidate into its original unquantized base.
This creates a new export only. It never activates the adapter in the application.
"""
import argparse,json,hashlib,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def main():
 p=argparse.ArgumentParser();p.add_argument('--checkpoint',required=True);p.add_argument('--output',required=True);args=p.parse_args();checkpoint=Path(args.checkpoint).resolve();out=Path(args.output).resolve()
 if not checkpoint.is_relative_to(ROOT/'models') or not out.is_relative_to(ROOT/'models') or out.exists():raise SystemExit('Use an existing local checkpoint and a NEW model output directory')
 run=read(checkpoint/'run.json');base=Path(run['base']).resolve()
 if not base.is_relative_to(ROOT/'models'):raise SystemExit('Base must be a local model')
 if read(base/'config.json').get('quantization_config'):raise SystemExit('Export requires original bf16/fp16 weights, not a quantized base')
 import psutil
 if psutil.virtual_memory().available<12*2**30:raise SystemExit('Need 12 GiB free system RAM for a 4B CPU merge; close inference first')
 os.environ['HF_HUB_OFFLINE']='1'
 import torch
 from transformers import Qwen3VLForConditionalGeneration,AutoProcessor
 from peft import PeftModel
 torch.set_num_threads(8)
 model=Qwen3VLForConditionalGeneration.from_pretrained(base,torch_dtype=torch.bfloat16,device_map={'':'cpu'},low_cpu_mem_usage=True,local_files_only=True)
 model=PeftModel.from_pretrained(model,checkpoint).merge_and_unload(safe_merge=True)
 model.save_pretrained(out,max_shard_size='4GB');AutoProcessor.from_pretrained(base,local_files_only=True).save_pretrained(out)
 adapter=checkpoint/'adapter_model.safetensors';digest=hashlib.sha256(adapter.read_bytes()).hexdigest();(out/'adaptation-provenance.json').write_text(json.dumps({'checkpoint':str(checkpoint),'adapter_sha256':digest,'training':run,'status':'exported-candidate-not-active; GGUF parity and semantic validation still required'},indent=2),encoding='utf-8')
 print(out)
if __name__=='__main__':main()
