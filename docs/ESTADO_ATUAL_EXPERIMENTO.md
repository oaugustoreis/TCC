# Estado Atual do Experimento (Checkpoint de Continuidade)

Atualizado em: `08/11/2026`.

Este documento registra o ponto exato de parada do experimento para retomada imediata em qualquer sessão futura.

---

## 1. O Que Já Foi Concluído

1. **Limpeza do Repositório e Padronização Metodológica (v2.1)**:
   - Removidos scripts/evidências legadas de cronômetro humano, validador Python antigo (`validar.py`) e dependências externas não utilizadas (`pulse-arch`).
   - Atualizados [docs/PROTOCOLO_EVOLUCAO_INCREMENTAL.md](PROTOCOLO_EVOLUCAO_INCREMENTAL.md) e [docs/PLANO_MEDICAO_ESFORCO.md](PLANO_MEDICAO_ESFORCO.md) para a versão 2.1 (*AI-Only*), incorporando:
     - Separação explícita entre **Coleta Primária** (`transcript.jsonl` do sistema e `result.json` do validador), **Cálculo Determinístico** e **Consolidação**.
     - Distinção entre mudança líquida no Git (`net_diff_lines`) e operações de escrita (`files_written`).
     - Métrica de reutilização restrita aos arquivos tocados na tarefa (`batch_reuse` vs. `static_suite_imports`).
     - Detector léxico de duplicação (`exact-token-window-union-v1`, janela $\ge 25$ tokens, união sem contagem dupla, separando clones intra e inter-arquivos).
     - Extração auditada de tokens do LLM (`llm_input_tokens`, `llm_cache_read_tokens`, `llm_output_tokens`, `llm_total_tokens`), `tool_calls_total`, `first_validation_pass`, `functional_validation_cycles` e `infra_error_runs`.
   - Implementado e testado [scripts/metricas/coletar-metricas.mjs](../scripts/metricas/coletar-metricas.mjs) e [scripts/metricas/coletar-metricas.test.mjs](../scripts/metricas/coletar-metricas.test.mjs) (54/54 testes automatizados do projeto passando via `npm run test:all`).

2. **Fotografia da Baseline `E0` Concluída**:
   - Relatório salvo em [evidencias/metricas/E0/RELATORIO_METRICAS.md](../evidencias/metricas/E0/RELATORIO_METRICAS.md) e [evidencias/metricas/E0/metricas.json](../evidencias/metricas/E0/metricas.json).
   - Commit base antes de `E1`: `103a1e1ec5ceb05b15411b308b00f8f79fdc15a6`.

3. **Etapa `E1` (`CT-06` e `CT-07` — Catálogo filtrado e Estoque) Concluída e Validada**:
   - **Tradicional (`E1-T`)**: Criados `tradicional/ct06.js` e `tradicional/ct07.js`.
   - **Modular (`E1-M`)**: Adaptados de forma retrocompatível `modular/helpers/checks/checks.js`, `modular/use-cases/autenticacao/login.useCase.js`, `modular/use-cases/catalogo/listProducts.useCase.js`, `modular/use-cases/catalogo/getProduct.useCase.js`, `modular/profiles/catalogo/catalogo.profiles.js`; criados `modular/use-cases/catalogo/getProductStock.useCase.js`, `modular/flows/catalogo/filtro.flow.js`, `modular/flows/catalogo/estoque.flow.js`, `modular/scenarios/catalogo/filtro.scenario.js` e `modular/scenarios/catalogo/estoque.scenario.js`.
   - **Validação HTTP Real (`--suite both`)**: 14/14 execuções aprovadas (`validation_passed: true`, `complete_functional_equivalence: true`) em `evidencias/evolucao/E1/validacao_both/result.json`.
   - **Transcripts Arquivados**: `evidencias/evolucao/E1/transcripts/tradicional.transcript.jsonl` e `modular.transcript.jsonl`.
   - **Métricas de `E1` Extraídas**: Salvas em [evidencias/metricas/E1/RELATORIO_METRICAS.md](../evidencias/metricas/E1/RELATORIO_METRICAS.md) e [evidencias/metricas/E1/metricas.json](../evidencias/metricas/E1/metricas.json).

---

## 2. Resumo Comparativo Acumulado Até Aqui (`E0` e `E1`)

| Métrica | `E0` Trad | `E0` Mod | `E1` Trad | `E1` Mod |
|---|---:|---:|---:|---:|
| Cenários (CTs) | 5 | 5 | 7 | 7 |
| Arquivos JS autorais | 5 | 24 | 7 | 29 |
| Linhas físicas (LOC) / lógicas (SLOC) | 85 / 76 | 333 / 286 | 153 / 140 | 484 / 421 |
| Tokens JS duplicados (%) | 90.36% | 7.94% | 73.77% | 5.52% |
| Linhas duplicadas (%) | 96.05% | 6.29% | 69.29% | 4.28% |
| Arquivos tocados no lote (*Blast Radius*) | — | — | 2 (2A / 0M) | 10 (5A / 5M) |
| Volume líquido de diff (`net_diff_lines`) | — | — | 68 | 179 |
| Reuso no lote (sem edição / adaptados / criados) | — | — | 0 / 0 / 0 | 2 / 5 / 3 |
| Total de Tool Calls do Agente | — | — | 12 | 42 |
| Tokens LLM consumidos (`input + cache + output`) | — | — | 61.935 | 155.364 |
| Tokens LLM gerados (`output_tokens`) | — | — | 3.177 | 14.125 |

---

## 3. Próximos Passos ao Retomar

1. **Commit do Estado `E1`**:
   - Commitar as alterações atuais do working tree (que entregam `E1` completo e validado) e registrar o `<SHA-base>` para a próxima etapa.
2. **Executar Etapa `E2` (Carrinho de Compras: `CT-08`, `CT-09`, `CT-10` — Ordem: `Modular` → `Tradicional`)**:
   - Preparar comuns: adicionar rotas de carrinho (`POST /carts`, `POST /carts/:id/items`, `PATCH /carts/:id/items/:productId`, `DELETE /carts/:id/items/:productId`, `GET /carts/:id`) em `api/server.js`, testes de contrato `api/e2.contract.test.js` e oráculo de `CT-08`–`CT-10` em `scripts/validacao/oraculos.mjs`.
   - Executar unidade `E2-Modular` → `E2-Tradicional`, validar com `validar.mjs --state E2 --suite both` e extrair `evidencias/metricas/E2/`.
3. **Executar Etapa `E3` (Listagem filtrada e Cancelamento de Pedidos: `CT-11`, `CT-12` — Ordem: `Tradicional` → `Modular`)**.
4. **Executar Etapa `E4` (Pagamentos e Compra Completa por Carrinho: `CT-13`, `CT-14`, `CT-15` — Ordem: `Modular` → `Tradicional`)**.
5. **Executar Fase 2 — Manutenções Independentes a partir de `E4` (`M1`, `M2`, `M3`)**.
6. **Gerar Relatório Consolidado Final (`docs/RELATORIO_EXPERIMENTAL_COMPLETO.md`)** com todas as tabelas e análises das Fases 1 e 2.
