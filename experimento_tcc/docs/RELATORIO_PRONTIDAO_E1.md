# Relatório de prontidão funcional de E1

> Relatório histórico de preparação funcional. A automação temporal e de isolamento citada abaixo foi encerrada e removida em 06/11/2026. A operação atual está em [EXECUCAO_MANUAL.md](EXECUCAO_MANUAL.md); a decisão antiga não comprova os controles do novo procedimento.

Data: 05/11/2026. **Decisão: E1 liberado funcionalmente para implementação medida de CT-06 e CT-07.** API, contratos, oráculo e validador comum estão preparados; a regressão HTTP real de E0 passou integralmente.

Esta entrega termina na preparação comum. **Nenhum cenário CT-06–CT-15 foi implementado nas suítes; nenhum esforço experimental foi coletado; não houve avanço para E2.** A liberação não declara equivalência funcional dos cenários novos, que ainda serão implementados e validados sob o protocolo congelado. O início de cada unidade continua sujeito a sessões isoladas, ordem tradicional→modular, recaptura de configuração e controle temporal externo antes dos prompts.

## Referências verificadas antes das alterações

| Referência | Commit |
|---|---|
| E0, tag anotada e0-baseline-validada | e93c3fcf8e954dc1a1e8a05d621c9f23b8ccdc87 |
| Protocolo, tag anotada protocolo-evolucao-v1.0 | 92c3bff5a6b0c7837aa97729fdc56bdf11976007 |
| HEAD encontrado no início | 92c3bff5a6b0c7837aa97729fdc56bdf11976007 |

Foram consultados o [protocolo](PROTOCOLO_EVOLUCAO_INCREMENTAL.md), a [matriz](MATRIZ_REQUISITOS_EXPANSAO.md), o [plano de esforço](PLANO_MEDICAO_ESFORCO.md) e o relatório de prontidão metodológica (documento da automação removida), incluindo suas versões na tag congelada. A comparação confirmou que as diferenças atuais desses quatro documentos limitam-se aos destinos dos links após a movimentação para docs/.

O repositório começou com essa reorganização documental pendente, realizada a pedido anterior do usuário; ela foi registrada separadamente antes de alterar a API. Nenhuma tag foi alterada ou movida. Branch de preparação: **api/e1**.

[Verificação inicial, status e hashes](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/verificacao-inicial.json). [Integridade final](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/integridade-final.json).

## Arquivos e separação dos commits

| Grupo | Arquivos | Situação |
|---|---|---|
| API | api/server.js | Modificado: categorias, filtro e estoque |
| Testes de contrato comuns | api/e1.contract.test.js | Criado; não pertence a nenhuma arquitetura |
| Instrumentação comum | scripts/validacao/api-observada.mjs | Modificado: captura também headers/corpo de resposta |
| Executor comum | scripts/validacao/execucao.mjs | Criado: comandos/logs, API observada em porta efêmera e ambiente k6 controlado |
| Validador | scripts/validacao/validar.mjs | Modificado: oráculo, validação E0/E1, manifestos e evidências novas |
| Oráculo independente | scripts/validacao/oraculos.mjs | Criado: fixtures, requisições esperadas, predicados e checks |
| Testes do oráculo | scripts/validacao/oraculos.test.mjs | Criado: casos sintéticos de aceitação/rejeição |
| Sonda de contrato | scripts/validacao/verificar-oraculo-e1.mjs | Criado: somente HTTP Node, sem k6 |
| Manual comum | scripts/validacao/README.md | Criado: comandos, alcance, formatos e limites |
| Configuração documental | .gitignore | Permite versionar logs de evidências desta preparação |
| Documentação/evidências | docs/RELATORIO_PRONTIDAO_E1.md, índice docs/README.md e ../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/ | Relatório, comandos, logs, hashes e resultados |

Commits da sequência, todos locais:

| Commit | Escopo |
|---|---|
| d27f1edcd835390e32ca2a2ca215de360a4dcfbc | Reorganização documental anterior, sem mudança de requisitos |
| f1c52f8e3e37b5d6964f6a5a2ec17af74ec62d97 | Somente API E1 |
| 47c242987c80c53aff1b42e7c4a37ff5e81a7bf9 | Somente testes de contrato comuns |
| cede8a039b45d33750ec6ae44de0f1e7708c62fe | Validador/oráculo/instrumentação e configuração dos logs |
| Commit que contém este relatório | Evidências e decisão de prontidão, separado dos anteriores |

A regressão foi executada com os fontes do validador ainda no worktree antes do commit cede8a0; o HEAD capturado pelos logs era o commit de contratos. A auditoria final confrontou os hashes de todos os fontes executados com os blobs do commit cede8a0 e confirmou igualdade. Não se atribui retroativamente à execução um HEAD diferente do registrado.

## Contratos implementados

Produtos preservados: p1/Produto A/preço 100 e p2/Produto B/preço 50. Acrescentadas category=principal para p1 e category=acessorio para p2.

| Requisição autenticada | Resposta |
|---|---|
| GET /products | 200, os dois produtos, agora com categoria |
| GET /products?category=principal | 200, items com somente p1 |
| GET /products?category=acessorio | 200, items com somente p2 |
| GET /products?category=inexistente | 200, items vazio |
| GET /products/p1 | 200, id/nome/preço preservados e categoria principal |
| GET /products/p2 | 200, id/nome/preço preservados e categoria acessorio |
| GET /products/p1/stock | 200, productId=p1, quantity=10, available=true |
| GET /products/p2/stock | 200, productId=p2, quantity=0, available=false |

Filtro executado na API, não no cliente. Estoque exclusivamente informativo e determinístico, sem reserva/baixa. Rotas protegidas continuam exigindo Authorization: Bearer token-experimental; sem token ou com token inválido retornam 401. Produto desconhecido retorna 404 nas consultas de detalhe e estoque.

Saúde, login, criação/consulta/confirmação de pedidos e erros anteriores continuam disponíveis. Não foram criados carrinhos, cancelamentos, pagamentos ou outras funcionalidades E2–E4.

## Testes de contrato

Comando:

```powershell
node --test api/server.test.js api/e1.contract.test.js
```

**9/9 testes passaram, saída 0**: oito novos testes comuns e o teste existente da API. Cobertura:

1. Filtro principal/acessorio/inexistente e listagem sem filtro.
2. Consulta individual dos dois produtos e preservação de IDs, nomes e preços.
3. Estoque positivo.
4. Estoque zero e booleano available=false.
5. Falta de autenticação e Bearer inválido nas rotas de catálogo/estoque.
6. Produtos inexistentes com 404.
7. Contratos E0 de saúde, credenciais, criação/consulta/confirmação e erros anteriores.
8. Estoque não alterado após criar/confirmar pedido.
9. Jornada HTTP E0 já existente.

[Evidência do comando](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/testes-contrato-e1.command.json), [stdout](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/testes-contrato-e1.stdout.log), [stderr](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/testes-contrato-e1.stderr.log). Rastros de cliente dos oito testes novos em ../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/contratos-http/, separados das métricas das arquiteturas. Nenhum desses testes foi contabilizado como cenário k6 ou esforço de uma condição.

## Validador e oráculo CT-06/CT-07

O oráculo foi derivado da matriz congelada e não importa a API, shared/, helpers nem código de nenhuma suíte. O validador verifica:

- Sequência e quantidade de chamadas, método, pathname e query completa.
- Headers semânticos: Content-Type, Host da instância observada, User-Agent k6, Bearer após login e ausência de Authorization no login; Content-Length dos payloads.
- Payload JSON, códigos HTTP, Content-Type de resposta, parsing e campos de negócio obrigatórios.
- Quantidade, sequência, labels exatos e valor de todos os checks.
- Configuração e execução: 1 VU, 1 iteração, executor shared-iterations para profiles nomeados, threshold rate==1, uma iteração concluída e ausência de falha HTTP.
- Comparação com o oráculo e, quando as duas suítes completas estão presentes, comparação entre pares, incluindo respostas. Só normaliza ordem de chaves, portas efêmeras e IDs/tokens encadeados.

As APIs são iniciadas em processos separados e portas efêmeras por entrada. Opções K6_* herdadas são removidas, com nomes registrados, para evitar sobrescritas ambientais. Os scripts continuam responsáveis por declarar a carga correta; o validador não corrige profiles inválidos.

### Testes de rejeição e configuração futura

```powershell
node --test scripts/validacao/oraculos.test.mjs
```

**30/30 testes passaram**, incluindo rejeições de ordem, método, rota/query, autenticação, headers, payload, status, campos/tipos, JSON inválido/null, checks faltantes/fora de ordem/reprovados, labels errados, VUs, iterações, contagens, falhas HTTP e API não pronta. Esses testes usam fixtures explicitamente sintéticas; não representam execução real dos cenários E1.

[Comando](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/testes-oraculo.command.json), [stdout](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/testes-oraculo.stdout.log).

### Sonda HTTP independente

```powershell
node scripts/validacao/verificar-oraculo-e1.mjs <pasta-nova>
```

A sonda Node enviou três chamadas para cada contrato:

- CT-06: login → catálogo filtrado principal → produto p1.
- CT-07: login → estoque p1 → estoque p2.

**Dois contratos aprovados contra o oráculo, seis requisições recebidas no total**, com respostas reais. [Resultado corrigido](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/oraculo-http-corrigido/result.json), [comando](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/sonda-oraculo-http-corrigida.command.json). Rastros brutos por CT nas subpastas desse diretório.

Isso comprova a preparação HTTP da API/oráculo, **não** a implementação ou equivalência dos futuros scripts. A sonda não usa k6, não declara VUs/iterações e não produz checks k6; esses campos estão explicitamente false/não verificados no resultado.

### Gate de entradas ausentes

```powershell
node scripts/validacao/validar.mjs --state E1 --out <pasta-nova>
```

Sem manifesto com os cenários reais, o comando retornou **1**, como esperado, e gravou validation_passed=false / complete_functional_equivalence=false. [Resultado](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/preflight-e1-sem-cenarios/result.json). Isso confirma que o validador não aprova E1 apenas por existir um oráculo.

Na etapa medida, fornecer --manifest com os caminhos efetivamente criados. --suite tradicional ou modular permite validar uma condição isolada; --suite both exige catorze entradas E1. Documentação: [manual do validador](../scripts/validacao/README.md).

## Regressão real de E0

```powershell
node scripts/validacao/validar.mjs --state E0 --out <pasta-nova>
```

**10/10 execuções reais bem-sucedidas; 28 requisições recebidas; 60/60 checks aprovados.** Inspect/run retornaram zero em todas; cada entrada manteve 1 VU/1 iteração, uma iteração concluída e nenhuma falha HTTP. Oráculo e comparação pareada aprovaram os cinco pares.

| Cenário | Requests por arquitetura | Checks aprovados por arquitetura | Par |
|---|---:|---:|---|
| CT-01 | 1 | 2 | Equivalente nas condições executadas |
| CT-02 | 3 | 6 | Equivalente nas condições executadas |
| CT-03 | 3 | 6 | Equivalente nas condições executadas |
| CT-04 | 3 | 7 | Equivalente nas condições executadas |
| CT-05 | 4 | 9 | Equivalente nas condições executadas |

[Resultado consolidado](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/regressao-e0/result.json), [comando](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/regressao-e0.command.json), [stdout](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/regressao-e0.stdout.log). Cada pasta tradicional_ctNN/modular_ctNN contém inspect, opções, comandos, logs de API/k6, rastros recebidos com responses, métricas, summary, checks e resultado individual. As comparações ct01–ct05 estão na raiz da pasta de regressão.

A conclusão limita-se à baseline E0 executada nessa API, sem alegar equivalência de novos cenários ou desempenho sob carga.

## Preservação, ambiente e rastreabilidade

- As 29 fontes das suítes (5 tradicionais + 24 modulares) têm os mesmos SHA-256 da validação E0 e da verificação inicial. Incluem integralmente os dois helpers.
- Nenhum arquivo de tradicional/ ou modular/ foi criado, alterado ou removido.
- Os 1.465 arquivos históricos inventariados no início (acervo separado, validação anterior e prontidão metodológica) mantiveram os hashes; evidências antigas e ultima_execucao.txt não foram sobrescritos.
- As duas tags mantiveram tanto os objetos anotados quanto os commits de destino.
- A mudança de API é intencional e está no commit próprio; a regressão demonstra compatibilidade funcional E0. Não se exige que api/server.js tenha o hash antigo após a ampliação autorizada.
- O auditor antigo de preservação estrita E0 continua histórico e exige API idêntica a E0; esta preparação usa a conferência explícita por escopo, registrada em integridade-final.json, sem enfraquecer silenciosamente essa condição.

Ambiente observado nesta preparação: Node v24.10.0; npm 11.6.1; k6 v2.3.0 (e088784614, Go 1.26.8, windows/amd64); Git 2.51.0.windows.2; Windows 10.0.26200 x64, America/Manaus. Comandos/saídas em ../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/versao-*.command.json e logs; [captura de ambiente e sessão](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/ambiente-preparacao.json). A captura não é medição de tempo de implementação.

## Ocorrências, correções e pendências

1. A primeira sonda reprovou porque res.getHeaders() não retornava os headers enviados explicitamente por writeHead na API. A falha era da observação: corpos e status já estavam corretos, mas o oráculo recusou a captura incompleta. A instrumentação passou a observar writeHead, preservando os dados e chamando a implementação original. A sonda foi repetida em pasta nova e passou. [Tentativa reprovada](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/oraculo-http/result.json) e [comando](../evidencias/preparacao_e1/2026-11-05T18-49-16-610Z/sonda-oraculo-http.command.json) foram mantidos.
2. Houve uma tentativa administrativa de staging com pathspec inexistente, recusada pelo Git. Nenhum commit ou fonte foi alterado por ela; o staging foi repetido com os caminhos corretos. O registro está em ocorrencias.json.
3. A saída 1 do preflight E1 sem cenários foi um teste negativo esperado, não uma falha funcional pendente.
4. A rota de execução local foi Node/child_process, a mesma documentada no protocolo diante da falha anterior do lançador de shell. Não houve elevação de permissões, instalação de dependências ou alteração global de Git.
5. Não há bloqueio funcional remanescente na API/infraestrutura E1. Continuam pendentes, por escopo: implementar CT-06/CT-07 durante as unidades medidas, validar os catorze scripts E1 reais e demonstrar sua equivalência. Nenhuma dessas tarefas foi iniciada aqui.
6. Antes de cada unidade, recapturar a configuração conforme o protocolo e preparar isolamento e controlador temporal externo. Este relatório não substitui esses controles operacionais.

Os logs brutos mantiveram espaços finais, linhas finais e CRLF produzidos pelo k6/Node. O git diff --check sinalizou somente esses artefatos; eles foram preservados byte a byte. A checagem restrita a código e documentação passou. Saídas registradas em git-check-logs.stdout.log e git-check-fontes.command.json.

**Encerramento: preparação funcional concluída; E1 liberado para implementação medida sob o protocolo. O trabalho para aqui.** Não foram iniciadas unidades experimentais ou funcionalidades E2.
