# Modular Pulse T1
Pré-requisitos: Node 24.18.0, npm 11.16.0, k6 2.0.0; executar `npm ci`.
Mock independente: em outro terminal, `cd ../shared-mock && node server.cjs`.
CLI oficial fixada: `node ../evidence/cli/node_modules/pulse-arch/pulse/cli.js run catalog_smoke_test dev`.
Reinstalar essa CLI isolada se necessário: a partir de T1, `npm install --prefix evidence/cli --ignore-scripts --save-exact pulse-arch@1.3.9`.
O workspace foi gerado com init/gen catalog/add-env; os seis arquivos de catalog foram adaptados à especificação T1. Núcleo preservado. Diretórios sample-request, mock interno e GUI gerados permanecem, mas não são utilizados.
Pulse fornece descoberta, compilação, engine, HTTP, status checks e ps.check/sleep. Contratos customizados mantêm checks idênticos ao manual, sem checks extras da cadeia expect padrão.
