# Relatório de Métricas — Estado E1

Gerado em: `2026-11-08T20:07:56.117Z`

## 1. Métricas Estruturais, Acoplamento Estático e Duplicação

| Métrica | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos JS autorais | 7 | 29 | 22 |
| Linhas físicas (LOC) | 153 | 484 | 331 |
| Linhas lógicas (SLOC) | 140 | 421 | 281 |
| Total de tokens JS | 1784 | 2896 | 1112 |
| Clones detectados (>=25 tokens) | 6 | 1 | -5 |
| Tokens duplicados (%) | 73.77% | 5.52% | -68.25% |
| Linhas duplicadas (%) | 69.29% | 4.28% | -65.01% |
| Imports internos estáticos (acumulado) | 0 | 52 | 52 |
| Módulos internos referenciados (acumulado) | 0 | 22 | 22 |

## 2. Delta Git e Reutilização da Tarefa (103a1e1ec5ceb05b15411b308b00f8f79fdc15a6 -> WORKTREE)

| Métrica de Alteração e Reuso no Lote | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos criados (A) | 2 | 5 | 3 |
| Arquivos modificados (M) | 0 | 5 | 5 |
| Total de arquivos tocados (Blast Radius) | 2 | 10 | 8 |
| Linhas adicionadas (+) | 68 | 165 | 97 |
| Linhas removidas (-) | 0 | 14 | 14 |
| Volume de alteração líquida (net_diff_lines) | 68 | 179 | 111 |
| Churn intermediário (checkpoints) | N/A | N/A | — |
| Componentes preexistentes reutilizados sem edição no lote | 0 | 2 | 2 |
| Componentes preexistentes adaptados (M) no lote | 0 | 5 | 5 |
| Novos componentes compartilhados criados (A) no lote | 0 | 3 | 3 |

## 3. Esforço Operacional Auditado do Agente de IA

| Métrica do Agente (Extraída dos Logs do Sistema/Validador) | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Aprovação na 1ª validação (first_validation_pass) | Não | Sim | — |
| Ciclos funcionais de validação | 2 | 1 | -1 |
| Execuções com erro de infraestrutura | 0 | 0 | 0 |
| Leituras de arquivos (files_read) | 8 | 30 | 22 |
| Operações de escrita/edição (files_written) | 3 | 12 | 9 |
| Comandos executados (commands_run) | 1 | 0 | -1 |
| Total de Tool Calls | 12 | 42 | 30 |
| Tokens de entrada novos do LLM (input_tokens) | 24565 | 34305 | 9740 |
| Tokens de contexto em cache (cache_read_tokens) | 34193 | 106934 | 72741 |
| Tokens gerados pelo LLM (output_tokens) | 3177 | 14125 | 10948 |
| Total de tokens LLM consumidos na unidade | 61935 | 155364 | 93429 |
| Duração registrada do subagente (s) | 48 | 87 | 39 |

## Glossário das Métricas (Para Referência no TCC)

- **Arquivos JS autorais**: Quantidade total de arquivos `.js` que compõem a suíte (`tradicional/` vs. `modular/`, incluindo todas as camadas e helpers).
- **Linhas físicas (LOC) e lógicas (SLOC)**: LOC conta todas as linhas; SLOC conta apenas linhas com código efetivo (sem linhas em branco e sem comentários).
- **Clones e Duplicação (%)**: Detector léxico Tipo-1 com janela mínima de 25 tokens (sem cruzar fronteiras de arquivo e usando união de conjuntos para evitar contagem dupla em regiões sobrepostas).
- **Reutilização da Tarefa (`batch_reuse`) vs. Acoplamento Estático (`static_suite_imports`)**: Em cada etapa, `batch_reuse` parte exclusivamente dos arquivos criados (`A`) ou modificados (`M`) na tarefa para medir quantos componentes preexistentes foram efetivamente consumidos sem edição (`reused_unmodified`) ou com adaptação (`reused_modified`), evitando inflar a contagem com módulos antigos não utilizados no lote.
- **Volume de alteração líquida (`net_diff_lines`) vs. Operações de escrita (`files_written`)**: `net_diff_lines` mede a soma líquida `lines_added + lines_removed` no `git diff` final da etapa, enquanto `files_written` contabiliza quantas operações de escrita/edição o subagente executou durante o turno.
- **Aprovação na 1ª validação (`first_validation_pass`)**: Indicador operacional que registra se a primeira execução funcional de `scripts/validacao/validar.mjs` na unidade foi aprovada integralmente (separando eventuais falhas de infraestrutura em `infra_error_runs`).
