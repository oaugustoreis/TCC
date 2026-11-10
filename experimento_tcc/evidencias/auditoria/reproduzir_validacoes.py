"""Executa somente os validadores já existentes nos commits experimentais."""
import json
import pathlib
import subprocess
import sys
import datetime

tools_dir = pathlib.Path(__file__).resolve().parent
audit = tools_dir
if '--dest' in sys.argv:
    i=sys.argv.index('--dest')
    audit=pathlib.Path(sys.argv[i+1]).resolve()
    del sys.argv[i:i+2]
audit.mkdir(parents=True,exist_ok=True)
if '--metricas' in sys.argv:
    refs=dict(E0='103a1e1ec5ceb05b15411b308b00f8f79fdc15a6',E1='452524a4963356e4ac0ae352ec99f681d3808eee',E2='bceabc33eb75c7387a99371ce60ead453fe5ecdd',E3='6c1ab09a2d0f51510bef8db7af43a69a5c822c88',E4='a84091f780bd745af4e22e6d787a9dd2124e7224',M1='4902526779b58c412bc3d876b9ba4b57540a11bc',M2='c8be840052438dfc115de71cf67b5cb30c2663c8',M3='4df995ace48e7969329b673a990420644718fb4d')
    for stage, ref in refs.items():
        git=lambda value: subprocess.check_output(['git','rev-parse',value],cwd=tools_dir,text=True).strip()
        sha=git(ref)
        base='-' if stage=='E0' else git(refs['E4'] if stage.startswith('M') else refs['E'+str(int(stage[1])-1)])
        cmd=['node',str(tools_dir/'recoletar.mjs'),stage,base,sha,'/tmp/tcc-auditoria-'+stage,str(audit/stage/'metricas')]
        subprocess.run(cmd,check=True)
        (audit/stage/'coleta.command.json').write_text(json.dumps({'command':cmd},indent=2)+'\n')
        print(stage,sha,flush=True)
    sys.exit(0)
for stage in sys.argv[1:] or ['E0','E1','E2','E3','E4','M1','M2','M3']:
    worktree = pathlib.Path('/tmp/tcc-auditoria-' + stage)
    dest = audit / stage / 'validacao-reexecucao'
    if dest.exists():
        raise RuntimeError('Destino já existe: ' + str(dest))
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = ['node',str(worktree/'scripts/validacao/validar.mjs'),'--state',stage,'--out',str(dest)]
    if stage != 'E0':
        cmd += ['--manifest',str(worktree/'evidencias/evolucao'/stage/'manifest-both.json')]
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    run = subprocess.run(cmd, cwd=worktree, text=True, capture_output=True)
    (dest.parent/'validacao.stdout.log').write_text(run.stdout)
    (dest.parent/'validacao.stderr.log').write_text(run.stderr)
    (dest.parent/'validacao.command.json').write_text(json.dumps(dict(command=cmd,cwd=str(worktree),started_at=started,exit_code=run.returncode),indent=2)+'\n')
    print(stage,run.returncode,run.stdout.splitlines()[-1:] or run.stderr[-300:],flush=True)
