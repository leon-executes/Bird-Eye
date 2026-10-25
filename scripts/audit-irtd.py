"""Audit early IR-TD labels. Flags are triage diagnostics, not error-rate estimates."""
import json,re,random,collections
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];base=ROOT/'data/corpora/irtd/extracted/Data4MLLM/IR-TD-version250724';rows=json.loads((base/'new_relative.json').read_text(encoding='utf-8'))
rules={'visible_color_attribution':r'\b(?:red|yellow|blue|green|pink|silver|brown|orange|purple)\s+(?:car|truck|sedan|SUV|motorcycle|sign|light|jacket|shirt|pants|object|stripes)\b','intent_or_identity':r'\b(?:military|paramilitary|training exercise|engaged in conversation|disciplined)\b','inferred_motion':r'(?:blur.{0,45}(?:motion|movement)|(?:motion|movement).{0,45}blur)','thermal_cause':r'\b(?:emissivity|heat source|hotter|colder|warmer|cooler)\b'}
counts=collections.Counter();samples=[]
for i,r in enumerate(rows):
 flags=[k for k,p in rules.items() if re.search(p,r['description'],re.I)]
 counts.update(flags)
 if flags:samples.append({'row':i,'image':r['image_path'],'flags':flags})
fixed=['055595.jpeg','049693.jpg','009446.jpg','047651.jpg','074885.jpg','000001.jpg'];review=[]
for name in fixed:
 r=next(r for r in rows if Path(r['image_path']).name==name)
 with Image.open(base/r['image_path']) as im:
  pixels=list(im.convert('RGB').resize((64,64)).getdata());chroma=max(max(p)-min(p) for p in pixels)
 review.append({'image':name,'maximum_sampled_channel_spread':chroma,'description':r['description'],'review':'Assistant visual inspection: grayscale thermal rendering; color, illumination, material, identity/activity or sign-text claims in these labels are not established by the visible pixels.'})
out={'source':'https://github.com/WheatCao/ICCV2025-IRGPT','release':'IR-TD-version250724 early release','image_caption_rows':len(rows),'regex_flags':dict(counts),'flagged_rows':len(samples),'metric_limit':'Regex flags are screening signals, not a measured caption error rate. Only the six fixed examples received visual review.','decision':'Do not use raw IR-TD captions as supervised truth. Retain imagery as a research/stress pool; no IR-TD labels enter the current human-supervised training manifests.','source_mapping':'Archive supplies image_path and description only; original source/capture split provenance is absent from these rows.','reviewed_examples':review}
(ROOT/'data/corpora/irtd/label-audit.json').write_text(json.dumps(out,indent=2),encoding='utf-8');print(json.dumps({k:v for k,v in out.items() if k!='reviewed_examples'},indent=2))
