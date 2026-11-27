# Protocolo de repetição de M1–M3 com prompt idêntico

Objetivo: remover a assimetria de instruções observada em M2 e M3 (seção 5.7 do TCC), em que o agente da
condição modular recebeu o arquivo inicial e orientação expressa de centralizar a alteração, e o agente da
condição independente recebeu a lista de scripts. Aqui os agentes recebem **o mesmo texto**, sem indicar arquivos.

## Condições
`tradicional` (condição independente), `modular` e, opcionalmente, `intermediaria`
(gerada por `node scripts/condicoes/gerar-intermediaria.mjs`; requer validação funcional prévia, ver abaixo).

## Antes de começar (uma vez)
1. `git checkout estado-e4` e confirmar o hash das fontes (`node scripts/custo/medir-custo.mjs` imprime `hashFontes`).
2. Para a `intermediaria`: rodar a validação funcional de E4 (1 VU, 1 iteração) adaptando `scripts/validacao/validar.mjs`
   para aceitar a pasta `intermediaria/` (hoje só aceita `tradicional` e `modular`) e registrar o resultado.
3. Fixar e registrar: produto e **modelo/versão do agente**, temperatura (se configurável), ferramentas habilitadas
   (leitura, edição, execução de comandos), tamanho de contexto, data e hora. Usar o mesmo para todas as execuções.

## Execução
- Cada execução parte de uma **cópia limpa** de E4 (branch própria: `rep<N>/<tarefa>-<condicao>`), em sessão nova do agente,
  sem histórico de outras execuções.
- Ordem das condições **sorteada** por tarefa e por repetição (registrar a semente). Executar em sequência, sem sobreposição temporal.
- Mínimo recomendado: 3 repetições por tarefa e condição (o agente é não determinístico; uma execução não permite estimar variação).
- Permitir ao agente ler e editar livremente a pasta da condição; **não** informar nomes de arquivos nem número de afetados.
- Rodar `node scripts/validacao/validar.mjs` após a edição e registrar aprovação na 1ª tentativa e número de ciclos.
- Registrar transcrição completa, horário de início e fim, `files_read`, `files_written`, tokens (entrada, saída, cache).

## Prompt (idêntico nas duas condições; substituir `<PASTA>` por `tradicional/`, `modular/` ou `intermediaria/`)

> Você trabalha em uma suíte de testes de carga em k6 localizada em `<PASTA>`. A suíte testa uma API REST local
> (código em `api/`). Não altere nada fora de `<PASTA>`. Implemente a mudança abaixo na suíte, mantendo todas as
> jornadas funcionando e com os mesmos checks que já possuem. Descubra por conta própria quais arquivos precisam mudar.
> Ao terminar, descreva em poucas linhas o que alterou.

Tarefas (acrescentar ao final do prompt, uma por execução):

- **M1** — A API passa a retornar `expiresIn: 3600` junto ao `token` e `tokenType` em `POST /auth/login`. Todas as
  autenticações da suíte devem validar também `expiresIn === 3600` no check de corpo do login.
- **M2** — A API passa a exigir `currency: "BRL"` no payload de `POST /orders` e a retornar `currency: "BRL"` no pedido
  criado. Todas as jornadas que criam pedidos devem enviar e validar `currency === "BRL"`.
- **M3** — A API passa a incluir `createdAt` (string ISO não vazia) nos pedidos, e todas as consultas individuais
  `GET /orders/:id` devem verificar `typeof createdAt === "string" && createdAt.length > 0`.

(Para as tarefas, a API correspondente a cada mudança já deve estar disponível: usar `api/` do commit de cada M.)

## Coleta e análise
- `node scripts/metricas/coletar-metricas.mjs` para arquivos alterados, linhas adicionadas/removidas e duplicação.
- Reportar, por tarefa e condição: arquivos alterados, churn, aprovação na 1ª validação, ciclos, tokens, duração; mediana e
  intervalo entre repetições. Sem testes inferenciais com menos de 5 repetições.
- Comparar com as execuções originais (com assimetria) apenas de forma descritiva.

## Ameaças a registrar
Mesma API em memória; agente e versão únicos; ordem sorteada mas sem cegamento do avaliador; autoria das edições conferida
somente pela transcrição.

## Execução realizada (27/11/2026)
- 27 execuções (M1–M3 × tradicional, intermediaria, modular × 3 repetições), cada uma em cópia própria de E4
  (`runs/<tarefa>-<suite>-r<N>/`, com `api/`, `shared/` e a suíte), em ordem embaralhada (semente 20261127, `runs.json`).
- Prompt: o texto acima, com `<RUN>/<SUITE>/` e menção a `<RUN>/api/` e `<RUN>/shared/`; leitura e edição restritas à cópia,
  sem execução de comandos. Modelo: Sonnet, tentativa única. Tokens e tempo não foram extraídos.
- Desvio: dois agentes usaram `python3` pelo Bash apesar da instrução; os resultados foram mantidos.
- Validação: `node scripts/validacao/validar-manutencao.mjs --raiz <copia> --tarefa Mx --suite <suite> --k6 <k6>` roda as 15 jornadas
  contra a API correta (todas devem passar) e contra uma API mutante (as jornadas que verificam o contrato devem falhar).
  Resultado: 27/27 aprovadas; mutante detectado por 15 (M1), 8 (M2) e 7 (M3) jornadas nas três condições.
- Dados: `evidencias/manutencao-prompt-identico/` (`resultado.json`, `runs.json`, `analisar.py`, `diffs/*.diff`).
