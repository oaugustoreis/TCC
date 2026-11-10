# Validador comum E0/E1

Infraestrutura compartilhada, não atribuída a nenhuma arquitetura. Não há implementação dos cenários CT-06/07 nestes arquivos.

## Regressão E0

Na raiz do projeto:

```powershell
node scripts/validacao/validar.mjs --state E0 --out <pasta-nova-de-evidencias>
node --test api/server.test.js api/e1.contract.test.js
node --test scripts/validacao/oraculos.test.mjs
node scripts/validacao/verificar-oraculo-e1.mjs <pasta-nova-da-sonda>
```

O validador inicia uma API observada nova por entrada, na porta efêmera indicada no arquivo de prontidão. Faz inspect e run reais de k6, exporta logs, requests/responses recebidos, métricas, checks e comparação com o oráculo e entre pares. Não altera ultima_execucao.txt nem evidências históricas. --suite tradicional ou --suite modular permite validar uma condição isolada, sem declarar equivalência das duas suítes.

As opções K6_* herdadas são removidas antes de inspect/run, com nomes registrados, para impedir sobrescritas ambientais de carga. BASE_URL é explícita. As suítes continuam responsáveis por declarar 1 VU/1 iteração; o validador não corrige um profile inválido.

## Entradas E1 futuras

```powershell
node scripts/validacao/validar.mjs --state E1 --suite tradicional --manifest <entradas.json> --out <pasta-nova>
node scripts/validacao/validar.mjs --state E1 --suite both --manifest <entradas.json> --out <pasta-nova>
```

O manifesto é um array de objetos com id, suite e script relativo à raiz; scenarioKey é opcional para profiles nomeados. Exemplo de formato, sem criar arquivo de cenário:

```json
[{"id":"ct06","suite":"tradicional","script":"tradicional/<entrada-real>.js"}]
```

Esse exemplo isolado não é manifesto de estado completo. Para uma arquitetura E1, fornecer exatamente sete entradas CT-01–CT-07; para ambas, catorze. Os caminhos de CT-06/07 serão informados somente após implementação medida. O validador recusa scripts ausentes, caminhos fora da suíte, IDs extras/duplicados e estados incompletos. Não inventa convenções de arquivos para a arquitetura modular.

E0 continua com a lista histórica de entradas. E1 sem manifesto deve falhar no preflight; não é aprovação nem execução dos cenários novos.

## Oráculo e alcance

oraculos.mjs contém entradas declarativas, fixtures e predicados derivados da matriz em protocolo-evolucao-v1.0. Não importa a API, helpers ou cenários das suítes. Verifica método, rota/query, payload JSON, Content-Type, Host, Bearer, ausência de token no login, Content-Length de payload, status e campos de resposta; compara ordem/labels/resultados de checks e métricas efetivas. Named profiles só podem ter uma entrada shared-iterations com 1 VU/1 iteração.

Comparação entre pares normaliza ordem de chaves JSON e IDs de token/pedido retornados. Host/porta e User-Agent são verificados contra o cliente/instância durante cada execução; portas efêmeras não entram como divergência de arquitetura. Os rastros brutos permanecem preservados. Campos de negócio das respostas também são comparados, além de checks e requisições. Só declara equivalência completa quando todas as entradas das duas condições passam.

A sonda verificar-oraculo-e1.mjs é um teste de contrato HTTP em Node, sem k6, sem VU/iteração ou checks reais de CT-06/07. Seu resultado não comprova os cenários futuros. Testes sintéticos de oraculos.test.mjs verificam se o validador rejeita desvios; seus labels/métricas sintéticos não são dados experimentais.

api-observada.mjs captura requests/responses da API real sem alterar as suítes. Observa writeHead para capturar headers explícitos e write/end para o corpo. Erros de captura reprovam a validação, em vez de serem descartados.
