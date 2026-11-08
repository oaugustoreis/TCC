# Relatório de Métricas — Estado E0

Gerado em: `2026-11-08T19:21:03.125Z`

## 1. Métricas Estruturais, Acoplamento Estático e Duplicação

| Métrica | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos JS autorais | 5 | 24 | 19 |
| Linhas físicas (LOC) | 85 | 333 | 248 |
| Linhas lógicas (SLOC) | 76 | 286 | 210 |
| Total de tokens JS | 1162 | 2016 | 854 |
| Clones detectados (>=25 tokens) | 4 | 1 | -3 |
| Tokens duplicados (%) | 90.36% | 7.94% | -82.42% |
| Linhas duplicadas (%) | 96.05% | 6.29% | -89.76% |
| Imports internos estáticos (acumulado) | 0 | 41 | 41 |
| Módulos internos referenciados (acumulado) | 0 | 19 | 19 |

## Glossário das Métricas (Para Referência no TCC)

- **Arquivos JS autorais**: Quantidade total de arquivos `.js` que compõem a suíte (`tradicional/` vs. `modular/`, incluindo todas as camadas e helpers).
- **Linhas físicas (LOC) e lógicas (SLOC)**: LOC conta todas as linhas; SLOC conta apenas linhas com código efetivo (sem linhas em branco e sem comentários).
- **Clones e Duplicação (%)**: Detector léxico Tipo-1 com janela mínima de 25 tokens (sem cruzar fronteiras de arquivo e usando união de conjuntos para evitar contagem dupla em regiões sobrepostas).
- **Reutilização da Tarefa (`batch_reuse`) vs. Acoplamento Estático (`static_suite_imports`)**: Em cada etapa, `batch_reuse` parte exclusivamente dos arquivos criados (`A`) ou modificados (`M`) na tarefa para medir quantos componentes preexistentes foram efetivamente consumidos sem edição (`reused_unmodified`) ou com adaptação (`reused_modified`), evitando inflar a contagem com módulos antigos não utilizados no lote.
- **Volume de alteração líquida (`net_diff_lines`) vs. Operações de escrita (`files_written`)**: `net_diff_lines` mede a soma líquida `lines_added + lines_removed` no `git diff` final da etapa, enquanto `files_written` contabiliza quantas operações de escrita/edição o subagente executou durante o turno.
- **Aprovação na 1ª validação (`first_validation_pass`)**: Indicador operacional que registra se a primeira execução funcional de `scripts/validacao/validar.mjs` na unidade foi aprovada integralmente (separando eventuais falhas de infraestrutura em `infra_error_runs`).
