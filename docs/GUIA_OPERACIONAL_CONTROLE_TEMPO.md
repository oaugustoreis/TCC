# Guia operacional do controle externo de tempo

A infraestrutura está implementada e testada. **O ensaio com o Codex real ainda está bloqueado neste ambiente**, porque o cliente falhou ao inicializar o app-server com “Acesso negado”. O ciclo técnico passou com um simulador explicitamente identificado. Não iniciar E1 com base nesse simulador: concluir primeiro o ensaio real, pelos marcadores manuais abaixo no cliente validado ou repetindo o ensaio CLI num terminal do operador.

Este guia operacionaliza o [plano congelado](PLANO_MEDICAO_ESFORCO.md); não altera categorias, definições, limite de 120 minutos, política de intervenções ou tags. Não reconstrói tempos da [tentativa bloqueada](RELATORIO_E1_TRADICIONAL.md).

## O que existia e o que foi acrescentado

O coletor original aceita start/end/pause/resume/close por JSON em stdin, exige event_id nos encerramentos e persiste com relógio monotônico. Comandos existentes:

```powershell
node scripts/medicao/coletor.mjs --dir <pasta> --unit <unidade>
node scripts/medicao/coletor.mjs --dir <pasta> --summary
```

Não existia um controlador de entrega/recebimento. A solução acrescentada é um único processo de terminal, [controlador.mjs](../scripts/medicao/controlador.mjs), que reutiliza o coletor sem modificá-lo. Guarda os IDs, arquiva prompts/respostas e fornece ACK antes do envio. Não precisa de servidor web, extensão ou pacote adicional.

Todos os comandos JSON abaixo são digitados **no terminal do controlador**, um por linha. Não são mensagens ao Codex. Aguarde ok=true antes de prosseguir; qualquer erro impede a ação dependente.

## 1. Ensaio neutro manual — antes de enviar qualquer tarefa

Abra PowerShell **como operador, fora do turno Codex a medir**. Não iniciar o relógio com uma ferramenta chamada de dentro do próprio turno.

Terminal A:

```powershell
Set-Location D:\TCC
node scripts/medicao/controlador.mjs --dir D:/TCC/evidencias/operacao_controlador/ensaio-manual-0001 --unit ENSAIO-MANUAL-0001 --mode ensaio
```

Usar pasta nova em cada tentativa; o controlador recusa reutilizar uma sessão. Manter o terminal aberto até o encerramento. Verificar ready=true.

Antes de ler/preparar a tarefa neutra, declarar atividade humana:

```json
{"action":"human-start","activity":"Preparar tarefa neutra e ambiente do cliente","observation":"operador"}
```

observation=operador é declaração explícita de atividade observada. Não usar esse valor em automação fingindo trabalho humano. observation=simulacao só serve ao ensaio/testes e produz tempo humano real null na auditoria.

Terminal B, ainda durante esse intervalo humano: preparar o texto exato em UTF-8 sem BOM e copiar **antes** de armar o turno:

```powershell
$pastaEnsaioTemporal = 'D:/TCC/evidencias/operacao_controlador/ensaio-manual-0001'
$arquivoPromptTemporal = "$pastaEnsaioTemporal/tarefa.txt"
$textoPromptTemporal = 'Ensaio neutro do controlador. O registro externo está em D:/TCC/evidencias/operacao_controlador/ensaio-manual-0001/controller.json. Não consulte nem altere as suítes ou o projeto. Calcule 2+3+5 e responda somente 10.'
[IO.File]::WriteAllText($arquivoPromptTemporal, $textoPromptTemporal, [Text.UTF8Encoding]::new($false))
Get-Content -LiteralPath $arquivoPromptTemporal -Raw | Set-Clipboard
```

Abra o cliente e a sessão neutra apropriada sem enviar ainda. Não aproveitar a sessão de preparação como condição medida.

Opcionalmente, testar pausa antes do envio, no Terminal A:

```json
{"action":"pause","reason":"Pausa explícita do operador no ensaio"}
{"action":"resume","reason":"Operador retomou a tarefa neutra"}
```

A pausa fecha o intervalo e a retomada abre outro. O controlador mantém os IDs; não é preciso copiá-los manualmente.

## 2. Armar, enviar, executar e receber

Terminal A:

```json
{"action":"codex-start","prompt_file":"D:/TCC/evidencias/operacao_controlador/ensaio-manual-0001/tarefa.txt"}
{"action":"sent"}
```

O primeiro comando termina a atividade humana e persiste o início Codex, prompt e hash; aguardar ready_to_send=true. O segundo é a declaração do operador imediatamente antes de enviar. **Só então** colar o texto já copiado e enviá-lo no cliente.

Não acrescentar texto depois de arquivar/armar: o prompt enviado deve corresponder ao arquivo. O caminho do controller.json já deve constar do texto antes do armamento, evitando autorreferência ao próprio hash.

Enquanto o cliente executa, o relógio principal permanece Codex. Não marcar pausa simplesmente porque o operador se afastou: o Codex continua executando. Se houver leitura/revisão humana efetiva durante a execução, declarar sua sobreposição:

```json
{"action":"aux-start","activity":"Revisar saída parcial enquanto Codex executa","observation":"operador"}
{"action":"aux-stop"}
```

Encerrar a trilha auxiliar antes de registrar a resposta final. Ela contribui ao tempo humano observado, mas não é somada novamente ao tempo ativo da condição.

Assim que a resposta **final** chegar, sem esperar a revisão ou copiar o arquivo, Terminal A:

```json
{"action":"received"}
{"action":"human-start","activity":"Conferir e arquivar resposta final","observation":"operador"}
```

Copiar a resposta exata para tarefa-resposta.txt usando editor ou exportação local. O arquivo deve conter a resposta realmente recebida, não uma resposta esperada inventada. Depois:

```json
{"action":"attach-response","response_file":"D:/TCC/evidencias/operacao_controlador/ensaio-manual-0001/tarefa-resposta.txt"}
{"action":"human-stop"}
{"action":"close"}
```

Marcadores manuais são observações do operador, com latência operacional, não hooks automáticos da interface. Registrar antes do clique e imediatamente ao observar a resposta; não descontar atraso estimado nem chamar esse intervalo de tempo puro de inferência. Se a entrega/recepção não puder ser delimitada de forma confiável, bloquear/censurar, sem reconstrução retroativa. A auditoria declara manual_attestation=true nessa modalidade.

Para cancelar, primeiro interromper efetivamente a tarefa no cliente; em seguida usar action=cancelled. Uma tarefa cancelada não recebe aprovação da auditoria. Não usar received para converter falha em resposta válida.

## 3. Auditar e conservar os registros

Terminal B, após close:

```powershell
node scripts/medicao/controlador.mjs --dir D:/TCC/evidencias/operacao_controlador/ensaio-manual-0001 --audit
```

Exigir saída 0 e passed=true, resposta real “10”, mesmo clock_session_id e nenhuma lacuna/intervalo aberto. Preservar:

- controller.json: PID, unidade, modo, estado, início Codex e heartbeat monotônico; updated_utc/heartbeat_monotonic_ns avançam enquanto o processo está vivo.
- eventos/events.<sessão>.jsonl e writer.lock enquanto o coletor estiver aberto: relógio e eventos persistidos.
- turnos/001/prompt.txt e response.txt, hashes e referências de início/despacho/recepção.
- Recibo ready_to_send e stdout do terminal, quando capturados pelo operador.
- Configuração efetiva do cliente, prompts posteriores e intervenções, conforme o plano.

O auditor confere hash, ordem monotônica início→despacho→término, artefatos de resposta, encerramento e sessão única. Não prova automaticamente que um marcador manual correspondeu ao clique real; essa observação continua responsabilidade do operador. Não valida sozinho configuração, isolamento, commits nem qualidade dos cenários.

Tempo humano = principal humano + sobreposição humana declarada. Tempo Codex = intervalos Codex observados e completos. Tempo ativo = principal humano + principal Codex; a sobreposição não é somada novamente. Pausas ficam separadas. Categorias sem observação/lacunas continuam null, não zero.

Use action=status para conferir o estado e active_budget_ms. O indicador inclui o trecho aberto no mesmo relógio. A guarda impede armar novo turno após 120 minutos; não desliga automaticamente uma tarefa em andamento. O operador deve supervisionar o limite e interromper a unidade quando alcançado, preservando o resultado censurado.

## 4. Ensaio CLI e teste técnico reproduzível

O adaptador CLI existe **somente em modo ensaio** e não troca o cliente/permissões congelados de E1.

```powershell
$executavelCodexTemporal = (Get-Command codex.exe -ErrorAction Stop).Source
node scripts/medicao/piloto-operacional.mjs --dir D:/TCC/evidencias/operacao_controlador/ensaio-cli-0001 --codex $executavelCodexTemporal
```

Se codex.exe não estiver no PATH, informar o caminho absoluto instalado, sem mudar permissões ou usar flags de bypass. O processo externo persiste o início antes de escrever o prompt em stdin, captura JSONL, observa turn.completed, arquiva a resposta e audita após encerrar. Perfil read-only no workspace neutro, sem leitura de suítes. O ensaio pede apenas 2+3+5.

No driver automático, as fases humanas são **simuladas** e o total humano/ativo real fica null. Um transporte CLI aprovado comprova o trajeto do cliente; não comprova esforço humano e não é medição E1. Fazer também os marcadores humanos explícitos do roteiro manual antes da unidade.

Teste técnico sem serviço externo:

```powershell
node --test scripts/medicao/coletor.test.mjs scripts/medicao/controlador.test.mjs
node scripts/medicao/piloto-operacional.mjs --dir D:/TCC/evidencias/operacao_controlador/ensaio-simulador-0001 --simulador
```

O simulador JSONL não é Codex. Seu sucesso não libera uma unidade experimental nem substitui o ensaio real. Não usar seus tempos como resultados.

A documentação oficial descreve o fluxo JSONL de codex exec: [OpenAI Developers](https://developers.openai.com/blog/eval-skills). As opções efetivamente disponíveis foram conferidas com codex exec --help do cliente instalado.

## 5. Antes, durante e depois de uma futura unidade medida

**Não executar esta seção nesta sessão de preparação.** Somente após o ensaio real aprovado e os demais gates do protocolo.

Antes de qualquer leitura específica da tarefa medida, no terminal externo:

```powershell
Set-Location D:\TCC
node scripts/medicao/controlador.mjs --dir D:/TCC/evidencias/evolucao/E1/tradicional/E1-T/0001 --unit E1-T --mode experimental
```

Declarar human-start com observation=operador antes das verificações/leitura específicas. Preparar isolamento e capturas conforme o protocolo durante os intervalos apropriados. A sessão deve pertencer à unidade correta; um ensaio não pode ser renomeado para E1.

Preparar o prompt inicial e copiar enquanto humano está ativo; usar codex-start, aguardar ACK, sent, e só então enviar. Informar no prompt o caminho exato do controller.json e dos eventos. O Codex deve confirmar início externo anterior ao seu turno, unidade, prompt, relógio e prova de vida; pasta existente sozinha não basta. A verificação externa usa UTC somente para correlação com o início do turno, nunca para calcular durações entre relógios.

Repetir received→human-start→próximo codex-start para cada continuação, arquivando a resposta antes de armar outro prompt. Manter registro das até cinco intervenções humanas; comandos do cronômetro não são prompts de implementação. Edições manuais e respostas a perguntas também contam conforme o plano, sem inferência automática pelo controlador.

Depois da implementação/validação/revisão/commit da condição e conferência humana, encerrar intervalos, close e audit. Não fechar o processo entre turnos. Se ele cair, preservar logs e bloquear: este controlador não reconstrói intervalos de outro processo. Não iniciar E1-Modular nesta sessão.

## 6. Critérios de bloqueio

Bloquear quando faltar qualquer um dos seguintes:

1. Controlador externo ativo antes da primeira leitura específica e antes do prompt; unidade/mode corretos e ACK persistido.
2. Início Codex anterior à entrega, prompt arquivado idêntico, despacho e recebimento observados; sem atrasos/lacunas não delimitáveis.
3. Intervalos humanos explicitamente declarados; sem simulações, durações fornecidas pelo usuário ou inferências automáticas como resultados.
4. Mesmo processo/relógio, prova de vida, arquivos íntegros e sessões sem reaproveitamento indevido.
5. Resposta final real, status de transporte válido e auditoria aprovada; simulador não é evidência real.
6. Configuração e isolamento do protocolo, limite de tempo/intervenções e supervisão operacional.
7. Ausência de intervalos abertos, queda, corrupção, falha de permissão ou limite ultrapassado sem encerramento válido.

Não editar registros antigos para fazer a auditoria passar; guardar tentativas reprovadas e iniciar nova tentativa identificada. A tentativa E1 bloqueada anteriormente continua sem tempos, sem recuperação.
