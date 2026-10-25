"""Reserve unused official aerial-thermal frames for a frozen-candidate check.
Labels are human object boxes, not full-scene caption truth. Never used for training.
"""
import json,random,collections
from pathlib import Path
from PIL import Image
from curation import sha,dhash,NearIndex
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'data/domain-adaptation';B=ROOT/'data/corpora/hituav'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
index=NearIndex();seen=set()
def protect(image,digest=None,h=None):
 p=ROOT/image
 if not p.exists():return
 digest=digest or sha(p)
 if digest in seen:return
 seen.add(digest)
 if h is None:
  with Image.open(p) as im:h=dhash(im)
 index.add(h)
for name in ['semantic-v2-50k.json','semantic-v2-validation.json','pilot-evaluation.json']:
 for r in read(D/name):protect(r['image'],r.get('sha256'),int(r['dhash'],16) if r.get('dhash') else None)
for name in ['work/specialist-eval-manifest.json','data/adaptation/pilot-evaluation.json']:
 for r in read(ROOT/name):protect(r['image'],r.get('sha256'))
for name in ['data/manifest.json','data/imports.json']:
 j=read(ROOT/name)
 for s in j if isinstance(j,list) else j['scenes']:
  for a in s['assets']:protect('data/'+a['path'],a.get('sha256'))
ann=read(B/'test.json');boxes=collections.defaultdict(list)
for a in ann['annotation']:boxes[a['image_id']].append(a)
items=list(ann['images']);random.Random(20261027).shuffle(items);groups=collections.defaultdict(list);names={0:'person',1:'car',2:'bicycle',3:'other vehicle'}
for item in items:
 p=B/'test'/item['filename'];digest=sha(p)
 with Image.open(p) as im:h=dhash(im)
 if digest in seen or index.find(h) is not None:continue
 labels=[a for a in boxes[item['id']] if a['category_id'] in names]
 # DontCare-only frames cannot support a clean negative claim.
 if not labels and boxes[item['id']]:continue
 categories={a['category_id'] for a in labels}
 group='no-target-boxes' if not labels else 'bicycle' if 2 in categories else 'mixed' if len(categories)>1 else 'person' if categories=={0} else 'vehicle'
 groups[group].append({'id':'prospective-hit-'+str(item['id']),'image':p.relative_to(ROOT).as_posix(),'sha256':digest,'dhash':format(h,'016x'),'modality':'TIR','domain':'aerial-thermal','objects':[{'class':names[a['category_id']],'bbox':a['bbox']} for a in labels],'references':[],'stratum':group,'source':{'dataset':'HIT-UAV','split':'test','original_id':item['filename'],'revision':'669259659b21a2737ca9f5e4bc81892acbe6ecd8'},'label_origin':'Human target boxes; empty annotations are a negative-object stress case, not proof that every possible object is absent.'})
chosen=[]
for group in ['no-target-boxes','bicycle','mixed','person','vehicle']:
 for r in groups[group]:
  if sum(x['stratum']==group for x in chosen)>=6:break
  h=int(r['dhash'],16)
  if index.find(h) is not None:continue
  chosen.append(r);index.add(h);seen.add(r['sha256'])
if len(chosen)<12:raise RuntimeError('Insufficient unused screened cases; do not weaken exclusion silently')
out=D/'prospective-thermal-evaluation.json'
if out.exists():raise SystemExit('Prospective manifest already exists; do not replace after inspecting candidate predictions')
out.write_text(json.dumps(chosen,indent=2),encoding='utf-8')
summary={'created':'2026-10-25','cases':len(chosen),'strata':dict(collections.Counter(r['stratum'] for r in chosen)),'selection':'Seed 20261027; at most six per available stratum; exact and dHash<=4 exclusion against revised full training pool, validation, prior evaluation and private imagery, and earlier selected frames. Prepared while revised pilot trained, before candidate predictions.','limits':['Development selection, not population-representative.','No full-scene human caption truth.','Capture-sequence/geographic independence not established.','Foundation pretraining overlap unknown.'],'promotion_gate':'Only evaluate for promotion if the original pilot comparison shows useful object identification without systematic inventions. Aerial-only deployment scope. No promotion from loss or word hits alone.'}
(D/'prospective-thermal-preparation.json').write_text(json.dumps(summary,indent=2),encoding='utf-8');print(json.dumps(summary,indent=2))
