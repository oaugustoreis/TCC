# Linha do tempo das execuções e validações

C = Comprovado. P = Parcialmente comprovado. I = Inferência. NV = Não verificável. X = Contraditório. T e M identificam as condições tradicional e modular. Cada link de unidade abre o JSONL primário. Os índices são step_index, não números de linha.

**Comprovado.** Instantes UTC de 2026. E1 ocorreu em 8 de novembro e as demais unidades em 9 de novembro. Ordenação por início, dentro de cada conjunto. A duração publicada é a diferença entre os campos created_at extremos. GENERIC conta eventos desse tipo, que podem conter retornos. DONE é status de passo. Não foi localizada declaração final datada de entrega que permita fixar o encerramento de cada unidade. Por exemplo, a última criação em E2-M tem created_at às 16:22:49 e texto de conclusão da ferramenta às 16:22:59 UTC.

## Atividade observada dos agentes

| Unidade | Primeiro passo | Último passo | Intervalo (s) | Índices extremos | Eventos GENERIC |
|---|---|---|---|---|---|
| [E1-T](experimento_tcc/evidencias/evolucao/E1/transcripts/tradicional.transcript.jsonl) | 19:29:26 | 19:30:14 | 48 | 0–14 | 0 |
| [E1-M](experimento_tcc/evidencias/evolucao/E1/transcripts/modular.transcript.jsonl) | 19:34:23 | 19:35:50 | 87 | 0–36 | 0 |
| [E2-M](experimento_tcc/evidencias/evolucao/E2/transcripts/modular.transcript.jsonl) | 16:20:07 | 16:22:49 | 162 | 0–51 | 44 |
| [E2-T](experimento_tcc/evidencias/evolucao/E2/transcripts/tradicional.transcript.jsonl) | 16:29:27 | 16:29:40 | 13 | 0–11 | 0 |
| [E3-T](experimento_tcc/evidencias/evolucao/E3/transcripts/tradicional.transcript.jsonl) | 19:21:06 | 19:21:53 | 47 | 0–15 | 0 |
| [E3-M](experimento_tcc/evidencias/evolucao/E3/transcripts/modular.transcript.jsonl) | 19:22:57 | 19:24:32 | 95 | 0–27 | 0 |
| [E4-M](experimento_tcc/evidencias/evolucao/E4/transcripts/modular.transcript.jsonl) | 19:32:42 | 19:34:38 | 116 | 0–25 | 0 |
| [E4-T](experimento_tcc/evidencias/evolucao/E4/transcripts/tradicional.transcript.jsonl) | 19:36:03 | 19:36:52 | 49 | 0–12 | 0 |
| [M1-T](experimento_tcc/evidencias/evolucao/M1/transcripts/tradicional.transcript.jsonl) | 19:49:18 | 19:49:26 | 8 | 0–19 | 17 |
| [M1-M](experimento_tcc/evidencias/evolucao/M1/transcripts/modular.transcript.jsonl) | 19:49:19 | 19:49:38 | 19 | 0–9 | 0 |
| [M2-M](experimento_tcc/evidencias/evolucao/M2/transcripts/modular.transcript.jsonl) | 20:00:37 | 20:07:28 | 411 | 0–193 | 151 |
| [M2-T](experimento_tcc/evidencias/evolucao/M2/transcripts/tradicional.transcript.jsonl) | 20:00:38 | 20:00:50 | 12 | 0–11 | 9 |
| [M3-T](experimento_tcc/evidencias/evolucao/M3/transcripts/tradicional.transcript.jsonl) | 20:11:37 | 20:11:45 | 8 | 0–10 | 8 |
| [M3-M](experimento_tcc/evidencias/evolucao/M3/transcripts/modular.transcript.jsonl) | 20:11:39 | 20:11:57 | 18 | 0–13 | 10 |


## Tentativas e validações conjuntas

**Comprovado.** Primeiro marcador interno = started_utc de node.command.json ao consultar a versão. Último ponto = maior data.time de tipo Point nos metrics.jsonl dos CTs, convertido em UTC e exibido até milissegundos. Esses limites não datam a chamada do processo pai nem a gravação final de result.json. O SHA é o HEAD informado pelo processo Git durante a validação, antes do commit final. Nas suítes individuais, complete_functional_equivalence fica falso por construção. O teste dessa propriedade ocorre com both.

| Etapa | Condição | Resultado primário | Primeiro marcador | Último ponto k6 | Execuções CT | Desfecho | HEAD lido |
|---|---|---|---|---|---|---|---|
| E1 | E1-T | [attempt-01](experimento_tcc/evidencias/evolucao/E1/tentativas_tradicional/attempt-01/result.json) | 19:32:52.841 | — | 0 | preflight inválido | 103a1e1 |
| E1 | E1-T | [attempt-02](experimento_tcc/evidencias/evolucao/E1/tentativas_tradicional/attempt-02/result.json) | 19:33:39.675 | 19:33:41.595 | 7 | aprovada | 103a1e1 |
| E1 | E1-M | [attempt-01](experimento_tcc/evidencias/evolucao/E1/tentativas_modular/attempt-01/result.json) | 19:42:36.480 | 19:42:38.886 | 7 | aprovada | 103a1e1 |
| E1 | par | [validacao_both](experimento_tcc/evidencias/evolucao/E1/validacao_both/result.json) | 19:42:39.287 | 19:42:43.047 | 14 | aprovada | 103a1e1 |
| E2 | E2-M | [attempt-01](experimento_tcc/evidencias/evolucao/E2/tentativas_modular/attempt-01/result.json) | 16:28:57.447 | 16:29:01.587 | 10 | aprovada | 452524a |
| E2 | E2-T | [attempt-01](experimento_tcc/evidencias/evolucao/E2/tentativas_tradicional/attempt-01/result.json) | 17:05:32.713 | 17:05:35.248 | 10 | aprovada | 452524a |
| E2 | par | [validacao_both](experimento_tcc/evidencias/evolucao/E2/validacao_both/result.json) | 17:05:35.703 | 17:05:40.983 | 20 | aprovada | 452524a |
| E3 | E3-T | [attempt-01](experimento_tcc/evidencias/evolucao/E3/tentativas_tradicional/attempt-01/result.json) | 19:25:48.557 | 19:25:51.519 | 12 | aprovada | bceabc3 |
| E3 | E3-M | [attempt-01](experimento_tcc/evidencias/evolucao/E3/tentativas_modular/attempt-01/result.json) | 19:28:43.244 | 19:28:47.060 | 12 | aprovada | bceabc3 |
| E3 | par | [validacao_both](experimento_tcc/evidencias/evolucao/E3/validacao_both/result.json) | 19:28:47.579 | 19:28:53.564 | 24 | aprovada | bceabc3 |
| E4 | E4-M | [attempt-01](experimento_tcc/evidencias/evolucao/E4/tentativas_modular/attempt-01/result.json) | 19:44:25.612 | 19:44:30.814 | 15 | aprovada | 6c1ab09 |
| E4 | E4-T | [attempt-01](experimento_tcc/evidencias/evolucao/E4/tentativas_tradicional/attempt-01/result.json) | 19:46:24.944 | 19:46:28.769 | 15 | aprovada | 6c1ab09 |
| E4 | par | [validacao_both](experimento_tcc/evidencias/evolucao/E4/validacao_both/result.json) | 19:46:29.370 | 19:46:37.051 | 30 | aprovada | 6c1ab09 |
| M1 | M1-T | [attempt-01](experimento_tcc/evidencias/evolucao/M1/tentativas_tradicional/attempt-01/result.json) | 19:53:32.127 | 19:53:35.626 | 15 | aprovada | a84091f |
| M1 | M1-M | [attempt-01](experimento_tcc/evidencias/evolucao/M1/tentativas_modular/attempt-01/result.json) | 19:53:36.124 | 19:53:40.531 | 15 | aprovada | a84091f |
| M1 | par | [validacao_both](experimento_tcc/evidencias/evolucao/M1/validacao_both/result.json) | 19:53:41.042 | 19:53:48.289 | 30 | aprovada | a84091f |
| M2 | M2-M | [attempt-01](experimento_tcc/evidencias/evolucao/M2/tentativas_modular/attempt-01/result.json) | 20:09:06.814 | 20:09:11.782 | 15 | aprovada | a84091f |
| M2 | M2-T | [attempt-01](experimento_tcc/evidencias/evolucao/M2/tentativas_tradicional/attempt-01/result.json) | 20:09:12.324 | 20:09:15.780 | 15 | aprovada | a84091f |
| M2 | par | [validacao_both](experimento_tcc/evidencias/evolucao/M2/validacao_both/result.json) | 20:09:16.335 | 20:09:26.234 | 30 | aprovada | a84091f |
| M3 | M3-T | [attempt-01](experimento_tcc/evidencias/evolucao/M3/tentativas_tradicional/attempt-01/result.json) | 20:20:31.555 | 20:20:34.948 | 15 | aprovada | a84091f |
| M3 | M3-M | [attempt-01](experimento_tcc/evidencias/evolucao/M3/tentativas_modular/attempt-01/result.json) | 20:20:35.440 | 20:20:39.778 | 15 | aprovada | a84091f |
| M3 | par | [validacao_both](experimento_tcc/evidencias/evolucao/M3/validacao_both/result.json) | 20:20:40.302 | 20:20:47.565 | 30 | aprovada | a84091f |


**Parcialmente comprovado.** Em todas as 15 tentativas individuais, o primeiro marcador interno é posterior ao último created_at da própria transcrição. E1-T/14 registra às 19:30:14 o pedido do comando Node com state E1, suite tradicional e destino attempt-01. Há 158,841 s até node.command.json da pasta. Coincidem comando esperado, destino e resultado. Não há recibo do shell, PID pai ou ID de correlação para certificar quem iniciou o processo que gravou a pasta. Nenhum outro comando de validação consta nas 14 transcrições. E2-M/0 manda validar e repetir em caso de falha, mas E2-M/1 e /5 registram a listagem de arquivos, e a primeira tentativa preservada já passou.

**Comprovado.** Em E1-T/attempt-01, result.json registra “Manifesto deve ser array”, preflight falso, sem runs, métricas k6 ou inventário posterior. Em attempt-02 há entries.json aceito e sete execuções aprovadas. Os hashes inventariados da suíte tradicional já coincidem nas duas tentativas. A forma inválida original e a autoria da correção ou da escolha do manifesto não foram recuperadas. O coletor contabiliza dois ciclos, first_validation_pass falso e zero infra_error_runs. Houve uma execução funcional avaliável, aprovada. As demais 13 unidades têm uma tentativa individual aprovada cada. Os sete both e as reexecuções posteriores em auditoria/ têm finalidades distintas.

## Sobreposição e genealogia

**Comprovado.** M1 sobrepõe 19:49:19–19:49:26 (7 s), M2 sobrepõe 20:00:38–20:00:50 (12 s) e M3 sobrepõe 20:11:39–20:11:45 (6 s). Os horários de início seguem a alternância prevista. O procedimento sequencial descrito no protocolo diverge dos intervalos. M1, M2 e M3 não se sobrepõem entre si nos registros de agentes. Consultas de versão das tentativas dessas três tarefas ocorrem depois das duas janelas de agentes do respectivo par.


| Estado | Pai Git | Commit final | Data do committer (offset local) | Fontes inventariadas em both | both: CT / requisições / checks (soma T+M) |
|---|---|---|---|---|---|
| E1 | 103a1e1 | 452524a | 2026-11-09T12:08:00-04:00 | 46 | 14 / 40 / 84 |
| E2 | 452524a | bceabc3 | 2026-11-09T15:18:18-04:00 | 62 | 20 / 68 / 140 |
| E3 | bceabc3 | 6c1ab09 | 2026-11-09T15:29:32-04:00 | 72 | 24 / 84 / 172 |
| E4 | 6c1ab09 | a84091f | 2026-11-09T15:48:20-04:00 | 85 | 30 / 132 / 268 |
| M1 | a84091f | 4902526 | 2026-11-09T15:54:05-04:00 | 85 | 30 / 132 / 268 |
| M2 | a84091f | c8be840 | 2026-11-09T16:09:42-04:00 | 85 | 30 / 132 / 268 |
| M3 | a84091f | 4df995a | 2026-11-09T16:21:08-04:00 | 85 | 30 / 132 / 268 |


**Comprovado.** E0 histórico corresponde à tag e0-baseline-validada em e93c3fc. A base analítica de E1 é 103a1e1, com os mesmos 29 arquivos JS das suítes. A API evoluiu entre essas referências. Os três ramos manutencao/m1, manutencao/m2 e manutencao/m3 são filhos diretos da tag estado-e4, sem acumular a manutenção anterior. Os inventários de cada tentativa de manutenção incluem os fontes de ambas as condições já no estado final do par.

**Inferência.** Recursos comuns e atividade simultânea constituem vias possíveis de interferência. O caminho lógico comum e a ancestralidade dos snapshots não identificam o processo que aplicou alterações, mounts compartilhados ou transferência de contexto. **Não verificável.** Não há trilha suficiente para atribuir interferência ou excluir intervenções entre dois registros.
