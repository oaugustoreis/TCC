# Relatório de Métricas — Estado E3

Gerado em: `2026-11-09T19:28:54.934Z`

## 1. Métricas Estruturais, Acoplamento Estático e Duplicação

| Métrica | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos JS autorais | 12 | 48 | 36 |
| Linhas físicas (LOC) | 464 | 1062 | 598 |
| Linhas lógicas (SLOC) | 434 | 953 | 519 |
| Total de tokens JS | 4376 | 5711 | 1335 |
| Clones detectados (>=25 tokens) | 14 | 14 | 0 |
| Tokens duplicados (%) | 74.52% | 24.99% | -49.53% |
| Linhas duplicadas (%) | 73.27% | 28.86% | -44.41% |
| Imports internos estáticos (acumulado) | 0 | 99 | 99 |
| Módulos internos referenciados (acumulado) | 0 | 36 | 36 |

## 2. Delta Git e Reutilização da Tarefa (bceabc33eb75c7387a99371ce60ead453fe5ecdd -> WORKTREE)

| Métrica de Alteração e Reuso no Lote | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos criados (A) | 2 | 7 | 5 |
| Arquivos modificados (M) | 0 | 3 | 3 |
| Total de arquivos tocados (Blast Radius) | 2 | 10 | 8 |
| Linhas adicionadas (+) | 99 | 229 | 130 |
| Linhas removidas (-) | 0 | 15 | 15 |
| Volume de alteração líquida (net_diff_lines) | 99 | 244 | 145 |
| Churn intermediário (checkpoints) | N/A | N/A | — |
| Componentes preexistentes reutilizados sem edição no lote | 0 | 4 | 4 |
| Componentes preexistentes adaptados (M) no lote | 0 | 3 | 3 |
| Novos componentes compartilhados criados (A) no lote | 0 | 5 | 5 |

## 3. Esforço Operacional Auditado do Agente de IA

| Métrica do Agente (Extraída dos Logs do Sistema/Validador) | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Aprovação na 1ª validação (first_validation_pass) | Sim | Sim | — |
| Ciclos funcionais de validação | 1 | 1 | 0 |
| Execuções com erro de infraestrutura | 0 | 0 | 0 |
| Leituras de arquivos (files_read) | 10 | 21 | 11 |
| Operações de escrita/edição (files_written) | 3 | 11 | 8 |
| Comandos executados (commands_run) | 0 | 0 | 0 |
| Total de Tool Calls | 13 | 32 | 19 |
| Tokens de entrada novos do LLM (input_tokens) | 24065 | 33804 | 9739 |
| Tokens de contexto em cache (cache_read_tokens) | 48014 | 69035 | 21021 |
| Tokens gerados pelo LLM (output_tokens) | 3211 | 10441 | 7230 |
| Total de tokens LLM consumidos na unidade | 75290 | 113280 | 37990 |
| Duração registrada do subagente (s) | 47 | 95 | 48 |

## Glossário das Métricas (Para Referência no TCC)

- **Arquivos JS autorais**: Quantidade total de arquivos `.js` que compõem a suíte (`tradicional/` vs. `modular/`, incluindo todas as camadas e helpers).
- **Linhas físicas (LOC) e lógicas (SLOC)**: LOC conta todas as linhas; SLOC conta apenas linhas com código efetivo (sem linhas em branco e sem comentários).
- **Clones e Duplicação (%)**: Detector léxico Tipo-1 com janela mínima de 25 tokens (sem cruzar fronteiras de arquivo e usando união de conjuntos para evitar contagem dupla em regiões sobrepostas).
- **Reutilização da Tarefa (`batch_reuse`) vs. Acoplamento Estático (`static_suite_imports`)**: Em cada etapa, `batch_reuse` parte exclusivamente dos arquivos criados (`A`) ou modificados (`M`) na tarefa para medir quantos componentes preexistentes foram efetivamente consumidos sem edição (`reused_unmodified`) ou com adaptação (`reused_modified`), evitando inflar a contagem com módulos antigos não utilizados no lote.
- **Volume de alteração líquida (`net_diff_lines`) vs. Operações de escrita (`files_written`)**: `net_diff_lines` mede a soma líquida `lines_added + lines_removed` no `git diff` final da etapa, enquanto `files_written` contabiliza quantas operações de escrita/edição o subagente executou durante o turno.
- **Aprovação na 1ª validação (`first_validation_pass`)**: Indicador operacional que registra se a primeira execução funcional de `scripts/validacao/validar.mjs` na unidade foi aprovada integralmente (separando eventuais falhas de infraestrutura em `infra_error_runs`).
