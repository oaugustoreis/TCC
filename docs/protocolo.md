# Protocolo experimental — ainda não executado

1. Registrar versões (`node --version`, `k6 version`, sistema operacional) e commit inicial.
2. Rodar `npm run api:test`; iniciar `npm run api`.
3. Rodar os dez scripts k6, um por vez; verificar 100% dos checks. Comparar sequência de requisições e contagens esperadas (CT-01=1, CT-02=3, CT-03=3, CT-04=3, CT-05=4).
4. Congelar a baseline de ambas as suítes; documentar versão e parâmetros do jscpd antes da coleta.
5. Duplicação: analisar `tradicional/` e `modular/` separadamente. O conjunto modular deve incluir integralmente seus 24 arquivos JavaScript, inclusive `modular/helpers/http/http.js` e `modular/helpers/checks/checks.js`, além de scenarios, profiles e flows. Não excluir, externalizar ou descontar os helpers por serem infraestrutura reutilizável. Excluir de ambas as medições `shared/`, `api/`, `tests/`, `scripts/`, `evidencias/`, dependências e arquivos gerados. Contar LOC e arquivos com a mesma regra. Usar o inventário com SHA-256 da validação como lista explícita do conjunto modular.
6. Manutenção: criar branches independentes a partir da baseline para M1 (mudar `/auth/login`), M2 (novo campo obrigatório em pedido) e M3 (verificação adicional no GET pedido). Aplicar mesma especificação nas duas suítes; validar; registrar `git diff --numstat`, arquivos e pontos de edição com justificativa.
7. Reutilização: branches independentes para R1 (consulta de catálogo com novas verificações) e R2 (acompanhamento com duas consultas); validar e registrar diffs, componentes reaproveitados.
8. Não executar as tarefas em sequência acumulativa. Não tratar LOC como medida direta de produtividade. Não afirmar resultados antes da coleta.

**Atenção metodológica:** a baseline tradicional contém repetição natural das operações; isso decorre da definição operacional escolhida para organização direta. Para reduzir o viés, documentar e avaliar com o orientador se uma segunda baseline tradicional com funções auxiliares compartilhadas deve ser adicionada como análise de sensibilidade. Não ajustar a baseline depois de ver resultados.

## Gate de validação funcional

Antes de congelar a baseline ou iniciar os experimentos definitivos, executar `python3 scripts/validacao/validar.py` em um ambiente com sockets locais permitidos. O procedimento reinicia a API real para cada um dos dez scripts, registra rastros HTTP e métricas de checks, confirma 1 VU/1 iteração e compara os pares. O resultado somente aprova a equivalência se todos os dez scripts completarem com sucesso e os 24 arquivos permanecerem preservados. Saída não zero e `complete_functional_equivalence: false` impedem o avanço. Tentativas de envio e contagens de `http_reqs` com erro não comprovam chamadas recebidas pela API.
