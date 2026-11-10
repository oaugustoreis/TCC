# Relatório de Métricas — Estado E2

Gerado em: `2026-11-10T16:15:33.827Z`

## 1. Métricas Estruturais, Acoplamento Estático e Duplicação

| Métrica | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos JS autorais | 10 | 41 | 31 |
| Linhas físicas (LOC) | 365 | 848 | 483 |
| Linhas lógicas (SLOC) | 341 | 752 | 411 |
| Total de tokens JS | 3541 | 4711 | 1170 |
| Clones detectados (>=25 tokens) | 11 | 10 | -1 |
| Tokens duplicados (%) | 75.37% | 22.84% | -52.53% |
| Linhas duplicadas (%) | 73.31% | 26.73% | -46.58% |
| Imports internos estáticos (acumulado) | 0 | 83 | 83 |
| Módulos internos referenciados (acumulado) | 0 | 31 | 31 |

## 2. Delta Git e Reutilização da Tarefa (452524a4963356e4ac0ae352ec99f681d3808eee -> bceabc33eb75c7387a99371ce60ead453fe5ecdd)

| Métrica de Alteração e Reuso no Lote | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos criados (A) | 3 | 12 | 9 |
| Arquivos modificados (M) | 0 | 1 | 1 |
| Total de arquivos tocados (Blast Radius) | 3 | 13 | 10 |
| Linhas adicionadas (+) | 212 | 364 | 152 |
| Linhas removidas (-) | 0 | 0 | 0 |
| Volume de alteração líquida (net_diff_lines) | 212 | 364 | 152 |
| Churn intermediário (checkpoints) | N/A | N/A | — |
| Componentes preexistentes reutilizados sem edição no lote | 0 | 3 | 3 |
| Componentes preexistentes adaptados (M) no lote | 0 | 1 | 1 |
| Novos componentes compartilhados criados (A) no lote | 0 | 9 | 9 |

## 3. Esforço Operacional Auditado do Agente de IA

| Métrica do Agente (Extraída dos Logs do Sistema/Validador) | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Aprovação na 1ª validação (first_validation_pass) | Sim | Sim | — |
| Ciclos funcionais de validação | 1 | 1 | 0 |
| Execuções com erro de infraestrutura | 0 | 0 | 0 |
| Leituras de arquivos (files_read) | 8 | 29 | 21 |
| Operações de escrita/edição (files_written) | 4 | 14 | 10 |
| Comandos executados (commands_run) | 0 | 1 | 1 |
| Total de Tool Calls | 12 | 44 | 32 |
| Tokens de entrada novos do LLM (input_tokens) | 24846 | 40455 | 15609 |
| Tokens de contexto em cache (cache_read_tokens) | 32560 | 146892 | 114332 |
| Tokens gerados pelo LLM (output_tokens) | 5152 | 12373 | 7221 |
| Total de tokens LLM consumidos na unidade | 62558 | 199720 | 137162 |
| Duração registrada do subagente (s) | 13 | 162 | 149 |

## Glossário das Métricas (Para Referência no TCC)

- **Arquivos JS autorais**: Quantidade total de arquivos `.js` que compõem a suíte (`tradicional/` vs. `modular/`, incluindo todas as camadas e helpers).
- **Linhas físicas (LOC) e lógicas (SLOC)**: LOC conta todas as linhas; SLOC conta apenas linhas com código efetivo (sem linhas em branco e sem comentários).
- **Clones e Duplicação (%)**: Detector léxico Tipo-1 com janela mínima de 25 tokens (sem cruzar fronteiras de arquivo e usando união de conjuntos para evitar contagem dupla em regiões sobrepostas).
- **Reutilização da Tarefa (`batch_reuse`) vs. Acoplamento Estático (`static_suite_imports`)**: Em cada etapa, `batch_reuse` parte exclusivamente dos arquivos criados (`A`) ou modificados (`M`) na tarefa para medir quantos componentes preexistentes foram efetivamente consumidos sem edição (`reused_unmodified`) ou com adaptação (`reused_modified`), evitando inflar a contagem com módulos antigos não utilizados no lote.
- **Volume de alteração líquida (`net_diff_lines`) vs. Operações de escrita (`files_written`)**: `net_diff_lines` mede a soma líquida `lines_added + lines_removed` no `git diff` final da etapa, enquanto `files_written` contabiliza quantas operações de escrita/edição o subagente executou durante o turno.
- **Aprovação na 1ª validação (`first_validation_pass`)**: Indicador operacional que registra se a primeira execução funcional de `scripts/validacao/validar.mjs` na unidade foi aprovada integralmente (separando eventuais falhas de infraestrutura em `infra_error_runs`).
