# Auditoria metodológica das 14 unidades de execução

**Parecer.** P1 permanece aberta quanto à identidade e à configuração dos executores. P2 está parcialmente resolvida quanto às regras escritas, às orientações assimétricas e aos caminhos observados. P3 está parcialmente resolvida quanto às tentativas, aos tempos, às chamadas de edição e aos resultados de navegação. A validação funcional e o histórico de arquivos sustentam comparações entre as duas implementações entregues. A atribuição exclusiva das diferenças à arquitetura ultrapassa o controle documentado.

## Método e inventário

C = Comprovado. P = Parcialmente comprovado. I = Inferência. NV = Não verificável. X = Contraditório. T e M identificam as condições tradicional e modular. Cada link de unidade abre o JSONL primário. Os índices são step_index, não números de linha.

A unidade de análise é uma condição em uma etapa, com duas condições por etapa e E0 como referência. A auditoria consultou o corpus principal no checkout e os objetos Git históricos por leitura. Não houve checkout de estado, commit, reexecução de agente ou de k6. O antigo ensaio neutro do controlador em d26daa8 descreve outro procedimento, anterior à emenda de novembro. Seus metadados de modelo e sessão não foram transferidos para as unidades.

| Fonte e localização | Uso e limite |
|---|---|
| [Pendências](PENDENCIAS_VALIDACAO.md), [parecer](Analise_Critica_TCC.md), [correções](RELATORIO_CORRECOES.md), [resumo](RESUMO_ALTERACOES.md) e [DOCX de entrada](TCC_Revisado.docx) | Problemas, decisões anteriores e afirmações a verificar. Fontes secundárias para a execução. |
| [Protocolo](experimento_tcc/docs/PROTOCOLO_EVOLUCAO_INCREMENTAL.md), [matriz](experimento_tcc/docs/MATRIZ_REQUISITOS_EXPANSAO.md), [plano](experimento_tcc/docs/PLANO_MEDICAO_ESFORCO.md) e [manual](experimento_tcc/docs/EXECUCAO_MANUAL.md) | Desenho, contratos, ordem, instrumentos e regras, confrontados com 92c3bff, 785fb4f e 103a1e1. |
| [Transcrições e validações](experimento_tcc/evidencias/evolucao/) | 14 JSONL, 15 pastas de tentativa, sete validações both. Para eventos, usar fonte, tipo, índice, timestamp, argumentos e retorno quando presente. Para validações, examinar environment, command, entries, result, comparações e inventários. |
| [Git e fontes](experimento_tcc/) | Baseline histórica e base analítica, quatro expansões, três ramos de manutenção, consolidação df99b64 e checkout reorganizado 458f3d0. O prefixo experimento_tcc/ existe na cópia atual. Nos commits experimentais os caminhos começam na raiz. |
| [Coletor](experimento_tcc/scripts/metricas/coletar-metricas.mjs) e [validador](experimento_tcc/scripts/validacao/validar.mjs) | Semântica das contagens e dos critérios de aceitação. Para cada manutenção consultar o script do seu commit, que admite o estado M correspondente. |
| [Métricas originais](experimento_tcc/evidencias/metricas/), [consolidado](experimento_tcc/docs/RELATORIO_EXPERIMENTAL_COMPLETO.md) e [auditoria anterior](experimento_tcc/evidencias/auditoria/RELATORIO_AUDITORIA_RASTREABILIDADE.md) | Confronto de indicadores, reexecuções técnicas históricas e divergências. Os relatórios interpretativos e as reexecuções posteriores não substituem os eventos do executor. |

Para cada unidade, foram comparados o JSONL e seu blob no commit da etapa, contadas as chamadas, normalizadas as aspas de caminhos e subtraídos os created_at extremos. Os nomes de arquivos de escrita foram confrontados com git diff do pai ao filho. Em E2-M e M1-T os argumentos preservados permitem ainda comparação de conteúdo. Para cada validação pareada, os SHA-256 de todos os arquivos inventariados foram recalculados sobre os blobs do commit final. Nas tentativas individuais, foram comparados os snapshots antes/depois onde ambos existem e a suíte-alvo ao estado pareado. Os horários da validação provêm dos registros internos, independentemente da data de cópia dos arquivos.

**Comprovado.** As 14 cópias das transcrições são byte a byte iguais aos blobs das etapas. Os SHA-256 dos sete inventários pareados coincidem integralmente com os fontes finais. **Não verificável.** A concordância não autentica a exportação externa. Há índices omitidos, payloads ausentes e conteúdo truncado. A sequência de passos tampouco fornece uma trilha completa dos outros processos. A coluna de chamadas abaixo mede solicitações, inclusive as que falharam.

## P1 — Matriz das unidades e limites de identificação


| Unidade / fonte | Commit final | Passos extremos (linhas JSONL) | Texto inicial | Ferramentas e contagens | s | Última tentativa individual |
|---|---|---|---|---|---|---|
| [E1-T](experimento_tcc/evidencias/evolucao/E1/transcripts/tradicional.transcript.jsonl) | 452524a | 0–14 (4 registros) | NV, passo 0 sem texto | read 8, write 3, run 1 | 48 | [attempt-02](experimento_tcc/evidencias/evolucao/E1/tentativas_tradicional/attempt-02/result.json) |
| [E1-M](experimento_tcc/evidencias/evolucao/E1/transcripts/modular.transcript.jsonl) | 452524a | 0–36 (7 registros) | NV, passo 0 sem texto | read 30, edit 4, write 8 | 87 | [attempt-01](experimento_tcc/evidencias/evolucao/E1/tentativas_modular/attempt-01/result.json) |
| [E2-T](experimento_tcc/evidencias/evolucao/E2/transcripts/tradicional.transcript.jsonl) | bceabc3 | 0–11 (4 registros) | NV, passo 0 sem texto | read 8, write 4 | 13 | [attempt-01](experimento_tcc/evidencias/evolucao/E2/tentativas_tradicional/attempt-01/result.json) |
| [E2-M](experimento_tcc/evidencias/evolucao/E2/transcripts/modular.transcript.jsonl) | bceabc3 | 0–51 (52 registros) | P, texto truncado | read 29, run 1, edit 1, write 13 | 162 | [attempt-01](experimento_tcc/evidencias/evolucao/E2/tentativas_modular/attempt-01/result.json) |
| [E3-T](experimento_tcc/evidencias/evolucao/E3/transcripts/tradicional.transcript.jsonl) | 6c1ab09 | 0–15 (5 registros) | NV, passo 0 sem texto | read 10, write 3 | 47 | [attempt-01](experimento_tcc/evidencias/evolucao/E3/tentativas_tradicional/attempt-01/result.json) |
| [E3-M](experimento_tcc/evidencias/evolucao/E3/transcripts/modular.transcript.jsonl) | 6c1ab09 | 0–27 (6 registros) | NV, passo 0 sem texto | read 21, edit 3, write 8 | 95 | [attempt-01](experimento_tcc/evidencias/evolucao/E3/tentativas_modular/attempt-01/result.json) |
| [E4-T](experimento_tcc/evidencias/evolucao/E4/transcripts/tradicional.transcript.jsonl) | a84091f | 0–12 (4 registros) | NV, passo 0 sem texto | read 8, write 4 | 49 | [attempt-01](experimento_tcc/evidencias/evolucao/E4/tentativas_tradicional/attempt-01/result.json) |
| [E4-M](experimento_tcc/evidencias/evolucao/E4/transcripts/modular.transcript.jsonl) | a84091f | 0–25 (5 registros) | NV, passo 0 sem texto | read 20, edit 3, write 10 | 116 | [attempt-01](experimento_tcc/evidencias/evolucao/E4/tentativas_modular/attempt-01/result.json) |
| [M1-T](experimento_tcc/evidencias/evolucao/M1/transcripts/tradicional.transcript.jsonl) | 4902526 | 0–19 (20 registros) | C, texto da tarefa | read 17, edit 15 | 8 | [attempt-01](experimento_tcc/evidencias/evolucao/M1/tentativas_tradicional/attempt-01/result.json) |
| [M1-M](experimento_tcc/evidencias/evolucao/M1/transcripts/modular.transcript.jsonl) | 4902526 | 0–9 (4 registros) | NV, passo 0 sem texto | read 5, edit 1 | 19 | [attempt-01](experimento_tcc/evidencias/evolucao/M1/tentativas_modular/attempt-01/result.json) |
| [M2-T](experimento_tcc/evidencias/evolucao/M2/transcripts/tradicional.transcript.jsonl) | c8be840 | 0–11 (12 registros) | C, texto da tarefa | read 9, edit 8 | 12 | [attempt-01](experimento_tcc/evidencias/evolucao/M2/tentativas_tradicional/attempt-01/result.json) |
| [M2-M](experimento_tcc/evidencias/evolucao/M2/transcripts/modular.transcript.jsonl) | c8be840 | 0–193 (194 registros) | C, texto da tarefa | read 151, edit 1 | 411 | [attempt-01](experimento_tcc/evidencias/evolucao/M2/tentativas_modular/attempt-01/result.json) |
| [M3-T](experimento_tcc/evidencias/evolucao/M3/transcripts/tradicional.transcript.jsonl) | 4df995a | 0–10 (11 registros) | C, texto da tarefa | read 8, edit 7 | 8 | [attempt-01](experimento_tcc/evidencias/evolucao/M3/tentativas_tradicional/attempt-01/result.json) |
| [M3-M](experimento_tcc/evidencias/evolucao/M3/transcripts/modular.transcript.jsonl) | 4df995a | 0–13 (14 registros) | C, texto da tarefa | read 10, edit 1 | 18 | [attempt-01](experimento_tcc/evidencias/evolucao/M3/tentativas_modular/attempt-01/result.json) |


**Comprovado.** Há um registro inicial SYSTEM_MESSAGE por unidade. Há texto em E2-M (truncado) e nas cinco manutenções M1-T, M2-T/M e M3-T/M. As outras oito transcrições preservam apenas metadados dessa mensagem. Os primeiros passos de modelo têm diferentes contagens de entrada. O remetente de E2-M difere do remetente comum das cinco mensagens de manutenção. Os identificadores literais, os tokens iniciais, os caminhos consultados, as ferramentas acionadas e as limitações por unidade estão na [matriz de controle](MATRIZ_CONTROLE_AGENTES.md).

**Parcialmente comprovado.** Os eventos demonstram quais ferramentas foram chamadas e, em alguns casos, quais resultados retornaram. Em E2-M, por exemplo, find sobre modular/ retorna código zero e caminhos, e a edição e as criações têm resultados. Em M2-M o retorno distingue arquivo acessível, caminho ausente e diretório. As versões de ferramentas de validação encontram-se nos environment.json (por exemplo Node v24.18.0 e k6 v2.0.0 em M2-M). Os campos descrevem o processo de validação. Nem esses registros nem a contagem de tokens identificam o backend de IA.

**Não verificável nas 14 unidades.** Não há vínculo autenticado entre unidade e versão de modelo, parâmetros, sessão do provedor, política de ferramentas, diretório corrente do subagente ou contexto inicial integral. A regra planejada de um modelo comum, nova sessão e isolamento permanece uma hipótese do delineamento. Não se recuperou instrução integral de desenvolvedor, configuração de sandbox ou registro de criação, retomada e encerramento de cada sessão. As diferenças de ferramentas usadas e os textos das tarefas estão demonstrados no escopo da transcrição.

**Comprovado apenas na preparação.** A captura de prontidão de 5 de novembro em `d26daa8:evidencias/prontidao/2026-11-05T17-36-24-859Z/codex-efetivo.json` registra turn.model = gpt-6.1-sol, turn.reasoning_effort = low e turn.codex_version = 0.166.0. exact_model_snapshot.value é nulo. O arquivo possui identificadores do turno preparatório. Nenhum vínculo o associa como executor das 14 unidades de 8 e 9 de novembro.

**Parcialmente comprovado quanto ao contexto lido.** Em seis unidades há 101 retornos de arquivo com linhas numeradas comparáveis ao commit pai (E2-M: 29, M1-T: 17, M2-T: 9, M2-M: 28, M3-T: 8, M3-M: 10). Os trechos numerados coincidem com as linhas correspondentes da base, integralmente ou até o corte da exportação. Por exemplo, M2-M/164 contém um trecho abreviado do fluxo de compra completa. Essa comparação atesta conteúdo devolvido após as chamadas. Permanece indeterminado o que o agente já conhecia antes da primeira chamada.

## P2 — Liberdade arquitetural e correspondência operacional

**Parcialmente comprovado.** A v1.0 permitia helpers necessários compatíveis com cada baseline e vedava impor duplicação artificial. A v2.1 caracteriza a tradicional como scripts diretos. Faltam os quatro textos das expansões tradicionais, e a matriz comum admite checks diretos ou por helper. A ausência de import interno tradicional em E4 descreve o código. A razão histórica para não extrair funções permanece NV.

**Comprovado.** Em M2 e M3 os prompts direcionam a modular ao caso de uso central e a tradicional aos scripts individuais. Em E2-M há exigência textual de conservar quatro camadas, com instrução de reuso. A validação pareada comprova os mesmos resultados nos CTs executados. Não estabelece paridade de contexto ou de orientação sobre como chegar a eles.

**Contraditório.** Em cinco manutenções o texto proíbe usar edit_file e o modelo solicita essa ferramenta. Em M1-T/19 há prova textual mais forte que a coincidência de alvos. Cada substituição possui um único alvo no pai E4 e reconstrói o arquivo versionado em 4902526. Em M1-M há uma chamada de edição sem texto inicial recuperável. Não se pode estender automaticamente a ela a mesma contradição. A [análise de comparabilidade](ANALISE_COMPARABILIDADE.md) discrimina as sete fases, o reuso, as restrições e os diffs correspondentes.

## P3 — Validação externa e autoria

**Comprovado.** O validador Node inventaria fontes, registra versões e a revisão Git, verifica o array de entradas, executa k6 inspect, inicia a API observada para cada entrada e registra a chamada k6 run. Os result.json individuais contêm os julgamentos do oráculo. Em both a comparação alcança as duas sequências normalizadas e os checks. A cronologia indica cada tentativa, a primeira marca de processo e o último ponto k6. A sequência inclui 14 tentativas individuais aprovadas, uma tentativa individual inválida no preflight e sete aprovações pareadas. As contagens de ciclos originais permanecem preservadas. [Linha do tempo](LINHA_TEMPO_EXECUCOES.md)

| Questão de autoria | Classificação e evidência |
|---|---|
| Solicitação explicitamente atribuída ao agente | **Comprovado.** E1-T/14, source MODEL, traz o comando do validador e o destino attempt-01. E2-M/1, por sua vez, solicita find, não o validador mencionado no prompt. As chamadas de edição também têm source MODEL. |
| Processo que executou os testes | **Comprovado** para os processos filhos registrados (comando, cwd, instante, exit_code). **Parcialmente comprovado** para a ligação da solicitação E1-T à tentativa de mesmo destino. Não há ID do pai que conecte os dois lados. |
| Iniciador das demais tentativas e das sete validações both | **Não verificável.** Os resultados e versões existem fora das transcrições. Não há eventos de agendamento correlacionáveis com pessoa ou agente identificado. O validador registra subprocessos, não o operador que o invocou. |
| Intervenção humana comprovada durante unidade | **Não verificável.** Não se localizou mensagem atribuída explicitamente a humano ordenando correção, comando manual identificado ou trilha de edição humana. Sender, autoria Git e status DONE de um passo não individualizam o operador. |
| Mudança de artefato com autoria desconhecida | **Parcialmente comprovado.** E1-T passa de preflight inválido a validação bem-sucedida. O primeiro erro informa o tipo de entrada esperado. A segunda pasta contém as entradas aceitas. Não há cópia integral do manifesto rejeitado nem registro da correção aplicada ou de quem escolheu a entrada seguinte. |
| Possíveis edições externas e preparação comum | **Comprovado** para diferenças de arquivos em snapshots Git e estabilidade entre inventários capturados. **Não verificável** para autoria, alterações transitórias ou etapas omitidas. O inventário exclui manifestos JSON e não é monitoramento contínuo. Os commits M incluem API, oráculo e suítes juntos sobre E4. A preparação em commit separado, prevista pelo protocolo, não está materializada como pai intermediário desses três commits. |

**Contraditório quanto à execução estritamente sequencial.** M1, M2 e M3 têm intervalos sobrepostos entre T e M (7, 12 e 6 s). **Comprovado quanto à independência Git.** Os commits são irmãos, todos com pai a84091f. **Não verificável quanto à contaminação.** As duas condições aparecem nos inventários do validador. Esse acesso pertence ao validador e não identifica leitura cruzada por um subagente. A hora de conclusão declarada das unidades permanece indisponível. Todos os primeiros marcadores internos de validação individual são posteriores ao último passo da respectiva transcrição.

## P3 — O que aconteceu nas 151 leituras de M2 modular

**Comprovado.** De 20:00:37 a 20:07:28 UTC, em 9 de novembro, há 151 read_file mais uma edit_file e nenhum run_command. O intervalo de 411 s é de parede entre passos. As 151 solicitações visaram 151 caminhos distintos. Houve 28 retornos de conteúdo, 113 erros de caminho inexistente e dez erros de diretório. A ordem de cada lote de chamadas foi emparelhada aos retornos GENERIC imediatamente seguintes. A árvore Git de E4 confirma para cada alvo se era arquivo, diretório ou ausente. O passo 193 solicita editar o caminho já lido nos passos 1–3. [Transcrição M2-M](experimento_tcc/evidencias/evolucao/M2/transcripts/modular.transcript.jsonl)


| Diretório ou grupo de caminhos | Com conteúdo | Inexistentes | Diretórios | Total de chamadas |
|---|---|---|---|---|
| docs | 1 | 0 | 0 | 1 |
| modular/01-login.js | 0 | 1 | 0 | 1 |
| modular/03-criar-pedido.js | 0 | 1 | 0 | 1 |
| modular/CT-01.js | 0 | 1 | 0 | 1 |
| modular/ct-01.js | 0 | 1 | 0 | 1 |
| modular/ct-03-criar-pedido.js | 0 | 1 | 0 | 1 |
| modular/ct03.js | 0 | 1 | 0 | 1 |
| modular/ct03.test.js | 0 | 1 | 0 | 1 |
| modular/dados | 0 | 1 | 0 | 1 |
| modular/data | 0 | 20 | 0 | 20 |
| modular/fixtures | 0 | 1 | 0 | 1 |
| modular/flows | 10 | 41 | 6 | 57 |
| modular/helpers | 2 | 1 | 0 | 3 |
| modular/index.js | 0 | 1 | 0 | 1 |
| modular/profiles | 4 | 3 | 1 | 8 |
| modular/scenarios | 5 | 18 | 3 | 26 |
| modular/suite.js | 0 | 1 | 0 | 1 |
| modular/suite.test.js | 0 | 1 | 0 | 1 |
| modular/test-cases | 0 | 2 | 0 | 2 |
| modular/tests | 0 | 9 | 0 | 9 |
| modular/use-cases | 5 | 7 | 0 | 12 |
| shared | 1 | 0 | 0 | 1 |


**Comprovado.** O arquivo de criação de pedido estava indicado no prompt e devolveu conteúdo no passo 3. Depois vieram alternativas de grafia, nomes em inglês e português, layouts de dados/testes e consultas a diretórios. Não há repetição literal de caminho entre os 151 pedidos. Há repetição da estratégia de busca por variantes. Por exemplo, os passos 105 e 110 tentam variantes de ct03 e createOrder sob scenarios/pedidos, e 130 envia diretórios de flows para uma ferramenta de arquivo. O retorno de conteúdo inclui os oito fluxos consumidores de createOrder no estado E4. A edição final indicada atinge somente createOrder.useCase.js no diff a84091f..c8be840.

**Inferência sobre finalidade.** As leituras de protocolo e configuração são compatíveis com identificação do requisito e das convenções. As de helpers e use-cases são compatíveis com inspeção de transporte, predicados e payload. As de flows e scenarios são compatíveis com procura dos consumidores. Perfis de carga, fluxo de autenticação e fluxo de catálogo têm relação indireta com alterar POST /orders. Sua leitura é observável, mas não se pode determinar que o agente os considerou irrelevantes ou que eram necessários. O padrão de nomes e os erros demonstram dificuldade concreta de localização de arquivos adicionais. A causa de tantas tentativas e o efeito de uma ferramenta de listagem ou de instruções diferentes são NV. A regra explícita de usar read_file não certifica ausência de outras ferramentas habilitadas.

## Divergências e consequências para a monografia

| Evidências em confronto | Classificação e tratamento |
|---|---|
| Modelo comum e prompts padronizados no plano versus ausência de configuração e orientações específicas no registro | **Parcialmente comprovado** para o plano e para as mensagens recuperadas. Identidade técnica e equivalência operacional continuam abertas. |
| Protocolo manda o subagente validar versus cinco prompts de manutenção de somente leitura e validações externas | **Contraditório** como instrução operacional. Reconhecer que os resultados existem e que o acionamento nem sempre é atribuível. |
| Protocolo M3 indica oito e enumera sete CTs | **Contraditório.** Sete enumerados, sete scripts tradicionais alterados, sete consultas nos prompts. Nenhuma métrica foi recalculada para substituir o registro histórico. |
| E1-T, dois ciclos funcionais publicados, primeiro sem cenários | **Contraditório** no sentido do rótulo. A regra implementada conta a pasta inválida. Conservar número e explicitar que somente a segunda tentativa avaliou cenários. |
| Narrativa de M2-M atribui navegação à falta de listagem | **Comprovado** para os erros, a regra textual, o caminho inicial e os oito consumidores localizados. **Não verificável** para o inventário de capacidades e para a causa contrafactual. |
| Declarações de isolamento e ausência de digitação humana versus falta de auditoria de acesso e de intervenções | **Não verificável** na execução integral. Nenhum alvo conhecido aponta à outra suíte. Os 42 alvos de chamadas em E1-M são desconhecidos, e registros incompletos impedem certificar ausência global. |

A cópia da monografia altera sete parágrafos nas seções 4.7, 5.4, 5.7, 5.9 e 6.4. As seções 5.10, 6.5 e 7 já delimitam o alcance da auditoria técnica, a ausência da condição intermediária e a incerteza sobre o efeito adicional das camadas. Os indicadores históricos, a bibliografia, as nove tabelas e as cinco figuras foram preservados. O pacote foi validado por CRC, leitura de XML e reabertura. Somente word/document.xml difere entre os pacotes. No Word, as duas versões repaginaram em 43 páginas e os 57 marcadores de destinos do sumário e das listas conservaram suas páginas.

## Como conferir os vínculos

Os comandos de leitura abaixo usam a raiz do repositório atual. Para a contagem de caminhos, remover apenas as aspas adicionais de serialização de Path. Para distinguir conteúdo, ausência e diretório, consultar os campos content dos retornos consecutivos em cada lote.

```sh
git show 92c3bff:PROTOCOLO_EVOLUCAO_INCREMENTAL.md
git show 103a1e1:docs/PROTOCOLO_EVOLUCAO_INCREMENTAL.md
git show -s --format='%h %p' 4902526 c8be840 4df995a
git diff a84091f 4902526 -- tradicional modular
git show c8be840:evidencias/evolucao/M2/transcripts/modular.transcript.jsonl | jq -s '[.[] | .tool_calls[]? | .name] | group_by(.) | map({ferramenta: .[0], n: length})'
```

## Apêndice — Todos os caminhos solicitados em M2 modular

Caminhos relativos à raiz histórica /mnt/d/TCC. “Conteúdo” indica retorno com linhas de arquivo, inclusive quando a exportação abrevia o texto. A finalidade interpretativa por família está discutida acima. O inventário não reproduz o conteúdo das leituras.

| Passo da chamada | Passo do retorno | Caminho solicitado | Resposta |
|---|---|---|---|
| 1 | 2 | `docs/PROTOCOLO_EVOLUCAO_INCREMENTAL.md` | conteúdo |
| 1 | 3 | `modular/use-cases/pedidos/createOrder.useCase.js` | conteúdo |
| 4 | 5 | `modular/suite.test.js` | ausente |
| 6 | 7 | `modular/helpers/checks/checks.js` | conteúdo |
| 6 | 8 | `modular/data/orders.data.js` | ausente |
| 9 | 10 | `modular/data/pedidos.data.js` | ausente |
| 9 | 11 | `modular/flows/pedidos.flow.js` | ausente |
| 12 | 13 | `shared/config.js` | conteúdo |
| 12 | 14 | `modular/data/testData.js` | ausente |
| 15 | 16 | `modular/flows/pedidos/createOrder.flow.js` | ausente |
| 15 | 17 | `modular/data/pedidos/orders.data.js` | ausente |
| 15 | 18 | `modular/test-cases/ct03-criar-pedido.test.js` | ausente |
| 15 | 19 | `modular/tests/ct03-criar-pedido.test.js` | ausente |
| 20 | 21 | `modular/helpers/http/http.js` | conteúdo |
| 20 | 22 | `modular/data/pedidos.js` | ausente |
| 20 | 23 | `modular/data/orders.js` | ausente |
| 20 | 24 | `modular/flows/pedidos/order.flow.js` | ausente |
| 25 | 26 | `modular/tests/ct03.test.js` | ausente |
| 25 | 27 | `modular/test-cases/ct03.test.js` | ausente |
| 25 | 28 | `modular/ct03.test.js` | ausente |
| 25 | 29 | `modular/ct03.js` | ausente |
| 30 | 31 | `modular/use-cases/pedidos/getOrder.useCase.js` | conteúdo |
| 30 | 32 | `modular/use-cases/pedidos/getOrderById.useCase.js` | ausente |
| 30 | 33 | `modular/use-cases/pedidos/listOrders.useCase.js` | conteúdo |
| 30 | 34 | `modular/use-cases/pedidos/cancelOrder.useCase.js` | ausente |
| 35 | 36 | `modular/ct-03-criar-pedido.js` | ausente |
| 35 | 37 | `modular/tests/pedidos/pedidos.test.js` | ausente |
| 35 | 38 | `modular/flows/pedidos/pedidos.flow.js` | ausente |
| 35 | 39 | `modular/data/pedidos/pedidos.data.js` | ausente |
| 40 | 41 | `modular/use-cases/pedidos/updateOrderStatus.useCase.js` | ausente |
| 40 | 42 | `modular/data/orders.json` | ausente |
| 40 | 43 | `modular/data/pedidos.json` | ausente |
| 40 | 44 | `modular/flows/createOrder.flow.js` | ausente |
| 45 | 46 | `modular/ct-01.js` | ausente |
| 45 | 47 | `modular/CT-01.js` | ausente |
| 45 | 48 | `modular/tests/ct-01.js` | ausente |
| 45 | 49 | `modular/scenarios/ct-01.js` | ausente |
| 50 | 51 | `modular/flows/ct03.flow.js` | ausente |
| 50 | 52 | `modular/flows/ct-03.flow.js` | ausente |
| 50 | 53 | `modular/flows/pedidos/ct03.flow.js` | ausente |
| 50 | 54 | `modular/flows/pedidos/checkout.flow.js` | ausente |
| 55 | 56 | `modular/tests/login.test.js` | ausente |
| 55 | 57 | `modular/tests/pedidos.test.js` | ausente |
| 55 | 58 | `modular/tests/orders.test.js` | ausente |
| 55 | 59 | `modular/tests/createOrder.test.js` | ausente |
| 60 | 61 | `modular/flows/pedidos/createAndGetOrder.flow.js` | ausente |
| 60 | 62 | `modular/flows/pedidos/cancelOrder.flow.js` | ausente |
| 60 | 63 | `modular/flows/pedidos/listOrders.flow.js` | ausente |
| 60 | 64 | `modular/data/order.data.js` | ausente |
| 65 | 66 | `modular/use-cases/auth/login.useCase.js` | ausente |
| 65 | 67 | `modular/use-cases/autenticacao/login.useCase.js` | conteúdo |
| 65 | 68 | `modular/use-cases/pedidos/updateStatus.useCase.js` | ausente |
| 65 | 69 | `modular/use-cases/pedidos/patchOrderStatus.useCase.js` | ausente |
| 70 | 71 | `modular/data/pedidos/order.data.js` | ausente |
| 70 | 72 | `modular/data/pedidos/order.js` | ausente |
| 70 | 73 | `modular/data/autenticacao/login.data.js` | ausente |
| 70 | 74 | `modular/data/autenticacao/credentials.data.js` | ausente |
| 75 | 76 | `modular/flows/autenticacao/login.flow.js` | ausente |
| 75 | 77 | `modular/flows/pedidos/createOrder.js` | ausente |
| 75 | 78 | `modular/flows/pedidos.js` | ausente |
| 75 | 79 | `modular/data/index.js` | ausente |
| 80 | 81 | `modular/use-cases/pedidos/updateOrder.useCase.js` | conteúdo |
| 80 | 82 | `modular/use-cases/pedidos/patchOrder.useCase.js` | ausente |
| 80 | 83 | `modular/flows/pedidos/orderStatusUpdate.flow.js` | ausente |
| 80 | 84 | `modular/flows/pedidos/orderLookup.flow.js` | ausente |
| 85 | 86 | `modular/01-login.js` | ausente |
| 85 | 87 | `modular/03-criar-pedido.js` | ausente |
| 85 | 88 | `modular/flows/pedidos/criarPedido.flow.js` | ausente |
| 85 | 89 | `modular/flows/criarPedido.flow.js` | ausente |
| 90 | 91 | `modular/data/catalog.data.js` | ausente |
| 90 | 92 | `modular/data/cart.data.js` | ausente |
| 90 | 93 | `modular/data/payments.data.js` | ausente |
| 90 | 94 | `modular/data/payment.data.js` | ausente |
| 95 | 96 | `modular/flows` | diretório |
| 95 | 97 | `modular/data` | ausente |
| 95 | 98 | `modular/tests` | ausente |
| 95 | 99 | `modular/scenarios` | diretório |
| 100 | 101 | `modular/fixtures` | ausente |
| 100 | 102 | `modular/dados` | ausente |
| 100 | 103 | `modular/flows/pedidos` | diretório |
| 100 | 104 | `modular/scenarios/pedidos` | diretório |
| 105 | 106 | `modular/helpers/data` | ausente |
| 105 | 107 | `modular/scenarios/pedidos/ct03.scenario.js` | ausente |
| 105 | 108 | `modular/scenarios/pedidos/ct-03.scenario.js` | ausente |
| 105 | 109 | `modular/scenarios/pedidos/createOrder.scenario.js` | ausente |
| 110 | 111 | `modular/scenarios/pedidos/ct03.test.js` | ausente |
| 110 | 112 | `modular/scenarios/pedidos/ct-03.test.js` | ausente |
| 110 | 113 | `modular/scenarios/pedidos/createOrder.test.js` | ausente |
| 110 | 114 | `modular/scenarios/pedidos/createOrder.js` | ausente |
| 115 | 116 | `modular/scenarios/autenticacao` | diretório |
| 115 | 117 | `modular/scenarios/autenticacao/login.test.js` | ausente |
| 115 | 118 | `modular/scenarios/autenticacao/login.scenario.js` | ausente |
| 115 | 119 | `modular/scenarios/autenticacao/login.js` | ausente |
| 120 | 121 | `modular/scenarios/autenticacao/ct01-login.js` | ausente |
| 120 | 122 | `modular/scenarios/autenticacao/ct-01-login.js` | ausente |
| 120 | 123 | `modular/scenarios/autenticacao/ct01-login.test.js` | ausente |
| 120 | 124 | `modular/scenarios/autenticacao/autenticacao.test.js` | ausente |
| 125 | 126 | `modular/flows/pedidos/orderCreation.flow.js` | ausente |
| 125 | 127 | `modular/flows/pedidos/orderConsultation.flow.js` | ausente |
| 125 | 128 | `modular/flows/pedidos/orderStatus.flow.js` | ausente |
| 125 | 129 | `modular/flows/pedidos/orderCancellation.flow.js` | ausente |
| 130 | 131 | `modular/flows/autenticacao` | diretório |
| 130 | 132 | `modular/flows/catalogo` | diretório |
| 130 | 133 | `modular/flows/carrinho` | diretório |
| 130 | 134 | `modular/flows/pagamentos` | diretório |
| 135 | 136 | `modular/flows/autenticacao/auth.flow.js` | ausente |
| 135 | 137 | `modular/flows/autenticacao/authenticate.flow.js` | ausente |
| 135 | 138 | `modular/flows/autenticacao/authentication.flow.js` | ausente |
| 135 | 139 | `modular/flows/autenticacao/autenticacao.flow.js` | conteúdo |
| 140 | 141 | `modular/scenarios/autenticacao/autenticacao.scenario.js` | conteúdo |
| 140 | 142 | `modular/scenarios/autenticacao/ct01-autenticacao.js` | ausente |
| 140 | 143 | `modular/flows/pedidos/criacaoPedido.flow.js` | ausente |
| 140 | 144 | `modular/flows/pedidos/consultaPedido.flow.js` | ausente |
| 145 | 146 | `modular/profiles/pedidos/pedidos.profiles.js` | ausente |
| 145 | 147 | `modular/profiles/pagamentos/pagamentos.profiles.js` | conteúdo |
| 145 | 148 | `modular/scenarios/pedidos/pedidos.scenario.js` | ausente |
| 145 | 149 | `modular/scenarios/pagamentos/pagamentos.scenario.js` | ausente |
| 150 | 151 | `modular/profiles/pedidos/pedido.profiles.js` | ausente |
| 150 | 152 | `modular/profiles/catalogo/catalogo.profiles.js` | conteúdo |
| 150 | 153 | `modular/scenarios/catalogo/catalogo.scenario.js` | conteúdo |
| 150 | 154 | `modular/flows/catalogo/catalogo.flow.js` | conteúdo |
| 155 | 156 | `modular/profiles/pedidos` | diretório |
| 155 | 157 | `modular/flows/pedidos/pedido.flow.js` | ausente |
| 155 | 158 | `modular/flows/pedidos/statusPedido.flow.js` | ausente |
| 155 | 159 | `modular/flows/pedidos/cancelamentoPedido.flow.js` | ausente |
| 160 | 161 | `modular/flows/pedidos/criar-pedido.flow.js` | ausente |
| 160 | 162 | `modular/flows/pedidos/criacao-pedido.flow.js` | ausente |
| 160 | 163 | `modular/flows/pagamentos/pagamentoAprovado.flow.js` | ausente |
| 160 | 164 | `modular/flows/pagamentos/compraCompleta.flow.js` | conteúdo |
| 165 | 166 | `modular/scenarios/pagamentos/compraCompleta.scenario.js` | conteúdo |
| 165 | 167 | `modular/flows/pagamentos/pagamentoPedido.flow.js` | ausente |
| 165 | 168 | `modular/flows/pagamentos/estornoPagamento.flow.js` | ausente |
| 165 | 169 | `modular/flows/pagamentos/reembolsoPagamento.flow.js` | ausente |
| 170 | 171 | `modular/profiles/comum/smoke.profile.js` | conteúdo |
| 170 | 172 | `modular/profiles/carrinho/carrinho.profiles.js` | conteúdo |
| 170 | 173 | `modular/index.js` | ausente |
| 170 | 174 | `modular/suite.js` | ausente |
| 175 | 176 | `modular/profiles/pedidos/pedidos.profile.js` | ausente |
| 175 | 177 | `modular/flows/pedidos/listagemFiltrada.flow.js` | conteúdo |
| 175 | 178 | `modular/flows/pedidos/cancelamento.flow.js` | conteúdo |
| 175 | 179 | `modular/flows/pagamentos/pagamentoRecusado.flow.js` | ausente |
| 180 | 181 | `modular/scenarios/pedidos/listagemFiltrada.scenario.js` | conteúdo |
| 180 | 182 | `modular/scenarios/pedidos/cancelamento.scenario.js` | conteúdo |
| 183 | 184 | `modular/flows/pedidos/criacao.flow.js` | conteúdo |
| 183 | 185 | `modular/flows/pedidos/consulta.flow.js` | conteúdo |
| 183 | 186 | `modular/flows/pedidos/atualizacao.flow.js` | conteúdo |
| 183 | 187 | `modular/flows/pedidos/status.flow.js` | ausente |
| 188 | 189 | `modular/flows/pagamentos/aprovado.flow.js` | ausente |
| 188 | 190 | `modular/flows/pagamentos/recusado.flow.js` | ausente |
| 188 | 191 | `modular/flows/pagamentos/aprovacao.flow.js` | conteúdo |
| 188 | 192 | `modular/flows/pagamentos/recusa.flow.js` | conteúdo |
