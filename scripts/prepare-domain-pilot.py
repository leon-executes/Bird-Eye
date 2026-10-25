"""Create a balanced human-labelled pilot; never inflate unique image counts."""
import json,random,collections
from pathlib import Path
from PIL import Image
from curation import sha,dhash,NearIndex
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'data/domain-adaptation'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(name,x):(D/name).write_text(json.dumps(x,indent=2),encoding='utf-8')
rng=random.Random(20261025);rgb=read(D/'rgb-train.json');hit=read(D/'hit-train.json');rng.shuffle(rgb);rng.shuffle(hit)
train=rgb[:1024]+hit[:1024];rng.shuffle(train);save('pilot-train.json',train)
rgbval=read(D/'rgb-validation.json');hitval=read(D/'hit-validation.json');validation=rgbval[:32]+hitval[:32];rng.shuffle(validation);save('pilot-validation.json',validation)
evaluation=[]
for r in read(ROOT/'data/specialist-eval/manifest.json')[:24]:
 p=ROOT/r['image'];r={**r,'caption':r['references'][0],'sha256':sha(p),'dhash':format(dhash(Image.open(p)),'016x'),'label_origin':'human captions; official test'};evaluation.append(r)
evaluation+=read(D/'hit-evaluation.json')[:20]
for r in read(ROOT/'work/specialist-eval-manifest.json'):
 if (r['id'].startswith('user-sheet-row-') or r['id'].startswith('irtd-audit-')) or r['id'] in ['control-misc','s1-003','landsat-000','s2-002']:
  path=ROOT/r['image'];evaluation.append({**r,'sha256':sha(path),'dhash':format(dhash(Image.open(path)),'016x'),'label_origin':'Unlabelled development regression; not a numerical accuracy target'})
save('pilot-evaluation.json',evaluation)
# Protect the pilot before any later training-corpus merge.
index=NearIndex()
for r in validation+evaluation:index.add(int(r['dhash'],16))
assert all(index.find(int(r['dhash'],16)) is None for r in train),'Perceptual train/eval overlap'
save('pilot-plan.json',{'train':len(train),'validation':len(validation),'evaluation':len(evaluation),'train_modalities':dict(collections.Counter(r['modality'] for r in train)),'pixels':448*448,'basis':'Human NWPU captions and captions derived from human HIT-UAV boxes. No generated thermal captions.','promotion':'Requires matched native-base/adapter semantic review; loss alone never qualifies.'})
print('Pilot prepared:',len(train),'train,',len(validation),'validation,',len(evaluation),'evaluation')
