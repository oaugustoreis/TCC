from instrument import ROOT
import json,pathlib,difflib,hashlib,csv,os
E=ROOT/'evidence';R=ROOT/'reports'
actions=[json.loads(x) for x in (E/'actions.jsonl').read_text().splitlines()]
commands=[json.loads(x) for x in (E/'commands.jsonl').read_text().splitlines()]
baseline=json.loads((E/'B-generated-baseline.json').read_text())
artifacts={'pulse/dist/main.js','pulse/generated-env.ts','pulse/virtual-registry.ts','summary.html','package-lock.json'}
def relevant(p,root):
 rel=p.relative_to(root)
 return p.is_file() and 'node_modules' not in rel.parts and str(rel) not in artifacts
metrics={};manifest={}
for c,prefix in [('modular-manual','A'),('modular-pulse','B')]:
 ev=[x for x in actions if x['condition']==c];writes=[x for x in ev if x['kind'] in ['create','edit']]
 start=next(x for x in ev if x['kind']=='start');end=next(x for x in ev if x['kind']=='validated')
 files=[]
 for directory,folders,names in os.walk(ROOT/c):
  folders[:]=[d for d in folders if d not in ['node_modules','__pycache__']]
  files.extend(p for name in names if relevant(p:=pathlib.Path(directory)/name,ROOT/c))
 code=0
 for x in writes:
  if x['path'].endswith('.md'):continue
  if x['old'] is None:lines=x['new'].splitlines()
  else:
   lines=[l[1:] for l in difflib.ndiff(x['old'].splitlines(),x['new'].splitlines()) if l.startswith('+ ')]
  code+=sum(bool(l.strip()) for l in lines)
 cmds=[x for x in commands if x['label'].startswith(prefix+'-')]
 generated=([x for x in baseline if x not in artifacts]+['.env']) if prefix=='B' else []
 metrics[c]=dict(start_utc=start['utc'],first_validation_utc=end['utc'],M1_seconds=round(end['epoch']-start['epoch'],3),terminal_commands=len(cmds),file_creation_operations=sum(x['kind']=='create' for x in writes),file_edit_operations=sum(x['kind']=='edit' for x in writes),execution_attempts=sum(x['label'] in [prefix+'-run',prefix+'-run-retry'] for x in cmds),corrections_after_failures=sum(x['kind']=='correction' for x in ev),manual_nonblank_lines_added=code,generated_relevant_files=len(generated),manual_created_files=len({x['path'] for x in writes if x['kind']=='create'}),manually_modified_files=len({x['path'] for x in writes if x['kind']=='edit'}),total_relevant_files=len(files),project_relevant_nonblank_lines=sum(sum(bool(l.strip()) for l in p.read_text().splitlines()) for p in files),project_relevant_bytes=sum(p.stat().st_size for p in files),manual_final_code_file_nonblank_lines=sum(sum(bool(l.strip()) for l in (ROOT/c/x['path']).read_text().splitlines()) for x in writes if not x['path'].endswith('.md')),configuration_failures=0 if prefix=='A' else 1,compilation_failures=0,k6_execution_failures=0,instrument_validation_failures=1 if prefix=='A' else 0,validation=json.loads((E/f'{c}-validation.json').read_text()))
 manifest[c]=[dict(path=str(p.relative_to(ROOT/c)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size,origin=('generated_modified' if any(x['path']==str(p.relative_to(ROOT/c)) and x['kind']=='edit' for x in writes) else 'generated' if str(p.relative_to(ROOT/c)) in generated else 'manual')) for p in sorted(files)]
(E/'file-manifest.json').write_text(json.dumps(manifest,indent=2))
meta=json.loads((E/'npm-metadata.json').read_text())
result=dict(experiment='T1',order=['modular-manual','modular-pulse'],replications_per_condition=1,equivalent=True,pulse_version='1.3.9',repository_package_version='1.3.8',commit=meta['gitHead'],npm_integrity=meta['dist']['integrity'],node='24.18.0',npm='11.16.0',k6='2.0.0',tokens=None,tool_calls=None,conditions=metrics,shared_cli_install_seconds=next(x['seconds'] for x in commands if x['label']=='cli-install'),notes='M1 inclui esperas por autorização e raciocínio; preparação/CLI isolada fora das condições. M3 linhas não vazias, adições de diff para edições. Números não são medidas de esforço humano.')
(R/'T1_metrics.json').write_text(json.dumps(result,indent=2))
keys=[k for k,v in metrics['modular-manual'].items() if isinstance(v,(int,float))]
with (R/'T1_comparison.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['metric','modular-manual','modular-pulse'])
 for k in keys:w.writerow([k,metrics['modular-manual'][k],metrics['modular-pulse'][k]])
a=metrics['modular-manual'];b=metrics['modular-pulse']
table='| Métrica | A — Manual | B — Pulse |\n|---|---:|---:|\n'
labels={'M1_seconds':'M1: tempo decorrido (s)','terminal_commands':'M2: comandos registrados','file_creation_operations':'M2: operações autorais de criação','file_edit_operations':'M2: operações autorais de edição','execution_attempts':'M2/M5: tentativas de execução','corrections_after_failures':'M5: correções da condição','manual_nonblank_lines_added':'M3: linhas manuais não vazias adicionadas','project_relevant_nonblank_lines':'M3: linhas totais relevantes (inclui docs/dados)','project_relevant_bytes':'M3: bytes relevantes','generated_relevant_files':'M4: arquivos gerados relevantes','manual_created_files':'M4: arquivos criados manualmente','manually_modified_files':'M4: arquivos gerados editados manualmente','total_relevant_files':'M4: total relevante','configuration_failures':'M5: falhas de configuração/CLI','compilation_failures':'M5: falhas de compilação','k6_execution_failures':'M5: falhas durante execução k6','instrument_validation_failures':'Falhas do instrumento de validação'}
for k,label in labels.items():table+=f'| {label} | {a[k]} | {b[k]} |\n'
(R/'T1_limitations.md').write_text('''# Limitações metodológicas

- Uma observação por condição, ordem A→B, mesmo agente e contexto. Há aprendizado, transferência de conhecimento e cache npm; nenhuma repetição independente nem inferência estatística.
- A inspeção obrigatória do Pulse ocorreu antes de A, podendo influenciar conceitualmente a arquitetura. Nenhum arquivo/template/código Pulse foi copiado para A; ambas as implementações foram escritas separadamente, sem leitura dos arquivos A para implementar B.
- M1 usa time.time e UTC reais, mas inclui raciocínio, comunicação, coleta, erro do validador em A e esperas por autorizações. Não há decomposição confiável dessas esperas, relógio monotônico nem esforço humano medido; não interpretar a diferença como efeito causal do framework.
- Instalação isolada da CLI e inspeção/aprendizado ficaram na preparação, separados de B. B inclui npm install do workspace. Portanto M1 não representa custo total desde máquina limpa. O custo de aprendizagem não foi isolado numericamente.
- Manual usa JavaScript nativo k6; Pulse usa TypeScript/esbuild, descoberta, plugins e relatório HTML. Equivalência refere-se à jornada, carga, checks e thresholds, não à mesma instrumentação interna, headers completos ou funcionalidades de GUI.
- Contagem de comandos usa invocações do recorder; scripts agrupam gravações. Não equivale a cliques, teclas, decisões cognitivas ou chamadas de ferramentas. As operações por arquivo são registradas separadamente.
- M3 conta linhas físicas não vazias (inclui delimitadores/configurações). Formatação e linguagem afetam o número. Arquivos gerados editados usam adições de diff; código apagado não é código escrito. README, locks, dependências, relatórios e artefatos compilados excluídos.
- M4 exclui node_modules, lock, summary.html, bundle, generated-env e virtual-registry. Estes três últimos já vieram no init e foram regravados pelo build: preservados, mas não contam como arquitetura autoral. Arquivos sample/GUI/mock interno não usados permanecem no total relevante gerado. Categorias gerado/modificado se sobrepõem.
- Mock determinístico de um produto, sem falhas induzidas, somente 1 VU/10s. Não demonstra escalabilidade, manutenção ou capacidade de detectar todas as violações de contrato. Logging síncrono no mock e logging Pulse podem afetar latência.
- npm reportou 8 vulnerabilidades e avisos de pacotes obsoletos/allow-scripts. Não foram corrigidos para preservar as dependências geradas. GUI/Electron, mock integrado, outros perfis e demais comandos não foram validados.
- Logs persistentes começam em versions/inspect. Primeiros comandos de inspeção e primeira falha EPERM do mock só estão na conversa; ver preparation-notes.md. Não foram reconstruídos. actions.jsonl registra gravações dos projetos, não todo o raciocínio do agente. Tokens e contagem completa de ferramentas indisponíveis.
- Repositório HEAD declara 1.3.8; npm 1.3.9 aponta ao mesmo gitHead. Pacote instalado, metadados, baseline e SHA foram preservados; não presumir identidade byte a byte entre checkout e publicação.
- Horário do host foi mantido como observado (UTC; Manaus UTC−4). Ambiente WSL e política de rede exigiram autorizações; resultados podem diferir em outro ambiente.
''')
report=f'''# T1 — Criação de arquitetura modular manual e com Pulse

## 1. Objetivo
Avaliar esforço operacional observado para estabelecer uma arquitetura modular k6 equivalente, manualmente e com automação Pulse. Experimento complementar independente do estudo Tradicional × Modular; nenhuma alteração em resultados anteriores.

## 2. Ambiente
Ubuntu 24.04.3 LTS, WSL2 Linux 6.6.87.2, x86_64. Node 24.18.0, npm 11.16.0, k6 2.0.0 (8c3be52cc1, Go 1.26.3). Mesmos executáveis nas condições. Versões em [versions.log](../evidence/versions.log). k6 já instalado no PATH; execução confirmada. Mock somente Node HTTP nativo, sem serviço externo.

## 3. Pulse e inspeção
Pacote npm **1.3.9**, gitHead/HEAD `{meta['gitHead']}`; package.json do checkout declara **1.3.8**. Integridade npm `{meta['dist']['integrity']}`. Fontes consultadas: [repositório oficial](https://github.com/oaugustoreis/pulse), README e USER_GUIDE preservados em evidence/pulse-source, [pacote npm](https://www.npmjs.com/package/pulse-arch). A página npm retornou 403 na consulta web; os metadados foram obtidos com npm view.

Inspeção de CLI/build publicada preservada em inspected-source.log e cli-help.log. `init` copia config, data, pulse, src, tsconfig, env e package; `gen catalog` gera **seis** arquivos (contrato, use case, flow, profile, scenario, thresholds). O guia descreve cinco arquivos: a execução encontrou seis. `add-env` criou .env. `run` faz descoberta, gera registro/tipos de ambiente, empacota com esbuild e chama k6. A publicação já inclui bundle/tipos/registro que init também copia. Núcleo original e checkout preservados.

Dependências CLI diretas: chalk, commander, dotenv e xlsx; pacote sem engines explícito. Node/npm são necessários à CLI e instalação; k6 é executável externo obrigatório para carga. CLI contém tentativas de instalação de k6 por gerenciadores de SO, caminho não exercitado porque já disponível. Compilação exige esbuild/dotenv no workspace. Template também instala TypeScript, tipos k6/Node, dotenv-cli, glob, json-server, Electron e electron-builder, embora GUI/mock interno não sejam usados. Versões resolvidas em dependency-versions.log e package-lock.json. Nenhuma API remota necessária durante as jornadas.

CLI preparada isoladamente com `npm install --prefix experiments/T1/evidence/cli --ignore-scripts --save-exact pulse-arch@1.3.9` ({result['shared_cli_install_seconds']:.3f}s de comando); scripts desativados apenas nessa instalação para evitar o postinstall init no ambiente de preparação. Workspace B recebeu `npm install` normal. Instalação relatou 399 pacotes adicionados, 8 vulnerabilidades (7 moderadas, 1 alta), avisos de depreciação e scripts sujeitos à política npm. Build e execução funcionaram; GUI não verificada.

## 4. Especificação funcional
[Especificação prévia](../evidence/specification.md): POST /authentication → token; GET /products com Bearer → lista determinística; selecionar primeiro id; GET /products/1 com Bearer → detalhe. Um produto id=1, name='Produto T1', price=10. Autenticação em cada iteração, pausa de 1s. Seis checks: três status 200 e três contratos. Contratos verificam token string não vazia; lista não vazia e tipos id/name/price; detalhe com o mesmo id. Thresholds `checks: rate==1`, `http_req_failed: rate==0`, `http_req_duration: p(95)<1500`. Perfil constant-vus, 1 VU, 10s, gracefulStop padrão 30s.

## 5. Procedimento e contagem
Preparação compartilhada anterior às condições: inspeção, CLI isolada, mock independente, especificação e instrumentação. Ordem A→B, sem repetição. Diretórios começaram vazios; nenhuma reutilização de arquivos entre condições. `record.py` captura stdout/stderr, início UTC, duração do comando e código de saída. `instrument.py` registra início/fim e cada gravação autoral com conteúdo anterior/posterior. Os próprios scripts de escrita ficam na evidência, não entram no código dos projetos.

M1 vai do evento start ao validated após resumo e trace aprovados. M2 conta comandos de nível superior rotulados A-/B-, incluindo validação e falhas; inspeções e pós-análise ficam fora. Criação/edição é uma gravação autoral por caminho. M3 soma linhas não vazias adicionadas; edições de arquivos gerados contam somente adições do diff, não todo o template. M4 trata caminhos distintos, gerados e modificados podem se sobrepor. Total relevante inclui docs/dados/config/código, exclui dependências, lock e saídas regeneráveis.

## 6. Condição A — Manual
Início **{a['start_utc']}**; primeira validação **{a['first_validation_utc']}**. Implementação em JS nativo, sem npm, gerador ou código Pulse. Responsabilidades: config/environment.js, profiles/smoke.js, contracts/responses.js, use-cases/authenticate.js e products.js, flows/journey.js, scenarios/journey.js; README. Escrita rastreada em implement-a.py/actions.jsonl. Executada com `k6 run --no-usage-report --summary-export ../evidence/modular-manual-summary.json scenarios/journey.js`.

Primeira execução k6 passou. Primeira invocação do validador falhou porque o instrumento interpretava os booleanos de thresholds legados ao contrário: false significa não violado. Correção compartilhada preservada em actions.jsonl e A-validate-first.log. Não houve correção no projeto A nem repetição de carga. M1 inclui a correção do instrumento.

## 7. Condição B — Pulse
Início **{b['start_utc']}**; primeira validação **{b['first_validation_utc']}**. CLI publicada executada via Node no caminho isolado. Sequência: `init`, `gen catalog`, `add-env BASE_URL_DEV http://127.0.0.1:3333`, `npm install`, adaptação dos seis arquivos catalog e criação de README, `run catalog_smoke_test dev`. Baseline completo após init/gen em B-generated-baseline.json; .env gerado depois por add-env. Núcleo não editado manualmente.

Template exigiu adaptação: shared-iterations→constant-vus, uma consulta genérica→autenticação/lista/detalhe, contratos de produto e thresholds comuns. HTTP Pulse fornece exatamente os três checks de status; ps.check fornece os três contratos. Não manter expect/body/time/schema padrão evita checks adicionais à especificação. O contrato customizado permanece na camada schemas. A seleção de ambiente é explicitamente DEV neste cenário T1; núcleo continua configurável.

Primeira tentativa com `--summary-export` foi rejeitada pelo parser (`too many arguments`), antes de compilar ou chamar k6. Correção operacional: variável herdada `K6_SUMMARY_EXPORT=../evidence/modular-pulse-summary.json`. Comando funcional: `K6_NO_USAGE_REPORT=true K6_SUMMARY_EXPORT=../evidence/modular-pulse-summary.json node ../evidence/cli/node_modules/pulse-arch/pulse/cli.js run catalog_smoke_test dev`. Primeira execução que chegou ao k6 passou. Nenhuma falha de compilação. Pulse criou summary.html e omitiu o resumo textual padrão por handleSummary; JSON e trace permitiram validação completa.

## 8. Tabela comparativa

{table}
Linhas finais dos arquivos autorais de código/config: A={a['manual_final_code_file_nonblank_lines']}, B={b['manual_final_code_file_nonblank_lines']}; em B isso inclui linhas de template mantidas e difere da métrica de adições. Tamanho com dependências/saídas não contabilizado; a varredura foi interrompida por custo de I/O no volume WSL. Manifesto individual com origem e hashes em file-manifest.json. Diretórios sem arquivos não contam. Não há necessidade de comparar arquitetura pela quantidade bruta de arquivos.

## 9. Equivalência funcional
**Confirmada no escopo especificado.** Ambas: 10 iterações completas, 30 requisições, 60 checks aprovados, zero falhas HTTP/checks, três thresholds satisfeitos. root_group.checks idênticos (nomes, passes/fails) e thresholds idênticos. Perfil conferido nos fontes e execução. Trace do mock confirma dez sequências POST auth→GET lista→GET detalhe com Bearer correto em cada condição. O validador segmenta o trace pelo índice salvo antes de cada execução.

Evidências: modular-manual-summary.json, modular-pulse-summary.json, respectivos validation.json, mock-requests.jsonl, equivalence.json/equivalence.log, A-run.log e B-run-retry.log. Não houve diferença de contagem de requests/checks. HTTP Pulse adiciona Content-Type e tags/logging; a instrumentação difere, preservando a jornada. As latências locais não são métricas de eficiência de implementação.

## 10. Limitações metodológicas
Ver [T1_limitations.md](T1_limitations.md). Uma observação por condição, agente/contexto compartilhados, aprendizado, cache e esperas por autorizações impedem inferência causal/estatística. M1 inclui tempo de raciocínio/coleta e falha do instrumento em A; CLI e aprendizado anteriores excluídos. JS manual versus TS Pulse, escopo pequeno e dependências extras afetam a comparação. Tokens e contagem completa de chamadas de ferramenta: **não disponíveis**. Registro inicial incompleto foi explicitado, sem reconstruir logs.

## 11. Interpretação
Neste procedimento A apresentou menor tempo decorrido e menos comandos de nível superior; Pulse reduziu o volume de linhas adicionadas manualmente, automatizou a estrutura/descoberta/compilação e forneceu cliente HTTP/checks de status. Essa redução de autoria envolve utilitários em runtime além dos geradores. A adaptação dos seis componentes ainda foi necessária para uma jornada real. Instalação, dependências e restrição do parser acrescentaram custo operacional a B.

As duas condições já são modulares: separação de responsabilidades e reutilização não podem ser atribuídas exclusivamente ao Pulse. A automação comprovada é init/gen/add-env/discovery/build/run; GUI, mock integrado e funcionalidades somente documentadas não entram como benefício validado. Mais arquivos automáticos não demonstram eficiência. Não calcular percentuais de superioridade: tempos incluem fatores não controlados e as unidades de esforço são operacionais, não humanas.

## 12. Conclusão e reprodução
O Pulse estabeleceu uma estrutura modular funcional e reduziu autoria observada, mas nesta execução não reduziu tempo decorrido nem quantidade de comandos. Os dados sustentam automação de infraestrutura com custos de instalação/adaptação; não sustentam superioridade geral. Estudo exploratório sem inferência estatística.

Cada projeto contém README executável. Iniciar shared-mock/server.cjs em terminal separado; executar o comando do projeto. Reinstalação B via npm ci e CLI fixada; lock e pacote preservados. Os scripts validate.py e equivalence.py verificam as evidências coletadas; nova coleta deve usar novos caminhos/índices para não sobrescrever esta observação. Fontes, baseline, manifests, scripts, comandos, erros e hashes estão em evidence. Nenhuma segunda repetição foi apresentada como independente.
'''
(R/'T1_experiment_report.md').write_text(report)
print(table)
