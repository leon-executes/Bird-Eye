import json,io,tarfile,time,hashlib
from pathlib import Path,PurePosixPath
ROOT=Path.cwd();base=ROOT/'data/corpora/irtd';rows=json.loads((ROOT/'scripts/irtd-files.json').read_text());out=base/'extracted';out.mkdir(exist_ok=True)
class Parts(io.RawIOBase):
 def __init__(self,paths):self.paths=iter(paths);self.current=None
 def readable(self):return True
 def readinto(self,b):
  if self.current is None:
   try:
    source=next(self.paths)
    while not source.exists():time.sleep(5)
    self.current=open(source,'rb')
   except StopIteration:return 0
  n=self.current.readinto(b)
  if n:return n
  self.current.close();self.current=None;return self.readinto(b)
count=0;annotations=[]
with tarfile.open(fileobj=io.BufferedReader(Parts([base/r['name'] for r in rows])),mode='r|gz') as tar:
 for member in tar:
  rel=PurePosixPath(member.name)
  if rel.is_absolute() or '..' in rel.parts:raise RuntimeError('Unsafe archive path')
  if not member.isfile() or rel.suffix.lower() not in ['.jpg','.jpeg','.png','.json','.jsonl','.txt']:continue
  if member.size>300_000_000:raise RuntimeError('Unexpectedly large archive member')
  dest=out.joinpath(*rel.parts).resolve()
  if not dest.is_relative_to(out.resolve()):raise RuntimeError('Archive path escaped output')
  dest.parent.mkdir(parents=True,exist_ok=True)
  stream=tar.extractfile(member)
  if dest.exists() and dest.stat().st_size==member.size:stream.read();continue
  with dest.open('wb') as target:
   while block:=stream.read(1024*1024):target.write(block)
  count+=1
  if rel.suffix.lower() in ['.json','.jsonl','.txt']:annotations.append(str(dest));print('ANNOTATION',dest,member.size,flush=True)
  if count%5000==0:print('Extracted',count,flush=True)
(base/'extraction.json').write_text(json.dumps({'members':count,'annotations':annotations,'source':'IRGPT official early-access Drive','rights':'Academic research only; underlying source rights apply'},indent=2));print('IR ARCHIVE READY',count,annotations,flush=True)
