# Coletor temporal — versão 1

Infraestrutura comum, fora das suítes. Requer apenas Node.js; nenhuma dependência nova. Não inicia medições definitivas por conta própria.

## Executar e usar

```powershell
node scripts/medicao/coletor.mjs --dir evidencias/evolucao/E1/tradicional/E1-T/eventos --unit E1-T
```

Manter esse processo aberto durante toda a sessão de medição. Cada linha de stdin é um comando JSON; cada linha de stdout é um ACK JSON. O ACK só é enviado depois de escrever e executar fsync no evento. Antes de iniciar a atividade, aguardar o ACK com ok=true. Não executar a atividade se o comando falhar.

Exemplos de comandos enviados um a um; copiar o event_id retornado, não usar IDs inventados:

```json
{"action":"start","category":"humano_ativo","activity":"Ler o lote e preparar o prompt"}
{"action":"end","start_event_id":"ID_RETORNADO_NO_START"}
{"action":"start","category":"codex_execucao","activity":"Turno 1"}
{"action":"pause","reason":"Interrupção externa registrada"}
{"action":"resume","reason":"Retomada após interrupção"}
{"action":"end","start_event_id":"NOVO_ID_RETORNADO_NO_RESUME"}
{"action":"close"}
```

Quem registra a entrega do prompt e a chegada da resposta final deve estar **fora do turno medido**: operador ou controlador externo. Um agente iniciando o relógio dentro do próprio turno mede apenas parte dele. Não usar este piloto para afirmar duração integral de execução do Codex. Prompt e resposta brutos, configuração e intervenções são artefatos complementares, ligados ao event_id/turn_id.

O plano define as seis categorias do relógio principal. Só uma pode estar ativa. Sobreposição humana durante Codex usa track=humano_auxiliar, category=humano_ativo e related_start_id igual ao principal. Comando interno usa track=comando, categoria apropriada e a mesma referência. Encerrar subeventos antes do principal. Esses intervalos não se somam novamente ao tempo ativo.

A pausa fecha o intervalo principal, inicia categoria pausa e guarda a atividade suspensa. A retomada fecha a pausa e cria novo start_id para a atividade. O consumidor deve usar esse ID novo. Registrar motivo em ambas as operações.

## Resumo e recuperação

```powershell
node scripts/medicao/coletor.mjs --dir <pasta-eventos> --summary
node scripts/medicao/coletor.mjs --dir <pasta-eventos> --unit <unidade> --recover
```

O arquivo writer.lock evita dois escritores. --recover só remove lock cujo PID comprovadamente não existe (ESRCH); processo vivo ou liveness desconhecido bloqueia recuperação. Não apagar lock de um processo vivo, não executar coletores de unidades diferentes na mesma pasta e não editar eventos antigos.

Cada processo cria events.<clock_session_id>.jsonl exclusivo, com UTC, offset, process.hrtime.bigint em nanossegundos e representação em ms. IDs do relógio são UUIDs novos a cada processo. Eventos de sessões distintas nunca são subtraídos. Os timestamps civis são usados apenas para correlação.

Após queda, um start sem end permanece aberto, com duração null; o próximo session_start referencia esses intervalos. Não os encerrar com relógio novo, não inserir zero e não reconstruir duração por UTC. O resumo mostra somas known apenas dos intervalos completos, métricas públicas null quando não há observação ou quando há intervalo relevante aberto e duração entre sessões desconhecida. Um intervalo aberto preserva complete=false.

Log sem newline final/JSON inválido bloqueia leitura e retomada: preservar e auditar, sem reparo automático silencioso. Eventos antigos não são sobrescritos. fsync confirma a solicitação de persistência ao SO, sem prometer resistência a toda falha física de hardware.

O limite de 120 minutos do plano deve ser acompanhado pelo controlador antes/durante a unidade, com base no tempo ativo e nas lacunas expostas. Este coletor registra e resume; não mata o Codex nem infere atividade humana automaticamente. Não continuar medição com lacunas não resolvidas.

## Piloto e testes

```powershell
node --test scripts/medicao/coletor.test.mjs
node scripts/medicao/piloto.mjs <pasta-nova-do-piloto>
node scripts/prontidao/auditar.mjs <pasta-nova-da-auditoria>
```

COLLECTOR_TEST_DIR pode definir a pasta dos testes. Piloto: ordenar palavras e somar inteiros, com arquivos somente na pasta passada. Não acessa API, k6 ou suítes. Categorias humanas/Codex usadas em testes unitários são intervalos simulados, identificados como tal, não medições de trabalho real.

Cada repetição usa pasta nova; manter também as tentativas anteriores. O resultado do piloto delimita explicitamente seu escopo, sem extrapolar milissegundos de subprocessos para esforço de implementação.
