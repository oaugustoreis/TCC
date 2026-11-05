# Plano de medição do esforço de implementação

Versão 1.0 — planejamento prospectivo. Nenhum tempo de implementação de E1–E4 foi coletado. Não reconstruir tempos de E0 ou desta preparação a partir de lembranças ou duração total da conversa.

Vínculos: [protocolo](PROTOCOLO_EVOLUCAO_INCREMENTAL.md), [requisitos](MATRIZ_REQUISITOS_EXPANSAO.md), [baseline](BASELINE_E0.md).

## Unidade, início e encerramento

Unidade = lote de novos cenários de uma arquitetura em uma etapa: E1-T, E1-M, E2-M, E2-T, E3-T, E3-M, E4-M, E4-T, nessa ordem. Mensurar o lote inteiro; decompor por CT somente quando o evento puder ser atribuído sem rateio arbitrário. A API e a infraestrutura já devem estar prontas no SHA-base comum.

Iniciar o cronômetro antes de entregar o prompt e da primeira leitura específica da condição. Encerrar após implementação, validação própria, revisão e commit da condição, registrando a decisão. Se a comparação final descobrir problema da suíte, reabrir a mesma unidade e acrescentar os eventos de correção/revalidação; não apagar o encerramento anterior.

Limite operacional comum: até 120 minutos de tempo ativo da condição por lote. Inclui intervalos de trabalho humano e execução do Codex, como união temporal, sem contar pausas e esperas externas. Se atingido, marcar unidade incompleta/censurada, guardar tudo e concluir a outra sob a mesma regra. Não registrar “120 minutos” se o cronômetro não demonstrar esse valor. Não avançar ao estado seguinte com par incompleto. Retomada além do limite exige emenda para ambos os braços, identificando a censura original.

## Registro temporal

Usar um coletor de eventos validado em piloto neutro antes do congelamento. Relógio monotônico para durações; UTC ISO-8601 e offset local para correlação. Um evento de início deve ser persistido antes de executar a ação; término persistido imediatamente depois. Queda sem término gera evento aberto e duração desconhecida, não zero. Reinício do processo gera novo clock_session_id; não subtrair relógios monotônicos de processos diferentes.

Estados mutuamente exclusivos do relógio principal:

| Categoria | Exemplos | Destino |
|---|---|---|
| humano_ativo | Ler tarefa, decidir, revisar diff, editar, preparar prompt | Esforço humano |
| codex_execucao | Turno da entrega do prompt até resposta final, inclusive comandos internos | Tempo de execução do agente, não esforço humano presumido |
| ferramenta_externa | k6/Node executado fora de um turno, sem trabalho humano concomitante | Espera automática |
| pausa | Ausência pessoal/interrupção sem trabalho | Excluída do tempo ativo |
| bloqueio_ambiente | API indisponível, rede, permissão, indisponibilidade do serviço | Espera externa, causa registrada |
| coordenacao_comum | Integração, comparador, API, infraestrutura | Conta separada, nunca atribuída a uma condição por conveniência |

Quando o humano revisa durante um turno do Codex, guardar intervalo de sobreposição em trilha auxiliar. O relógio principal continua em codex_execucao; a trilha permite relatar tempo humano observado sem somá-lo duas vezes ao tempo ativo da condição. Comandos disparados pelo próprio Codex são subeventos dentro do turno, não novos intervalos somados ao principal.

Definições:

- Tempo decorrido da unidade: fim − início em relógio monotônico, por sessões; expor pausas e intervalos desconhecidos.
- Tempo humano observado: soma de humano_ativo e intervalos humanos auxiliares, sem sobreposição entre si.
- Tempo de execução do Codex: soma dos turnos observados; inclui espera por ferramentas internas e não equivale a tempo de inferência.
- Tempo ativo da condição: união dos intervalos humano_ativo e codex_execucao, descontando sobreposições. Sem estimar “tempo de pensamento”.
- Tempo de validação automática: duração dos comandos k6/Node, relatada à parte mesmo se já contida em codex_execucao.
- Custos de API, instrumentação, preparo, integração e ambiente: categorias próprias no total do estudo.

Sem coleta confiável, registrar null/“não registrado” e motivo. Nunca substituir ausência por 0, médias, estimativas ou tempos inventados. Não arredondar antes de agregar; apresentar segundos/minutos com precisão compatível com o coletor.

## Arquivos e esquema da coleta futura

Uma pasta por unidade, com tentativas numeradas. Registros append-only em UTF-8; correções são novos eventos que apontam o registro corrigido. Não colocar resultados dentro das pastas medidas das suítes.

| Artefato | Campos mínimos |
|---|---|
| unidade.json | id, estado, arquitetura, ordem, CTs, SHA-base, SHA-final, SHA API/infra, tag do protocolo, status, operador, máquina, ambiente, relógio, início/fim, motivo de ausência |
| eventos.jsonl | event_id, unit_id, clock_session_id, UTC, monotonic_ms, tipo start/end/pause/resume, categoria, atividade, referência ao evento inicial, motivo |
| turnos.jsonl | turn_id, UTC início/fim, duração observada, modelo efetivo, versão cliente/app, reasoning effort, service tier, ferramentas/skills, sandbox, política de aprovação, sessão, tokens/custo se observáveis |
| prompts/ | Texto exato enviado, em ordem, inclusive correções e anexos/contexto; hash dos arquivos disponibilizados |
| intervencoes.jsonl | id, humano/assistente, UTC, tipo, texto/diff exato, justificativa, requisito afetado, turno associado |
| alteracoes/ | Inventário anterior/posterior, hashes, numstat, name-status, diff completo, classificação de arquivos e commits |
| reutilizacao.csv | unit_id, componente, origem/commit, CTs consumidores, antes/depois, tipo de reutilização, evidência de chamadas/imports, adaptação |
| defeitos.jsonl | defect_id, requisito, fase de detecção, sintoma, causa, classe suíte/API/infra/ambiente, severidade, evidência, correção e reteste |
| ciclos.jsonl | cycle_id, tentativa, CTs, defeitos relacionados, comandos de validação, resultado, início/fim, commit |
| validacao/ | Comandos, stdout/stderr, readiness, HTTP recebido, métricas/checks, comparação com oráculo e entre pares |

CSV usa cabeçalho, UTF-8 e escape adequado. JSON usa null para ausência, acompanhado de motivo. Cada resultado tabulado deve apontar eventos e commits de origem; preservar todos os erros e tentativas invalidadas.

## Linhas e arquivos

Medir deltas ao fim de cada condição contra o SHA-base comum do lote, e acumulados contra E0. Comandos prospectivos, executados somente na coleta definitiva:

```powershell
git diff --no-ext-diff --no-textconv --no-renames --numstat <SHA-base> <SHA-final> -- tradicional/
git diff --no-ext-diff --no-textconv --no-renames --name-status <SHA-base> <SHA-final> -- tradicional/
git diff --no-ext-diff --no-textconv --no-renames --numstat <SHA-base> <SHA-final> -- modular/
git diff --no-ext-diff --no-textconv --no-renames --name-status <SHA-base> <SHA-final> -- modular/
git diff --no-ext-diff --no-textconv --no-renames --binary <SHA-base> <SHA-final> -- <escopo>
git ls-tree -r --name-only <SHA-final>
```

Guardar a versão do Git e as opções. `--no-renames` torna movimentações explícitas como remoção+adição; identificar movimentações no relatório para não interpretá-las como comportamento novo. Arquivos binários têm linhas não aplicáveis, mas contam como arquivos autorais. Não ignorar comentários, linhas em branco ou whitespace no numstat. Não executar formatador global entre condições.

Métricas distintas:

- Linhas adicionadas e removidas no diff final, sem condensar em apenas saldo.
- Churn bruto dos commits de trabalho em cadeia linear da condição: soma de adições/remoções por commit, inclusive código descartado nas correções; guardar patches intermediários ou checkpoints. Não somar commits de merge/integracão novamente.
- Arquivos criados, modificados e excluídos por lote; contagem de caminhos distintos e classificação A/M/D. Arquivo criado e depois editado conta como um criado no diff final; seus retrabalhos aparecem no churn.
- Tamanho do estado: arquivos e linhas físicas dos arquivos texto autorais em UTF-8; linha final sem newline conta uma vez, CRLF é um terminador. Essa regra não se confunde com SLOC, nem é usada sozinha para inferir dificuldade.

Escopo primário das arquiteturas: **todos os arquivos autorais** sob tradicional/ e modular/, incluindo helpers HTTP/checks, profiles, fluxos, use cases, novos utilitários, fixtures e configuração local quando existirem. Os 24 arquivos modulares E0 integram o escopo integral, mesmo quando não forem alterados no lote. Não medir somente cenários de entrada.

Escopo autoral complementar: shared/, api/, tests/, scripts/, documentação, configuração raiz e manifesto de dependências, com custos/arquivos classificados por suporte comum, API, testes, infraestrutura e documentação. Relatar também o total autoral do projeto, para que nenhum arquivo autoral desapareça dos resultados. Acervo histórico e evidências brutas são contados/classificados como artefatos de evidência, fora das linhas de implementação. Dependências instaladas, caches, .git e gerados por ferramentas não são código autoral.

Não mover lógica para shared/, API, documentação executável ou fora das suítes para reduzir artificialmente o escopo primário. Se shared/ ganhar lógica específica de uma condição, atribuir seu custo a ela e incluí-la no total da condição; lógica comum preparada previamente fica em linha comum. Registrar qualquer arquivo autoral novo fora do inventário e sua classificação. Não descontar helpers por reutilização.

Não há coleta definitiva de duplicação nesta fase. Uma análise futura de clones exigirá ferramenta/versão/parâmetros congelados por emenda antes da coleta; não introduzir um indicador retrospectivo para favorecer resultados conhecidos.

## Reutilização e defeitos

Componente reutilizado = função, módulo, configuração ou operação já existente no SHA-base e efetivamente consumido por pelo menos um novo cenário. O registro identifica símbolo/caminho, commit de origem e evidência de consumo. Distinguir:

1. Reuso sem alteração do componente.
2. Reuso com adaptação, com diff e custo incluídos.
3. Componente novo compartilhado dentro do lote; não chamá-lo de preexistente.
4. Cópia de código: registrar como cópia, não como chamada/reuso de componente.

Aplicar a definição também às funções locais tradicionais quando efetivamente chamadas; registrar ausência de reuso sem julgamento. Contar componentes distintos e cenários consumidores separadamente. Não comparar apenas números absolutos de componentes entre arquiteturas de granularidade diferente; apresentar exemplos e dependências.

Defeito = não atendimento verificável de requisito ou regressão, com evidência. Separar erro funcional de suíte, API, infraestrutura e ambiente. Severidade: bloqueador (impede executar), maior (resultado/fluxo incorreto), menor (violação sem impedir a jornada). Vários checks com a mesma causa formam um defeito; causas independentes são defeitos distintos. Registrar o critério de agrupamento.

Ciclo de correção = edição motivada por falha seguida de uma nova validação. Primeira implementação e primeira validação são tentativa inicial, não ciclo de correção. Correção de múltiplos defeitos antes de um reteste forma um ciclo com múltiplas referências. Executar de novo sem editar é reexecução, não correção. Registrar falhas detectadas antes de executar e retrabalho manual, sem inventar uma execução inexistente.

## Política idêntica de uso do Codex

O estudo mede desenvolvimento assistido sob uma política fixa, não produtividade humana sem assistência. Usar o mesmo operador, cliente, modelo efetivo, reasoning effort, service tier se configurável, ferramentas, skills, acesso de rede, permissões, autonomia e limite de tempo nos dois braços de cada par. Registrar mudanças de disponibilidade entre etapas e não atribuí-las à arquitetura.

A documentação oficial lista campos como model, model_reasoning_effort, sandbox_mode e approval_policy: [Configuration Reference](https://learn.chatgpt.com/docs/config-file/config-reference), consultada em 05/11/2026. A configuração declarada é uma fonte; registrar também o que a sessão expõe como efetivo. Não assumir que o arquivo global prova qual modelo respondeu.

Antes do congelamento, preencher uma ficha comum com os valores efetivos e evidência de captura. Se alias exato, versão do cliente ou esforço não forem observáveis, marcar a ausência e resolver a captura em piloto; não alegar igualdade verificada com campos desconhecidos. Congelar o valor efetivamente disponível, sem selecionar um modelo em função dos resultados de uma arquitetura.

Sessão nova por condição, sem acesso a código/logs/prompts da implementação oposta. Fornecer o mesmo protocolo e contrato, mudando apenas estado, arquitetura, caminhos e CTs. Sem agentes paralelos, acesso a soluções externas ou dicas de design específicas para apenas uma condição. A conversa atual de preparação não será reutilizada como contexto medido.

Permitir um prompt inicial e até cinco intervenções humanas de orientação/correção por condição. Perguntas do agente e respostas humanas também entram nesse limite; a mensagem final padronizada de encerramento é administrativa, sem dica técnica. Edições manuais contam como intervenção, com diff. Comandos autônomos e tentativas internas do agente são registrados, sem serem tratados como prompts humanos adicionais. Se o limite for atingido sem aprovação, a unidade é incompleta, sem ajuda extra silenciosa.

Não pedir à condição executada depois que copie ou “melhore” a solução da primeira. Intervenções fornecem requisito ou diagnóstico observado; não oferecer a uma condição uma solução estrutural que a outra teve de descobrir. Informação nova de domínio é emenda comum ou invalida/reinicia o par conforme protocolo. Repetir apenas a unidade mais lenta/defeituosa para obter melhor número é proibido.

Prompt inicial padronizado (substituições registradas, sem outras diferenças de política):

> Implemente somente os cenários {CTs} da transição {estado anterior}→{estado}, na arquitetura {arquitetura}, a partir do commit {SHA-base}. Siga a matriz e o protocolo v1.0 anexos e preserve os cenários anteriores. A API e o validador comum já estão prontos; não os altere. Use 1 VU e 1 iteração por entrada, os dados, sequência de chamadas e checks exatos da matriz. Pode reutilizar e adaptar componentes compatíveis com esta arquitetura, incluindo seu custo integral. Registre comandos, falhas, decisões e correções; valide toda a suíte-alvo do estado em HTTP real. Não consulte a outra arquitetura, não execute experimentos fora deste escopo, não faça refatoração cosmética e não invente tempos ou resultados. Se o contrato/ambiente impedir a tarefa, registre a evidência e suspenda o trabalho dependente. Pare ao atingir os limites da unidade; finalize com arquivos alterados, requisitos atendidos, validações e limitações.

Prompt de correção padronizado:

> A validação {referência} observou {diagnóstico verificável} contra o requisito {ID}. Corrija somente a condição atual, preserve os contratos e registre a nova tentativa e o reteste. Não consulte a solução da outra arquitetura.

Ficha desta preparação, fora da amostra: fontes de versão anteriores registram Node v24.10.0, npm 11.6.1, k6 v2.3.0 e Windows 10.0.26200; Git observado agora 2.51.0.windows.2. Não são garantia das futuras sessões. O identificador exato do modelo efetivo, reasoning effort, tokens e duração total ativa desta preparação não foram capturados de forma verificável para medição; são “não registrados”, não estimados. Ferramentas usadas na preparação: shell PowerShell/Git, edição de arquivos, Node e consulta à documentação oficial. Sem subagentes. O pedido integral do usuário e suas restrições são a origem deste planejamento; não há prompts de implementação E1–E4 nem tempos desses cenários.

## Alternância e análise

Ordem fixa: E1 T→M, E2 M→T, E3 T→M, E4 M→T. Registrar ordem real e qualquer desvio. Não trocar a ordem após ver o esforço do lote. Alternar reduz o desequilíbrio de posição, mas não remove aprendizagem do operador; sessões isoladas reduzem transferência direta de código, não memória humana.

Apresentar tabela por unidade com tempo humano, Codex, ativo/decorrido, espera, adições/remoções, churn, arquivos, componentes/consumidores, defeitos e ciclos. Informar dados faltantes, limites e tentativas inválidas. Resultados de API/infra aparecem em tabela comum separada e no total do projeto.

Para cada etapa, diferença pareada = modular − tradicional, com unidade e denominador explícitos. Razão modular/tradicional somente quando ambas as observações forem completas e o denominador for positivo. Não dividir por zero nem substituir ausência por zero. Acumulados E1–E4 só somam observações compatíveis, distinguindo duração de esforço de duração calendário.

Não criar índice de dificuldade baseado apenas em linhas ou uma pontuação composta escolhida depois de ver resultados. Combinar tempo, retrabalho, defeitos, alcance de mudanças e evidência qualitativa. Como os lotes diferem e são dependentes, relatar descrição de estudo de caso, sem alegação causal geral ou significância estatística baseada em cenários tratados como réplicas.

## Estado da preparação

- Documentos e E0 preparados; cenários expandidos ausentes.
- Modelo/configuração efetivos e coletor temporal precisam ser capturados/ensaiados antes da tag definitiva do protocolo.
- API futura e adaptação do validador ainda não implementadas; prontidão será verificada por lote.
- Nenhuma linha desta especificação é resultado de esforço já medido.
