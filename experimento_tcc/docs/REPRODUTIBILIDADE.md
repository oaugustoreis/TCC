# Reprodutibilidade

Roteiro para reproduzir as verificações do estudo em Linux ou WSL. Complementa `EXECUCAO_MANUAL.md` (validação funcional) e `PLANO_MEDICAO_ESFORCO.md` (métricas de código).

## 1. Ambiente

Registrar antes de qualquer rodada:

```bash
node --version; npm --version; k6 version; git rev-parse HEAD; uname -a
```

Ambientes já registrados no estudo: baseline E0 em Windows (Node.js v24.10.0, npm 11.6.1, k6 v2.3.0) e reprodução técnica de 10/11/2026 em Linux/WSL (Node.js v24.18.0, k6 v2.0.0). Para as medições de custo, usar **uma única máquina e uma única versão do k6** em todas as rodadas.

## 2. Passos

Na raiz `experimento_tcc/`:

| Etapa | Comando | Resultado esperado |
|---|---|---|
| Testes (API, helpers, instrumentos) | `npm run test:all` | todos aprovados |
| Regra de dependência entre camadas | `npm run arquitetura:verificar` | 0 violações, 0 ciclos (código de saída 0) |
| Validação funcional | `node scripts/validacao/validar.mjs ...` | ver `EXECUCAO_MANUAL.md` |
| Custo de execução | `npm run custo:medir -- --k6 "$(command -v k6)" --reps 5` | pasta nova em `evidencias/custo/` |

Para posicionar o repositório em um estado: `git checkout <tag>` (por exemplo, a tag de E4) antes das etapas.

### Custo de execução

`scripts/custo/medir-custo.mjs` mede, sem alterar as suítes, o código empacotado (`k6 archive`), a inicialização (`k6 inspect`) e o tempo, a CPU e o pico de memória do processo k6 em 1x1, 10x100 e 50x200 (VUs x iterações). Opções: `--entradas ct01,ct04`, `--niveis 1x1,10x100`, `--reps N`, `--porta`, `--saida`, `--excluir-carga ct11`.

Saídas: `ambiente.json` (máquina, versões, commit, SHA-256 das fontes), `empacotamento.json`, `inicializacao.csv`, `execucoes.csv` (uma linha por execução) e `resumo.md` (medianas, quartis e razões modular/tradicional).

Cuidados para reduzir ruído: fechar outros programas, manter o computador na tomada e em modo de alto desempenho, não usar a máquina durante a rodada e não misturar rodadas com versões diferentes do k6.

Decisões de projeto que afetam a leitura:

- A carga é aplicada por `--vus` e `--iterations`. Nas entradas modulares isso substitui `options.scenarios`, então a camada Profile não define a carga nessas execuções (o k6 emite aviso). As suítes não são editadas.
- O CT-11 exige exatamente um pedido `created` na listagem e só passa com a API em estado vazio. Por isso entra apenas no nível de 1 iteração (verificado: falha de check em todas as iterações extras nas duas suítes).
- A API roda na mesma máquina; seu consumo não é medido.
- Execuções com código de saída diferente de 0, check falho ou número de iterações diferente do esperado são marcadas como inválidas e excluídas do resumo.

## 3. O que é determinístico

Estruturais, empacotamento (módulos e bytes) e dependências dependem apenas das fontes; `.gitattributes` fixa `eol=lf` nos `.js`, então devem coincidir entre sistemas. Tempo, CPU e memória variam com a máquina: comparar por razão entre suítes no mesmo ambiente, nunca por valor absoluto entre ambientes.

## 4. Situação da verificação (27/11/2026)

Feita em Linux (Node.js v22.23.5, k6 v1.3.0, 2 vCPU) sobre o commit `0ac54c3`, apenas para testar os instrumentos:

- `npm run test:all`: 76 de 76 testes aprovados.
- `npm run arquitetura:verificar`: 57 módulos modulares, 151 importações, 0 violações, 0 ciclos.
- `npm run custo:medir`: rodada de teste com 15 entradas, 3 níveis e 3 repetições, 258 execuções válidas e nenhuma inválida (CT-11 apenas com 1 iteração).

Os números dessa rodada de teste **não são resultados do estudo** e não devem ser citados. Não foram reexecutados: `validar.mjs`, `coletar-metricas.mjs`, tags e histórico Git (o clone usado era raso) e qualquer execução em Windows ou com k6 2.x.
