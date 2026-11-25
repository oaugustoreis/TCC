# T1 — Métricas e ampliação da abordagem modular pelo Pulse

## Síntese

> O Pulse amplia a abordagem modular com recursos de automação. Ele preserva a separação de responsabilidades da arquitetura modular e a complementa com mecanismos de inicialização, geração de componentes, descoberta automática de cenários e integração entre compilação e execução dos testes.

As duas condições adotam arquitetura modular. A contribuição observada do Pulse está na automação e nos recursos de suporte a essa arquitetura. Os resultados abaixo descrevem as implementações avaliadas, sem estabelecer uma classificação de superioridade.

## Contexto da coleta

A comparação original considerou um projeto modular implementado manualmente e outro criado com Pulse 1.3.9. Ambos executaram a mesma jornada contra um mock local independente: autenticar, extrair o token, listar produtos, selecionar um produto e consultar seus detalhes.

Ambiente comum: Node.js 24.18.0, npm 11.16.0 e k6 2.0.0, em Ubuntu 24.04.3 LTS/WSL2. Perfil: `constant-vus`, 1 usuário virtual, duração de 10 segundos e pausa de 1 segundo por iteração.

## Métricas da comparação original

| Grupo | Métrica | Modular manual | Modular com Pulse |
|---|---|---:|---:|
| M1 — Tempo | Tempo decorrido até a primeira validação funcional completa | 82,309 s | 153,884 s |
| M2 — Ações | Comandos de terminal registrados | 4 | 8 |
| M2 — Ações | Operações autorais de criação de arquivos | 8 | 1 |
| M2 — Ações | Operações autorais de edição de arquivos | 0 | 6 |
| M3 — Código | Linhas manuais não vazias adicionadas | 60 | 48 |
| M3 — Código | Linhas finais nos arquivos autorais de código/configuração | 60 | 58 |
| M3 — Tamanho | Linhas não vazias de todos os arquivos relevantes, incluindo documentação e dados | 66 | 5.378 |
| M3 — Tamanho | Tamanho dos arquivos relevantes | 2.914 bytes | 206.717 bytes |
| M4 — Arquivos | Arquivos relevantes gerados automaticamente | 0 | 41 |
| M4 — Arquivos | Arquivos criados manualmente | 8 | 1 |
| M4 — Arquivos | Arquivos gerados posteriormente editados manualmente | 0 | 6 |
| M4 — Arquivos | Total de arquivos relevantes | 8 | 42 |
| M5 — Retrabalho | Tentativas de executar o cenário | 1 | 2 |
| M5 — Retrabalho | Falhas de configuração/CLI | 0 | 1 |
| M5 — Retrabalho | Correções da condição após falhas | 0 | 1 |
| M5 — Retrabalho | Falhas de compilação | 0 | 0 |
| M5 — Retrabalho | Falhas durante a execução do k6 | 0 | 0 |
| Instrumentação | Falhas do instrumento de validação | 1 | 0 |
| M6 — Validação | Iterações completas | 10 | 10 |
| M6 — Validação | Requisições HTTP | 30 | 30 |
| M6 — Validação | Checks executados e aprovados | 60 | 60 |
| M6 — Validação | Checks com falha | 0 | 0 |
| M6 — Validação | Equivalência funcional no escopo original | Confirmada | Confirmada |

### Critérios de contagem e ocorrências

- **Tempo:** medição instrumentada de início até a validação completa, incluindo raciocínio, coleta e esperas por autorização. A preparação compartilhada e a instalação isolada da CLI ficaram fora das condições. A instalação das dependências do workspace entrou no tempo do Pulse. Esses tempos não medem esforço humano isolado.
- **Comandos:** invocações de nível superior registradas pelo coletor, incluindo validação; um comando pode executar um script com várias gravações. As operações por arquivo são contabilizadas separadamente.
- **Linhas manuais:** linhas físicas não vazias adicionadas, incluindo configuração. Para arquivos gerados editados, contam as adições do diff. Código gerado, dependências, locks, documentação, relatórios e artefatos compilados não entram nessa métrica. Por isso, as 48 linhas adicionadas no Pulse diferem das 58 linhas finais dos arquivos de código editados, que também contêm linhas mantidas dos templates.
- **Arquivos relevantes:** incluem código, configuração, documentação e dados; excluem dependências, lock, relatório HTML, bundle e arquivos regeneráveis de registro/tipos de ambiente. Arquivos gerados de exemplo, GUI e mock interno permanecem no total do Pulse, mesmo sem uso na jornada. As categorias “gerado” e “editado” se sobrepõem.
- **Retrabalho no manual:** o teste k6 passou na primeira execução. O validador compartilhado interpretou inicialmente os booleanos de thresholds do resumo ao contrário e foi corrigido, sem alteração do projeto ou repetição da carga. Essa correção está incluída no tempo de A e registrada separadamente como falha de instrumentação.
- **Retrabalho no Pulse:** a CLI rejeitou `--summary-export` como argumento adicional. A exportação foi feita com `K6_SUMMARY_EXPORT`; a tentativa rejeitada não chegou ao k6. A primeira execução efetiva do k6 passou.
- **Dependências:** o manual não exigiu dependências npm. A instalação do workspace Pulse adicionou 399 pacotes e reportou 8 vulnerabilidades. Essas ocorrências foram preservadas nas evidências.
- **Telemetria indisponível:** não há contagem confiável de tokens ou de todas as chamadas de ferramentas. O tamanho físico incluindo dependências não foi contabilizado.

Os thresholds originais foram idênticos: `checks: rate==1`, `http_req_failed: rate==0` e `http_req_duration: p(95)<1500`. Ambos os projetos os satisfizeram.

## Variante com uso ampliado dos recursos nativos do Pulse

Após a comparação original, foi criada uma variante incremental para explorar mais funcionalidades do framework. Os projetos e resultados originais foram preservados.

| Aspecto | Pulse da comparação original | Variante Pulse ampliada |
|---|---|---|
| Contratos | Funções customizadas com `ps.check` | Schemas nativos com `ps.expect().jsonSchema()`, complementados por checks customizados |
| Verificações adicionais | Status e campos essenciais | Corpo não vazio, header JSON, propriedades e duração individual das respostas |
| Agrupamento | Sequência de operações no fluxo | Jornada agrupada com `ps.group()` |
| Ambiente | URL DEV diretamente | Seleção de URL por `Env` e `configResolver` |
| Geração, descoberta e build | Utilizados | Utilizados |
| Cliente HTTP, logging e relatório HTML | Utilizados | Utilizados |
| Iterações completas | 10 | 10 |
| Requisições HTTP | 30 | 30 |
| Checks por iteração | 6 | 21 |
| Checks executados e aprovados | 60 | 210 |
| Checks com falha | 0 | 0 |
| Perfil de carga | 1 VU por 10 segundos | 1 VU por 10 segundos |
| Thresholds | Originais | Mesmos thresholds |
| Tempo de implementação comparável | Medido na comparação original | Não disponível |
| Equivalência estrita de checks com o manual original | Confirmada | Não: há verificações adicionais |

Os quinze checks adicionais por iteração correspondem a cinco verificações nativas por resposta. O schema da lista também verifica todos os itens. Permaneceram verificações customizadas para strings e lista não vazias e correspondência do identificador selecionado, pois o validador de schemas inspecionado não implementa todas essas restrições.

A variante mantém a jornada e a carga, mas amplia as verificações. Portanto, seus 210 checks não representam uma redução de esforço nem permitem substituir os números da comparação original. Não foi medida como uma nova criação independente: houve reaproveitamento de contexto e dependências. Para compará-la ao manual, seria necessário definir previamente as verificações adicionais para ambas as condições e realizar nova coleta instrumentada.

## Recursos que ampliam o projeto modular

| Responsabilidade | Abordagem modular | Ampliação observada com Pulse |
|---|---|---|
| Estrutura | Separação de cenários, perfis, fluxos, operações e contratos | Inicialização padronizada com `init` |
| Novos componentes | Criação e conexão de arquivos | Geração de componentes com `gen` |
| Registro de cenários | Conexões definidas pela implementação | Descoberta e registro automáticos |
| Execução | Organização dos comandos necessários ao projeto | Integração de descoberta, compilação e k6 pela CLI |
| Operações HTTP | Operações reutilizáveis organizadas em módulos | Cliente HTTP com suporte a Bearer, checks de status e logging |
| Validações | Contratos e verificações definidos pelo projeto | API `ps.expect` e validação nativa de schemas na variante ampliada |
| Observação dos resultados | Saídas de execução do k6 | Logging estruturado e relatório HTML automático |

A modularidade também foi estabelecida manualmente. Dessa forma, a separação de responsabilidades não é atribuída exclusivamente ao Pulse. A contribuição do framework consiste em fornecer convenções, automações e utilitários que dão suporte à implementação modular.

## Interpretação acadêmica

> Os resultados observados indicam que o Pulse complementa uma arquitetura modular de testes de performance com mecanismos de automação e suporte à execução. No experimento, foram validadas a inicialização do workspace, a geração de componentes, a descoberta de cenários, a integração entre compilação e execução, o cliente HTTP e a geração de relatório. Na variante ampliada, também foram exercitados recursos nativos de validação e agrupamento. Essas contribuições caracterizam uma ampliação da abordagem modular, sem estabelecer superioridade geral entre as implementações.

As métricas registram diferenças de autoria, configuração, estrutura e execução no procedimento realizado. Mais arquivos gerados ou mais checks executados não constituem, isoladamente, evidência de eficiência. Os custos de dependências, instalação, adaptação e aprendizagem integram a avaliação do uso do framework.

Foi realizada uma observação por condição, na ordem manual → Pulse, pelo mesmo agente e contexto. Há possibilidade de aprendizagem e transferência de conhecimento. Os tempos incluem fatores não controlados e a variante ampliada não é uma repetição independente. A avaliação é exploratória, sem inferência estatística ou conclusão causal sobre redução de esforço.

## Fontes das métricas

- [Métricas estruturadas da comparação original](T1_metrics.json)
- [Relatório experimental completo](T1_experiment_report.md)
- [Limitações metodológicas](T1_limitations.md)
- [Adendo da variante Pulse ampliada](T1_pulse_native_addendum.md)
- [Validação da variante ampliada](../evidence/native-validation.json)
- [Histórico de comandos](../evidence/commands.jsonl)
- [Histórico de gravações e correções](../evidence/actions.jsonl)
