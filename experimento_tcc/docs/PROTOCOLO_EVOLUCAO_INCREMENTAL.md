# Protocolo Experimental — Evolução Incremental e Manutenção Assistida por IA

Versão 2.1 — 08/11/2026.

Vínculos: [Matriz de Requisitos da Expansão](MATRIZ_REQUISITOS_EXPANSAO.md), [Plano de Medição](PLANO_MEDICAO_ESFORCO.md), [Baseline E0](BASELINE_E0.md), [Execução Operacional](EXECUCAO_MANUAL.md).

---

## 1. Pergunta de Pesquisa e Delineamento

**Pergunta central**:
> *Como a organização arquitetural de testes de carga em k6 — **Tradicional** (scripts diretos por cenário) vs. **Modular** (4 camadas inspiradas no Pulse + helpers compartilhados) — impacta a adição/modificação de código, a superfície de impacto, a taxa de duplicação, a reutilização efetiva de componentes e o esforço operacional quando os testes são evoluídos e mantidos por um agente de IA?*

**Delineamento**:
Estudo experimental controlado, longitudinal e pareado, composto por **Baseline `E0` + 7 etapas pareadas (14 unidades experimentais)**, dividido em dois blocos analíticos:
- **Bloco 1 — Fase 1: Evolução Incremental (`E1` a `E4`, 8 unidades)**: Verifica quanto código cada arquitetura precisa acrescentar ou modificar para incorporar novos cenários cumulativamente (de 5 para 15 cenários).
- **Bloco 2 — Fase 2: Manutenção Transversal (`M1` a `M3`, 6 unidades)**: Verifica a propagação de mudanças de contrato pelos 15 cenários existentes, partindo independentemente do estado `E4` validado.

---

## 2. Especificação das Etapas (14 Unidades Pareadas)

### Fase 1: Evolução Incremental (`E0` → `E1` → `E2` → `E3` → `E4`)
Os contratos, payloads, sequências HTTP e predicados de checks de `CT-01` a `CT-15` estão congelados em [MATRIZ_REQUISITOS_EXPANSAO.md](MATRIZ_REQUISITOS_EXPANSAO.md). Cada etapa acumula os cenários das etapas anteriores:

| Estado | Novos Cenários | Total por Arquitetura | Requests / Checks por Suíte | Ordem de Execução |
|---|---|---:|---:|---|
| **E0** | `CT-01` a `CT-05` (Baseline validada) | 5 | 14 / 30 | Baseline histórica (`e0-baseline-validada`) |
| **E1** | `CT-06` e `CT-07`: Catálogo filtrado e Estoque | 7 | 20 / 42 | `E1-T` (Tradicional) → `E1-M` (Modular) |
| **E2** | `CT-08` a `CT-10`: Carrinho de compras | 10 | 34 / 70 | `E2-M` (Modular) → `E2-T` (Tradicional) |
| **E3** | `CT-11` e `CT-12`: Listagem filtrada e Cancelamento | 12 | 42 / 86 | `E3-T` (Tradicional) → `E3-M` (Modular) |
| **E4** | `CT-13` a `CT-15`: Pagamentos e Compra completa | 15 | 66 / 134 | `E4-M` (Modular) → `E4-T` (Tradicional) |

### Fase 2: Manutenção e Atualização Transversal (`M1`, `M2`, `M3` sobre `E4`)
**Regra de Independência**: Todas as três tarefas de manutenção (`M1`, `M2` e `M3`) partem **independentemente do mesmo estado `E4` validado** (em branches separadas criadas a partir da tag/commit `estado-e4` + preparação da respectiva API/oráculo). Nenhuma tarefa `M` acumula alterações da tarefa `M` anterior, garantindo que uma manutenção não altere o ponto de partida da seguinte.

| Tarefa | Base | Escopo da Mudança de Contrato / Verificação | Cenários Afetados por Suíte | Ordem de Execução |
|---|---|---|---:|---|
| **M1** | `estado-e4` | **Evolução no Contrato de Login (`POST /auth/login`)**: A API passa a retornar `expiresIn: 3600` junto ao `token` e `tokenType`. Todas as autenticações da suíte devem validar também `expiresIn === 3600` no check de corpo do login. | 15 cenários (`CT-01` a `CT-15`) | `M1-T` → `M1-M` |
| **M2** | `estado-e4` | **Novo Campo Obrigatório em Criação de Pedido (`POST /orders`)**: A API passa a exigir `currency: "BRL"` no payload de `POST /orders` e a retornar `currency: "BRL"` no pedido criado. Todos os cenários que criam pedidos devem enviar e validar `currency === "BRL"`. | 8 cenários (`CT-03` a `CT-05`, `CT-11` a `CT-15`) | `M2-M` → `M2-T` |
| **M3** | `estado-e4` | **Nova Verificação em Consulta de Pedido (`GET /orders/:id`)**: A API passa a incluir `createdAt` (string ISO não vazia) nos pedidos, e todas as consultas individuais `GET /orders/:id` devem verificar `typeof createdAt === "string" && createdAt.length > 0`. | 8 cenários (`CT-04`, `CT-05`, `CT-11` a `CT-15`) | `M3-T` → `M3-M` |

---

## 3. Procedimento Operacional por Etapa

1. **Preparação Comum (Fora das Unidades Medidas)**:
   - Atualizar `api/server.js`, testes de contrato da API e o oráculo independente (`scripts/validacao/oraculos.mjs`) para a etapa.
   - Executar os testes de contrato e a regressão do estado anterior; commitar como `<SHA-base>` da etapa.
2. **Execução de Subagentes Isolados**:
   - Invocar um subagente novo para a primeira condição na ordem definida, com prompt padronizado e restrição explícita de acesso apenas à pasta daquela arquitetura (`tradicional/` ou `modular/`).
   - O subagente implementa a tarefa e executa o validador `scripts/validacao/validar.mjs` (salvando cada tentativa em `tentativas_<arquitetura>/attempt-NN`).
   - Repetir o mesmo procedimento em um novo subagente isolado para a segunda arquitetura.
3. **Validação Pareada e Extração Auditada**:
   - Executar `scripts/validacao/validar.mjs --suite both` para comprovar equivalência funcional entre os pares (`validation_passed: true` e `complete_functional_equivalence: true`).
   - Executar `scripts/metricas/coletar-metricas.mjs` passando o `<SHA-base>`, o `<SHA-final>`, os caminhos dos arquivos `transcript.jsonl` gerados pelo sistema para cada subagente e as pastas de tentativas de validação.

---

## 4. Alinhamento com a Estrutura do Texto do TCC

Para referência direta na escrita dos capítulos do TCC:
- **Seção 3 (Objetivos Específicos)**: Contempla tanto a evolução incremental de cenários (`E1`–`E4`) quanto a avaliação de manutenibilidade diante de mudanças de contrato (`M1`–`M3`).
- **Seção 5.1 (Delineamento)**: Descreve a baseline `E0` e as 7 etapas pareadas (14 unidades experimentais).
- **Seção 5.3 (Cenários)**: Separa o catálogo de cenários de expansão (`CT-06` a `CT-15` em `E1`–`E4`) das tarefas de manutenção (`M1`–`M3` partindo independentemente de `E4`).
- **Seção 5.6 (Indicadores)**: Incorpora as definições e fórmulas da v2.1 de [PLANO_MEDICAO_ESFORCO.md](PLANO_MEDICAO_ESFORCO.md) (`net_diff_lines` vs. `files_written`, `batch_reuse` vs. `static_suite_imports`, detector léxico por união de tokens/linhas e `first_validation_pass`).
- **Seção 5.7 (Procedimento)**: Documenta o isolamento por subagentes e a separação entre coleta primária (`.system_generated/logs/transcript.jsonl` e `result.json`), cálculo estático/Git e consolidação.
- **Seção 5.8 (Análise dos Resultados)**: Organizada em dois blocos principais (Bloco 1: Evolução `E0→E4`; Bloco 2: Manutenção `M1–M3`), complementados pelas métricas operacionais auditadas dos subagentes.
- **Seção 5.9 (Ameaças à Validade)**: Discute a estocasticidade de modelos LLM, a dependência cumulativa entre `E1`–`E4` (mitigada na Fase 2 pela independência de `M1`–`M3` a partir de `E4`) e o escopo das métricas extraídas dos logs do runtime.
