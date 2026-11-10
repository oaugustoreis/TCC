# Relatório de validação funcional final

Data: 05/11/2026. Projeto: `D:\TCC`. A execução HTTP real dos cinco cenários tradicionais e cinco modulares foi bem-sucedida: **10/10 execuções, 28 requisições recebidas e 60/60 checks aprovados**, com **1 VU e 1 iteração em cada execução**. Os cinco pares apresentaram a mesma sequência de métodos, caminhos, headers, payloads, status HTTP e nomes/resultados de checks.

Essa conclusão limita-se às cinco jornadas baseline, aos dados usados e à execução local sequencial descrita abaixo. Não comprova equivalência para outras entradas, concorrência, desempenho ou respostas de erro não exercitadas.

## Evidências e ambiente

Execução completa iniciada em `2026-11-05T17:07:25.732Z` (13:07:25 em Manaus):

- [Resultado consolidado](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/result.json): `complete_functional_equivalence: true`, `architecture_preserved: true`.
- [Ambiente e versões](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/environment.json).
- [Manifesto anterior](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/source-manifest-before.json) e [posterior](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/source-manifest-after.json), com SHA-256 dos arquivos JS de `modular/`, `tradicional/`, `shared/` e `api/`.
- [Escopo das métricas de código](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/code-accounting.json).
- [Auditoria final](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/auditoria-final.json): zero diferenças nos hashes atuais, 24 arquivos modulares, 10 execuções bem-sucedidas e taxa de falha HTTP zero nos dez summaries. A sintaxe do orquestrador foi verificada com `node --check scripts/validacao/validar.mjs`.

| Ferramenta | Versão observada |
|---|---|
| Sistema | Windows, release 10.0.26200, x64 |
| Node.js | v24.10.0 |
| npm | 11.6.1 |
| k6 | v2.3.0, commit e088784614, Go 1.26.8, windows/amd64 |
| Python / python3 | Não disponíveis no PATH (`ENOENT`, código registrado 127) |
| Commit Git | Indisponível: diretório sem repositório Git, `git rev-parse HEAD` retornou 128 |

## Procedimento e comandos

Foram lidos o README, contratos/matriz de equivalência, protocolo, documentação modular, código da API, configuração comum, cenários e helpers, além de `scripts/validacao/validar.py` e sua instrumentação `api-observada.mjs`.

O validador Python foi inspecionado, mas não executado, pois não havia interpretador disponível. Foi criada a alternativa [scripts/validacao/validar.mjs](../scripts/validacao/validar.mjs), com os mesmos dez cenários, contagens esperadas, nomes de checks e critérios de comparação. Ela normaliza os separadores do inventário para `/`, evitando que os caminhos Windows impeçam a identificação dos 24 arquivos modulares. O arquivo Python foi preservado.

Comandos efetivamente utilizados:

```powershell
node --version
npm.cmd --version
k6 version
git rev-parse HEAD
python --version
python3 --version
npm.cmd run api
npm.cmd run api:test
node --experimental-vm-modules tests/http-helper.test.js
node --experimental-vm-modules tests/checks-helper.test.js
node scripts/validacao/validar.mjs
```

`npm.cmd` é a entrada do npm usada no Windows. A primeira inicialização de `npm run api` exibiu `API: http://127.0.0.1:3333`; a sondagem real `GET /health` retornou **200**, corpo `{"status":"ok"}`. Evidências: [comando](../evidencias/validacao_final/2026-11-05T17-06-36-981Z/npm-api.command.json), [stdout](../evidencias/validacao_final/2026-11-05T17-06-36-981Z/npm-api.stdout.log) e [resposta](../evidencias/validacao_final/2026-11-05T17-06-36-981Z/npm-api-health.json).

Para cada script, o validador executou `k6 inspect`, iniciou um processo novo de `node scripts/validacao/api-observada.mjs` e aguardou seu arquivo de prontidão. A instrumentação usa `createServer` da API real e registra as requisições recebidas e o status ao concluir a resposta; não simula respostas. Cada processo foi encerrado após seu cenário. A porta dessas dez instâncias foi **3334**, com `BASE_URL` explícita, isolando a validação da tentativa de inicialização por npm na porta 3333. O reinício faz os pedidos começarem em `o1` em cada execução.

Formato dos comandos reais de cada cenário (os caminhos absolutos completos estão nos respectivos `*.command.json`):

```powershell
k6 inspect <script>
# PORT=3334, TRACE_FILE=<pasta>/server-requests.jsonl,
# READY_FILE=<pasta>/api-ready.json, definidos pelo validador:
node scripts/validacao/api-observada.mjs
k6 run --no-usage-report --no-color --quiet --log-format=json `
  --log-output file=<pasta>/http-debug.jsonl --http-debug=full `
  --summary-export <pasta>/summary.json --out json=<pasta>/metrics.jsonl `
  -e BASE_URL=http://127.0.0.1:3334 <script>
```

Scripts executados:

| ID | Tradicional | Modular |
|---|---|---|
| CT-01 | `tradicional/ct01.js` | `modular/scenarios/autenticacao/autenticacao.scenario.js` |
| CT-02 | `tradicional/ct02.js` | `modular/scenarios/catalogo/catalogo.scenario.js` |
| CT-03 | `tradicional/ct03.js` | `modular/scenarios/pedidos/criacao.scenario.js` |
| CT-04 | `tradicional/ct04.js` | `modular/scenarios/pedidos/consulta.scenario.js` |
| CT-05 | `tradicional/ct05.js` | `modular/scenarios/pedidos/atualizacao.scenario.js` |

Para repetir somente a validação funcional: `node scripts/validacao/validar.mjs`. A sondagem npm integrada ficou opcional após esta coleta (`--probe-npm-api`); essa alteração posterior afeta apenas o orquestrador, fora da arquitetura medida. A execução registrada continha a sondagem npm habilitada.

## Resultados reais por execução

Todos os dez `k6 inspect` e os dez `k6 run` retornaram código **0**. As opções inspecionadas foram 1 VU/1 iteração; os modulares usaram `shared-iterations`. As métricas registraram exatamente uma iteração concluída por script. O threshold configurado foi `checks: rate==1`.

| Execução | VUs / iterações | Requisições esperadas / recebidas / http_reqs | Checks aprovados / observados | Resultado |
|---|---|---|---|---|
| Tradicional CT-01 | 1 / 1 | 1 / 1 / 1 | 2 / 2 | Passou |
| Modular CT-01 | 1 / 1 | 1 / 1 / 1 | 2 / 2 | Passou |
| Tradicional CT-02 | 1 / 1 | 3 / 3 / 3 | 6 / 6 | Passou |
| Modular CT-02 | 1 / 1 | 3 / 3 / 3 | 6 / 6 | Passou |
| Tradicional CT-03 | 1 / 1 | 3 / 3 / 3 | 6 / 6 | Passou |
| Modular CT-03 | 1 / 1 | 3 / 3 / 3 | 6 / 6 | Passou |
| Tradicional CT-04 | 1 / 1 | 3 / 3 / 3 | 7 / 7 | Passou |
| Modular CT-04 | 1 / 1 | 3 / 3 / 3 | 7 / 7 | Passou |
| Tradicional CT-05 | 1 / 1 | 4 / 4 / 4 | 9 / 9 | Passou |
| Modular CT-05 | 1 / 1 | 4 / 4 / 4 | 9 / 9 | Passou |
| Total | 10 iterações | 28 / 28 / 28 | 60 / 60 | 10/10 |

Testes complementares: `npm run api:test` passou (1 teste); testes dos helpers HTTP e checks passaram (4 testes em cada arquivo). Os mocks k6 desses testes unitários não são a base da conclusão funcional: essa conclusão usa as dez execuções HTTP reais.

## Requisições e checks comparados

As sequências abaixo foram recebidas pela API em ambas as suítes:

| ID | Método, caminho e status, na ordem | Checks, na ordem |
|---|---|---|
| CT-01 | POST `/auth/login` → 200 | `login 200`; `token presente` |
| CT-02 | POST `/auth/login` → 200; GET `/products` → 200; GET `/products/p1` → 200 | `login 200`; `token presente`; `lista 200`; `produtos disponíveis`; `produto 200`; `produto p1` |
| CT-03 | POST `/auth/login` → 200; GET `/products/p1` → 200; POST `/orders` → 201 | `login 200`; `token presente`; `produto 200`; `produto p1`; `pedido 201`; `pedido criado` |
| CT-04 | POST `/auth/login` → 200; POST `/orders` → 201; GET `/orders/o1` → 200 | `login 200`; `token presente`; `pedido 201`; `pedido criado`; `consulta 200`; `pedido corresponde`; `status esperado` |
| CT-05 | POST `/auth/login` → 200; POST `/orders` → 201; PATCH `/orders/o1/status` → 200; GET `/orders/o1` → 200 | `login 200`; `token presente`; `pedido 201`; `pedido criado`; `atualização 200`; `status confirmado`; `consulta 200`; `pedido corresponde`; `status esperado` |

Payloads recebidos: login `{"username":"pesquisador","password":"teste123"}`; criação `{"productId":"p1","quantity":1}`; atualização `{"status":"confirmed"}`; GETs sem corpo. Headers incluíram `Content-Type: application/json`, `Host: 127.0.0.1:3334`, `User-Agent: Grafana k6/2.3.0` e Content-Length quando havia corpo. As chamadas após login usaram `Authorization: Bearer token-experimental`; login sem Authorization.

Foram comparados método, caminho, todos os headers recebidos e payload literal, preservando a ordem das requisições. A ordem das chaves do objeto de headers foi normalizada; a ordem física dos headers não integra o critério e permanece disponível em `rawHeaders`. Status HTTP foram comparados separadamente. Checks foram comparados por sequência de nome e valor, excluindo timestamps. Não foi feita comparação integral dos corpos das respostas; os checks exercitam os campos definidos na matriz (token, produtos, id e status do pedido).

Comparações dos pares: [CT-01](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/ct01-comparison.json), [CT-02](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/ct02-comparison.json), [CT-03](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/ct03-comparison.json), [CT-04](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/ct04-comparison.json), [CT-05](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/ct05-comparison.json). Todos registram `requests_equal`, `checks_equal`, `response_statuses_equal` e `equivalent` como `true`.

Cada pasta `tradicional_ct01` a `tradicional_ct05` e `modular_ct01` a `modular_ct05`, dentro da pasta da execução, contém: comandos e stdout/stderr de inspect/run, opções efetivas, prontidão e logs da API, `server-requests.jsonl`, `http-debug.jsonl`, `metrics.jsonl`, `summary.json`, `checks.json`, `http-request-metrics.json` e `result.json`. Exemplo completo: [requisições CT-05 tradicional](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/tradicional_ct05/server-requests.jsonl), [modular](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/modular_ct05/server-requests.jsonl), [checks modulares](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/modular_ct05/checks.json).

## Divergências, limitações e preservação

- Não houve divergência funcional observada nos cinco pares executados.
- Documentos históricos mencionavam `listen EPERM` e validação pendente. Nesta sessão houve inicialização e tráfego reais bem-sucedidos; os registros anteriores não foram sobrescritos.
- Uma segunda tentativa npm na porta 3333 falhou com `EADDRINUSE`, e sua sondagem falhou. Evidência: [stderr](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/npm-api.stderr.log). Ela não foi contada como sucesso. A validação dos dez cenários utilizou processos novos e observados na porta 3334, todos com prontidão confirmada.
- A tentativa de encerrar a árvore npm com `taskkill` retornou acesso negado. Evidência: [log](../evidencias/validacao_final/2026-11-05T17-06-36-981Z/npm-api-stop.stderr.log). Os processos instrumentados dos cenários foram encerrados diretamente pelo orquestrador. Não se afirma encerramento confirmado de toda a árvore npm inicial.
- O ambiente e as versões diferem dos relatos históricos; valem as versões registradas nesta coleta. Sem Git disponível para este diretório, a identidade dos fontes é documentada por hashes, sem atribuir commit inexistente.
- Os **24 arquivos modulares foram preservados**, assim como os demais fontes presentes nos manifestos. A composição é 5 scenarios, 6 profiles, 5 flows, 6 use cases e 2 helpers. `modular/helpers/http/http.js` e `modular/helpers/checks/checks.js` estão incluídos integralmente no inventário das métricas de código, sem desconto ou externalização.
- O inventário define o conjunto para futuras métricas: todos os 24 arquivos de `modular/`; no tradicional, seus cinco scripts. `shared/`, `api/`, `tests/`, `scripts/`, `evidencias/`, dependências e gerados ficam fora desse conjunto arquitetural. Os hashes desses diretórios de suporte servem apenas à preservação quando presentes no manifesto.
- **Não foram executados os experimentos definitivos de duplicação, manutenção ou reutilização**, nem coleta experimental de LOC. As métricas operacionais exportadas automaticamente pelo k6 são evidências da validação funcional, sem interpretação como comparação de desempenho ou superioridade arquitetural.
