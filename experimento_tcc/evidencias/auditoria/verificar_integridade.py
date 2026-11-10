"""Verifica o selo do manifesto e os arquivos inventariados, sem escrever."""
import hashlib
import json
import pathlib
import subprocess
import sys

audit=pathlib.Path(__file__).resolve().parent
root=audit.parent.parent
sha256=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest_path=audit/'MANIFESTO_RASTREABILIDADE.json'
expected=(audit/'MANIFESTO_RASTREABILIDADE.sha256').read_text().split()[0]
errors=[]
if sha256(manifest_path)!=expected:errors.append('Selo SHA-256 do manifesto inválido')
manifest=json.loads(manifest_path.read_text())
for item in manifest['files']:
    p=root/item['path']
    if not p.is_file() or sha256(p)!=item['sha256']:errors.append(item['path'])
original=json.loads((audit/'INVENTARIO_ORIGINAL.json').read_text())
for path,digest in original['files'].items():
    p=root/path
    if not p.is_file() or sha256(p)!=digest:errors.append(path)
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
refs=subprocess.check_output(['git','show-ref'],cwd=root,text=True)
if head!=original['head']:errors.append('HEAD alterado')
if refs!=original['refs']:errors.append('Referências Git alteradas')
if manifest['consolidated_cell_divergences']:errors.append('Divergências nas células do consolidado')
if any(s['indicator_differences'] or not s['equivalence_reproduced'] for s in manifest['stages']):errors.append('Divergências nos indicadores ou equivalência funcional')
if any(not s['match'] for s in manifest['historical_E0_evidence']):errors.append('Evidência histórica E0 diverge da tag')
print(json.dumps(dict(integrity_passed=not errors,original_files_checked=len(original['files']),audit_files_checked=len(manifest['files']),consolidated_cells_checked=manifest['consolidated_numeric_cells'],errors=errors,audit_status=manifest['status'],documentary_pending=manifest['pending']),ensure_ascii=False,indent=2))
sys.exit(bool(errors))
