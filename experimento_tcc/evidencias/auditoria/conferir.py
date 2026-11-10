"""Conferência somente leitura dos originais e dos commits; escreve apenas na auditoria.
Execute depois da coleta e das validações. Não invoca agentes de IA.
"""
import datetime
import hashlib
import io
import json
import pathlib
import re
import subprocess
import tarfile

A = pathlib.Path(__file__).resolve().parent
R = A.parent.parent
STAGES = ['E0','E1','E2','E3','E4','M1','M2','M3']
REFS = dict(zip(STAGES,['103a1e1ec5ceb05b15411b308b00f8f79fdc15a6','452524a4963356e4ac0ae352ec99f681d3808eee','bceabc33eb75c7387a99371ce60ead453fe5ecdd','6c1ab09a2d0f51510bef8db7af43a69a5c822c88','a84091f780bd745af4e22e6d787a9dd2124e7224','4902526779b58c412bc3d876b9ba4b57540a11bc','c8be840052438dfc115de71cf67b5cb30c2663c8','4df995ace48e7969329b673a990420644718fb4d']))
SUITES = ['tradicional','modular']
def git(*args):
    return subprocess.check_output(['git',*args],cwd=R).decode().strip()
def digest(data):
    return hashlib.sha256(data).hexdigest()
def read(p):
    return json.loads(pathlib.Path(p).read_text())
def write(name,obj):
    (A/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def archive_hashes(sha):
    raw=subprocess.check_output(['git','archive',sha],cwd=R)
    with tarfile.open(fileobj=io.BytesIO(raw)) as tf:
        return {m.name:digest(tf.extractfile(m).read()) for m in tf if m.isfile()}
def deepdiff(x,y,p=''):
    if type(x)!=type(y): return [dict(pointer=p,original=x,recalculado=y)]
    if isinstance(x,dict):
        return [d for k in sorted(x.keys()|y.keys()) for d in deepdiff(x.get(k),y.get(k),p+'/'+k)]
    if isinstance(x,list):
        if len(x)!=len(y): return [dict(pointer=p,original=x,recalculado=y)]
        return [d for i,(v,w) in enumerate(zip(x,y)) for d in deepdiff(v,w,p+'/'+str(i))]
    return [] if x==y else [dict(pointer=p,original=x,recalculado=y)]
def normalize(x):
    if isinstance(x,dict): return {k:normalize(v) for k,v in x.items() if k not in ['generated_at','target_ref','source_transcript','result_file']}
    if isinstance(x,list): return [normalize(v) for v in x]
    return x
def validation_totals(d):
    runs=d.get('runs') or [r for pair in d.get('pairs',[]) for r in pair['runs']]
    return {s:dict(runs=sum(r['suite']==s for r in runs),requests=sum(r['received_requests'] for r in runs if r['suite']==s),checks=sum(r['observed_checks'] for r in runs if r['suite']==s),passed_checks=sum(r['passed_checks'] for r in runs if r['suite']==s),all_success=all(r['real_success'] for r in runs if r['suite']==s)) for s in SUITES}

original=read(A/'INVENTARIO_ORIGINAL.json')
preserved=[p for p,h in original['files'].items() if not (R/p).is_file() or digest((R/p).read_bytes())!=h]
sha={s:git('rev-parse',ref) for s,ref in REFS.items()}
historical_sha=git('rev-parse','e0-baseline-validada^{commit}')
historical=archive_hashes(historical_sha)
baseline_path='evidencias/validacao_final/2026-11-05T17-07-25-732Z'
histroot=A/'historico_E0'/baseline_path
records=[]
recalculated={}
original_metrics={}
for s in STAGES:
    final=sha[s]
    base=None if s=='E0' else sha['E4'] if s.startswith('M') else sha['E'+str(int(s[1])-1)]
    tracked=archive_hashes(final)
    wt=pathlib.Path('/tmp/tcc-auditoria-'+s)
    new=read(A/s/'metricas/metricas.json'); old=read(R/'evidencias/metricas'/s/'metricas.json')
    recalculated[s]=new;original_metrics[s]=old
    differences=deepdiff(old,new)
    numeric_diff=deepdiff(normalize(old),normalize(new))
    ev='evidencias/evolucao/'+s
    vp=histroot if s=='E0' else R/ev/'validacao_both'
    before=read(vp/'source-manifest-before.json');after=read(vp/'source-manifest-after.json')
    manifest_comparison=[dict(path=p,registered=h,commit_sha256=tracked.get(p),match=h==tracked.get(p)) for p,h in before.items()]
    validation=read(vp/'result.json');rerun=read(A/s/'validacao-reexecucao/result.json')
    inventories=[]
    attempts=[]
    transcript_links=[]
    if s!='E0':
        for suite in SUITES:
            tp=f'{ev}/transcripts/{suite}.transcript.jsonl'
            steps=[json.loads(line) for line in (R/tp).read_text().splitlines() if line.strip()]
            tools=[t for st in steps for t in st.get('tool_calls',[])]
            writes=[]
            reads=[]
            for t in tools:
                args=t.get('args',{})
                if isinstance(args,str):
                    try: args=json.loads(args)
                    except json.JSONDecodeError: args={}
                p=args.get('Path',args.get('path',''))
                if len(p)>1 and p.startswith('"') and p.endswith('"'):
                    try:p=json.loads(p)
                    except json.JSONDecodeError:p=p.strip('"')
                if p.startswith('/mnt/d/TCC/'):p=p[len('/mnt/d/TCC/'):]
                if t.get('name') in ['write_file','edit_file']: writes.append(p)
                if t.get('name') in ['read_file','view_file']: reads.append(p)
            touched=[d['path'] for d in new[suite]['git_delta']['files_detail']]
            readonly='Use **APENAS** a ferramenta `read_file`' in steps[0].get('content','')
            transcript_links.append(dict(suite=suite,path=tp,sha256=digest((R/tp).read_bytes()),matches_commit=digest((R/tp).read_bytes())==tracked.get(tp),recorded_write_paths=writes,commit_touched_paths=touched,changed_files_without_recorded_write=sorted(set(touched)-set(writes)),writes_outside_own_suite=[p for p in writes if not p.startswith(suite+'/')],reads_of_other_suite=[p for p in reads if p.startswith(('modular/' if suite=='tradicional' else 'tradicional/'))],readonly_prompt_and_recorded_writes=readonly and bool(writes),step_indices=[st.get('step_index') for st in steps],content_provenance_limit='Contagem e caminhos verificáveis; registros compactados podem omitir conteúdo de leitura, patches e saídas. Não comprova autenticidade externa do runtime.'))
            for result in sorted((R/ev/('tentativas_'+suite)).glob('*/result.json')):
                folder=result.parent;d=read(result)
                mb=read(folder/'source-manifest-before.json') if (folder/'source-manifest-before.json').exists() else {}
                ma=read(folder/'source-manifest-after.json') if (folder/'source-manifest-after.json').exists() else {}
                own={p:h for p,h in ma.items() if p.startswith(suite+'/')}
                mismatch=[p for p,h in own.items() if tracked.get(p)!=h]
                attempts.append(dict(suite=suite,path=str(result.relative_to(R)),sha256=digest(result.read_bytes()),preflight_passed=d.get('preflight_passed'),validation_passed=d.get('validation_passed'),source_manifest_before_available=bool(mb),source_manifest_after_available=bool(ma),source_unchanged_during_validation=mb==ma if mb and ma else None,own_suite_final_mismatches=mismatch,explanation='Tentativa intermediária antes da correção final.' if mismatch and not d.get('validation_passed') else 'Manifesto pós-execução ausente; consultar result.json para falha de preflight.' if not ma else None,totals=validation_totals(d)))
    relevant=[]
    for p,h in tracked.items():
        if p.startswith(('tradicional/','modular/','api/','shared/','scripts/metricas/','scripts/validacao/',f'evidencias/metricas/{s}/',ev+'/')):
            actual=R/p
            relevant.append(dict(path=p,sha256_in_commit=h,workspace_sha256=original['files'].get(p) or (digest(actual.read_bytes()) if actual.is_file() else None)))
    gitinfo=dict(final_sha=final,base_sha=base,parents=git('show','-s','--format=%P',final).split(),worktree=str(wt),worktree_head=git('-C',str(wt),'rev-parse','HEAD'),worktree_status=git('-C',str(wt),'status','--porcelain'),tree=git('rev-parse',final+'^{tree}'),base_is_ancestor=None if base is None else subprocess.run(['git','merge-base','--is-ancestor',base,final],cwd=R).returncode==0)
    (A/s/'FONTES_COMMIT.json').write_text(json.dumps(relevant,ensure_ascii=False,indent=2)+'\n')
    record=dict(stage=s,git=gitinfo,original_metrics_path=f'evidencias/metricas/{s}/metricas.json',recalculated_metrics_path=f'evidencias/auditoria/{s}/metricas/metricas.json',raw_differences=differences,indicator_differences=numeric_diff,validation_original_path=str((vp/'result.json').relative_to(R)),validation_manifest_unchanged=before==after,validation_manifest_commit_comparison=manifest_comparison,original_totals=validation_totals(validation),reproduced_totals=validation_totals(rerun),validation_reproduced_pass=rerun.get('validation_passed'),equivalence_reproduced=rerun.get('complete_functional_equivalence'),attempts=attempts,transcripts=transcript_links,source_inventory_path=f'evidencias/auditoria/{s}/FONTES_COMMIT.json')
    if s!='E0':
        order=['modular','tradicional'] if s in ['E2','E4','M2'] else SUITES
        first,last=[new[k]['agent']['transcript'] for k in order]
        record['paired_execution_order']=dict(expected=order,first_start=first['first_step_at'],first_end=first['last_step_at'],second_start=last['first_step_at'],second_end=last['last_step_at'],sequential_order_confirmed=first['last_step_at']<=last['first_step_at'])
    record['measurement_reproduced_without_indicator_divergences']=not numeric_diff and bool(rerun.get('validation_passed'))
    records.append(record)
    print('Conferido',s,flush=True)
write('COMPARACAO_INDICADORES.json',records)

# Livro de origem: uma entrada para cada célula numérica das tabelas 2.1–3.2.
report=(R/'docs/RELATORIO_EXPERIMENTAL_COMPLETO.md').read_text()
ledger=[]
section=None
def pointer_value(s,suite,p):
    v=recalculated[s][suite]
    for k in p.split('/'):v=v[k]
    return dict(path=f'evidencias/auditoria/{s}/metricas/metricas.json',pointer='/'+suite+'/'+p,value=v)
def sources(stages,suite,p):return [pointer_value(s,suite,p) for s in stages]
struct=['files_count','physical_lines','logical_lines','duplication/total_tokens','duplication/clones_count','duplication/duplication_tokens_pct','duplication/duplication_lines_pct','static_suite_imports/internal_imports_total','static_suite_imports/distinct_internal_components_imported']
delta=['git_delta/files_added','git_delta/files_modified','git_delta/files_touched_total','git_delta/lines_added','git_delta/lines_removed','git_delta/net_diff_lines','batch_reuse/batch_reused_unmodified_count','batch_reuse/batch_reused_modified_count','batch_reuse/batch_created_shared_count']
effort=['first_validation_pass','functional_validation_cycles','files_read','files_written','commands_run','tool_calls_total','llm_input_tokens','llm_cache_read_tokens','llm_output_tokens','llm_total_tokens','duration_seconds']
def numeric(text):
    text=text.replace('**','').replace('`','').strip()
    if text=='Sim':return True
    if text=='Não':return False
    if text=='—':return None
    if re.fullmatch(r'-?[\d.,]+%?',text):return float(text.rstrip('%').replace('.','').replace(',','.'))
    return text
def cell(line,col,presented,origins,formula='identidade',expected=None):
    if expected is None:
        vals=[o['value'] for o in origins]
        expected=vals[0] if formula=='identidade' else sum(vals)
    actual=numeric(presented)
    equal=actual==expected if not isinstance(expected,float) else isinstance(actual,(float,int)) and abs(actual-expected)<0.011
    ledger.append(dict(report='docs/RELATORIO_EXPERIMENTAL_COMPLETO.md',line=line,column=col,presented=presented,expected=expected,formula=formula,sources=origins,match=equal))
for lineno,line in enumerate(report.splitlines(),1):
    match=re.match(r'### (2\.[123]|3\.[12])\b',line)
    if match:section=match.group(1)
    if not line.startswith('| **'):continue
    cells=[c.strip() for c in line.strip('|').split('|')]
    label=cells[0].replace('**','').replace('`','')
    if section=='2.1' and label in STAGES:
        for col,p in enumerate(struct,1):
            values=cells[col].split(' / ')
            for suite,part in zip(SUITES,values):cell(lineno,col,part,sources([label],suite,p))
    elif section in ['2.2','2.3','3.1','3.2'] and (label[:2] in STAGES or label.startswith('Soma Fase')):
        suite='tradicional' if 'Tradicional' in cells[1] else 'modular'
        stages=STAGES[1:5] if label.startswith('Soma Fase 1') else STAGES[5:] if label.startswith('Soma Fase 2') else [label[:2]]
        summed=len(stages)>1
        if section=='2.2':
            for col,p in enumerate(delta,2):cell(lineno,col,cells[col],sources(stages,suite,p),'soma' if summed else 'identidade')
        elif section in ['2.3','3.2']:
            keys=effort if section=='2.3' else [p for p in effort if p!='commands_run']
            for col,k in enumerate(keys,2):
                origin=sources(stages,suite,'agent/summary/'+k)
                if summed and k=='first_validation_pass':
                    n=sum(o['value'] for o in origin); expected=f'{n}/{len(stages)} ({100*n/len(stages):g}%)'
                    cell(lineno,col,cells[col],origin,'aprovações/n e percentual',expected)
                else:cell(lineno,col,cells[col],origin,'soma' if summed else 'identidade')
        else:
            mapping={2:'git_delta/files_added',3:'git_delta/files_modified',4:'git_delta/files_touched_total',6:'git_delta/lines_added',7:'git_delta/lines_removed',8:'git_delta/net_diff_lines',9:'batch_reuse/batch_reused_unmodified_count',10:'duplication/duplication_tokens_pct',11:'duplication/duplication_lines_pct'}
            for col,p in mapping.items():
                origin=sources(stages,suite,p)
                if col in [10,11] and summed:
                    cell(lineno,col,cells[col].split(' (')[0],origin,'média aritmética dos percentuais',round(sum(o['value'] for o in origin)/len(origin),2))
                else:cell(lineno,col,cells[col],origin,'soma' if summed else 'identidade')
            if suite=='modular':
                t=sources(stages,'tradicional','git_delta/files_touched_total');m=sources(stages,'modular','git_delta/files_touched_total')
                tv=sum(o['value'] for o in t);mv=sum(o['value'] for o in m)
                cell(lineno,5,cells[5].split(' (')[0],t+m,'100*(Mod/Trad-1)',round(100*(mv/tv-1),1))
write('ORIGEM_CELULAS_CONSOLIDADO.json',ledger)

# Verifica a tabela 1 diretamente contra os resultados funcionais e a árvore Git.
functional=[]
for r in records:
    s=r['stage'];d=r['original_totals']['tradicional'];functional.append(dict(stage=s,scenarios_per_suite=d['runs'],requests_per_suite=d['requests'],checks_per_suite=d['checks'],sources=[r['validation_original_path'],f'evidencias/auditoria/{s}/validacao-reexecucao/result.json'],totals_match=r['original_totals']==r['reproduced_totals']))
write('ORIGEM_VALIDACAO_CONSOLIDADO.json',functional)

# Derivações narrativas e seção 4 (fórmulas explícitas, sem nova medição).
derived=[]
def derive(name,origins,formula,value):derived.append(dict(indicator=name,sources=origins,formula=formula,value=value))
for phase,stages in [('fase1',STAGES[1:5]),('fase2',STAGES[5:])]:
    for suite in SUITES:
        for p in delta+[f'agent/summary/{k}' for k in effort]:
            o=sources(stages,suite,p);derive(phase+'/'+suite+'/'+p,o,'soma entre unidades; booleanos contam aprovações',sum(v['value'] for v in o))
for s in ['E0','E4']:
    t=pointer_value(s,'tradicional','duplication/total_tokens');m=pointer_value(s,'modular','duplication/total_tokens')
    derive(s+'/razao_tokens',[t,m],'Mod/Trad',m['value']/t['value']);derive(s+'/overhead_pct',[t,m],'100*(Mod/Trad-1)',100*(m['value']/t['value']-1))
for suite in SUITES:
    o=sources(['E0','E4'],suite,'duplication/total_tokens');derive(suite+'/crescimento_tokens',o,'E4/E0',o[1]['value']/o[0]['value'])
for p in ['duplication_tokens_pct','duplication_lines_pct']:
    t=pointer_value('E4','tradicional','duplication/'+p);m=pointer_value('E4','modular','duplication/'+p);derive('E4/reducao_'+p,[t,m],'Trad-Mod (pontos percentuais)',t['value']-m['value'])
for p in ['git_delta/files_touched_total','git_delta/net_diff_lines','agent/summary/files_written']:
    t=sources(STAGES[5:],'tradicional',p);m=sources(STAGES[5:],'modular',p);derive('fase2/reducao/'+p,t+m,'100*(1-soma(Mod)/soma(Trad))',100*(1-sum(v['value'] for v in m)/sum(v['value'] for v in t)))
for s in ['M1','M3']:
    t=pointer_value(s,'tradicional','agent/summary/llm_output_tokens');m=pointer_value(s,'modular','agent/summary/llm_output_tokens');derive(s+'/reducao_output_tokens',[t,m],'100*(1-Mod/Trad)',100*(1-m['value']/t['value']))
write('INDICADORES_DERIVADOS.json',derived)

json_errors=[]
for p in original['files']:
    if p.endswith('.json'):
        try:read(R/p)
        except (ValueError,OSError) as e:json_errors.append(dict(path=p,error=str(e)))
e0tracked=archive_hashes(sha['E0'])
baseline_comparison=[dict(path=p,historical_sha256=h,consolidated_E0_sha256=e0tracked.get(p),match=h==e0tracked.get(p)) for p,h in historical.items() if p.startswith(('tradicional/','modular/'))]
pending=[dict(stages=['E1'],issue='Transcrição modular registra operações de escrita sem caminhos; associação arquivo/ação não demonstrável integralmente.'),dict(stages=['M1','M2','M3'],issue='Intervalos das transcrições se sobrepõem; sequência estrita prevista no protocolo não comprovada.'),dict(stages=['M1-T','M2-T','M2-M','M3-T','M3-M'],issue='Prompt inicial restringe a read_file, mas transcrição registra edit_file; requer logs primários integrais para resolver a contradição.'),dict(stages=STAGES[1:],issue='Logs locais permitem recalcular contagens; não há prova externa de completude/autenticidade do runtime ou de aplicação integral dos patches.')]
historical_evidence=[dict(path=f'evidencias/auditoria/historico_E0/{p}',commit_sha=historical_sha,original_path=p,sha256_in_commit=h,match=digest((A/'historico_E0'/p).read_bytes())==h) for p,h in historical.items() if p.startswith(baseline_path+'/')]
manifest=dict(schema_version=1,generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),status='REPRODUCAO_TECNICA_CONFORME_AUDITORIA_INTEGRAL_PENDENTE',pending=pending,repository_head=original['head'],repository_head_after=git('rev-parse','HEAD'),refs_preserved=original['refs']==subprocess.check_output(['git','show-ref'],cwd=R,text=True),original_inventory='evidencias/auditoria/INVENTARIO_ORIGINAL.json',original_files_count=len(original['files']),original_files_changed=preserved,original_json_parse_errors=json_errors,historical_E0_sha=historical_sha,historical_E0_evidence=historical_evidence,consolidated_E0_sha=sha['E0'],historical_E0_suite_comparison=baseline_comparison,common_E4_sha=sha['E4'],maintenance_merge_bases={a+'_'+b:git('merge-base',sha[a],sha[b]) for a,b in [('M1','M2'),('M1','M3'),('M2','M3')]},collector=dict(original_path='scripts/metricas/coletar-metricas.mjs',source_commit=original['head'],sha256=digest((R/'scripts/metricas/coletar-metricas.mjs').read_bytes()),pinned_copy='evidencias/auditoria/coletar-metricas.original.mjs',pinned_copy_identical=(R/'scripts/metricas/coletar-metricas.mjs').read_bytes()==(A/'coletar-metricas.original.mjs').read_bytes(),wrapper='evidencias/auditoria/recoletar.mjs',structural_source='rootDir em disco; targetRef somente para delta Git; adaptador exige HEAD=SHA e fontes limpos'),stages=records,consolidated_numeric_cells=len(ledger),consolidated_cell_divergences=[v for v in ledger if not v['match']],functional_origin= functional,files=[])
for p in sorted(A.rglob('*')):
    if p.is_file() and p.name not in ['MANIFESTO_RASTREABILIDADE.json','MANIFESTO_RASTREABILIDADE.sha256']:
        manifest['files'].append(dict(path=str(p.relative_to(R)),bytes=p.stat().st_size,sha256=digest(p.read_bytes())))
write('MANIFESTO_RASTREABILIDADE.json',manifest)
(A/'MANIFESTO_RASTREABILIDADE.sha256').write_text(digest((A/'MANIFESTO_RASTREABILIDADE.json').read_bytes())+'  MANIFESTO_RASTREABILIDADE.json\n')
print(json.dumps(dict(stages=len(records),changed_originals=len(preserved),indicator_divergences=sum(len(r['indicator_differences']) for r in records),consolidated_cells=len(ledger),cell_divergences=manifest['consolidated_cell_divergences'],json_errors=json_errors),ensure_ascii=False,indent=2))
