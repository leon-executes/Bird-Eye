"""Count-free targets and stronger caption screening after the first pilot failed.
No VLM labels; retain original human references and all image/split provenance.
"""
import json,re,random,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'data/domain-adaptation'
def read(name):return json.loads((D/name).read_text(encoding='utf-8-sig'))
def save(name,rows):(D/name).write_text(json.dumps(rows,indent=2),encoding='utf-8')
scene=re.compile(r'\b(airport|airfield|runway|airplane|basketball|tennis|baseball|stadium|track|beach|bridge|chaparral|shrub|church|commercial|industrial|desert|forest|woodland|freeway|highway|road|junction|intersection|golf|harbo[u]?r|port|ship|island|lake|reservoir|river|meadow|grassland|mobile home|trailer|mountain|hill|parking|palace|power|cooling tower|railway|railroad|residential|roundabout|terrace|farmland|field|farm|sea ice|ice floe|snow|wetland|marsh|coast|settlement|town|city|urban|houses|buildings)\w*\b',re.I)
banned=re.compile(r'\b(moving|driving|travelling|traveling|running|walking|waiting|working|busy|normal traffic|emitting smoke|military|north\w*|south\w*|east\w*|west\w*)\b|\bcolou?r of\b|\b(?:green|yellow|blue|brown|white|gray|grey|orange) area\b',re.I)
stop=set('the a an and of in on is are with some many there has have to it this that around beside by very which'.split())
def normalize(text):
 text=re.sub(r'\bnuclear power (?:station|plant)\b','power station',text,flags=re.I)
 text=re.sub(r'\s+([.,;:!?])',r'\1',text);text=re.sub(r'\s+',' ',text).strip();text=text[0].upper()+text[1:]
 return text if text.endswith(('.', '!', '?')) else text+'.'
def eligible(text):
 words=re.findall(r'[a-z]+',text.lower());counts=collections.Counter(w for w in words if w not in stop)
 return 10<=len(words)<=65 and scene.search(text) and not banned.search(text) and max(counts.values(),default=0)<3
def rgb_rows(rows):
 result=[]
 for row in rows:
  refs=list(dict.fromkeys(normalize(t) for t in row.get('eligible_references',row['references']) if eligible(t)))
  if not refs:continue
  refs.sort(key=lambda t:(-len(set(re.findall(r'[a-z]+',t.lower()))),-len(t)))
  result.append({**row,'caption':refs[0],'eligible_references':refs,'domain':'satellite','label_origin':'Original human caption; punctuation normalized; nuclear source claim generalized; semantic/activity/repetition screening'})
 return result
def thermal(row):
 counts=collections.Counter(o['class'] for o in row['objects']);plural={'person':'people','car':'cars','bicycle':'bicycles','other vehicle':'other vehicles'}
 names=[(('a vehicle' if c=='other vehicle' else 'a '+c) if n==1 else plural[c]) for c,n in sorted(counts.items())]
 # Keep class identity; precise counts are supplied by scoped detection evidence, not caption training.
 target='An aerial thermal view shows '+(', '.join(names[:-1])+' and '+names[-1] if len(names)>1 else names[0])+'.'
 layout=row['caption'].partition('. ')[2]
 if layout:target+=' '+layout.replace('; The','; the')
 return {**row,'caption':target,'domain':'aerial-thermal','label_origin':'Count-free description of human object classes and grid-relative positions; no authored background/activity/temperature labels'}
rgb=rgb_rows(read('rgb-train.json'));tir=[thermal(r) for r in read('hit-train.json')];pairs=rgb+tir
extras=[{**r,'id':r['id']+'-semantic-reference-'+str(i),'caption':t} for r in rgb for i,t in enumerate(r['eligible_references'][1:],1)]
random.Random(20261026).shuffle(extras);seen={(r['sha256'],r['caption'].lower()) for r in pairs}
for r in extras:
 key=(r['sha256'],r['caption'].lower())
 if key in seen:continue
 pairs.append(r);seen.add(key)
 if len(pairs)==50000:break
if len(pairs)<50000:raise RuntimeError('Only '+str(len(pairs))+' screened pairs; do not pad with invented/repeated captions')
validation=rgb_rows(read('rgb-validation.json'))[:32]+[thermal(r) for r in read('hit-validation.json')[:32]]
rng=random.Random(20261026);rng.shuffle(rgb);rng.shuffle(tir);pilot=rgb[:1024]+tir[:1024];rng.shuffle(pilot);rng.shuffle(validation)
protected={r['sha256'] for r in validation+read('pilot-evaluation.json')}
assert not protected.intersection(r['sha256'] for r in pairs)
assert not any(re.search(r'\b\d+\b',r['caption']) for r in tir)
save('semantic-v2-50k.json',pairs);save('semantic-v2-pilot.json',pilot);save('semantic-v2-validation.json',validation)
report={'pairs':len(pairs),'unique_images':len({r['sha256'] for r in pairs}),'modality_pairs':dict(collections.Counter(r['modality'] for r in pairs)),'rgb_images':len(rgb),'thermal_images':len(tir),'pilot':len(pilot),'validation':len(validation),'evaluation':'unchanged pilot-evaluation.json; 61 cases','changes':['Exact thermal counts removed from supervision after measured counting failure.','Visual encoder/mergers will remain frozen in the revised training recipe.','Human RGB captions require a scene/object noun, >=10 words, no repeated content word >=3 times, and no explicit motion/cardinal direction or color-only-area phrasing.','Punctuation normalized; nuclear power source claim generalized to power station.'],'limitations':['Rule-based screening is not a full human factual audit.','Alternate captions of a training image are pairs, not new images.','Aerial thermal training is not ground-camera or orbital validation.','No model promotion or quality claim from preparation.']}
save('semantic-v2-preparation.json',report);print(json.dumps(report,indent=2))
