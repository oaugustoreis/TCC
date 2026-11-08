# Relatório de Métricas — Estado E0

Gerado em: `2026-11-08T19:08:06.695Z`

## 1. Métricas Estruturais, Reutilização e Duplicação

| Métrica | Tradicional | Modular | Diferença (Mod - Trad) |
|---|---:|---:|---:|
| Arquivos JS autorais | 5 | 24 | 19 |
| Linhas físicas (LOC) | 85 | 333 | 248 |
| Linhas lógicas (SLOC) | 76 | 286 | 210 |
| Total de tokens JS | 1162 | 2016 | 854 |
| Clones detectados (>=25 tokens) | 4 | 1 | -3 |
| Tokens duplicados (%) | 90.36% | 7.94% | -82.42% |
| Linhas duplicadas (%) | 96.05% | 6.29% | -89.76% |
| Imports internos de componentes | 0 | 41 | 41 |
| Componentes internos reutilizados | 0 | 19 | 19 |

## Glossário das Métricas (Para Referência no TCC)

- **Arquivos JS autorais**: Quantidade total de arquivos `.js` que compõem a suíte (`tradicional/` vs. `modular/`, incluindo todas as camadas e helpers).
- **Linhas físicas (LOC)**: Total de linhas dos arquivos, incluindo linhas em branco.
- **Linhas lógicas (SLOC)**: Total de linhas contendo código efetivo (descontando linhas em branco e comentários).
- **Total de tokens JS**: Quantidade total de elementos léxicos da linguagem (identificadores, palavras-chave, operadores, literais).
- **Clones detectados / Tokens e Linhas duplicadas (%)**: Mede a taxa de código repetido (copiado/colado) dentro da própria suíte usando janelas mínimas de 25 tokens consecutivos idênticos.
- **Imports internos / Componentes reutilizados**: Quantidade de conexões `import` internas e de arquivos/módulos da própria suíte que são reaproveitados por outros arquivos.
- **Blast Radius (Superfície de Impacto)**: Total de arquivos criados (`A`), modificados (`M`) ou removidos (`D`) no Git para entregar a etapa.
- **Pass@1 e Ciclos de validação**: Indica se o subagente de IA aprovou 100% dos checks no validador HTTP real na primeira tentativa (`Pass@1`) e quantas execuções do validador foram necessárias.
