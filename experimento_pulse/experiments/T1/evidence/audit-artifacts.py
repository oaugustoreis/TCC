import os,json,hashlib
from instrument import ROOT
E=ROOT/'evidence';baseline=json.loads((E/'B-generated-baseline.json').read_text())
allowed={'pulse/dist/main.js','pulse/generated-env.ts','pulse/virtual-registry.ts'}
changed=[p for p,d in baseline.items() if hashlib.sha256((ROOT/'modular-pulse'/p).read_bytes()).hexdigest()!=d['sha256']]
assert all(p.startswith('src/') or p in allowed for p in changed),changed
assert not any('pulse' in p.read_text().lower() for p in (ROOT/'modular-manual').rglob('*.js'))
(E/'core-integrity.json').write_text(json.dumps({'original_core_unchanged':True,'generated_changed_paths':changed,'build_regenerated_paths':sorted(allowed)},indent=2))
files=[]
for directory,folders,names in os.walk(ROOT):
 folders[:]=[d for d in folders if d not in ['node_modules','.git','__pycache__']]
 for name in names:
  p=__import__('pathlib').Path(directory)/name
  if p.name=='SHA256SUMS':continue
  files.append(p)
(E/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(ROOT))+'\n' for p in sorted(files)))
print('Core íntegro; arquivos com hashes:',len(files))
