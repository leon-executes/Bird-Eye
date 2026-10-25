import pathlib,lzma,json,time
root=pathlib.Path(__file__).resolve().parents[1]/'work/compression'
rows=[]
for p in root.glob('*.sample'):
    data=p.read_bytes();t=time.perf_counter();out=lzma.compress(data,preset=6);enc=time.perf_counter()-t
    t=time.perf_counter();decoded=lzma.decompress(out);dec=time.perf_counter()-t
    assert decoded==data
    row=dict(file=p.name.removesuffix('.sample'),method='xz-6',input_bytes=len(data),bytes=len(out),ratio=len(out)/len(data),encode_seconds=enc,decode_seconds=dec,sha256_verified=True)
    rows.append(row);print(json.dumps(row),flush=True)
    (root/'xz-results.json').write_text(json.dumps(rows,indent=2))
