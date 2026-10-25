"""Bounded, optional Qwen3-VL caption adaptation. Not invoked by normal app launch.
Run only in an isolated CUDA/PEFT environment; existing models are never modified.
"""
import argparse, hashlib, json, os, random, time
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True, help='Local verified Qwen3-VL-4B HF checkpoint')
    parser.add_argument('--output', required=True, help='New adapter directory; must not exist')
    parser.add_argument('--steps', type=int, default=96)
    parser.add_argument('--eval-manifest', help='Held-out caption comparison manifest; images only reach generation')
    parser.add_argument('--smoke', action='store_true', help='One optimizer step; not a quality test')
    args = parser.parse_args()
    if not 1 <= args.steps <= 128:
        raise SystemExit('Pilot is bounded to 1–128 optimizer steps.')
    root = Path(__file__).resolve().parents[1]
    out = Path(args.output).resolve()
    if not out.is_relative_to(root) or out.exists():
        raise SystemExit('Output must be a NEW directory within this project.')
    source = Path(args.model).resolve()
    if not source.is_dir():
        raise SystemExit('Download and verify the local HF model first; no implicit model download.')
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TOKENIZERS_PARALLELISM'] = 'false'
    import torch
    from PIL import Image
    from transformers import AutoProcessor, Qwen3VLForConditionalGeneration
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    if not torch.cuda.is_available():
        raise SystemExit('A working CUDA environment is required for this optional training experiment.')
    free, total = torch.cuda.mem_get_info()
    if free < 6 * 2**30:
        raise SystemExit('Less than 6 GiB VRAM free. Unload inference models before training; no process was stopped.')
    train = json.loads((root/'data/adaptation/train.json').read_text())
    val = json.loads((root/'data/adaptation/validation.json').read_text())
    if len(train) < 128 or len(val) < 24:
        raise SystemExit('Insufficient separate train/validation data for this pilot.')
    train_hashes = {x['sha256'] for x in train}
    if train_hashes.intersection(x['sha256'] for x in val):
        raise SystemExit('Train/validation image leakage detected.')
    for row in train + val:
        image = (root/row['image']).resolve()
        if not image.is_relative_to(root/'data/adaptation') or hashlib.sha256(image.read_bytes()).hexdigest() != row['sha256']:
            raise SystemExit('Adaptation image path/hash check failed.')
    seed = 42
    random.seed(seed); torch.manual_seed(seed); torch.cuda.manual_seed_all(seed)
    processor = AutoProcessor.from_pretrained(source, local_files_only=True, min_pixels=64*32*32, max_pixels=256*32*32)
    model = Qwen3VLForConditionalGeneration.from_pretrained(source, local_files_only=True, device_map={'':0}, torch_dtype=torch.bfloat16, attn_implementation='sdpa')
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True, gradient_checkpointing_kwargs={'use_reentrant':False})
    # Frozen embeddings/vision do not require fp32 optimizer states. Keep norms fp32.
    for name, param in model.named_parameters():
        if not param.requires_grad and param.dtype == torch.float32 and ('visual.' in name or 'embed_tokens.' in name or 'lm_head.' in name):
            param.data = param.data.to(torch.bfloat16)
    lora = LoraConfig(r=8, lora_alpha=16, lora_dropout=0.05, target_modules=['q_proj','v_proj'], layers_to_transform=list(range(24,36)), bias='none', task_type='CAUSAL_LM')
    model = get_peft_model(model, lora)
    if any(p.requires_grad for n,p in model.named_parameters() if 'visual.' in n or 'merger.' in n):
        raise SystemExit('Vision/projector must stay frozen in this pilot.')
    model.config.use_cache = False
    model.print_trainable_parameters()
    prompt = 'Describe what is in this aerial or satellite image in one or two concise sentences. Identify the main scene, visible objects and spatial relationships. Do not invent details.'

    def batch(row):
        with Image.open(root/row['image']) as original:
            image = original.convert('RGB')
        messages = [{'role':'user','content':[{'type':'image','image':image},{'type':'text','text':prompt}]}]
        prefix = processor.apply_chat_template(messages, tokenize=True, add_generation_prompt=True, return_dict=True, return_tensors='pt')
        full = processor.apply_chat_template(messages + [{'role':'assistant','content':[{'type':'text','text':row['caption']}]}], tokenize=True, add_generation_prompt=False, return_dict=True, return_tensors='pt')
        n = prefix['input_ids'].shape[1]
        if not torch.equal(prefix['input_ids'], full['input_ids'][:,:n]):
            raise RuntimeError('Chat template prefix mismatch; cannot safely mask answer-only loss.')
        if full['input_ids'].shape[1] > 1024:
            raise RuntimeError('Example exceeds the pilot context budget; refusing silent truncation.')
        full['labels'] = full['input_ids'].clone(); full['labels'][:,:n] = -100
        if (full['labels'] != -100).sum() < 3:
            raise RuntimeError('No usable answer tokens.')
        return {k:v.to('cuda',dtype=torch.bfloat16) if v.is_floating_point() else v.to('cuda') for k,v in full.items()}

    @torch.no_grad()
    def validation_loss():
        model.eval(); losses=[]
        for row in val[:24]:
            with torch.autocast('cuda', dtype=torch.bfloat16):
                losses.append(float(model(**batch(row)).loss))
        return sum(losses)/len(losses)

    eval_rows = json.loads(Path(args.eval_manifest).read_text()) if args.eval_manifest else []
    if any(x['sha256'] in train_hashes or x['sha256'] in {v['sha256'] for v in val} for x in eval_rows):
        raise SystemExit('Evaluation overlaps training or validation.')
    for row in eval_rows:
        image = (root/row['image']).resolve()
        if not image.is_relative_to(root/'data') or hashlib.sha256(image.read_bytes()).hexdigest() != row['sha256']:
            raise SystemExit('Evaluation image path/hash mismatch.')

    @torch.no_grad()
    def captions(stage):
        model.eval(); result=[]
        for row in eval_rows:
            with Image.open(root/row['image']) as im:
                im = im.convert('RGB')
            modality = row.get('modality','UNKNOWN')
            task = prompt if modality == 'RGB' else 'Describe what is in this image in one or two concise sentences. Identify the visible objects and their spatial relationships. The declared modality is '+modality+'. Do not infer temperature from brightness or invent a setting.'
            messages = [{'role':'user','content':[{'type':'image','image':im},{'type':'text','text':task}]}]
            inputs = processor.apply_chat_template(messages,tokenize=True,add_generation_prompt=True,return_dict=True,return_tensors='pt')
            inputs = {k:v.to('cuda',dtype=torch.bfloat16) if v.is_floating_point() else v.to('cuda') for k,v in inputs.items()}
            with torch.autocast('cuda',dtype=torch.bfloat16):
                tokens = model.generate(**inputs,max_new_tokens=128,do_sample=False,use_cache=True)
            text = processor.decode(tokens[0,inputs['input_ids'].shape[1]:],skip_special_tokens=True)
            result.append({'id':row['id'],'caption':text,'modality':modality,'image_sha256':row['sha256'],'truncated':tokens.shape[1]-inputs['input_ids'].shape[1]>=128})
            (out/('captions-'+stage+'.json')).write_text(json.dumps(result,indent=2))
            print(json.dumps({'stage':stage,'id':row['id'],'caption':text}),flush=True)
        return result

    out.mkdir(parents=True)
    before = validation_loss()
    if eval_rows: captions('base')
    started = time.time(); steps = 1 if args.smoke else args.steps
    optimizer = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=2e-5, weight_decay=0.01)
    model.train(); random.shuffle(train); log=[]
    torch.cuda.reset_peak_memory_stats()
    for step in range(steps):
        optimizer.zero_grad(set_to_none=True); loss_sum=0
        for micro in range(4):
            row = train[(step*4+micro)%len(train)]
            with torch.autocast('cuda',dtype=torch.bfloat16):
                loss = model(**batch(row)).loss / 4
            if not torch.isfinite(loss):
                raise RuntimeError('Non-finite training loss; base model remains untouched.')
            loss.backward(); loss_sum += float(loss.detach())
        torch.nn.utils.clip_grad_norm_(model.parameters(),1.0); optimizer.step()
        record={'step':step+1,'loss':loss_sum,'elapsed_s':round(time.time()-started,1),'peak_vram_mib':round(torch.cuda.max_memory_allocated()/2**20)}
        log.append(record); print(json.dumps(record),flush=True)
        (out/'training-log.json').write_text(json.dumps(log,indent=2))
    after = validation_loss()
    model.save_pretrained(out); processor.save_pretrained(out)
    if eval_rows: captions('adapter')
    metadata={'status':'smoke-only' if args.smoke else 'candidate-not-promoted','base':str(source),'seed':seed,'steps':steps,'rank':8,'alpha':16,'target':'last 12 language attention q/v projections; frozen vision/projector','answer_only_loss':True,'train_images':len(train),'validation_images':len(val),'validation_loss_before':before,'validation_loss_after':after,'peak_allocated_mib':round(torch.cuda.max_memory_allocated()/2**20),'peak_reserved_mib':round(torch.cuda.max_memory_reserved()/2**20),'seconds':round(time.time()-started,1),'training_manifest_sha256':hashlib.sha256((root/'data/adaptation/train.json').read_bytes()).hexdigest(),'note':'Loss is diagnostic. Requires matched base/adapter captions on held-out images and control regressions before council use; RGB adaptation is not IR validation.'}
    (out/'experiment.json').write_text(json.dumps(metadata,indent=2)); print(json.dumps(metadata),flush=True)

if __name__ == '__main__':
    lock = Path(__file__).resolve().parents[1]/'work/training.lock.json'
    lock.parent.mkdir(exist_ok=True)
    with lock.open('x') as f:
        json.dump({'pid':os.getpid(),'started':time.time()},f)
    try:
        main()
    finally:
        lock.unlink(missing_ok=True)
