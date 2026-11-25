import subprocess,sys,json,time,datetime,pathlib
root=pathlib.Path(__file__).resolve().parent
label,cwd,cmd=sys.argv[1:4]
t=time.time(); start=datetime.datetime.now(datetime.timezone.utc).isoformat()
p=subprocess.run(cmd,shell=True,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
(root/(label+'.log')).write_text(p.stdout)
with (root/'commands.jsonl').open('a') as f: f.write(json.dumps(dict(label=label,cwd=cwd,command=cmd,start=start,seconds=time.time()-t,exit_code=p.returncode))+'\n')
print(p.stdout);sys.exit(p.returncode)
