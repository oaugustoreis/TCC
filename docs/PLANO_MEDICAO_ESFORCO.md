# Plano de Medição — Experimento Conduzido por IA (Evolução e Manutenção)

Versão 2.1 — 08/11/2026. Este documento define **o que é medido**, **a distinção entre coleta primária, cálculo e consolidação**, e **como cada métrica é auditada** na comparação entre as arquiteturas **Tradicional** (`tradicional/`) e **Modular** (`modular/`) em k6.

Vínculos: [Protocolo Experimental](PROTOCOLO_EVOLUCAO_INCREMENTAL.md), [Matriz de Requisitos](MATRIZ_REQUISITOS_EXPANSAO.md), [Baseline E0](BASELINE_E0.md), [Extrator e Consolidador de Métricas](../scripts/metricas/coletar-metricas.mjs).

---

## 1. Princípio Metodológico e Separação de Responsabilidades

Para eliminar ruídos subjetivos de digitação humana, fadiga e pausas manuais, a escrita de novos cenários (**Fase 1 — Evolução: `E1` a `E4`**) e a propagação de mudanças de contrato (**Fase 2 — Manutenção: `M1` a `M3`**) são executadas por um **único agente de IA controlado** (mesmo modelo, configuração e prompts padronizados), atuando em **subagentes isolados** por arquitetura.

Para garantir rigor de auditoria, o processo de medição separa explicitamente três etapas:
1. **Coleta Primária (Externa ao LLM)**:
   - Os logs de ações e timestamps do subagente são gravados automaticamente pelo runtime do sistema em `.system_generated/logs/transcript.jsonl`.
   - Os resultados de cada tentativa de validação funcional são gravados pelo orquestrador [scripts/validacao/validar.mjs](../scripts/validacao/validar.mjs) em arquivos `result.json` numerados por tentativa (`attempt-01`, `attempt-02`, ...).
   - **A IA nunca preenche manualmente estimativas sobre suas próprias ações ou tempos.**
2. **Cálculo Determinístico**:
   - O utilitário [scripts/metricas/coletar-metricas.mjs](../scripts/metricas/coletar-metricas.mjs) analisa o código-fonte em disco e o histórico do Git para calcular tamanho (LOC/SLOC/tokens), deltas líquidos (`git diff`), reutilização específica da tarefa (`batch_reuse`) e duplicação léxica de código.
3. **Consolidação e Relatório**:
   - O mesmo utilitário lê os registros primários externos (`transcript.jsonl` e `result.json` das tentativas de validação), une-os às métricas estruturais calculadas e exporta `metricas.json` e `RELATORIO_METRICAS.md`. Caso algum registro primário não esteja disponível no transporte, o campo correspondente é registrado como `null` acompanhado de `missing_reason`, jamais presumido ou estimado.

---

## 2. Unidades de Medição (14 Unidades Pareadas + Baseline `E0`)

O estudo organiza a análise em **dois blocos complementares** (7 etapas pareadas = 14 unidades experimentais):

### Bloco 1 — Fase 1: Evolução Incremental (Adição de Novos Cenários)
Avalia quanto código cada arquitetura precisa acrescentar ou modificar para incorporar novos cenários de negócio cumulativamente:
| Etapa | Unidade Tradicional | Unidade Modular | Ordem de Execução | Escopo |
|---|---|---|---|---|
| **E0** | Baseline `tradicional/` (5 CTs) | Baseline `modular/` (5 CTs) | Concluída | `CT-01` a `CT-05` (Referência inicial) |
| **E1** | `E1-T` | `E1-M` | Tradicional → Modular | + `CT-06`, `CT-07` (Catálogo filtrado e Estoque — total 7 CTs) |
| **E2** | `E2-T` | `E2-M` | Modular → Tradicional | + `CT-08` a `CT-10` (Carrinho de compras — total 10 CTs) |
| **E3** | `E3-T` | `E3-M` | Tradicional → Modular | + `CT-11`, `CT-12` (Listagem filtrada e Cancelamento — total 12 CTs) |
| **E4** | `E4-T` | `E4-M` | Modular → Tradicional | + `CT-13` a `CT-15` (Pagamentos e Checkout completo — total 15 CTs) |

### Bloco 2 — Fase 2: Manutenção Transversal (Propagação de Mudanças sobre `E4`)
Avalia a propagação de mudanças de contrato pelos 15 cenários existentes. **Cada tarefa (`M1`, `M2`, `M3`) parte independentemente do commit validado do estado `E4`** (em branch própria a partir de `estado-e4`), impedindo que uma manutenção altere o ponto de partida da seguinte:
| Tarefa | Ponto de Partida | Unidade Tradicional | Unidade Modular | Ordem de Execução | Mudança de Contrato / Verificação |
|---|---|---|---|---|---|
| **M1** | `estado-e4` | `M1-T` | `M1-M` | Tradicional → Modular | `/auth/login` retorna `expiresIn: 3600`; validar campo no check de login nos 15 cenários. |
| **M2** | `estado-e4` | `M2-T` | `M2-M` | Modular → Tradicional | `POST /orders` exige/retorna `currency: "BRL"`; atualizar envio e check de criação de pedido (`CT-03` a `CT-05`, `CT-11` a `CT-15`). |
| **M3** | `estado-e4` | `M3-T` | `M3-M` | Tradicional → Modular | `GET /orders/:id` retorna `createdAt` string não vazia; validar campo nas consultas individuais de pedido. |

---

## 3. Especificação das Métricas e Fórmulas

### 3.1. Escopo Primário das Arquiteturas
- **Tradicional (`tradicional/`)**: Todos os arquivos `.js` sob `tradicional/`.
- **Modular (`modular/`)**: Todos os arquivos `.js` sob `modular/`, incluindo integralmente `scenarios/`, `profiles/`, `flows/`, `use-cases/` e `helpers/` (`http.js` e `checks.js`). Nenhum helper é descontado ou externalizado.
- **Escopo Comum (Fora das métricas das arquiteturas)**: `api/`, `shared/`, `tests/`, `scripts/`, `docs/` e `evidencias/`.

### 3.2. Métricas Estruturais de Tamanho
1. **Arquivos JS Autorais (`files_count`)**: Quantidade total de arquivos `.js` na pasta da arquitetura ao fim da etapa.
2. **Linhas Físicas (`physical_lines` / LOC)**: Total de linhas terminadas por `\n` ou `\r\n` (linha final sem newline conta 1).
3. **Linhas Lógicas (`logical_lines` / SLOC)**: Total de linhas contendo código efetivo, após remover comentários (`//` e `/* ... */`) e linhas em branco.
4. **Total de Tokens JS (`total_tokens`)**: Quantidade total de tokens léxicos da linguagem JavaScript (identificadores, palavras-chave, operadores, pontuação e literais).

### 3.3. Métricas de Alteração no Git: Mudança Líquida vs. Esforço de Escrita
Calculadas via `git diff --no-ext-diff --no-textconv --no-renames` entre `<SHA-base>` e `<SHA-final>`:
1. **Arquivos Criados (`files_added` — `A`), Modificados (`files_modified` — `M`) e Removidos (`files_deleted` — `D`)**.
2. **Superfície de Impacto (`files_touched_total` / *Blast Radius*)**: Soma `A + M + D` no diff final da unidade.
3. **Linhas Adicionadas (`lines_added` — `+`) e Removidas (`lines_removed` — `-`)**: Extraídas via `--numstat`.
4. **Distinção entre Mudança Líquida e Retrabalho**:
   - **`net_diff_lines` (Volume de alteração líquida)**: Soma `lines_added + lines_removed` entre o `<SHA-base>` e o `<SHA-final>`. Mede o tamanho líquido da entrega consolidada no Git, **não** o retrabalho ocorrido durante a execução.
   - **`files_written` (Operações de escrita registradas)**: Quantidade total de chamadas de criação/edição de arquivos (`write_file` + `edit_file`) registradas no log do subagente (ex.: se a IA editar o mesmo arquivo 5 vezes na sessão, `files_modified` no Git será `1`, mas `files_written` será `5`).
   - **`intermediate_churn` (Churn entre checkpoints)**: Soma acumulada de `lines_added + lines_removed` entre checkpoints intermediários (quando houver múltiplos ciclos de validação com commits/patches intermediários). Quando não houver checkpoints intermediários, registra `null` com nota explicativa.

### 3.4. Métricas de Reutilização: Reuso na Tarefa (`batch_reuse`) vs. Acoplamento Estático (`static_suite_imports`)
Para evitar inflar a reutilização da arquitetura Modular contando módulos antigos que não participaram da tarefa, o extrator separa duas visões:
1. **Reutilização Efetiva na Tarefa (`batch_reuse`)**:
   - Parte **exclusivamente dos arquivos criados (`A`) ou modificados (`M`) na unidade** (`batch_entry_files_touched`).
   - Percorre o fecho transitivo de dependências internas (`import`) consumidas por esses arquivos ativos no lote e classifica cada componente interno consumido:
     - **`batch_reused_unmodified_count`**: Módulos preexistentes no `<SHA-base>` efetivamente importados pelos arquivos da tarefa **sem sofrer nenhuma edição** na etapa.
     - **`batch_reused_modified_count`**: Módulos preexistentes no `<SHA-base>` importados pelos arquivos da tarefa que **foram modificados (`M`)** na etapa.
     - **`batch_created_shared_count`**: Novos módulos internos criados na própria etapa (`A`) e importados por outros arquivos do lote.
2. **Acoplamento Estático Acumulado da Suíte (`static_suite_imports`)**:
   - Mede a estrutura global de `imports` da suíte inteira ao fim do estado (`internal_imports_total` e `distinct_internal_components_imported`), relatada separadamente apenas como propriedade estrutural do estado.

### 3.5. Métricas de Duplicação de Código (Detector Léxico `exact-token-window-union-v1`)
Calculadas por `computeCodeDuplication` em [scripts/metricas/coletar-metricas.mjs](../scripts/metricas/coletar-metricas.mjs), validado por testes unitários determinísticos ([scripts/metricas/coletar-metricas.test.mjs](../scripts/metricas/coletar-metricas.test.mjs)):
- **Regras de Normalização e Escopo**:
  - Comentários de linha (`//`), comentários de bloco (`/* ... */`) e espaços/quebras de linha são removidos durante a tokenização.
  - Identificadores, palavras-chave, operadores e literais são preservados literalmente (detecção de clones **Tipo-1** exatos).
  - Janela mínima de detecção: **`min_tokens_window = 25` tokens consecutivos** (limiar inspirado na literatura e em ferramentas como `jscpd`, mas implementado por algoritmo léxico próprio e determinístico, sem alegar identidade de implementação com o pacote `jscpd`).
  - As janelas deslizantes respeitam estritamente os limites de cada arquivo (**nunca cruzam a fronteira entre o fim de um arquivo e o início de outro**).
  - São detectados e contabilizados separadamente **clones intra-arquivo** (`intra_file_clones_count`, repetidos em posições distintas do mesmo arquivo) e **clones inter-arquivos** (`cross_file_clones_count`, repetidos entre arquivos diferentes da mesma suíte).
- **Cálculo de Percentuais por União (Sem Contagem Dupla)**:
  - Quando múltiplas janelas de 25 tokens se sobrepõem, cada posição de token do arquivo é marcada uma única vez em um vetor booleano (`Uint8Array`) e cada linha lógica (`arquivo:linha`) é inserida em um conjunto matemático (`Set`).
  - $$\text{Duplicação de Tokens (\%)} = \frac{|\text{União das posições de tokens em clones}|}{\text{Total de Tokens da suíte}} \times 100$$
  - $$\text{Duplicação de Linhas (\%)} = \frac{|\text{União das linhas lógicas (SLOC) com tokens em clones}|}{\text{Total de SLOC da suíte}} \times 100$$

### 3.6. Métricas Operacionais Auditadas do Agente de IA
Extraídas mecanicamente a partir dos logs primários externos, nunca auto-declaradas pelo modelo:
| Métrica | Origem Auditável Primária | Definição Operacional |
|---|---|---|
| **`first_validation_pass`** | `attempt-01/result.json` (ou 1ª tentativa sem erro de infra) | Indicador operacional próprio deste estudo (`true`/`false`): registra se a suíte passou com 100% de aprovação na 1ª execução funcional do validador após a implementação (não confundir com a estimativa probabilística combinatória $pass@k$ de benchmarks de LLMs). |
| **`functional_validation_cycles`** | Diretórios de tentativas do `validar.mjs` | Quantidade de execuções funcionais válidas do validador realizadas até aprovar a unidade. |
| **`infra_error_runs`** | Diretórios de tentativas do `validar.mjs` | Quantidade de execuções interrompidas por falha ambiental/infraestrutura (`api_ready: false` ou erro de processo) antes do julgamento funcional, contabilizadas separadamente de defeitos da suíte. |
| **`files_read`** | `.system_generated/logs/transcript.jsonl` | Total de chamadas `read_file` / `view_file` registradas nos passos `PLANNER_RESPONSE`. |
| **`files_written`** | `.system_generated/logs/transcript.jsonl` | Total de chamadas `write_file` + `edit_file` registradas nos passos `PLANNER_RESPONSE`. |
| **`commands_run`** | `.system_generated/logs/transcript.jsonl` | Total de chamadas `run_command` registradas nos passos `PLANNER_RESPONSE`. |
| **`tool_calls_total`** | `.system_generated/logs/transcript.jsonl` | Soma de todas as invocações de ferramentas registradas no transcript do subagente. |
| **`duration_seconds`** | `.system_generated/logs/transcript.jsonl` | Diferença em segundos entre o `created_at` (ISO-8601) do primeiro e do último passo registrados pelo runtime na sessão do subagente. |

---

## 4. Comando de Extração e Consolidação

Ao término de cada etapa `<ESTADO>`, executar:

```bash
node scripts/metricas/coletar-metricas.mjs \
  --state <ESTADO> \
  --base <SHA_BASE> \
  --target <SHA_FINAL> \
  --validation evidencias/evolucao/<ESTADO>/validacao_both/result.json \
  --trad-transcript <CAMINHO_TRANSCRIPT_SUBAGENTE_TRADICIONAL> \
  --mod-transcript <CAMINHO_TRANSCRIPT_SUBAGENTE_MODULAR> \
  --trad-val-attempts evidencias/evolucao/<ESTADO>/tentativas_tradicional \
  --mod-val-attempts evidencias/evolucao/<ESTADO>/tentativas_modular \
  --out evidencias/metricas/<ESTADO>
```
