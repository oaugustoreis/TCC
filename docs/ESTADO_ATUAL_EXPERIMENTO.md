# Estado Atual do Experimento (Checkpoint de Continuidade)

Atualizado em: `09/11/2026`.

Este documento registra o ponto exato de parada do experimento para retomada imediata em um novo terminal.

---

## ⚠️ Regra Operacional Crítica para a Nova Sessão na CLI
- **NUNCA permita que um subagente (`invoke_subagent`) execute `run_command` (`Bash`), `write_file` ou `edit_file`** caso a CLI esteja solicitando aprovação manual (`ctrl+k`), pois chamadas de ferramentas que exigem aprovação dentro de subagentes em background travam a fila visual de permissões da CLI (`waiting_for_input`).
- **Como operar sem travar a CLI**:
  - Se usar subagentes (`research` ou `self`), instrua-os a usar **SOMENTE `read_file`** e retornar o código/resumo na resposta final (ou ler os tokens do seu `transcript.jsonl`), enquanto o **agente principal (orquestrador)** executa `write_file`, `edit_file` e `run_command` (onde o `ctrl+k` / auto-approve funciona diretamente no terminal principal).

---

## 1. O Que Já Foi Concluído

1. **Padronização Metodológica (v2.1) e Baseline `E0`**:
   - Relatório `E0` salvo em [evidencias/metricas/E0/RELATORIO_METRICAS.md](../evidencias/metricas/E0/RELATORIO_METRICAS.md).
   - Commit base antes de `E1`: `103a1e1ec5ceb05b15411b308b00f8f79fdc15a6`.

2. **Etapa `E1` (`CT-06` e `CT-07` — Catálogo filtrado e Estoque) Concluída, Validada e Commitada**:
   - Relatório `E1` salvo em [evidencias/metricas/E1/RELATORIO_METRICAS.md](../evidencias/metricas/E1/RELATORIO_METRICAS.md).
   - **Commit do estado `E1` (`<SHA-base>` da Etapa `E2`)**: `452524a4963356e4ac0ae352ec99f681d3808eee`.

3. **Etapa `E2` (`CT-08`, `CT-09` e `CT-10` — Carrinho de Compras) — Implementação Concluída e `E2-Modular` Validada**:
   - **Preparação Comum Concluída**:
     - Rotas de carrinho (`POST /carts`, `GET /carts/:id`, `POST /carts/:id/items`, `PATCH /carts/:id/items/:productId`, `DELETE /carts/:id/items/:productId`) implementadas em [api/server.js](../api/server.js).
     - Testes de contrato criados em [api/e2.contract.test.js](../api/e2.contract.test.js) (62/62 testes automatizados passando via `npm run test:all`).
     - Oráculo atualizado para `CT-08`–`CT-10` (`E2_IDS`) em [scripts/validacao/oraculos.mjs](../scripts/validacao/oraculos.mjs) e [scripts/validacao/validar.mjs](../scripts/validacao/validar.mjs).
   - **Unidade `E2-Modular` (`E2-M`) Concluída e Validada**:
     - Editado `modular/helpers/http/http.js` (`del`).
     - Criados `modular/profiles/carrinho/carrinho.profiles.js`, `modular/use-cases/carrinho/{createCart,addCartItem,updateCartItem,removeCartItem,getCart}.useCase.js`, `modular/flows/carrinho/{adicao,atualizacao,remocao}.flow.js` e `modular/scenarios/carrinho/{adicao,atualizacao,remocao}.scenario.js`.
     - Validado com sucesso (`10/10` cenários aprovados na 1ª tentativa) em `evidencias/evolucao/E2/tentativas_modular/attempt-01/result.json`.
     - Transcript arquivado em `evidencias/evolucao/E2/transcripts/modular.transcript.jsonl`.
   - **Unidade `E2-Tradicional` (`E2-T`) Implementada (Pronta para Rodar `validar.mjs`)**:
     - Criados `tradicional/ct08.js`, `tradicional/ct09.js`, `tradicional/ct10.js`.
     - Criados `evidencias/evolucao/E2/manifest-tradicional.json` e `evidencias/evolucao/E2/manifest-both.json`.
     - Transcript arquivado em `evidencias/evolucao/E2/transcripts/tradicional.transcript.jsonl`.

---

## 2. Próximos Passos Imediatos no Novo Terminal

1. **Finalizar Validação e Métricas de `E2`** (basta rodar estes 3 comandos):
   ```bash
   node scripts/validacao/validar.mjs --state E2 --suite tradicional --manifest evidencias/evolucao/E2/manifest-tradicional.json --out evidencias/evolucao/E2/tentativas_tradicional/attempt-01
   node scripts/validacao/validar.mjs --state E2 --suite both --manifest evidencias/evolucao/E2/manifest-both.json --out evidencias/evolucao/E2/validacao_both
   node scripts/metricas/coletar-metricas.mjs --state E2 --base 452524a4963356e4ac0ae352ec99f681d3808eee --target WORKTREE --trad-transcript evidencias/evolucao/E2/transcripts/tradicional.transcript.jsonl --mod-transcript evidencias/evolucao/E2/transcripts/modular.transcript.jsonl --trad-val-dir evidencias/evolucao/E2/tentativas_tradicional --mod-val-dir evidencias/evolucao/E2/tentativas_modular --both-val evidencias/evolucao/E2/validacao_both/result.json --out evidencias/metricas/E2
   ```
2. **Commitar o Estado `E2`** para registrar o `<SHA-base>` da Etapa `E3`.
3. **Executar Etapa `E3`** (`CT-11` e `CT-12` — Listagem filtrada e Cancelamento de Pedidos; Ordem: `Tradicional` → `Modular`).
4. **Executar Etapa `E4`** (`CT-13`, `CT-14`, `CT-15` — Pagamentos e Compra Completa por Carrinho; Ordem: `Modular` → `Tradicional`).
5. **Executar Fase 2 (`M1`, `M2`, `M3` sobre `E4`)** e gerar o relatório consolidado final (`docs/RELATORIO_EXPERIMENTAL_COMPLETO.md`).
