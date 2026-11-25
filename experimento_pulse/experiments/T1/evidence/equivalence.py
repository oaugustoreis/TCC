import json,re
from instrument import ROOT
E=ROOT/'evidence'
a=json.loads((E/'modular-manual-summary.json').read_text());b=json.loads((E/'modular-pulse-summary.json').read_text())
assert a['root_group']['checks']==b['root_group']['checks']
for key in ['checks','http_req_failed','http_req_duration']:
 assert a['metrics'][key]['thresholds']==b['metrics'][key]['thresholds']
for name,path in [('A','modular-manual/profiles/smoke.js'),('B','modular-pulse/src/profiles/catalog/catalog.profiles.ts')]:
 text=(ROOT/path).read_text();assert "'constant-vus'" in text and re.search(r'vus:\s*1',text) and "'10s'" in text
for c in ['modular-manual','modular-pulse']:
 assert json.loads((E/f'{c}-validation.json').read_text())['validated']
print('PASS: mesmos seis checks (nomes, passes e fails); mesmos thresholds; perfil constant-vus/1/10s confirmado nos fontes; trace validado em ambas as condições.')
(E/'equivalence.json').write_text(json.dumps({'equivalent':True,'checks':list(a['root_group']['checks']),'profile':{'executor':'constant-vus','vus':1,'duration':'10s'},'thresholds':{k:a['metrics'][k]['thresholds'] for k in ['checks','http_req_failed','http_req_duration']}},indent=2))
