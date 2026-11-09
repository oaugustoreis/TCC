# Relatório de Métricas — Estado E4

Gerado em: `2026-11-09T19:46:38.573Z`

## 1. Métricas Estruturais, Acoplamento Estático e Duplicação

| Métrica | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos JS autorais | 15 | 57 | 42 |
| Linhas físicas (LOC) | 784 | 1526 | 742 |
| Linhas lógicas (SLOC) | 733 | 1377 | 644 |
| Total de tokens JS | 6982 | 7799 | 817 |
| Clones detectados (>=25 tokens) | 23 | 21 | -2 |
| Tokens duplicados (%) | 73.35% | 32.36% | -40.99% |
| Linhas duplicadas (%) | 72.03% | 35.8% | -36.23% |
| Imports internos estáticos (acumulado) | 0 | 133 | 133 |
| Módulos internos referenciados (acumulado) | 0 | 42 | 42 |

## 2. Delta Git e Reutilização da Tarefa (6c1ab09a2d0f51510bef8db7af43a69a5c822c88 -> WORKTREE)

| Métrica de Alteração e Reuso no Lote | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos criados (A) | 3 | 9 | 6 |
| Arquivos modificados (M) | 0 | 3 | 3 |
| Total de arquivos tocados (Blast Radius) | 3 | 12 | 9 |
| Linhas adicionadas (+) | 320 | 492 | 172 |
| Linhas removidas (-) | 0 | 28 | 28 |
| Volume de alteração líquida (net_diff_lines) | 320 | 520 | 200 |
| Churn intermediário (checkpoints) | N/A | N/A | — |
| Componentes preexistentes reutilizados sem edição no lote | 0 | 9 | 9 |
| Componentes preexistentes adaptados (M) no lote | 0 | 3 | 3 |
| Novos componentes compartilhados criados (A) no lote | 0 | 6 | 6 |

## 3. Esforço Operacional Auditado do Agente de IA

| Métrica do Agente (Extraída dos Logs do Sistema/Validador) | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Aprovação na 1ª validação (first_validation_pass) | Sim | Sim | — |
| Ciclos funcionais de validação | 1 | 1 | 0 |
| Execuções com erro de infraestrutura | 0 | 0 | 0 |
| Leituras de arquivos (files_read) | 8 | 20 | 12 |
| Operações de escrita/edição (files_written) | 4 | 13 | 9 |
| Comandos executados (commands_run) | 0 | 0 | 0 |
| Total de Tool Calls | 12 | 33 | 21 |
| Tokens de entrada novos do LLM (input_tokens) | 24193 | 35602 | 11409 |
| Tokens de contexto em cache (cache_read_tokens) | 27566 | 52547 | 24981 |
| Tokens gerados pelo LLM (output_tokens) | 5089 | 12104 | 7015 |
| Total de tokens LLM consumidos na unidade | 56848 | 100253 | 43405 |
| Duração registrada do subagente (s) | 49 | 116 | 67 |

## Glossário das Métricas (Para Referência no TCC)

- **Arquivos JS autorais**: Quantidade total de arquivos `.js` que compõem a suíte (`tradicional/` vs. `modular/`, incluindo todas as camadas e helpers).
- **Linhas físicas (LOC) e lógicas (SLOC)**: LOC conta todas as linhas; SLOC conta apenas linhas com código efetivo (sem linhas em branco e sem comentários).
- **Clones e Duplicação (%)**: Detector léxico Tipo-1 com janela mínima de 25 tokens (sem cruzar fronteiras de arquivo e usando união de conjuntos para evitar contagem dupla em regiões sobrepostas).
- **Reutilização da Tarefa (`batch_reuse`) vs. Acoplamento Estático (`static_suite_imports`)**: Em cada etapa, `batch_reuse` parte exclusivamente dos arquivos criados (`A`) ou modificados (`M`) na tarefa para medir quantos componentes preexistentes foram efetivamente consumidos sem edição (`reused_unmodified`) ou com adaptação (`reused_modified`), evitando inflar a contagem com módulos antigos não utilizados no lote.
- **Volume de alteração líquida (`net_diff_lines`) vs. Operações de escrita (`files_written`)**: `net_diff_lines` mede a soma líquida `lines_added + lines_removed` no `git diff` final da etapa, enquanto `files_written` contabiliza quantas operações de escrita/edição o subagente executou durante o turno.
- **Aprovação na 1ª validação (`first_validation_pass`)**: Indicador operacional que registra se a primeira execução funcional de `scripts/validacao/validar.mjs` na unidade foi aprovada integralmente (separando eventuais falhas de infraestrutura em `infra_error_runs`).
