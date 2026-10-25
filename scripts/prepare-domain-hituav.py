"""Human-box-derived thermal labels: identities/counts/layout, not scene guesses."""
import json,collections,random
from pathlib import Path
from PIL import Image
from curation import sha,dhash,NearIndex
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'data/domain-adaptation';BASE=ROOT/'data/corpora/hituav'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(name,x):(OUT/name).write_text(json.dumps(x,indent=2),encoding='utf-8')
index=NearIndex();blocked=set();protected=read(OUT/'protected-hashes.json');excluded=collections.Counter();sets={}
for x in protected:index.add(int(x['dhash'],16));blocked.add(x['sha256'])
for split in ['test','val','train']:
 ann=read(BASE/(split+'.json'));byimage=collections.defaultdict(list)
 for a in ann['annotation']:
  if a['category_id']!=4:byimage[a['image_id']].append(a)
 rows=[]
 for im in ann['images']:
  p=BASE/split/im['filename'];digest=sha(p)
  with Image.open(p) as image:h=dhash(image)
  dupe=digest in blocked or index.find(h) is not None
  if split!='train':protected.append({'sha256':digest,'dhash':format(h,'016x'),'source':'HIT-UAV official '+split})
  index.add(h);blocked.add(digest)
  if dupe:excluded[split+'_near_or_exact_duplicate']+=1;continue
  boxes=byimage[im['id']];counts=collections.Counter(a['category_id'] for a in boxes)
  if not counts:excluded[split+'_no_named_objects']+=1;continue
  names={0:('person','people'),1:('car','cars'),2:('bicycle','bicycles'),3:('other vehicle','other vehicles')}
  parts=[str(n)+' '+names[c][int(n!=1)] for c,n in sorted(counts.items())]
  caption='An aerial thermal image contains '+', '.join(parts)+'.'
  layout=[]
  for c,n in sorted(counts.items()):
   locations=collections.Counter()
   for a in boxes:
    if a['category_id']!=c:continue
    x,y,w,ht=a['bbox'];cx=(x+w/2)/im['width'];cy=(y+ht/2)/im['height'];location=('upper' if cy<1/3 else 'lower' if cy>2/3 else 'middle')+' '+('left' if cx<1/3 else 'right' if cx>2/3 else 'center');locations[location]+=1
   loc,amount=locations.most_common(1)[0]
   if n==1:layout.append('The '+names[c][0]+' is in the '+loc)
   elif amount/n>=.67:layout.append('Most '+names[c][1]+' are in the '+loc)
  if layout:caption+=' '+ '; '.join(layout)+'.'
  rows.append({'id':'hit-'+split+'-'+str(im['id']),'image':p.relative_to(ROOT).as_posix(),'sha256':digest,'dhash':format(h,'016x'),'caption':caption,'references':[caption],'modality':'TIR','objects':[{'class':names[a['category_id']][0],'bbox':a['bbox']} for a in boxes],'source':{'dataset':'HIT-UAV','split':split,'original_id':im['filename'],'revision':'669259659b21a2737ca9f5e4bc81892acbe6ecd8'},'label_origin':'deterministic caption of human object annotations; no scene/activity/temperature labels'})
 random.Random(20261025).shuffle(rows);sets[split]=rows
 print(split,len(rows),dict(excluded),flush=True)
write('hit-train.json',sets['train']);write('hit-validation.json',sets['val'][:48]);write('hit-evaluation.json',sets['test'][:40]);write('protected-hashes-with-hit.json',protected)
write('hit-preparation.json',{'counts':{k:len(v) for k,v in sets.items()},'excluded':dict(excluded),'license':'CC-BY-4.0','source':'https://github.com/suojiashun/HIT-UAV-Infrared-Thermal-Dataset','limitations':['Captions derived from human boxes, not independently authored scene captions.','Official splits are preserved, but capture-sequence independence is not established.','Exact and dHash<=4 screening does not establish geospatial independence.']})
