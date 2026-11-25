# Falhas e correções observadas

| Fase | Falha | Correção | Evidência |
|---|---|---|---|
| Preparação | Clone sem resolução DNS no sandbox | Repetir com autorização de rede | inspect.log / inspect-retry.log |
| Preparação | Página web npm 403 | Consultar metadados com npm view | npm-metadata.json; conversa |
| Preparação | Mock listen EPERM no sandbox | Iniciar fora do sandbox, mesma porta | Conversa; preparation-notes.md |
| A, instrumento | Booleano de thresholds interpretado ao contrário | Corrigir validador compartilhado; sem editar A e sem repetir k6 | A-validate-first.log, actions.jsonl |
| B, CLI | --summary-export recusado como argumentos extras | Usar K6_SUMMARY_EXPORT herdado pelo subprocesso | B-run.log, B-run-retry.log, actions.jsonl |
| B, instalação | Avisos de depreciação, 8 vulnerabilidades e scripts pendentes | Preservar dependências; compilação/carga funcionaram | B-install.log |
| Pós-coleta | Varredura do tamanho físico com node_modules demorada no volume WSL | Interromper processamento e calcular tamanho relevante sem percorrer dependências | Conversa; build-reports.py; relatório |

Não houve falha de compilação ou do teste k6 em nenhuma condição. Tentativa B rejeitada pela CLI não chegou ao k6. O mock foi encerrado após a coleta. Nenhuma saída inicial ausente foi reconstruída como log de comando.
