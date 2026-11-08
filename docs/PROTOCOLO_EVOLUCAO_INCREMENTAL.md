# Protocolo de evolução incremental de testes k6

> **Emenda Operacional v2.0 (08/11/2026) — Execução e Medição 100% Conduzida por IA (Fases 1 e 2)**: A partir de 08/11/2026, a implementação dos cenários de expansão (`E1`–`E4`) e das tarefas de manutenção transversal (`M1`–`M3`) passa a ser executada exclusivamente por um agente de IA controlado (mesmo modelo e prompt padronizado), operando em subagentes isolados por arquitetura (`tradicional/` vs. `modular/`), sem intervenção de digitação humana ou cronômetro manual. Veja a seção final deste documento e [EXECUCAO_MANUAL.md](EXECUCAO_MANUAL.md). O texto v1.0 abaixo é preservado integralmente como histórico metodológico.

Versão 1.0 — 05/11/2026. Escopo desta entrega: preparação e planejamento. Nenhum cenário expandido foi implementado e nenhuma medição definitiva foi iniciada.

## Pergunta e desenho

Qual esforço observado é necessário para evoluir duas organizações de testes k6, tradicional e modular, de cinco para quinze jornadas funcionalmente equivalentes, sob os mesmos requisitos, API, carga, ferramentas e política de assistência por Codex?

Estudo de caso longitudinal, pareado por etapa e cumulativo. Unidade medida: o lote de novos cenários de uma arquitetura em uma transição (oito unidades: E1–E4 × duas arquiteturas). Cenários que compartilham componentes no mesmo lote não são réplicas independentes. E0 é ponto inicial validado, sem estimativa retrospectiva de esforço.

| Estado | Novos cenários | Total por arquitetura | Total de entradas nas duas suítes | Ordem de implementação |
|---|---|---:|---:|---|
| E0 | CT-01 a CT-05 existentes | 5 | 10 | Baseline histórica |
| E1 | CT-06 e CT-07: catálogo e estoque | 7 | 14 | Tradicional → modular |
| E2 | CT-08 a CT-10: carrinho | 10 | 20 | Modular → tradicional |
| E3 | CT-11 e CT-12: pedidos | 12 | 24 | Tradicional → modular |
| E4 | CT-13 a CT-15: pagamentos e compra completa | 15 | 30 | Modular → tradicional |

Os requisitos e critérios comuns estão em [MATRIZ_REQUISITOS_EXPANSAO.md](MATRIZ_REQUISITOS_EXPANSAO.md). A coleta está definida em [PLANO_MEDICAO_ESFORCO.md](PLANO_MEDICAO_ESFORCO.md). Para o novo estudo, este desenho substitui as tarefas independentes M1–M3/R1–R2 de [docs/protocolo.md](protocolo.md), mantido como histórico. Suas tarefas não serão executadas nesta preparação.

## E0 e acervo anterior

A baseline está identificada em [BASELINE_E0.md](BASELINE_E0.md), pelo commit inicial e tag anotada `e0-baseline-validada`. Os cinco scripts tradicionais, 24 arquivos modulares (inclusive os dois helpers), API e configuração comum conservam os hashes da execução aprovada `2026-11-05T17-07-25-732Z`.

A coleta histórica registra 10 execuções HTTP reais bem-sucedidas, 28 requisições e 60 checks, com 1 VU/1 iteração por execução. Essa evidência não constitui nova medição nem revela esforço retrospectivo de construir E0.

O relatório original e `evidencias/validacao_final/` permanecem nos caminhos anteriores. Uma cópia separada está em [historico/validacao-e0/](../historico/validacao-e0/LEIA-ME.md), com toda a árvore, logs, tentativas malsucedidas e manifesto SHA-256. Não sobrescrever os resultados históricos. Novos registros usarão `evidencias/evolucao/E<n>/<arquitetura>/<unidade>/<tentativa>/`.

## Congelamento e gates

Os três documentos são a especificação prospectiva v1.0. Antes de qualquer unidade definitiva, registrar o checklist abaixo e criar a tag anotada `protocolo-evolucao-v1.0` no commit que contém a versão conferida dos três documentos. A preparação e o versionamento de E0 não equivalem a iniciar o experimento.

1. Confirmar tag/commit E0, hashes dos fontes e integridade do arquivo histórico.
2. Fixar versões observadas de Node, npm, k6, Git, SO, máquina e ferramentas de coleta. Usar o mesmo ambiente no par.
3. Fixar modelo/configuração efetivos do Codex, prompts e limites de assistência. Campos obrigatórios não observados bloqueiam o início, sem valores presumidos.
4. Ensaiar o mecanismo de registro em tarefa neutra fora das suítes. Não desenvolver CT-06–CT-15 no ensaio. Registrar o piloto separadamente, sem usar seus tempos como resultados.
5. Registrar revisão dos contratos, critérios, ordem e campos de coleta; criar a tag e guardar o SHA. Não mudar o protocolo após conhecer resultados sem emenda datada e nova versão.

A preparação inicial registrou o conteúdo v1.0 antes do piloto. A revisão de prontidão implementa o coletor, executa o piloto neutro e captura a configuração efetiva; a decisão de congelamento e suas evidências estão em RELATORIO_PRONTIDAO_EXPERIMENTO.md (documento da automação removida). A tag protocolo-evolucao-v1.0 identifica o commit conferido, sem autorizar implicitamente a implementação de cenários.

O desenho pode ser congelado antes de implementar a API. Cada lote tem gate adicional de prontidão: API e testes de contrato em commits próprios, regressão E0 aprovada, validador comum apto a todos os cenários do estado, fixtures e oráculos congelados. Esse trabalho comum precede as duas unidades medidas.

## API e infraestrutura separadas

A API atual não implementa estoque, carrinhos, cancelamento nem pagamentos. A matriz especifica contratos futuros; não afirma disponibilidade atual. Cada ampliação da API será desenvolvida em branch `api/eN`, sem alterações nas suítes, e concluída/testada antes do par correspondente. Não usar gateways externos.

Atualizações do validador, comparador, coletor e oráculos ficam em commits de infraestrutura separados. Os oráculos derivam da matriz, antes de ver soluções dos dois braços. API e infraestrutura têm tempo e alterações registrados como custos comuns, sem atribuí-los arbitrariamente a uma arquitetura.

Falha de contrato descoberta durante a unidade: preservar a tentativa, suspender ambas as condições e registrar defeito de API. Corrigir/testar em commit separado. Se a correção alterar requisitos ou soluções possíveis, invalidar e repetir ambas as unidades do par a partir do mesmo pai com a emenda; manter as tentativas invalidadas. Indisponibilidade ambiental gera pausa registrada e retomada, sem descarte seletivo de custos.

## Procedimento de cada transição

1. Partir do estado anterior aceito/tagueado: E0 usa `e0-baseline-validada`; depois `estado-e1`, etc. Integrar a API e infraestrutura comum do lote e registrar o SHA-base comum.
2. Criar duas branches/worktrees do mesmo SHA: `exp/eN-tradicional` e `exp/eN-modular`. Ambas recebem a própria evolução acumulada anterior; nenhuma recebe o patch recém-produzido da outra.
3. Usar sessão nova do Codex por condição, sem histórico da sessão oposta. Entregar protocolo, matriz, contrato e somente a suíte-alvo com arquivos comuns. Ocultar a outra suíte por checkout esparso ou pacote de contexto auditado. Um coordenador compara as suítes posteriormente, em contexto separado. Não usar subagentes.
4. Seguir a ordem predefinida na tabela. Iniciar o registro antes da primeira leitura específica da tarefa. Registrar toda edição, prompt, intervenção, teste, pausa e correção.
5. Validar a suíte-alvo completa do estado, cada entrada com 1 VU e 1 iteração, processo novo da API por entrada e fixtures iguais. A comparação final executa os dois braços na ordem fixada para o lote. E1 tem 14 execuções; E2, 20; E3, 24; E4, 30.
6. Fechar a unidade somente após seus gates passarem ou o limite de execução ser atingido. Falhas e ciclos anteriores permanecem. Divergência na comparação posterior reabre a unidade afetada: correções e tempo adicional contam para ela.
7. Guardar os commits finais, coletar diffs contra o SHA-base e integrar apenas patches das suítes, em commits separados da API. Criar `estado-eN` somente com ambos os braços aceitos e registros conferidos.

A integração tem custo separado. Correção de suíte na integração pertence à condição de origem e conta como ciclo adicional. Não somar duas vezes custos comuns. O caminho E0→E4 é cumulativo; o isolamento entre braços ocorre dentro de cada lote.

## Igualdade e liberdade arquitetural

As duas condições recebem exatamente jornadas, dados, chamadas, checks, carga e limites iguais. A matriz não prescreve camadas, número de arquivos ou quantidade de helpers. A tradicional conserva organização de entradas diretas e funções locais; a modular conserva scenarios/profiles/flows/use cases e helpers. Permitir reutilização compatível com cada baseline, sem converter a tradicional em modular ou impor duplicação artificial.

Helpers novos necessários são permitidos dentro da identidade arquitetural, integralmente medidos e justificados. Mudança de identidade exige decisão prospectiva antes do lote e registro como desvio; não remover seu custo. Não realizar formatação global, otimizações oportunistas para reduzir LOC ou refatoração sem requisito durante a unidade.

CT-01–CT-05 não serão reescritos ou fortalecidos silenciosamente. Mudança indispensável requer requisito, motivo, arquivos afetados, alternativa e impacto nas duas condições. Preservar a tag E0; novas rotas não devem mudar contratos antigos. Não mover tags para esconder alterações.

## Aceitação dos estados

- Integração real em k6: API pronta, saída zero, 1 VU/1 iteração efetivos, checks 100% e sequência/contagem conforme matriz. Mocks unitários não substituem essas evidências.
- Comparar com oráculo independente e entre pares: método, caminho, query, payload, headers semânticos, status e campos de resposta previstos. Igualdade entre dois testes errados não aprova o estado.
- Normalizar somente ordem de chaves JSON/headers, portas locais e IDs dinâmicos por mapa explícito. Preservar originais, referências e valores; não apagar divergências. Comparar Content-Type e presença/valor de Authorization. Não exigir ordem física de headers.
- Mesmo conjunto, ordem, labels e resultados de checks. IDs retornados são encadeados, sem hardcode de `o1`, `c1` ou `pay1`.
- E0 preservado ou exceção funcional documentada; inventário de todo código autoral; registros completos de assistência e esforço, com ausências explícitas.
- Evidências contêm commits, versões, comandos, stdout/stderr, métricas, rastros recebidos, checks individuais, comparações e falhas. Sem execução bem-sucedida, estado pendente/reprovado e equivalência não declarada.

## Análise e limites

Apresentar resultados dos oito lotes, diferenças pareadas e acumulados, distinguindo tempo humano, tempo Codex, espera automática, alterações, reutilização e defeitos/correções. Relacionar os resultados ao conteúdo dos lotes, que variam em quantidade e domínio. Não calcular tempo de E0 com base na conversa antiga.

Um projeto, um operador e um percurso assistido por IA limitam generalização. Aprendizagem, ordem, história, dependências e mudanças de modelo são ameaças. A alternância dá duas primeiras posições a cada arquitetura, mas não elimina transferência de conhecimento. Não tratar as quatro etapas como réplicas independentes. LOC não substitui dificuldade; smoke não sustenta comparação de desempenho.

## Revisão de prontidão de 05/11/2026

O coletor, o piloto e o auditor de prontidão desta versão foram removidos no reinício manual solicitado em 06/11/2026. Configuração prospectiva comum capturada: gpt-6.1-sol, reasoning effort low, cliente/backend Codex 0.166.0, workspace-write e aprovação granular. Recapturar e comparar os campos e o inventário de ferramentas antes de cada condição; mudança exige registro e revalidação do par. O service tier e o snapshot interno do alias não são expostos e permanecem explicitamente desconhecidos. Não se presume estabilidade interna de um alias.

A execução do Codex será delimitada pelo operador/controlador fora do turno medido. Não iniciar o cronômetro de um turno de dentro dele. O piloto valida a instrumentação com tarefa neutra, sem medir esforço humano ou duração integral deste turno. A captura de prompts/intervenções e a supervisão do limite de 120 minutos continuam obrigatórias. A rota de comandos local usa Node e subprocessos, disponível mesmo com falha do lançador exec_command; manter essa rota igual nos dois braços.

Congelamento metodológico e prontidão funcional de E1 são gates distintos: E1 ainda exige API/fixtures e validador de CT-06/07 em commits próprios, testes e regressão real antes de abrir unidades medidas. Nada disso foi implementado nesta revisão.

---

## Emenda v2.0 (08/11/2026) — Execução 100% Conduzida por IA (Fases 1 e 2)

### 1. Racional e Desenho Experimental
Para eliminar o viés de fadiga, variação de velocidade de digitação humana e subjetividade de pausas manuais, o experimento adota um **agente de IA único e padronizado** como instrumento executor constante para ambas as arquiteturas (`tradicional/` e `modular/`):
- **Isolamento por condição**: Cada lote de cada arquitetura (ex.: `E1-Tradicional` e `E1-Modular`) é executado em uma instância de subagente dedicada, recebendo o mesmo prompt padronizado e restrita a ler/editar apenas os arquivos da própria arquitetura (`tradicional/` ou `modular/`).
- **Oráculo determinístico**: Toda unidade é validada em HTTP real com o `k6` contra [scripts/validacao/validar.mjs](../scripts/validacao/validar.mjs) e [scripts/validacao/oraculos.mjs](../scripts/validacao/oraculos.mjs).

### 2. Fases Avaliadas
1. **Fase 1 — Evolução Incremental (`E0` → `E1` → `E2` → `E3` → `E4`)**:
   - Expansão cumulativa de 5 para 15 cenários (`CT-01` a `CT-15`) seguindo integralmente [MATRIZ_REQUISITOS_EXPANSAO.md](MATRIZ_REQUISITOS_EXPANSAO.md) e a alternância de ordem (`E1`: T→M; `E2`: M→T; `E3`: T→M; `E4`: M→T).
2. **Fase 2 — Manutenção e Atualização Transversal (`M1`, `M2`, `M3` sobre `E4`)**:
   - Executada em branches independentes a partir do estado `E4` validado (15 cenários por suíte), medindo o impacto de mudanças de contrato/verificação sobre uma suíte madura:
     - **`M1` (Contrato de Autenticação)**: `/auth/login` inclui `expiresIn: 3600` e todas as autenticações da suíte passam a validar esse campo no check de corpo do login.
     - **`M2` (Contrato de Criação de Pedido)**: `POST /orders` passa a retornar e exigir validação de `currency: "BRL"` em todos os cenários que criam pedidos (`CT-03`, `CT-04`, `CT-05`, `CT-11` a `CT-15`).
     - **`M3` (Verificação em Consulta de Pedido)**: `GET /orders/:id` passa a exigir validação de `createdAt` string não vazia nos cenários que consultam pedidos por ID.
