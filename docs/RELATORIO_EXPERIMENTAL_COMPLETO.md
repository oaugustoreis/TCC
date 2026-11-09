# Relatório Experimental Completo — Evolução Incremental e Manutenção Transversal Assistida por IA (Tradicional vs. Modular em k6)

Versão consolidada: `09/11/2026` — Protocolo Experimental v2.1.

Documentos relacionados:
- [Protocolo Experimental](PROTOCOLO_EVOLUCAO_INCREMENTAL.md)
- [Matriz de Requisitos da Expansão](MATRIZ_REQUISITOS_EXPANSAO.md)
- [Plano de Medição de Esforço](PLANO_MEDICAO_ESFORCO.md)
- [Baseline E0](BASELINE_E0.md)
- Relatórios individuais por etapa: [E0](../evidencias/metricas/E0/RELATORIO_METRICAS.md), [E1](../evidencias/metricas/E1/RELATORIO_METRICAS.md), [E2](../evidencias/metricas/E2/RELATORIO_METRICAS.md), [E3](../evidencias/metricas/E3/RELATORIO_METRICAS.md), [E4](../evidencias/metricas/E4/RELATORIO_METRICAS.md), [M1](../evidencias/metricas/M1/RELATORIO_METRICAS.md), [M2](../evidencias/metricas/M2/RELATORIO_METRICAS.md), [M3](../evidencias/metricas/M3/RELATORIO_METRICAS.md)

---

## 1. Síntese do Delineamento e Rastreabilidade de Commits

O experimento comparou longitudinalmente duas arquiteturas de testes de carga em Grafana k6 — **Tradicional** (scripts monolíticos autocontidos por cenário em `tradicional/`) vs. **Modular** (arquitetura em 4 camadas inspirada no Pulse: `profiles/`, `use-cases/`, `flows/`, `scenarios/` + `helpers/` compartilhados em `modular/`) — ao longo de **Baseline `E0` + 7 etapas pareadas (14 unidades experimentais)**:

- **Bloco 1 — Fase 1: Evolução Incremental (`E0 → E1 → E2 → E3 → E4`, 8 unidades experimentais)**: Expansão cumulativa de 5 para 15 cenários (`CT-01` a `CT-15`), saltando de 14 requisições e 30 checks por suíte em `E0` para 66 requisições e 134 checks por suíte em `E4`.
- **Bloco 2 — Fase 2: Manutenção Transversal (`M1`, `M2`, `M3` sobre `estado-e4`, 6 unidades experimentais)**: Três tarefas independentes de evolução de contrato e verificação executadas em branches separadas (`manutencao/m1`, `manutencao/m2`, `manutencao/m3`), cada qual partindo exatamente do commit/tag `estado-e4` (`a84091f780bd745af4e22e6d787a9dd2124e7224`).

| Etapa / Estado | Escopo Experimental | Cenários Ativos | Req. / Checks por Suíte | Ordem Pareada | Commit Base (`<SHA-base>`) | Commit Final / Branch | Equivalência Funcional (`both`) |
|---|---|---:|---:|---|---|---|---|
| **E0** | Baseline validada (`CT-01` a `CT-05`) | 5 | 14 / 30 | Baseline histórica | — | `103a1e1ec5ceb05b15411b308b00f8f79fdc15a6` | Sim (`5/5` pares) |
| **E1** | Catálogo filtrado (`CT-06`) e Estoque (`CT-07`) | 7 | 20 / 42 | `E1-T → E1-M` | `103a1e1ec5` | `452524a4963356e4ac0ae352ec99f681d3808eee` | Sim (`7/7` pares) |
| **E2** | Carrinho de compras (`CT-08` a `CT-10`) | 10 | 34 / 70 | `E2-M → E2-T` | `452524a496` | `bceabc33eb75c7387a99371ce60ead453fe5ecdd` | Sim (`10/10` pares) |
| **E3** | Listagem filtrada (`CT-11`) e Cancelamento (`CT-12`) | 12 | 42 / 86 | `E3-T → E3-M` | `bceabc33eb` | `6c1ab09a2d0f51510bef8db7af43a69a5c822c88` | Sim (`12/12` pares) |
| **E4** | Pagamentos (`CT-13`, `CT-14`) e Compra completa (`CT-15`) | 15 | 66 / 134 | `E4-M → E4-T` | `6c1ab09a2d` | `a84091f780bd745af4e22e6d787a9dd2124e7224` (`estado-e4`) | Sim (`15/15` pares) |
| **M1** | `expiresIn: 3600` no login (`POST /auth/login`) | 15 (15 afetados) | 66 / 134 | `M1-T → M1-M` | `a84091f780` (`estado-e4`) | `4902526` (`manutencao/m1`) | Sim (`15/15` pares) |
| **M2** | `currency: "BRL"` obrigatório em `POST /orders` | 15 (8 afetados) | 66 / 134 | `M2-M → M2-T` | `a84091f780` (`estado-e4`) | `c8be840` (`manutencao/m2`) | Sim (`15/15` pares) |
| **M3** | `createdAt` verificado em `GET /orders/:id` | 15 (7 scripts / 1 use-case) | 66 / 134 | `M3-T → M3-M` | `a84091f780` (`estado-e4`) | `4df995a` (`manutencao/m3`) | Sim (`15/15` pares) |

---

## 2. Bloco 1 — Fase 1: Evolução Incremental de Cenários (`E0 → E4`)

### 2.1 Evolução Estrutural, Duplicação Léxica e Acoplamento Estático (`E0` a `E4`)

| Estado | Arquivos JS (Trad / Mod) | LOC (Trad / Mod) | SLOC (Trad / Mod) | Tokens JS (Trad / Mod) | Clones >=25 tok (Trad / Mod) | Tokens Duplicados % (Trad / Mod) | Linhas Duplicadas % (Trad / Mod) | Imports Estáticos Internos (Trad / Mod) | Módulos Internos Referenciados (Trad / Mod) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **E0** | 5 / 24 | 85 / 333 | 76 / 286 | 1.162 / 2.016 | 4 / 1 | 90,36% / 7,94% | 96,05% / 6,29% | 0 / 41 | 0 / 19 |
| **E1** | 7 / 29 | 153 / 484 | 140 / 421 | 1.784 / 2.896 | 6 / 1 | 73,77% / 5,52% | 69,29% / 4,28% | 0 / 52 | 0 / 22 |
| **E2** | 10 / 41 | 365 / 848 | 341 / 752 | 3.541 / 4.711 | 11 / 10 | 75,37% / 22,84% | 73,31% / 26,73% | 0 / 83 | 0 / 31 |
| **E3** | 12 / 48 | 464 / 1.062 | 434 / 953 | 4.376 / 5.711 | 14 / 14 | 74,52% / 24,99% | 73,27% / 28,86% | 0 / 99 | 0 / 36 |
| **E4** | 15 / 57 | 784 / 1.526 | 733 / 1.377 | 6.982 / 7.799 | 23 / 21 | 73,35% / 32,36% | 72,03% / 35,80% | 0 / 133 | 0 / 42 |

### 2.2 Delta Git e Reutilização Efetiva por Lote na Fase 1 (`E1` a `E4`)

| Etapa | Arquitetura | Criados (`A`) | Modificados (`M`) | Blast Radius (`A+M`) | Linhas `+` | Linhas `-` | `net_diff_lines` | Reuso s/ Edição (`reused_unmodified`) | Reuso c/ Adaptação (`reused_modified`) | Novos Compartilhados (`new_shared`) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **E1** | Tradicional | 2 | 0 | 2 | 68 | 0 | 68 | 0 | 0 | 0 |
| **E1** | Modular | 5 | 5 | 10 | 165 | 14 | 179 | 2 | 5 | 3 |
| **E2** | Tradicional | 3 | 0 | 3 | 212 | 0 | 212 | 0 | 0 | 0 |
| **E2** | Modular | 12 | 1 | 13 | 364 | 0 | 364 | 3 | 1 | 9 |
| **E3** | Tradicional | 2 | 0 | 2 | 99 | 0 | 99 | 0 | 0 | 0 |
| **E3** | Modular | 7 | 3 | 10 | 229 | 15 | 244 | 4 | 3 | 5 |
| **E4** | Tradicional | 3 | 0 | 3 | 320 | 0 | 320 | 0 | 0 | 0 |
| **E4** | Modular | 9 | 3 | 12 | 492 | 28 | 520 | 9 | 3 | 6 |
| **Soma Fase 1** | **Tradicional** | **10** | **0** | **10** | **699** | **0** | **699** | **0** | **0** | **0** |
| **Soma Fase 1** | **Modular** | **33** | **12** | **45** | **1.250** | **57** | **1.307** | **18** | **12** | **23** |

### 2.3 Esforço Operacional Auditado do Agente de IA na Fase 1 (`E1` a `E4`)

| Etapa | Arquitetura | `first_validation_pass` | Ciclos de Validação | `files_read` | `files_written` | `commands_run` | Tool Calls | `input_tokens` | `cache_read_tokens` | `output_tokens` | Total Tokens LLM | Duração Subagente (s) |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **E1** | Tradicional | Não | 2 | 8 | 3 | 1 | 12 | 24.565 | 34.193 | 3.177 | 61.935 | 48 |
| **E1** | Modular | Sim | 1 | 30 | 12 | 0 | 42 | 34.305 | 106.934 | 14.125 | 155.364 | 87 |
| **E2** | Tradicional | Sim | 1 | 8 | 4 | 0 | 12 | 24.846 | 32.560 | 5.152 | 62.558 | 13 |
| **E2** | Modular | Sim | 1 | 29 | 14 | 1 | 44 | 40.455 | 146.892 | 12.373 | 199.720 | 162 |
| **E3** | Tradicional | Sim | 1 | 10 | 3 | 0 | 13 | 24.065 | 48.014 | 3.211 | 75.290 | 47 |
| **E3** | Modular | Sim | 1 | 21 | 11 | 0 | 32 | 33.804 | 69.035 | 10.441 | 113.280 | 95 |
| **E4** | Tradicional | Sim | 1 | 8 | 4 | 0 | 12 | 24.193 | 27.566 | 5.089 | 56.848 | 49 |
| **E4** | Modular | Sim | 1 | 20 | 13 | 0 | 33 | 35.602 | 52.547 | 12.104 | 100.253 | 116 |
| **Soma Fase 1** | **Tradicional** | **3/4 (75%)** | **5** | **34** | **14** | **1** | **49** | **97.669** | **142.333** | **16.629** | **256.631** | **157** |
| **Soma Fase 1** | **Modular** | **4/4 (100%)** | **4** | **100** | **50** | **1** | **151** | **144.166** | **375.408** | **49.043** | **568.617** | **460** |

**Principais achados da Fase 1 (Evolução Incremental)**:
1. **Custo inicial de estruturação vs. Reuso cumulativo**: Na expansão de novos cenários (`E1` a `E4`), a arquitetura **Tradicional** exige criar apenas 1 arquivo por cenário (`10` arquivos criados no total, `699` linhas líquidas), porém com **zero reutilização interna** (`0` módulos compartilhados) e mantendo **mais de 73% de todos os seus tokens duplicados** (`73,35%` em `E4`, contra `32,36%` na Modular — uma redução de **40,99 pontos percentuais** na taxa de duplicação de tokens na arquitetura Modular).
2. **Aceleração do reuso na Arquitetura Modular em jornadas compostas (`E4`)**: À medida que os cenários se tornam multidomínio (especialmente `CT-15` em `E4`, que integra Autenticação, Catálogo, Estoque, Carrinho, Pedidos e Pagamentos), a arquitetura **Modular** reutilizou **9 componentes preexistentes sem edição** (`login.useCase.js`, `getProduct.useCase.js`, `getProductStock.useCase.js`, `createCart.useCase.js`, `addCartItem.useCase.js`, `getCart.useCase.js`, `http.js`, `checks.js`, `execution.js`) e **3 componentes adaptados** (`createOrder.useCase.js`, `updateOrder.useCase.js`, `getOrder.useCase.js`), fazendo a razão de tokens JS (`Modular / Tradicional`) cair de `1,73x` em `E0` (`2.016 / 1.162`) para apenas **`1,12x` em `E4` (`7.799 / 6.982`)**.

---

## 3. Bloco 2 — Fase 2: Manutenção Transversal sobre `E4` (`M1`, `M2`, `M3`)

### 3.1 Superfície de Impacto (Blast Radius), Delta Git e Duplicação na Fase 2

| Tarefa | Arquitetura | Criados (`A`) | Modificados (`M`) | Blast Radius (`A+M`) | Redução de Blast Radius (Mod vs. Trad) | Linhas `+` | Linhas `-` | `net_diff_lines` | Reuso s/ Edição (`reused_unmodified`) | Tokens Duplicados % | Linhas Duplicadas % |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **M1** (`POST /auth/login` + `expiresIn`) | Tradicional | 0 | 15 | **15** | — | 15 | 15 | **30** | 0 | 73,85% | 72,03% |
| **M1** (`POST /auth/login` + `expiresIn`) | Modular | 0 | 1 | **1** | **-93,3% (-14 arq.)** | 2 | 0 | **2** | 2 | 32,26% | 35,75% |
| **M2** (`POST /orders` + `currency: "BRL"`) | Tradicional | 0 | 8 | **8** | — | 21 | 16 | **37** | 0 | 73,60% | 71,95% |
| **M2** (`POST /orders` + `currency: "BRL"`) | Modular | 0 | 1 | **1** | **-87,5% (-7 arq.)** | 10 | 5 | **15** | 2 | 32,77% | 36,03% |
| **M3** (`GET /orders/:id` + `createdAt`) | Tradicional | 0 | 7 | **7** | — | 17 | 7 | **24** | 0 | 74,02% | 73,35% |
| **M3** (`GET /orders/:id` + `createdAt`) | Modular | 0 | 1 | **1** | **-85,7% (-6 arq.)** | 15 | 0 | **15** | 2 | 32,65% | 36,21% |
| **Soma Fase 2** | **Tradicional** | **0** | **30** | **30** | — | **53** | **38** | **91** | **0** | **73,82% (méd.)** | **72,44% (méd.)** |
| **Soma Fase 2** | **Modular** | **0** | **3** | **3** | **-90,0% (-27 arq.)** | **27** | **5** | **32** | **6** | **32,56% (méd.)** | **36,00% (méd.)** |

### 3.2 Esforço Operacional Auditado do Agente de IA na Fase 2 (`M1`, `M2`, `M3`)

| Tarefa | Arquitetura | `first_validation_pass` | Ciclos de Validação | `files_read` | `files_written` | Tool Calls | `input_tokens` | `cache_read_tokens` | `output_tokens` | Total Tokens LLM | Duração Subagente (s) |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **M1** | Tradicional | Sim | 1 | 17 | 15 | 32 | 26.004 | 8.026 | 12.643 | 46.673 | 8 |
| **M1** | Modular | Sim | 1 | 5 | 1 | 6 | 15.317 | 18.182 | 1.216 | 34.715 | 19 |
| **M2** | Tradicional | Sim | 1 | 9 | 8 | 17 | 20.044 | 8.131 | 7.823 | 35.998 | 12 |
| **M2** | Modular | Sim | 1 | 151 | 1 | 152 | 120.778 | 1.068.924 | 20.680 | 1.210.382 | 411 |
| **M3** | Tradicional | Sim | 1 | 8 | 7 | 15 | 19.426 | 8.243 | 7.152 | 34.821 | 8 |
| **M3** | Modular | Sim | 1 | 10 | 1 | 11 | 17.453 | 20.914 | 2.555 | 40.922 | 18 |
| **Soma Fase 2** | **Tradicional** | **3/3 (100%)** | **3** | **34** | **30** | **64** | **65.474** | **24.400** | **27.618** | **117.492** | **28** |
| **Soma Fase 2** | **Modular** | **3/3 (100%)** | **3** | **166** | **3** | **169** | **153.548** | **1.108.020** | **24.451** | **1.286.019** | **448** |

**Principais achados da Fase 2 (Manutenção Transversal)**:
1. **Isolamento de Mudanças de Contrato (Blast Radius 10x menor na Modular)**:
   - Nas três tarefas de manutenção transversal (`M1`, `M2`, `M3`), a arquitetura **Modular** absorveu 100% da mudança de contrato editando **exatamente 1 único arquivo de Use Case** em cada tarefa (`login.useCase.js` em `M1`, `createOrder.useCase.js` em `M2`, e `getOrder.useCase.js` em `M3`), sem tocar em nenhum `flow`, `data`, `profile` ou `scenario` (`3` arquivos modificados no total das 3 tarefas, `net_diff_lines = 32`).
   - Já na arquitetura **Tradicional**, a mesma evolução exigiu modificar diretamente todos os scripts de cenário afetados (`15` arquivos em `M1`, `8` arquivos em `M2` e `7` arquivos em `M3`, somando **`30` arquivos modificados** e `net_diff_lines = 91`), demonstrando empiricamente o efeito da duplicação estrutural (`~73,8%` de tokens duplicados) sobre a propagação de manutenção (*shotgun surgery*).
2. **Redução de Escritas e Geração de Código (`files_written` e `output_tokens`)**:
   - O número de operações de escrita/edição caiu de **30 edições na Tradicional para apenas 3 edições na Modular (-90%)**.
   - Quando o subagente conhece os caminhos das camadas (`M1-M` e `M3-M`), a arquitetura Modular reduz drasticamente os tokens gerados (`output_tokens`: `1.216` vs. `12.643` em `M1`, uma **redução de 90,4%**, e `2.555` vs. `7.152` em `M3`, uma **redução de 64,3%**) e o número de tool calls (`6` vs. `32` em `M1`, e `11` vs. `15` em `M3`).
3. **Achado Metodológico Relevante sobre Navegação de Agentes de IA em Arquiteturas em Camadas (`M2-M` vs. `M3-M`)**:
   - Em `M2-M`, quando o prompt informou apenas o arquivo inicial (`createOrder.useCase.js`) sem listar os nomes exatos dos arquivos de `flows/` e `scenarios/` (e sem ferramenta de listagem de diretórios no sandbox de leitura), o subagente realizou diversas tentativas de leitura por inferência de nomes até localizar os 8 fluxos consumidores e confirmar que nenhum deles precisava ser alterado (`151` chamadas `read_file`), mas ao final editou **apenas 1 arquivo (`createOrder.useCase.js`)**.
   - Em `M3-M`, quando os caminhos dos módulos de domínio foram informados no prompt (de forma análoga à lista de arquivos `ctXX.js` fornecida à Tradicional), o subagente `M3-M` inspecionou os arquivos diretamente (`10` leituras), concluiu em `18s` e gerou `64,3%` menos `output_tokens` que `M3-T`. Esse contraste evidencia uma implicação prática importante para Engenharia de Software Assistida por IA: **arquiteturas modulares em camadas minimizam drasticamente o raio de edição (`Blast Radius = 1`), mas beneficiam-se de índices arquiteturais ou mapas de diretórios no contexto do agente para evitar custo de descoberta por tentativa e erro**.

---

## 4. Consolidação Geral e Resposta à Pergunta de Pesquisa

> **Pergunta de Pesquisa**: *Como a organização arquitetural de testes de carga em k6 — Tradicional vs. Modular — impacta a adição/modificação de código, a superfície de impacto, a taxa de duplicação, a reutilização efetiva de componentes e o esforço operacional quando os testes são evoluídos e mantidos por um agente de IA?*

| Dimensão Avaliada | Arquitetura Tradicional | Arquitetura Modular (4 Camadas) | Síntese Comparativa |
|---|---|---|---|
| **Duplicação de Código (`E4`)** | `73,35%` dos tokens / `72,03%` das linhas | `32,36%` dos tokens / `35,80%` das linhas | Modular reduz a duplicação em **-40,99 p.p.** (tokens) e **-36,23 p.p.** (linhas). |
| **Convergência de Tamanho (`E0 → E4`)** | `1.162 → 6.982` tokens JS (`6,01x`) | `2.016 → 7.799` tokens JS (`3,87x`) | O overhead relativo de tokens da Modular cai de **`+73,5%` em `E0` para apenas `+11,7%` em `E4`**. |
| **Reutilização Efetiva na Expansão (`E1–E4`)** | `0` componentes reutilizados | `18` usos s/ edição + `12` adaptados + `23` novos compartilhados | Em `E4` (`CT-15`), `9` componentes preexistentes foram reutilizados sem nenhuma edição. |
| **Superfície de Impacto na Manutenção (`M1–M3`)** | `30` arquivos modificados (`15 + 8 + 7`) | `3` arquivos modificados (`1 + 1 + 1`) | Modular reduz o *Blast Radius* de manutenção em **90,0%** (`1` use-case por mudança de contrato). |
| **Volume de Alteração na Manutenção (`M1–M3`)** | `91` linhas líquidas (`net_diff_lines`) | `32` linhas líquidas (`net_diff_lines`) | Modular reduz o volume de código alterado na manutenção em **64,8%**. |
| **Equivalência Funcional Auditada** | `100%` aprovada (`E0`–`E4`, `M1`–`M3`) | `100%` aprovada (`E0`–`E4`, `M1`–`M3`) | Ambas atingiram `complete_functional_equivalence: true` em todas as etapas. |
