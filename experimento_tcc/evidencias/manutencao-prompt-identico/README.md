Repetição de M1–M3 com prompt idêntico (ver docs/PROTOCOLO_M1-M3_PROMPT_IDENTICO.md).
- resultado.json: por execução, arquivos alterados, linhas adicionadas/removidas, churn e resultado da validação com API correta e mutante.
- runs.json: ordem embaralhada (semente 20261127) e prompts usados.
- diffs/: diff de cada suíte alterada em relação ao estado E4.
- analisar.py: gera resultado.json a partir das cópias de execução (caminhos /tmp/m/...).
