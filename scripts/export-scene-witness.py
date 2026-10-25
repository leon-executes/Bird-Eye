"""Export a frozen RemoteCLIP scene-ranking witness; no training or caption synthesis."""
import hashlib,json,sys
from pathlib import Path
import torch,open_clip,onnx
root=Path(__file__).resolve().parents[1]
source=root/'models/RemoteCLIP-ViT-B-32.pt'
expected='60014e395d930a3f2963d1d89c8522bf4ad56775571e4356e866864789af85c4'
assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
model,_,preprocess=open_clip.create_model_and_transforms('ViT-B-32')
model.load_state_dict(torch.load(source,map_location='cpu',weights_only=True));model.eval()
for p in model.parameters():p.requires_grad=False
labels=json.loads((root/'app/scene-labels.json').read_text(encoding='utf-8-sig'))
templates=['a satellite image of {}.','an aerial photograph of {}.','a remote sensing image of {}.']
tokenizer=open_clip.get_tokenizer('ViT-B-32')
with torch.no_grad():
    embeddings=[]
    for label in labels:
        features=model.encode_text(tokenizer([t.format(label) for t in templates]),normalize=True).mean(0)
        features=features/features.norm();embeddings.append(features.tolist())
class ImageEncoder(torch.nn.Module):
    def __init__(self,m):super().__init__();self.m=m
    def forward(self,x):return self.m.encode_image(x,normalize=True)
torch.backends.mha.set_fastpath_enabled(False)
output=root/'models/remoteclip-scene.onnx'
if '--text-only' not in sys.argv:
    torch.onnx.export(ImageEncoder(model),torch.zeros(1,3,224,224),output,input_names=['image'],output_names=['embedding'],opset_version=17,dynamo=False)
graph=onnx.load(output);onnx.checker.check_model(graph)
sha=hashlib.sha256(output.read_bytes()).hexdigest();Path(str(output)+'.sha256').write_text(sha+'\n')
metadata={'vocabulary_sha256':hashlib.sha256(json.dumps(labels).encode()).hexdigest(),'sha256':sha,'source_sha256':expected,'architecture':'RemoteCLIP ViT-B-32','labels':labels,'templates':templates,'embeddings':embeddings,'mean':[.48145466,.4578275,.40821073],'std':[.26862954,.26130258,.27577711],'size':224,'preprocess':str(preprocess),'scope':'RGB remote sensing scene ranking. Cosine similarities are not probabilities. Vocabulary is incomplete. Center crop may omit peripheral content.','status':'candidate pending local validation'}
(root/'models/remoteclip-scene.json').write_text(json.dumps(metadata))
print('Exported',output.name,sha,flush=True)
