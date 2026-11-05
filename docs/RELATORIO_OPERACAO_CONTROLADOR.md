# Operação do controlador externo — resultado

A ponte externa foi implementada e testada, sem mudar o protocolo nem o coletor congelado. **O ensaio com resposta do Codex real não foi concluído neste ambiente.** O cliente retornou “failed to initialize in-process app-server client: Acesso negado (os error 5)”. Não houve tentativa de reduzir permissões ou contornar o bloqueio.

O [guia operacional](GUIA_OPERACIONAL_CONTROLE_TEMPO.md) contém os comandos exatos de antes, durante e depois da sessão. O operador pode concluir o ensaio neutro com marcadores manuais no cliente já validado; a alternativa CLI também está documentada para execução no terminal do operador. Nenhuma unidade E1 foi aberta.

## Infraestrutura

Não existia controlador de entrega/recepção em scripts/medicao/: apenas o coletor e o piloto técnico anterior. A menor ponte adicionada reutiliza o coletor em um processo de terminal:

- controlador.mjs: comandos explícitos para humano, sobreposição humana, Codex, pausa, retomada, resposta e encerramento; recibo antes do envio, arquivos com hash, prova de vida e auditoria.
- piloto-operacional.mjs: driver neutro, em processo externo ao cliente observado, para início→entrega→execução→resposta→encerramento→auditoria.
- simulador-transporte.mjs: substituto JSONL explicitamente simulado, usado só para testar o trajeto sem serviço externo.
- controlador.test.mjs: testes da ponte e dos bloqueios.

Código e testes são exclusivamente infraestrutura de medição. Não houve edição da API, do validador ou de qualquer suíte. Os documentos congelados e as tags continuam intactos; o coletor.mjs mantém o mesmo SHA-256 do commit congelado.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| Testes do coletor e controlador | 13/13 passaram, saída 0 (5 existentes + 8 novos) |
| Ciclo completo com simulador JSONL | Passou; resposta 10; sem alegar Codex real |
| Tentativa com Codex real | Falhou na inicialização, saída 1; resposta ausente |
| Reauditoria da tentativa real com controlador final | Reprovada, saída 1; tempo de turno Codex concluído permanece null |
| Integridade de código fora da medição/protocolo/tags | Preservada |
| Tentativa E1 bloqueada anterior | Não reaberta; nenhum tempo reconstruído |

As fases humanas dos drivers automatizados são explicitamente simuladas. Não são tempo humano observado. O simulador não produz tempo Codex real e não libera experimento. Totais técnicos de intervalos ficam disponíveis para testar a aritmética, com indicadores reais null quando não observados.

A primeira versão do relatório da tentativa CLI guardou a duração do intervalo de tentativa sob o campo genérico Codex. Esse intervalo é a janela de transporte que falhou, **não tempo de um turno respondido**. A auditoria final distingue codex_interval_attempts_ms de codex_execution_ms e mantém este último null quando a resposta/transportes não são válidos. O resultado preliminar foi preservado, sem converter a falha em aprovação.

Os testes verificam persistência antes da entrega, exclusividade do relógio principal, sobreposição sem dupla contagem, pausa explícita, prompt/resposta íntegros, falta de despacho/artefatos, transporte com falha e guarda de tempo. A automação não infere inícios de atividade humana nem altera os limites metodológicos.

## Evidências e commits

Pasta desta preparação: evidencias/operacao_controlador/2026-11-05T19-21-08-019Z.

- [Inspeção inicial](../evidencias/operacao_controlador/2026-11-05T19-21-08-019Z/estado-inicial.json) e ajuda real do cliente em codex-exec-help.stdout.log / stderr.log.
- [Testes finais](../evidencias/operacao_controlador/2026-11-05T19-21-08-019Z/testes-v1.command.json) e [stdout](../evidencias/operacao_controlador/2026-11-05T19-21-08-019Z/testes-v1.stdout.log).
- [Tentativa CLI real](../evidencias/operacao_controlador/2026-11-05T19-21-08-019Z/piloto-real.command.json), com prompt, stdout JSONL vazio, stderr e resultado em ensaio-real/.
- [Erro do cliente real](../evidencias/operacao_controlador/2026-11-05T19-21-08-019Z/ensaio-real/sessao/turnos/001/stderr.txt).
- [Reauditoria final da falha](../evidencias/operacao_controlador/2026-11-05T19-21-08-019Z/auditoria-transporte-falho.json).
- [Ensaio técnico simulado](../evidencias/operacao_controlador/2026-11-05T19-21-08-019Z/ensaio-simulado/resultado-operacional.json).
- [Conferência de escopo e commits](../evidencias/operacao_controlador/2026-11-05T19-21-08-019Z/integridade-e-commits.json).

Branch: infra/controlador-tempo. Commit do código: e4e87942754cc4b0bdff176a5410d53ae0547562. Commit dos testes: 04a00d8cc1ddc0cbae9dbe382ccd426aeb20bfca. Documentação/evidências são registradas em commit próprio. Os arquivos administrativos não versionados da tentativa E1 bloqueada permaneceram fora desses commits.

## Decisão operacional

Ponte local pronta para uso do operador e testes técnicos aprovados. **Comprovação do ciclo com Codex real pendente**, por bloqueio de inicialização neste ambiente. O próximo passo é executar o roteiro de ensaio neutro do guia em terminal externo antes de qualquer prompt da futura unidade.

O roteiro manual mantém o cliente validado e registra observações do operador; não afirma possuir hooks automáticos da interface. O adaptador CLI é restrito ao ensaio e não muda silenciosamente modelo, ferramentas ou permissões do desenho experimental.

Não iniciar E1-Tradicional ou E1-Modular antes da comprovação real e dos demais gates do protocolo. Nenhum resultado experimental de esforço foi gerado nesta preparação.
