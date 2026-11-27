import json,subprocess,os,sys,re
runs=json.load(open('/tmp/m/runs.json'))
K6='/tmp/k6dl/k6-v2.0.0-linux-amd64/k6'
out=[]
for r in runs:
    d=r['dir']; s=r['suite']
    p=subprocess.run(['diff','-ruN','/tmp/m/pristine/'+s,d+'/'+s],capture_output=True,text=True).stdout
    files=set(); add=rem=0
    for l in p.splitlines():
        if l.startswith('diff '): files.add(l.split()[-1])
        elif l.startswith('+') and not l.startswith('+++'): add+=1
        elif l.startswith('-') and not l.startswith('---'): rem+=1
    # integridade fora da suíte
    api=open(d+'/api/server.js').read()
    v=subprocess.run(['node','/tmp/m/base/scripts/validacao/validar-manutencao.mjs','--raiz',d,'--tarefa',r['tarefa'],'--suite',s,'--k6',K6,'--api-base','/tmp/m/base/api/server.js'],capture_output=True,text=True)
    try: j=json.loads(v.stdout.strip().splitlines()[-1])
    except Exception as e: j={'erro':v.stderr[-300:]}
    out.append({'run':os.path.basename(d),'tarefa':r['tarefa'],'suite':s,'rep':r['rep'],'arquivos':len(files),'linhas_add':add,'linhas_rem':rem,'churn':add+rem,'validacao':j})
    print(out[-1]['run'],out[-1]['arquivos'],add+rem,json.dumps(j)[:200],flush=True)
json.dump(out,open('/tmp/m/resultado.json','w'),indent=1,ensure_ascii=False)
