# TCC — Experimento de organização de testes de carga com k6

Implementação inicial em JavaScript, sem TypeScript e sem dependências de backend. **Não são resultados experimentais.**

## Requisitos
- Node.js 20+ (API e testes da API)
- k6 instalado separadamente (execução das suítes)

## Executar

```bash
npm run api:test
npm run api
```

Em outro terminal:

```bash
k6 run tradicional/ct01.js
k6 run modular/scenarios/autenticacao/autenticacao.scenario.js
```

Para validar todos os cenários, executar `ct01.js` a `ct05.js` em `tradicional/` e os cinco arquivos `*.scenario.js` nas subpastas de `modular/scenarios/`. Todos os cinco profiles usam 1 VU e 1 iteração, herdados do profile smoke padrão. Para uma API remota, usar `-e BASE_URL=http://host:porta` (não use `localhost` dentro de containers sem configurar rede).

## Organização
- `api/`: API REST de pedidos, dados fixos e estado de pedidos em memória.
- `tradicional/`: scripts por cenário, com operações e verificações diretas.
- Todas as camadas de `modular/` usam subpastas `autenticacao/`, `catalogo/` e `pedidos/`; o profile reutilizável fica em `profiles/comum/`.
- `modular/profiles`: um arquivo de configuração da carga por jornada (`<jornada>.profiles.js`).
- `modular/scenarios`: pontos de entrada de cenários.
- `modular/flows`: jornadas de operações.
- `modular/helpers/checks`: checks parametrizados de status e campos JSON.
- `modular/helpers/http`: transporte HTTP compartilhado (headers, token e JSON).
- `modular/use-cases`: um arquivo por ação atômica, com sua chamada HTTP e verificações; os flows compõem essas ações em jornadas.
- `shared/`: condições comuns aos dois grupos (excluir da medição de código arquitetural).
- `docs/`: contratos, matriz de equivalência e protocolo experimental.

## Observações
A suíte modular **não depende do pacote Pulse**: implementa somente a arquitetura isolada. A suíte tradicional usa funções locais e configuração comum, mas não as quatro camadas. Os dois grupos têm os mesmos checks e a mesma ordem de chamadas. Os cinco cenários são a baseline; R1/R2 são mudanças futuras.

A API e seus testes automatizados foram verificados com Node.js. A execução k6 depende de instalação local e ainda precisa ser verificada antes de declarar equivalência funcional.

A revisão das cinco camadas e as adaptações em relação ao Pulse estão em [docs/arquitetura-pulse.md](arquitetura-pulse.md).

O estado atual da suíte, a estrutura por domínio e os exemplos de uso estão no [relatório modular](RELATORIO_MODULAR_ATUAL.md).

A validação funcional real e suas limitações estão em [RELATORIO_VALIDACAO_FINAL.md](RELATORIO_VALIDACAO_FINAL.md). Procedimento reproduzível: `python3 scripts/validacao/validar.py`. Os 24 arquivos modulares, incluindo os dois helpers, integram integralmente o conjunto das futuras métricas de código.

## Estudo de evolução incremental — preparação

E0 está identificada em [BASELINE_E0.md](BASELINE_E0.md), com commit e tag locais. A expansão planejada segue 5 → 7 → 10 → 12 → 15 cenários por arquitetura. Ver [protocolo](PROTOCOLO_EVOLUCAO_INCREMENTAL.md), [matriz de requisitos](MATRIZ_REQUISITOS_EXPANSAO.md) e [plano de medição](PLANO_MEDICAO_ESFORCO.md). E1–E4 não foram implementados; nenhuma medição definitiva foi iniciada. O protocolo antigo em docs/protocolo.md permanece histórico. A operação atual segue o [roteiro manual](EXECUCAO_MANUAL.md), separado das exigências operacionais do desenho anterior.

## Preparação funcional de E1

API de catálogo/estoque e validador comum preparados, sem implementação dos cenários novos. Decisão e evidências em [RELATORIO_PRONTIDAO_E1.md](RELATORIO_PRONTIDAO_E1.md). Operação do validador: [scripts/validacao/README.md](../scripts/validacao/README.md).

## Execução e medição conduzida por IA (Emenda v2.0)

A automação antiga de cronômetro humano foi removida e substituída pelo protocolo *AI-Only* (Fase 1: Expansão `E1`–`E4`; Fase 2: Manutenção `M1`–`M3`), utilizando subagentes isolados por arquitetura, validação HTTP real via `scripts/validacao/validar.mjs` e extração automática de métricas estruturais, reutilização, duplicação e esforço do agente via `scripts/metricas/coletar-metricas.mjs`. Consulte [EXECUCAO_MANUAL.md](EXECUCAO_MANUAL.md), [PROTOCOLO_EVOLUCAO_INCREMENTAL.md](PROTOCOLO_EVOLUCAO_INCREMENTAL.md) e [PLANO_MEDICAO_ESFORCO.md](PLANO_MEDICAO_ESFORCO.md).
