import json,sys,pathlib
from instrument import ROOT,event
c=sys.argv[1];s=json.loads((ROOT/'evidence'/f'{c}-summary.json').read_text());m=s['metrics']
assert m['checks']['fails']==0 and m['checks']['passes']>0
assert m['http_req_failed']['value']==0
for name in ['checks','http_req_failed','http_req_duration']:
 assert not any(m[name]['thresholds'].values()),(name,m[name])
n=m['iterations']['count'];assert m['http_reqs']['count']==3*n
assert m['checks']['passes']==6*n
mark=json.loads((ROOT/'evidence'/f'{c}-trace-start.json').read_text())
rows=[json.loads(x) for x in (ROOT/'evidence/mock-requests.jsonl').read_text().splitlines()][mark:]
assert len(rows)==3*n
for i in range(0,len(rows),3):
 a,b,d=rows[i:i+3]
 assert [(r['method'],r['path'],r['status']) for r in (a,b,d)]==[('POST','/authentication',200),('GET','/products',200),('GET','/products/1',200)]
 assert b['authorization']==d['authorization']=='Bearer t1-token'
result=dict(condition=c,iterations=n,requests=3*n,checks=6*n,failed_checks=0,trace_rows=len(rows),validated=True)
(ROOT/'evidence'/f'{c}-validation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result));event(c,'validated',**{'result':result})
