# Relatório de prontidão do experimento

Data: 05/11/2026. **Aprovado o congelamento metodológico da versão 1.0.** Coletor, piloto neutro, configuração efetiva, baseline, acervo, matriz e versões foram conferidos. A tag anotada `protocolo-evolucao-v1.0` identifica o commit desta revisão.

**E1 ainda não está liberado para implementação medida:** faltam API/fixtures de catálogo e estoque e o validador comum de CT-06/07, em commits próprios, seguidos de regressão HTTP real. Nenhum CT-06–CT-15 foi implementado; nenhuma medição definitiva de esforço foi executada; a tag e os fontes E0 permanecem intactos.

## Documentos revisados

Foram conferidos [protocolo](PROTOCOLO_EVOLUCAO_INCREMENTAL.md), [matriz](MATRIZ_REQUISITOS_EXPANSAO.md), [plano de esforço](PLANO_MEDICAO_ESFORCO.md) e [identificação E0](BASELINE_E0.md). As atualizações vinculam o coletor, registram a configuração observada e distinguem congelamento metodológico de prontidão funcional de E1. Não houve mudança dos dez requisitos planejados, da ordem alternada ou dos totais. A edição de BASELINE_E0.md atualiza referências; não altera o commit/tag E0.

## Coletor implementado e validado

Código comum em [scripts/medicao/coletor.mjs](../scripts/medicao/coletor.mjs), operação em [manual](../scripts/medicao/README.md), [piloto](../scripts/medicao/piloto.mjs) e [testes](../scripts/medicao/coletor.test.mjs).

- JSONL append-only por processo, UUID de sessão e evento, UTC, offset, nanossegundos de `process.hrtime.bigint` e representação em ms.
- Persistência com `writeSync`/`fsyncSync` antes do ACK e antes da atividade. Não reescrever registros existentes.
- Relógio principal exclusivo, categorias do plano, trilhas auxiliares humanas e de comandos, pausa/retomada com novos IDs e referências.
- Lock de escritor; recuperação somente após confirmar PID inexistente. Processo novo implica relógio novo, sem subtração entre sessões.
- Intervalo sem término permanece aberto, duração null. Métricas públicas sem observação ou com lacuna relevante são null; somas `known_*` contêm apenas intervalos completos e não representam observação integral.
- Arquivo truncado/JSON inválido é detectado e preservado, sem reparo silencioso.

**5/5 testes passaram na versão final**, código de saída 0: persistência/exclusividade/referências; pausa/retomada/sobreposição sem dupla contagem; queda de processo e recuperação; detecção de truncamento; rejeição de término associado a outro relógio. Categorias humanas/Codex usadas nos testes são explicitamente simuladas e não entram em resultados de esforço.

Evidências: [comando dos testes](../evidencias/prontidao/2026-11-05T17-36-24-859Z/testes-v1.command.json), [stdout](../evidencias/prontidao/2026-11-05T17-36-24-859Z/testes-v1.stdout.log), [stderr](../evidencias/prontidao/2026-11-05T17-36-24-859Z/testes-v1.stderr.log), [resumo da recuperação](../evidencias/prontidao/2026-11-05T17-36-24-859Z/testes-coletor-v1/queda/resumo-recuperacao.json).

## Piloto neutro real

Tarefa: ordenar `["gama","alfa","beta"]` em arquivo e calcular 2+3+5=10 em outro, em dois subprocessos Node. Arquivos somente na pasta do piloto, fora de api/, tradicional/, modular/ e shared/. Nenhuma chamada HTTP ou k6, nenhum cenário expandido e nenhuma dependência nova.

A execução final gerou **8 eventos, uma sessão, três intervalos encerrados e nenhum aberto**. Durou 91.8084 ms entre abertura e fechamento da sessão: 86.4414 ms nos intervalos de ferramenta externa e 1.0793 ms de pausa técnica. A duração da sessão inclui também sobrecarga do coletor. Valores observados no relógio monotônico, sem uso de estimativas.

Esses números validam a instrumentação da tarefa neutra. **Não são tempo humano, duração integral deste turno Codex ou esforço de E1**; esses campos são null no piloto. O controlador/operador precisa iniciar o intervalo do turno antes de entregar o prompt e encerrá-lo ao receber a resposta final. O coletor não detecta atividade humana nem impõe sozinho o limite de 120 minutos; a supervisão externa do plano permanece obrigatória.

Evidências: [resultado](../evidencias/prontidao/2026-11-05T17-36-24-859Z/piloto-neutro-v1/resultado-piloto.json), [palavras](../evidencias/prontidao/2026-11-05T17-36-24-859Z/piloto-neutro-v1/palavras.json), [soma](../evidencias/prontidao/2026-11-05T17-36-24-859Z/piloto-neutro-v1/soma.json), [comando](../evidencias/prontidao/2026-11-05T17-36-24-859Z/piloto-v1.command.json). Os eventos brutos estão em `evidencias/prontidao/2026-11-05T17-36-24-859Z/piloto-neutro-v1/eventos/`.

As execuções preliminares também foram preservadas. Após a primeira execução aprovada, os resumos foram refinados para diferenciar ausência de observação de zero e expor lacunas entre sessões; testes e piloto foram repetidos para a versão final. Não são repetições experimentais independentes.

## Configuração efetiva do Codex

| Campo | Valor observado e origem |
|---|---|
| Modelo efetivo (alias) | `gpt-6.1-sol`, metadados do turno e turn_context da sessão ativa |
| Reasoning effort | `low`, metadados deste turno |
| Cliente/backend | Codex `0.166.0`, metadados e `codex.exe --version` → `codex-cli 0.166.0` |
| Sandbox | `workspace-write`, backend Windows `windows_elevated`; perfil gerenciado com filesystem/rede restritos |
| Aprovação | `granular`, confirmada no turn_context: sandbox_approval=false, rules=false, skill_approval=false, request_permissions=true, mcp_elicitations=true |
| Ferramentas | Inventário dos 80 tools expostos em ALL_TOOLS, nomes e hash das descrições, mais namespaces functions/clock/collaboration |
| Agentes auxiliares | Não usados; proibidos nas unidades pelo protocolo |
| Service tier | null: não exposto |
| Snapshot interno do alias | null: não exposto; não se presume imutabilidade do alias |
| Versão da interface gráfica | null: não exposta; o cliente/backend verificável está registrado acima |

Captura: [codex-efetivo.json](../evidencias/prontidao/2026-11-05T17-36-24-859Z/codex-efetivo.json), [contexto selecionado](../evidencias/prontidao/2026-11-05T17-36-24-859Z/contexto-turno-selecionado.json), [ferramentas](../evidencias/prontidao/2026-11-05T17-36-24-859Z/ferramentas-disponiveis.json). Foram selecionados apenas campos de configuração da sessão atual; não foram copiados credenciais nem históricos de outras sessões. O arquivo global não forneceu esses valores e não foi tratado como comprovação efetiva.

O perfil comum da versão 1.0 é o observado acima, aplicado aos dois braços. Recapturar modelo, effort, cliente, permissões e inventário antes de cada condição; divergência bloqueia o par até decisão prospectiva. As ferramentas estarem disponíveis não autoriza ações externas nem altera a proibição de delegação. A skill OpenAI Docs foi usada para orientação da captura; referência oficial consultada: [Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference). A prova dos valores é local, não a documentação.

## E0 e integridade histórica

Commit confirmado: `e93c3fcf8e954dc1a1e8a05d621c9f23b8ccdc87`. Tag `e0-baseline-validada` é anotada e aponta para esse commit.

- **32 fontes JS** do manifesto anterior conferidos por SHA-256 contra os arquivos atuais e os blobs da tag: zero divergências.
- **24 arquivos modulares**, inclusive helpers HTTP/checks, preservados e integralmente incluídos no escopo.
- **694 arquivos históricos** conferidos nos caminhos originais e no arquivo separado, contra o manifesto SHA-256 e os blobs do commit E0: zero divergências.
- A validação anterior continua registrando 10 execuções bem-sucedidas, 28 requisições e 60 checks. Este relatório não apresenta nova execução HTTP.
- Diff dos caminhos protegidos (API, suítes, shared, testes E0, validador anterior, relatório e acervo históricos) contra E0: vazio.

Auditoria repetível: [scripts/prontidao/auditar.mjs](../scripts/prontidao/auditar.mjs). Evidências: [auditoria](../evidencias/prontidao/2026-11-05T17-36-24-859Z/auditoria-e0-matriz.json), [comando final](../evidencias/prontidao/2026-11-05T17-36-24-859Z/auditoria-v1.command.json), [stdout](../evidencias/prontidao/2026-11-05T17-36-24-859Z/auditoria-v1.stdout.log).

## Critérios e totais da matriz

A revisão manual confirmou dados, status, predicados, vínculos de IDs, carga, labels e ordem comuns, sem prescrição de componentes ou granularidade de arquivos para favorecer uma arquitetura. São requisitos prospectivos.

O auditor contou as operações (inclusive ranges), conferiu sua sequência, os dois checks por resposta nova, os 15 IDs únicos, os números E0 contra os resultados históricos e os totais de todas as etapas:

| Estado | Cenários por suíte | Execuções nas duas suítes | Requests por suíte | Checks por suíte | Requests/checks nas duas suítes |
|---|---:|---:|---:|---:|---|
| E0 | 5 | 10 | 14 | 30 | 28 / 60 |
| E1 | 7 | 14 | 20 | 42 | 40 / 84 |
| E2 | 10 | 20 | 34 | 70 | 68 / 140 |
| E3 | 12 | 24 | 42 | 86 | 84 / 172 |
| E4 | 15 | 30 | 66 | 134 | 132 / 268 |

**Nenhuma inconsistência aritmética encontrada.** E1 acrescenta seis requests e doze checks por suíte (CT-06 e CT-07: três/seis cada). Essas contagens não incluem /health, testes de contrato ou chamadas de coordenação. Somente E0 tem execução funcional comprovada atualmente.

## Ambiente e comandos

| Item | Observado |
|---|---|
| SO | Windows release 10.0.26200, x64 |
| CPU | Intel Core i5-12400F, 12 processadores lógicos |
| RAM física | 16.950.870.016 bytes |
| Fuso | America/Manaus, UTC−04:00 |
| Node.js | v24.10.0 |
| npm | 11.6.1 |
| k6 | v2.3.0, commit e088784614, Go 1.26.8, windows/amd64 |
| Git | 2.51.0.windows.2 |
| PowerShell | 5.1.26100.9711 |
| Codex CLI/backend | 0.166.0 |

[Comandos, saídas e ambiente completos](../evidencias/prontidao/2026-11-05T17-36-24-859Z/ambiente-versoes.json). Foram executados comandos de versão de todas as ferramentas acima. O coletor não depende de Python.

Comandos reproduzíveis da verificação (usar pasta nova para cada repetição):

```powershell
node --test scripts/medicao/coletor.test.mjs
node scripts/medicao/piloto.mjs <pasta-piloto>
node scripts/prontidao/auditar.mjs <pasta-auditoria>
git -c safe.directory=D:/TCC rev-parse 'e0-baseline-validada^{commit}'
git -c safe.directory=D:/TCC cat-file -t refs/tags/e0-baseline-validada
git -c safe.directory=D:/TCC rev-parse 'protocolo-evolucao-v1.0^{commit}'
```

## Ocorrências e pendências

1. **Falha do lançador exec_command:** erro técnico `setup refresh had errors`. Os comandos locais foram executados via Node/child_process, incluindo PowerShell, Git e versões, sem elevar permissões nem modificar configuração global. Essa rota foi documentada para uso igual nos dois braços. A falha isolada do lançador não bloqueia o coletor nem os gates metodológicos.
2. **Avisos do Codex CLI:** a consulta de versão terminou com código 0, mas informou acesso negado ao limpar diretórios temporários/criar aliases de PATH. Nada foi alterado para contornar permissões; saída bruta preservada. Não foi executada nova sessão de implementação.
3. **Auditoria inicial excedeu 30 segundos:** a primeira implementação invocava Git separadamente para muitos arquivos. A tentativa e seu timeout foram preservados. A leitura foi otimizada com `git cat-file --batch`, e a auditoria final passou. Não houve alteração nas evidências verificadas.
4. **Limitações observacionais:** service tier, snapshot interno e versão GUI permanecem desconhecidos. O alias, effort e versão backend exigidos foram capturados. Tempos integrais do turno e humanos desta preparação não foram reconstruídos.
5. **Gate funcional de E1 pendente:** API/fixtures de categoria/estoque, testes de contrato e atualização do validador, em commits separados das suítes, com regressão real de E0 e contrato E1. A implementação medida deve começar em sessões novas isoladas, tradicional antes de modular, após confirmar configuração comum e controlador temporal externo.

## Decisão de congelamento

Os critérios de preparação para congelar o desenho v1.0 foram satisfeitos: documentação revisada, coletor persistente/monotônico testado, piloto neutro aprovado, configuração obrigatória capturada, E0/acervo íntegros, matriz consistente e ambiente registrado. **Não há bloqueio metodológico para a tag.**

[Decisão estruturada](../evidencias/prontidao/2026-11-05T17-36-24-859Z/decisao-prontidao.json). A tag anotada `protocolo-evolucao-v1.0` é criada no commit que contém estes documentos, o coletor e estas evidências. A tag E0 não é movida. Conferir o SHA com o comando acima; o próprio relatório não incorpora seu hash para evitar autorreferência.

Congelar o protocolo não declara equivalência dos cenários futuros, não inicia E1 e não elimina o gate funcional pendente.
