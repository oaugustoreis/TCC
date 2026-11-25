# Modular manual T1
Pré-requisito: k6 2.0.0. Sem dependências npm.
Em outro terminal: `cd ../shared-mock && node server.cjs` (Node 24.18.0).
Neste diretório: `k6 run --no-usage-report scenarios/journey.js`.
URL opcional: `k6 run -e BASE_URL=http://127.0.0.1:3333 scenarios/journey.js`.
Configuração, perfil, cenário, fluxo, operações e contratos em diretórios próprios.
