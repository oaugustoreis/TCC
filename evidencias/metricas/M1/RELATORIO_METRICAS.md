# Relatório de Métricas — Estado M1

Gerado em: `2026-11-09T19:53:49.783Z`

## 1. Métricas Estruturais, Acoplamento Estático e Duplicação

| Métrica | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos JS autorais | 15 | 57 | 42 |
| Linhas físicas (LOC) | 784 | 1528 | 744 |
| Linhas lógicas (SLOC) | 733 | 1379 | 646 |
| Total de tokens JS | 7117 | 7823 | 706 |
| Clones detectados (>=25 tokens) | 23 | 21 | -2 |
| Tokens duplicados (%) | 73.85% | 32.26% | -41.59% |
| Linhas duplicadas (%) | 72.03% | 35.75% | -36.28% |
| Imports internos estáticos (acumulado) | 0 | 133 | 133 |
| Módulos internos referenciados (acumulado) | 0 | 42 | 42 |

## 2. Delta Git e Reutilização da Tarefa (a84091f780bd745af4e22e6d787a9dd2124e7224 -> WORKTREE)

| Métrica de Alteração e Reuso no Lote | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos criados (A) | 0 | 0 | 0 |
| Arquivos modificados (M) | 15 | 1 | -14 |
| Total de arquivos tocados (Blast Radius) | 15 | 1 | -14 |
| Linhas adicionadas (+) | 15 | 2 | -13 |
| Linhas removidas (-) | 15 | 0 | -15 |
| Volume de alteração líquida (net_diff_lines) | 30 | 2 | -28 |
| Churn intermediário (checkpoints) | N/A | N/A | — |
| Componentes preexistentes reutilizados sem edição no lote | 0 | 2 | 2 |
| Componentes preexistentes adaptados (M) no lote | 0 | 0 | 0 |
| Novos componentes compartilhados criados (A) no lote | 0 | 0 | 0 |

## 3. Esforço Operacional Auditado do Agente de IA

| Métrica do Agente (Extraída dos Logs do Sistema/Validador) | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Aprovação na 1ª validação (first_validation_pass) | Sim | Sim | — |
| Ciclos funcionais de validação | 1 | 1 | 0 |
| Execuções com erro de infraestrutura | 0 | 0 | 0 |
| Leituras de arquivos (files_read) | 17 | 5 | -12 |
| Operações de escrita/edição (files_written) | 15 | 1 | -14 |
| Comandos executados (commands_run) | 0 | 0 | 0 |
| Total de Tool Calls | 32 | 6 | -26 |
| Tokens de entrada novos do LLM (input_tokens) | 26004 | 15317 | -10687 |
| Tokens de contexto em cache (cache_read_tokens) | 8026 | 18182 | 10156 |
| Tokens gerados pelo LLM (output_tokens) | 12643 | 1216 | -11427 |
| Total de tokens LLM consumidos na unidade | 46673 | 34715 | -11958 |
| Duração registrada do subagente (s) | 8 | 19 | 11 |

## Glossário das Métricas (Para Referência no TCC)

- **Arquivos JS autorais**: Quantidade total de arquivos `.js` que compõem a suíte (`tradicional/` vs. `modular/`, incluindo todas as camadas e helpers).
- **Linhas físicas (LOC) e lógicas (SLOC)**: LOC conta todas as linhas; SLOC conta apenas linhas com código efetivo (sem linhas em branco e sem comentários).
- **Clones e Duplicação (%)**: Detector léxico Tipo-1 com janela mínima de 25 tokens (sem cruzar fronteiras de arquivo e usando união de conjuntos para evitar contagem dupla em regiões sobrepostas).
- **Reutilização da Tarefa (`batch_reuse`) vs. Acoplamento Estático (`static_suite_imports`)**: Em cada etapa, `batch_reuse` parte exclusivamente dos arquivos criados (`A`) ou modificados (`M`) na tarefa para medir quantos componentes preexistentes foram efetivamente consumidos sem edição (`reused_unmodified`) ou com adaptação (`reused_modified`), evitando inflar a contagem com módulos antigos não utilizados no lote.
- **Volume de alteração líquida (`net_diff_lines`) vs. Operações de escrita (`files_written`)**: `net_diff_lines` mede a soma líquida `lines_added + lines_removed` no `git diff` final da etapa, enquanto `files_written` contabiliza quantas operações de escrita/edição o subagente executou durante o turno.
- **Aprovação na 1ª validação (`first_validation_pass`)**: Indicador operacional que registra se a primeira execução funcional de `scripts/validacao/validar.mjs` na unidade foi aprovada integralmente (separando eventuais falhas de infraestrutura em `infra_error_runs`).
