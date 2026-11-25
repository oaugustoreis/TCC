import json
from instrument import ROOT
E=ROOT/'evidence';s=json.loads((E/'native-summary.json').read_text());m=s['metrics']
assert m['iterations']['count']==10 and m['http_reqs']['count']==30
assert m['checks']['passes']==210 and m['checks']['fails']==0
assert m['http_req_failed']['value']==0
assert not any(v for name in ['checks','http_req_failed','http_req_duration'] for v in m[name]['thresholds'].values())
rows=[json.loads(l) for l in (E/'native-mock-requests.jsonl').read_text().splitlines()]
assert len(rows)==30
for i in range(0,30,3):
 a,b,c=rows[i:i+3]
 assert [(x['method'],x['path'],x['status']) for x in [a,b,c]]==[('POST','/authentication',200),('GET','/products',200),('GET','/products/1',200)]
 assert b['authorization']==c['authorization']=='Bearer t1-token'
assert (ROOT/'pulse-native-variant/summary.html').is_file()
(E/'native-validation.json').write_text(json.dumps({'validated':True,'iterations':10,'requests':30,'checks':210,'failed_checks':0,'same_journey':True,'strict_original_check_equivalence':False,'implementation_time_seconds':None,'reason':'Variante incremental com contexto/dependências reaproveitados; não é repetição independente.'},indent=2))
print('PASS: 10 iterações, 30 requests, 210 checks, sem falhas; trace, thresholds e HTML confirmados.')
