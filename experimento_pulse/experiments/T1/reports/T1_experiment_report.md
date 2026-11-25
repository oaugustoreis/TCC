# T1 — Criação de arquitetura modular manual e com Pulse

## 1. Objetivo
Avaliar esforço operacional observado para estabelecer uma arquitetura modular k6 equivalente, manualmente e com automação Pulse. Experimento complementar independente do estudo Tradicional × Modular; nenhuma alteração em resultados anteriores.

## 2. Ambiente
Ubuntu 24.04.3 LTS, WSL2 Linux 6.6.87.2, x86_64. Node 24.18.0, npm 11.16.0, k6 2.0.0 (8c3be52cc1, Go 1.26.3). Mesmos executáveis nas condições. Versões em [versions.log](../evidence/versions.log). k6 já instalado no PATH; execução confirmada. Mock somente Node HTTP nativo, sem serviço externo.

## 3. Pulse e inspeção
Pacote npm **1.3.9**, gitHead/HEAD `b3979a585fadc2d60ca35a3decb320b2d7b45f48`; package.json do checkout declara **1.3.8**. Integridade npm `sha512-VHquhPDLNHlTc7Ee+iBKP8tCIPyNF/e+D5Grr/DykBztsyV2v6q7tukxaTdms1cXvEJJ/mhAtg0dTd+KJ1hHIA==`. Fontes consultadas: [repositório oficial](https://github.com/oaugustoreis/pulse), README e USER_GUIDE preservados em evidence/pulse-source, [pacote npm](https://www.npmjs.com/package/pulse-arch). A página npm retornou 403 na consulta web; os metadados foram obtidos com npm view.

Inspeção de CLI/build publicada preservada em inspected-source.log e cli-help.log. `init` copia config, data, pulse, src, tsconfig, env e package; `gen catalog` gera **seis** arquivos (contrato, use case, flow, profile, scenario, thresholds). O guia descreve cinco arquivos: a execução encontrou seis. `add-env` criou .env. `run` faz descoberta, gera registro/tipos de ambiente, empacota com esbuild e chama k6. A publicação já inclui bundle/tipos/registro que init também copia. Núcleo original e checkout preservados.

Dependências CLI diretas: chalk, commander, dotenv e xlsx; pacote sem engines explícito. Node/npm são necessários à CLI e instalação; k6 é executável externo obrigatório para carga. CLI contém tentativas de instalação de k6 por gerenciadores de SO, caminho não exercitado porque já disponível. Compilação exige esbuild/dotenv no workspace. Template também instala TypeScript, tipos k6/Node, dotenv-cli, glob, json-server, Electron e electron-builder, embora GUI/mock interno não sejam usados. Versões resolvidas em dependency-versions.log e package-lock.json. Nenhuma API remota necessária durante as jornadas.

CLI preparada isoladamente com `npm install --prefix experiments/T1/evidence/cli --ignore-scripts --save-exact pulse-arch@1.3.9` (4.983s de comando); scripts desativados apenas nessa instalação para evitar o postinstall init no ambiente de preparação. Workspace B recebeu `npm install` normal. Instalação relatou 399 pacotes adicionados, 8 vulnerabilidades (7 moderadas, 1 alta), avisos de depreciação e scripts sujeitos à política npm. Build e execução funcionaram; GUI não verificada.

## 4. Especificação funcional
[Especificação prévia](../evidence/specification.md): POST /authentication → token; GET /products com Bearer → lista determinística; selecionar primeiro id; GET /products/1 com Bearer → detalhe. Um produto id=1, name='Produto T1', price=10. Autenticação em cada iteração, pausa de 1s. Seis checks: três status 200 e três contratos. Contratos verificam token string não vazia; lista não vazia e tipos id/name/price; detalhe com o mesmo id. Thresholds `checks: rate==1`, `http_req_failed: rate==0`, `http_req_duration: p(95)<1500`. Perfil constant-vus, 1 VU, 10s, gracefulStop padrão 30s.

## 5. Procedimento e contagem
Preparação compartilhada anterior às condições: inspeção, CLI isolada, mock independente, especificação e instrumentação. Ordem A→B, sem repetição. Diretórios começaram vazios; nenhuma reutilização de arquivos entre condições. `record.py` captura stdout/stderr, início UTC, duração do comando e código de saída. `instrument.py` registra início/fim e cada gravação autoral com conteúdo anterior/posterior. Os próprios scripts de escrita ficam na evidência, não entram no código dos projetos.

M1 vai do evento start ao validated após resumo e trace aprovados. M2 conta comandos de nível superior rotulados A-/B-, incluindo validação e falhas; inspeções e pós-análise ficam fora. Criação/edição é uma gravação autoral por caminho. M3 soma linhas não vazias adicionadas; edições de arquivos gerados contam somente adições do diff, não todo o template. M4 trata caminhos distintos, gerados e modificados podem se sobrepor. Total relevante inclui docs/dados/config/código, exclui dependências, lock e saídas regeneráveis.

## 6. Condição A — Manual
Início **2026-11-10T18:34:13.971216+00:00**; primeira validação **2026-11-10T18:35:36.279842+00:00**. Implementação em JS nativo, sem npm, gerador ou código Pulse. Responsabilidades: config/environment.js, profiles/smoke.js, contracts/responses.js, use-cases/authenticate.js e products.js, flows/journey.js, scenarios/journey.js; README. Escrita rastreada em implement-a.py/actions.jsonl. Executada com `k6 run --no-usage-report --summary-export ../evidence/modular-manual-summary.json scenarios/journey.js`.

Primeira execução k6 passou. Primeira invocação do validador falhou porque o instrumento interpretava os booleanos de thresholds legados ao contrário: false significa não violado. Correção compartilhada preservada em actions.jsonl e A-validate-first.log. Não houve correção no projeto A nem repetição de carga. M1 inclui a correção do instrumento.

## 7. Condição B — Pulse
Início **2026-11-10T18:35:36.363264+00:00**; primeira validação **2026-11-10T18:38:10.247029+00:00**. CLI publicada executada via Node no caminho isolado. Sequência: `init`, `gen catalog`, `add-env BASE_URL_DEV http://127.0.0.1:3333`, `npm install`, adaptação dos seis arquivos catalog e criação de README, `run catalog_smoke_test dev`. Baseline completo após init/gen em B-generated-baseline.json; .env gerado depois por add-env. Núcleo não editado manualmente.

Template exigiu adaptação: shared-iterations→constant-vus, uma consulta genérica→autenticação/lista/detalhe, contratos de produto e thresholds comuns. HTTP Pulse fornece exatamente os três checks de status; ps.check fornece os três contratos. Não manter expect/body/time/schema padrão evita checks adicionais à especificação. O contrato customizado permanece na camada schemas. A seleção de ambiente é explicitamente DEV neste cenário T1; núcleo continua configurável.

Primeira tentativa com `--summary-export` foi rejeitada pelo parser (`too many arguments`), antes de compilar ou chamar k6. Correção operacional: variável herdada `K6_SUMMARY_EXPORT=../evidence/modular-pulse-summary.json`. Comando funcional: `K6_NO_USAGE_REPORT=true K6_SUMMARY_EXPORT=../evidence/modular-pulse-summary.json node ../evidence/cli/node_modules/pulse-arch/pulse/cli.js run catalog_smoke_test dev`. Primeira execução que chegou ao k6 passou. Nenhuma falha de compilação. Pulse criou summary.html e omitiu o resumo textual padrão por handleSummary; JSON e trace permitiram validação completa.

## 8. Tabela comparativa

| Métrica | A — Manual | B — Pulse |
|---|---:|---:|
| M1: tempo decorrido (s) | 82.309 | 153.884 |
| M2: comandos registrados | 4 | 8 |
| M2: operações autorais de criação | 8 | 1 |
| M2: operações autorais de edição | 0 | 6 |
| M2/M5: tentativas de execução | 1 | 2 |
| M5: correções da condição | 0 | 1 |
| M3: linhas manuais não vazias adicionadas | 60 | 48 |
| M3: linhas totais relevantes (inclui docs/dados) | 66 | 5378 |
| M3: bytes relevantes | 2914 | 206717 |
| M4: arquivos gerados relevantes | 0 | 41 |
| M4: arquivos criados manualmente | 8 | 1 |
| M4: arquivos gerados editados manualmente | 0 | 6 |
| M4: total relevante | 8 | 42 |
| M5: falhas de configuração/CLI | 0 | 1 |
| M5: falhas de compilação | 0 | 0 |
| M5: falhas durante execução k6 | 0 | 0 |
| Falhas do instrumento de validação | 1 | 0 |

Linhas finais dos arquivos autorais de código/config: A=60, B=58; em B isso inclui linhas de template mantidas e difere da métrica de adições. Tamanho com dependências/saídas não contabilizado; a varredura foi interrompida por custo de I/O no volume WSL. Manifesto individual com origem e hashes em file-manifest.json. Diretórios sem arquivos não contam. Não há necessidade de comparar arquitetura pela quantidade bruta de arquivos.

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
