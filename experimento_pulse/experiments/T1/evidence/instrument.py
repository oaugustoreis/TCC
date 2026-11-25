import pathlib,json,time,datetime,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
def event(condition,kind,**kw):
 with (ROOT/'evidence/actions.jsonl').open('a') as f:f.write(json.dumps(dict(condition=condition,kind=kind,utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),epoch=time.time(),**kw))+'\n')
def write(condition,path,content):
 p=ROOT/condition/path;p.parent.mkdir(parents=True,exist_ok=True)
 old=p.read_text() if p.exists() else None
 event(condition,'edit' if old is not None else 'create',path=path,old=old,new=content)
 p.write_text(content)
