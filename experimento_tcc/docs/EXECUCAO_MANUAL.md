# Execução manual dos testes

Reinício operacional solicitado em 06/11/2026. Não usa cápsula, preflight do Codex, controlador temporal ou orquestração de conversas. As suítes, API, contratos e oráculos existentes foram preservados. Nenhuma etapa de expansão foi executada nesta limpeza.

## 1. Abrir o projeto no Ubuntu/WSL

```bash
cd /mnt/d/TCC
node --version
command -v k6
k6 version
```

O Node da API deve ser 20 ou superior. Se `k6` não existir, instalar a versão Linux antes da validação de carga; não tratar ausência da ferramenta como falha da suíte.

## 2. Conferir os testes comuns

```bash
npm run api:test
node --experimental-vm-modules --test api/e1.contract.test.js tests/*.test.js scripts/validacao/oraculos.test.mjs
```

## 3. Executar cenários individualmente

No terminal A:

```bash
cd /mnt/d/TCC
npm run api
```

No terminal B:

```bash
cd /mnt/d/TCC
k6 run tradicional/ct01.js
k6 run modular/scenarios/autenticacao/autenticacao.scenario.js
```

Execute um cenário por vez. Confira em `docs/contratos.md` e na matriz os dados e os checks esperados. Esses dois exemplos não validam a suíte inteira. Encerre a API com Ctrl+C após os testes.

## 4. Validar a baseline completa, uma arquitetura por vez

O validador funcional inicia suas próprias instâncias da API. Não exige uma sessão do Codex nem o antigo controlador. Cada comando usa uma pasta nova:

```bash
cd /mnt/d/TCC
pasta_execucao="evidencias/manual/$(date -u +%Y%m%dT%H%M%SZ)"
node scripts/validacao/validar.mjs --state E0 --suite tradicional --out "$pasta_execucao/tradicional"
node scripts/validacao/validar.mjs --state E0 --suite modular --out "$pasta_execucao/modular"
```

Pare e examine a saída se um comando falhar. Para comparação conjunta dos dois grupos, execute o mesmo validador com `--suite both` em outra pasta nova. Consulte `scripts/validacao/README.md` para os manifestos de estados posteriores; E1 não usa automaticamente as entradas E0.

## 5. Execução e Medição Conduzida por IA (Emenda v2.0 — 08/11/2026)

A partir de 08/11/2026, a evolução incremental (**Fase 1**: `E1` a `E4`) e a manutenção transversal (**Fase 2**: `M1` a `M3`) são conduzidas por um agente de IA único utilizando subagentes isolados por arquitetura (`tradicional/` vs. `modular/`), sem cronometragem humana manual:

1. **Preparação Comum**: Antes de cada lote (`E1`–`E4` ou `M1`–`M3`), a API (`api/server.js`), os testes de contrato (`api/*.contract.test.js`) e o oráculo (`scripts/validacao/oraculos.mjs`) são atualizados e verificados em commit separado.
2. **Implementação Isolada por Subagente**:
   - Cada condição da etapa (ex.: `E1-Tradicional` e `E1-Modular`) é executada por um subagente independente que recebe o prompt padronizado e tem acesso restrito apenas à pasta da sua arquitetura (`tradicional/` ou `modular/`).
   - Não alterar API, oráculos ou requisitos para aprovar uma suíte.
3. **Validação HTTP Real**:
   - Validar cada arquitetura e o par completo (`--suite both`) com `scripts/validacao/validar.mjs`.
4. **Extração Automática de Métricas**:
   - Ao final de cada etapa, executar `node scripts/metricas/coletar-metricas.mjs` para extrair automaticamente os deltas do Git (`--numstat`, `--name-status`), LOC/SLOC, reutilização de módulos ESM, taxa de duplicação/clones de código e métricas operacionais do subagente (*Pass@1*, ciclos de validação, *tool calls* e duração do turno).
