"""50,000 human-supervised image/caption pairs, with honest unique-image counts.
Extra NWPU references stay in the original training split; no new images are claimed.
"""
import json,random,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'data/domain-adaptation'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
rgb=read(D/'rgb-train.json');thermal=read(D/'hit-train.json');pairs=rgb+thermal;extra=[]
for row in rgb:
 for i,caption in enumerate(row.get('eligible_references',row['references'])):
  if caption==row['caption'] or not 8<=len(caption.split())<=70 or len(caption)>500:continue
  extra.append({**row,'id':row['id']+'-reference-'+str(i+1),'caption':caption})
random.Random(20261025).shuffle(extra);seen={(x['sha256'],' '.join(x['caption'].lower().split())) for x in pairs}
for row in extra:
 key=(row['sha256'],' '.join(row['caption'].lower().split()))
 if key in seen:continue
 pairs.append(row);seen.add(key)
 if len(pairs)==50000:break
if len(pairs)!=50000:raise RuntimeError('Not enough distinct human-supervised pairs; do not pad with repeated labels')
protected={x['sha256'] for name in ['pilot-validation.json','pilot-evaluation.json'] for x in read(D/name)}
assert not protected.intersection(x['sha256'] for x in pairs)
(D/'human-50k-pairs.json').write_text(json.dumps(pairs,indent=2),encoding='utf-8')
report={'pairs':len(pairs),'unique_images':len({x['sha256'] for x in pairs}),'modality_pairs':dict(collections.Counter(x['modality'] for x in pairs)),'modality_unique_images':{m:len({x['sha256'] for x in pairs if x['modality']==m}) for m in ['RGB','TIR']},'label_origin':'Original human NWPU captions plus deterministic descriptions of human HIT-UAV boxes; no VLM-generated captions.','limitations':['50,000 distinct image/caption pairs are NOT 50,000 unique images.','RGB-heavy: this pool alone does not establish broad IR caption competence.','Near-duplicate screening does not prove capture-sequence or geographic independence.','Dataset rights apply; do not redistribute corpus or infer weight-release permission.'],'training_status':'Prepared only; no full-run promotion before pilot evaluation.'}
(D/'human-50k-preparation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
