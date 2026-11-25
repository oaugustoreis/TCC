# Variante Pulse nativa — extensão do T1

Usa Pulse 1.3.9 e mais recursos nativos; não substitui a condição B original.

Node 24.18.0, npm 11.16.0, k6 2.0.0. Dependências nesta sessão reaproveitadas de ../modular-pulse/node_modules por symlink. Em uma cópia sem symlink, instalar com npm install; a resolução nova pode variar, usar as versões do lock do workspace original para reproduzir o ambiente observado.

Iniciar o mock: em ../shared-mock, `MOCK_LOG=/tmp/t1-native-requests.jsonl node server.cjs`.

Neste diretório: `K6_NO_USAGE_REPORT=true node ../evidence/cli/node_modules/pulse-arch/pulse/cli.js run catalog_smoke_test dev`.

Para exportar novo resumo sem sobrescrever evidência: definir K6_SUMMARY_EXPORT=/tmp/t1-native-summary.json.

Relatório automático em summary.html. Jornada/carga/thresholds originais, 21 checks por iteração (seis originais e quinze nativos adicionais). Consulte ../reports/T1_pulse_native_addendum.md.
