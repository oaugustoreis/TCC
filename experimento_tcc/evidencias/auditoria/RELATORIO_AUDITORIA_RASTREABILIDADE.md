# Auditoria de rastreabilidade do experimento do TCC

Data: 10/11/2026. Repositório examinado: `/mnt/d/TCC`. HEAD inicial: `df99b648a2e422e735feba4af922e075f1e92fed`.

**Resultado: reprodução técnica das oito etapas aprovada, com pendências documentais que impedem declarar a auditoria integralmente concluída.** As métricas estruturais, os deltas Git, o reuso, as contagens extraídas das transcrições e os resultados funcionais foram reproduzidos. As 446 células numéricas/booleanas conferidas nas tabelas 2.1–3.2 do consolidado coincidem com as respectivas fontes, inclusive somas e médias. Isso comprova a reprodução dos números disponíveis, não a completude dos logs originais nem o cumprimento integral do procedimento experimental.

Nenhum agente de IA foi reexecutado. Prompts, cenários, contratos, implementações e arquivos originais foram preservados. Toda saída nova está nesta pasta. Não foram movidos branches ou tags nem criados commits experimentais. Os worktrees de auditoria têm HEAD destacado e permanecem em `/tmp/tcc-auditoria-<ETAPA>`.

## 1. Documentos e fontes examinados

- [Protocolo v2.1](../../docs/PROTOCOLO_EVOLUCAO_INCREMENTAL.md), [plano de medição](../../docs/PLANO_MEDICAO_ESFORCO.md), [matriz de requisitos](../../docs/MATRIZ_REQUISITOS_EXPANSAO.md), [baseline histórica](../../docs/BASELINE_E0.md) e [consolidado](../../docs/RELATORIO_EXPERIMENTAL_COMPLETO.md).
- `scripts/metricas/coletar-metricas.mjs`, seus testes e `scripts/validacao/{validar,execucao,oraculos,api-observada}.mjs`, incluindo as versões específicas dos commits validados.
- Os oito JSONs `evidencias/metricas/<ETAPA>/metricas.json`, suas versões nos commits, as transcrições de 14 unidades e os registros de tentativas e validação pareada. Os JSONs originais inventariados foram lidos e não apresentaram erros de sintaxe.
- Evidência funcional histórica de E0, recuperada da tag `e0-baseline-validada` exclusivamente para `historico_E0/`.

O [inventário original](INVENTARIO_ORIGINAL.json) registra SHA-256 de 6.984 arquivos em `docs/`, `scripts/` e `evidencias/`, antes das novas medições, além de HEAD e referências Git. A conferência final não encontrou alterações nesses arquivos. Os inventários `*/FONTES_COMMIT.json` identificam os hashes de fontes e evidências em cada commit; diferenças em fontes do checkout principal são esperadas quando ele está em E4 e a etapa é outra. A comparação de validade usa a árvore do commit e seu worktree, não o checkout principal.

## 2. Commits finais e ancestralidade

| Etapa | SHA final completo | Base para o delta |
|---|---|---|
| E0 | `103a1e1ec5ceb05b15411b308b00f8f79fdc15a6` | Baseline; sem delta experimental |
| E1 | `452524a4963356e4ac0ae352ec99f681d3808eee` | `103a1e1ec5ceb05b15411b308b00f8f79fdc15a6` |
| E2 | `bceabc33eb75c7387a99371ce60ead453fe5ecdd` | `452524a4963356e4ac0ae352ec99f681d3808eee` |
| E3 | `6c1ab09a2d0f51510bef8db7af43a69a5c822c88` | `bceabc33eb75c7387a99371ce60ead453fe5ecdd` |
| E4 | `a84091f780bd745af4e22e6d787a9dd2124e7224` | `6c1ab09a2d0f51510bef8db7af43a69a5c822c88` |
| M1 | `4902526779b58c412bc3d876b9ba4b57540a11bc` | `a84091f780bd745af4e22e6d787a9dd2124e7224` |
| M2 | `c8be840052438dfc115de71cf67b5cb30c2663c8` | `a84091f780bd745af4e22e6d787a9dd2124e7224` |
| M3 | `4df995ace48e7969329b673a990420644718fb4d` | `a84091f780bd745af4e22e6d787a9dd2124e7224` |

M1, M2 e M3 têm exatamente E4 como pai direto. Os três `merge-base` entre pares de manutenção também retornam E4. Logo, nenhuma manutenção incorpora outra. A tag `estado-e4` resolve para esse mesmo SHA. O commit de consolidação documental não substitui os commits finais experimentais.

E0 exige duas referências explícitas: a tag histórica resolve para `e93c3fcf8e954dc1a1e8a05d621c9f23b8ccdc87`, enquanto o consolidado e a base de E1 adotam `103a1e1ec5ceb05b15411b308b00f8f79fdc15a6`. Os 29 arquivos JS das duas suítes são idênticos entre esses estados. O manifesto funcional histórico difere do E0 do consolidado somente em `api/server.js`: houve preparação posterior da API, já anterior a E1. A equivalência das suítes não autoriza chamar os dois commits de árvores integralmente iguais. A validação nova de E0 usa a infraestrutura existente em `103a1e1…`, preservando a validação da API histórica como evidência documental separada.

## 3. Coletor e isolamento da reprodução

O coletor original resolve `ROOT_DIR` pelo local do próprio script. `analyzeSuiteStructure()` lê arquivos `.js` diretamente em `rootDir` com `fs.readFileSync`; não consulta os blobs de `targetRef`. `collectGitDelta()` usa as referências fornecidas no `git diff`. Assim, executar o coletor na árvore atual com `--target <SHA>` pode misturar a estrutura de um estado com o delta de outro. A opção histórica `WORKTREE` ainda chama `git add -N`, introduzindo dependência do índice e do diretório de trabalho.

Não foi necessário alterar o algoritmo experimental. A cópia [coletar-metricas.original.mjs](coletar-metricas.original.mjs) é byte a byte igual ao coletor no HEAD inicial. O adaptador separado [recoletar.mjs](recoletar.mjs) passa `rootDir` explicitamente, exige `HEAD == SHA final`, recusa fontes alterados e recusa destino já existente. Deltas usam somente SHAs completos. A única intervenção é na seleção e conferência da origem; fórmulas e regras léxicas permanecem iguais. O SHA-256 do coletor, a cópia e o adaptador estão no manifesto.

O adaptador recalcula esforço usando as transcrições e tentativas históricas presentes no próprio worktree do commit, sem chamar agentes ou usar as novas validações como novas tentativas experimentais. As validações novas usam o `validar.mjs` de cada commit e seus manifestos de entradas. E0 usa as entradas históricas padrão. Seus resultados ficam em `<ETAPA>/validacao-reexecucao/`.

Ambiente novo: Linux/WSL, Node `v24.18.0`, k6 `v2.0.0`. Os registros `environment.json` contêm versões, plataforma e horários efetivos; não se presume identidade com o ambiente original. O primeiro ensaio de E0 em `E0/validacao/` falhou por `listen EPERM` no sandbox. Foi preservado e excluído da confirmação funcional; `E0/validacao-reexecucao/` é a execução válida, com permissão para abrir portas locais. Não houve adaptação de API, k6, contratos ou validador para contornar resultados.

## 4. Matriz de conformidade por etapa

“Reprodução integral técnica” significa estrutura, duplicação, imports, delta/reuso aplicáveis e execução funcional completa das duas suítes. A execução histórica dos agentes permanece documental em todas as unidades de IA.

| Etapa | Estrutura/duplicação | Delta e reuso por SHA | Validação nova por suíte: cenários / req. / checks | Ligação manifesto → fontes finais | Esforço do agente | Pendências de rastreabilidade |
|---|---|---|---|---|---|---|
| E0 | Conforme | Não aplicável | 5 / 14 / 30, aprovada | Suítes históricas idênticas; API posterior identificada | Não aplicável | Duas referências E0 explicadas; nenhuma pendência numérica |
| E1 | Conforme | Conforme | 7 / 20 / 42, aprovada | Integral na validação pareada | Recalculado documentalmente | Caminhos de escrita ausentes em E1-M; classificação do preflight de E1-T |
| E2 | Conforme | Conforme | 10 / 34 / 70, aprovada | Integral | Recalculado documentalmente | Completude externa das transcrições não demonstrada |
| E3 | Conforme | Conforme | 12 / 42 / 86, aprovada | Integral | Recalculado documentalmente | Completude externa das transcrições não demonstrada |
| E4 | Conforme | Conforme | 15 / 66 / 134, aprovada | Integral | Recalculado documentalmente | Completude externa das transcrições não demonstrada |
| M1 | Conforme | Conforme, base E4 | 15 / 66 / 134, aprovada | Integral | Recalculado documentalmente | Sobreposição temporal; instrução somente leitura versus edição em M1-T |
| M2 | Conforme | Conforme, base E4 | 15 / 66 / 134, aprovada | Integral | Recalculado documentalmente | Sobreposição temporal; instrução somente leitura versus edição nas duas unidades |
| M3 | Conforme | Conforme, base E4 | 15 / 66 / 134, aprovada | Integral | Recalculado documentalmente | Sobreposição temporal; instrução somente leitura versus edição nas duas unidades |

Todas as validações novas têm `validation_passed: true` e `complete_functional_equivalence: true`; os totais por suíte coincidem com os registros originais. São 188 execuções de cenário válidas nas oito etapas, 748 requisições e 1.528 checks no conjunto das duas arquiteturas. Estes totais agregam reexecuções de estados diferentes; não são uma nova unidade experimental.

Os manifestos de fontes antes e depois das sete validações pareadas E1–M3 são iguais e todos os seus hashes correspondem à árvore final da etapa. Os manifestos das tentativas bem-sucedidas também correspondem aos fontes finais da própria arquitetura. Na primeira tentativa de E1-T não há manifesto posterior, coerentemente com o encerramento no preflight. Não se exige que a arquitetura ainda não implementada em uma tentativa isolada corresponda ao estado final da outra condição.

## 5. Comparação dos indicadores e origem de cada número

[COMPARACAO_INDICADORES.json](COMPARACAO_INDICADORES.json) contém a comparação recursiva dos oito JSONs completos. Não houve divergência nos indicadores recalculados. As diferenças brutas são exclusivamente:

1. `generated_at`, por se tratar de nova coleta;
2. `git_delta.target_ref`: `WORKTREE` foi substituído pelo SHA final da etapa;
3. caminhos absolutos de transcrição e tentativas, agora referindo os worktrees isolados.

A comparação normalizada exclui apenas esses campos de metadados, mantendo bases Git, indicadores, detalhes por arquivo, listas de componentes, contagens de tokens e resumos de validação. E0 conserva `validation: null` e `agent: null` na recoleta para reproduzir fielmente o JSON original; o manifesto vincula separadamente sua validação histórica e a nova.

A origem dos valores do consolidado pode ser consultada sem depender de inferência textual:

| Parte do consolidado | Evidência da auditoria | Regra de vinculação |
|---|---|---|
| Tabela 1: commits, cenários, requisições e checks | Manifesto + [ORIGEM_VALIDACAO_CONSOLIDADO.json](ORIGEM_VALIDACAO_CONSOLIDADO.json) | SHA final/base e totais dos `result.json` históricos e novos |
| Tabela 2.1: tamanho, tokens, clones, duplicação e imports | [ORIGEM_CELULAS_CONSOLIDADO.json](ORIGEM_CELULAS_CONSOLIDADO.json) | Linha/coluna do relatório → arquivo `metricas.json` → JSON Pointer → valor |
| Tabela 2.2: delta e reuso | Mesmo livro de células | `git_delta/*`, `batch_reuse/*`; somas entre etapas |
| Tabelas 2.3 e 3.2: esforço e primeira validação | Mesmo livro + transcrições/tentativas no manifesto | `agent.summary/*`; soma de unidades e taxa de aprovação |
| Tabela 3.1: manutenção, médias e redução de impacto | Mesmo livro | Deltas contra E4; média aritmética dos percentuais e `100*(Mod/Trad-1)` |
| Seção 4 e números derivados da narrativa | [INDICADORES_DERIVADOS.json](INDICADORES_DERIVADOS.json) | Valores de origem, fórmulas, somas, razões, crescimento e reduções |
| Arquivos específicos alterados/reutilizados | `metricas.json` + `FONTES_COMMIT.json` por etapa | `git_delta.files_detail`, `batch_reuse.components` e SHA-256 do fonte |

As 446 células conferidas incluem os totais e as médias, sem divergência de transcrição ou aritmética. Exemplos: manutenção soma 30 versus 3 arquivos modificados e 91 versus 32 linhas de delta; redução de 90% e 64,835…%, respectivamente. Em E4 a diferença de duplicação é 40,99 pontos percentuais de tokens e 36,23 de linhas. Arredondamentos de duas casas nas métricas e de uma casa em certas reduções explicam a apresentação decimal do consolidado.

`files_written` conta operações registradas, incluindo gravação de manifestos de evidência; não equivale ao número de arquivos JS alterados. Escritas de `manifest-*.json` fora da suíte são identificadas nos vínculos das transcrições e não indicam edição da arquitetura concorrente. Em E2-M há caminhos serializados com aspas adicionais: a auditoria decodifica essas aspas apenas para conferir os caminhos, preservando a transcrição original e a contagem do coletor.

## 6. Divergências explicadas e limitações ainda abertas

### 6.1 E1-T: preflight classificado como ciclo funcional

`evidencias/evolucao/E1/tentativas_tradicional/attempt-01/result.json` contém `preflight_passed: false` e `error: "Manifesto deve ser array"`, sem execuções de cenário. O coletor só classifica infraestrutura por `infra_error`, `api_ready: false` ou `k6_spawn_error`; como essa falha não satisfaz esses critérios, registra dois “ciclos funcionais” e `first_validation_pass: false` ao considerar também `attempt-02`, aprovada.

Portanto, os números do consolidado reproduzem exatamente o coletor, mas o rótulo “funcional” é amplo demais: houve uma falha de entrada/configuração e uma execução funcional aprovada, não evidência de reprovação dos checks dos cenários. Se o indicador excluir preflight, E1-T teria 1 ciclo executado e primeira execução funcional aprovada; o total tradicional da Fase 1 cairia de 5 para 4 ciclos, e a taxa de primeira aprovação funcional subiria de 3/4 para 4/4. Isso é uma interpretação alternativa documentada, não uma substituição dos originais. Permanece pendente decidir e explicitar a definição no texto definitivo do TCC.

### 6.2 Transcrições: vínculo quantitativo e lacunas de proveniência

Os arquivos de transcrição e resultados disponíveis coincidem com os blobs dos respectivos commits. Os timestamps e contagens de ações/tokens reproduzem os resumos. Entretanto:

- E1-M registra nomes de ferramentas de escrita sem argumentos/caminhos. É possível repetir a contagem de 12 operações, mas não demonstrar individualmente que cada alteração corresponde a uma chamada específica. Não foi inventado um caminho para preencher essa lacuna.
- Diversas transcrições têm saltos de `step_index`, campos omitidos ou truncados. Os registros locais não bastam para certificar que todos os passos do runtime foram exportados. Uma sequência com índices não contíguos, por si só, também não prova adulteração.
- Em M1-T, M2-T, M2-M, M3-T e M3-M, o prompt inicial disponível restringe o agente a `read_file`, mas a mesma transcrição registra `edit_file`. Os arquivos finais e seus hashes são verificáveis; a origem exata dessas chamadas e o procedimento efetivamente autorizado não podem ser resolvidos com o material local.
- O protocolo descreve agentes executando validações. Muitos registros têm `commands_run: 0` e as validações estão em arquivos externos às transcrições. Não se pode atribuir sua execução ao agente nem incluir seu tempo na duração do agente sem logs adicionais do orquestrador.

Para resolver essas pendências, são necessários os logs primários integrais do runtime e do orquestrador, com identificadores das sessões, prompts efetivos, argumentos, resultados e exportação verificável. Não se deve reexecutar agentes para tentar reconstruir o passado.

### 6.3 Ordem pareada: manutenções apresentam intervalos sobrepostos

| Etapa | Intervalo Tradicional (UTC) | Intervalo Modular (UTC) | Conferência |
|---|---|---|---|
| E1 | 08/11 19:29:26–19:30:14 | 08/11 19:34:23–19:35:50 | Sequência T → M compatível |
| E2 | 09/11 16:29:27–16:29:40 | 09/11 16:20:07–16:22:49 | Sequência M → T compatível |
| E3 | 09/11 19:21:06–19:21:53 | 09/11 19:22:57–19:24:32 | Sequência T → M compatível |
| E4 | 09/11 19:36:03–19:36:52 | 09/11 19:32:42–19:34:38 | Sequência M → T compatível |
| M1 | 09/11 19:49:18–19:49:26 | 09/11 19:49:19–19:49:38 | Sobreposição; sequência estrita não comprovada |
| M2 | 09/11 20:00:38–20:00:50 | 09/11 20:00:37–20:07:28 | Sobreposição; sequência estrita não comprovada |
| M3 | 09/11 20:11:37–20:11:45 | 09/11 20:11:39–20:11:57 | Sobreposição; sequência estrita não comprovada |

A ordem de início nas manutenções acompanha a ordem nominal prevista, mas o segundo agente começa antes de terminar o primeiro. A auditoria não presume que a sobreposição seja uma falha de relógio ou que os agentes tenham sido sequenciais. Essa divergência procedural permanece aberta. A ancestralidade Git independente das três manutenções continua comprovada.

### 6.4 Outras ressalvas de interpretação

- O protocolo escreve “8 cenários” em M3, mas enumera CT-04, CT-05 e CT-11–CT-15, que totalizam 7. O consolidado e o diff final registram corretamente 7 scripts tradicionais e 1 use-case modular.
- A frase “zero reutilização interna” refere-se a imports dentro da própria arquitetura; os imports de `shared/` são contabilizados separadamente. Não significa ausência de toda dependência compartilhada.
- As 151 leituras em M2-M são chamadas de leitura, podendo incluir tentativas sem sucesso e arquivos repetidos. Não equivalem a 151 arquivos distintos efetivamente inspecionados.
- A duração é `max(created_at)-min(created_at)` dos passos disponíveis. Não mede todo o trabalho do operador, a validação externa ou tempo de relógio independente. Tokens LLM são a soma dos contadores registrados, sem comprovante externo de faturamento/completude.
- Os commits finais agrupam preparação comum, implementação e evidências. As bases e os deltas das suítes são verificáveis, mas o Git sozinho não comprova um checkpoint separado de preparação congelado antes de cada unidade, como descreve o protocolo.
- Não há checkpoints intermediários suficientes para reconstruir retrabalho; `intermediate_churn` continua `null`. O delta final não foi apresentado como churn total.
- Hashes locais asseguram integridade comparativa e vínculo ao Git local. Não fornecem assinatura externa, datação independente ou certificação de autoria dos logs.

## 7. Reprodução

Pré-requisitos: os objetos Git originais, Git, Python 3, Node e k6 no PATH; permissão para a API local abrir portas. Não requer instalar dependências nem invocar agentes. Os arquivos `*.command.json`, `*.stdout.log`, `*.stderr.log` e `environment.json` preservam os comandos e resultados desta execução.

Para recriar os worktrees em outro ambiente, use os SHAs completos do manifesto:

```bash
python3 - <<'PY'
import json, subprocess
m=json.load(open('evidencias/auditoria/MANIFESTO_RASTREABILIDADE.json'))
for stage in m['stages']:
    subprocess.run(['git','worktree','add','--detach',
                    '/tmp/tcc-auditoria-'+stage['stage'],
                    stage['git']['final_sha']],check=True)
PY
```

Se esses worktrees já existem, confira `git -C /tmp/tcc-auditoria-<ETAPA> rev-parse HEAD` e `git -C ... status --porcelain` em vez de recriá-los. Nenhuma branch deve ser trocada, resetada ou atualizada.

Escolha uma pasta nova para a reprodução, preservando esta auditoria:

```bash
python3 evidencias/auditoria/reproduzir_validacoes.py --metricas --dest /tmp/tcc-auditoria-reproducao
python3 evidencias/auditoria/reproduzir_validacoes.py --dest /tmp/tcc-auditoria-reproducao
```

A primeira chamada refaz as oito coletas; a segunda executa os oito validadores originais. Ambas recusam sobrescrever o respectivo destino de evidência existente. Os caminhos dos worktrees são os indicados acima. Para uma etapa isolada, acrescente, por exemplo, `M2` à segunda chamada.

Para examinar os deltas independentemente do coletor:

```bash
git diff --no-ext-diff --no-textconv --no-renames --numstat a84091f780bd745af4e22e6d787a9dd2124e7224 4902526779b58c412bc3d876b9ba4b57540a11bc -- tradicional/ modular/
git merge-base 4902526779b58c412bc3d876b9ba4b57540a11bc c8be840052438dfc115de71cf67b5cb30c2663c8
```

O programa [conferir.py](conferir.py) refaz as comparações, resolve os commits, inventaria hashes, confere JSONs e tabelas e gera o manifesto desta pasta. Ele pressupõe as evidências originais e as reexecuções aqui armazenadas; não reexecuta medições nem agentes. Seu uso regenera os arquivos derivados de auditoria, portanto copie esta pasta antes de uma nova conferência se desejar preservar também esta versão da auditoria.

`MANIFESTO_RASTREABILIDADE.json` inclui os hashes dos arquivos da auditoria, caminhos, fontes Git e resultados. Seu próprio hash fica em `MANIFESTO_RASTREABILIDADE.sha256`, evitando uma referência circular. Para a conferência criptográfica completa, use `python3 evidencias/auditoria/verificar_integridade.py`.

## 8. Situação final por escopo

**Reproduzidas integralmente no escopo técnico autorizado:** E0, E1, E2, E3, E4, M1, M2 e M3, incluindo execução funcional completa das duas arquiteturas. Todas as diferenças numéricas e de metadados observadas têm origem identificada.

**Verificadas apenas documentalmente:** as 14 execuções históricas de agentes, seus tokens, ações, duração e relação com tentativas externas; a validação de E0 com a API da tag histórica. Nenhuma etapa inteira ficou limitada à verificação documental.

**Pendências:** completude/proveniência externa das transcrições, vínculo de escrita por arquivo em E1-M, definição de ciclo funcional em E1-T, contradições entre prompts e ferramentas nas cinco unidades de manutenção identificadas e comprovação da ordem sequencial em M1–M3. Essas pendências não são resolvidas pela coincidência dos números. Por isso, não se declara conformidade integral nem encerramento da auditoria de rastreabilidade.
