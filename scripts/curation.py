"""Shared image fingerprints. Perceptual screening is not a geographic split."""
import collections, hashlib
from PIL import Image

def sha(path):
 h=hashlib.sha256()
 with open(path,'rb') as f:
  while b:=f.read(4*1024*1024):h.update(b)
 return h.hexdigest()
def dhash(im):
 pixels=list(im.convert('L').resize((9,8),Image.Resampling.BILINEAR).getdata());h=0
 for y in range(8):
  for x in range(8):h=(h<<1)|int(pixels[y*9+x]>pixels[y*9+x+1])
 return h
class NearIndex:
 def __init__(self):self.buckets=collections.defaultdict(list);self.hashes=[]
 def find(self,h):
  candidates=set()
  for i in range(5):candidates.update(self.buckets[(i,(h>>(i*13))&8191)])
  return next((j for j in candidates if (self.hashes[j]^h).bit_count()<=4),None)
 def add(self,h):
  j=len(self.hashes);self.hashes.append(h)
  for i in range(5):self.buckets[(i,(h>>(i*13))&8191)].append(j)
