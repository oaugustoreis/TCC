# Relatório do estado atual da suíte modular

Data da revisão: 05/11/2026. Escopo: implementação atual em `modular/`, configuração em `shared/config.js` e testes dos helpers em `tests/`. Este documento descreve o código existente e suas verificações; não apresenta resultados de desempenho ou de superioridade arquitetural.

## 1. Visão geral

A suíte organiza cinco jornadas de teste da API de produtos e pedidos em quatro camadas: **Scenarios, Profiles, Flows e Use Cases**. Dois helpers compartilhados centralizam transporte HTTP e checks. A linguagem é JavaScript com módulos ESM, e os cenários são executados diretamente pelo k6.

A organização foi inspirada no Pulse. A suíte não importa o runtime do framework: não utiliza descoberta automática, registro virtual, aliases TypeScript, plugins ou relatório HTML do Pulse. O exemplo documental inclui uma camada de schemas; nesta implementação, ela foi removida por decisão do projeto. As regras de validação são declaradas nos use cases.

## 2. Estrutura de arquivos

```text
modular/
├── scenarios/
│   ├── autenticacao/autenticacao.scenario.js
│   ├── catalogo/catalogo.scenario.js
│   └── pedidos/
│       ├── criacao.scenario.js
│       ├── consulta.scenario.js
│       └── atualizacao.scenario.js
├── profiles/
│   ├── comum/smoke.profile.js
│   ├── autenticacao/autenticacao.profiles.js
│   ├── catalogo/catalogo.profiles.js
│   └── pedidos/
│       ├── criacao.profiles.js
│       ├── consulta.profiles.js
│       └── atualizacao.profiles.js
├── flows/
│   ├── autenticacao/autenticacao.flow.js
│   ├── catalogo/catalogo.flow.js
│   └── pedidos/
│       ├── criacao.flow.js
│       ├── consulta.flow.js
│       └── atualizacao.flow.js
├── use-cases/
│   ├── autenticacao/login.useCase.js
│   ├── catalogo/
│   │   ├── listProducts.useCase.js
│   │   └── getProduct.useCase.js
│   └── pedidos/
│       ├── createOrder.useCase.js
│       ├── getOrder.useCase.js
│       └── updateOrder.useCase.js
└── helpers/
    ├── http/http.js
    └── checks/checks.js
```

São **24 arquivos JavaScript** em `modular/`: 5 scenarios, 6 profiles, 5 flows, 6 use cases e 2 helpers. Os testes dos helpers ficam fora dessa pasta.

Os domínios de negócio são autenticação, catálogo e pedidos. Os profiles compartilhados ficam em `comum/`; os helpers são separados pela função técnica que exercem. Um flow pode reutilizar use cases de outro domínio: criação de pedido, por exemplo, utiliza login e consulta de produto.

## 3. Responsabilidade das camadas

| Camada | Responsabilidade | O que recebe ou define |
|---|---|---|
| Scenario | Ponto de entrada executável; configura options e chama o flow | BASE_URL, credenciais, thresholds e profile da jornada |
| Profile | Define a execução da carga | Executor, exec, VUs e iterações |
| Flow | Orquestra uma jornada de negócio | Contexto de execução; escolhe dados e encadeia respostas |
| Use Case | Executa uma ação HTTP e declara seus checks | URL base, token, identificadores, payload e valores esperados |
| Helper HTTP | Prepara e envia requisições pelo k6 | Método, URL, body, token, headers e opções |
| Helper de checks | Converte parâmetros em checks k6 | Status esperado, campos, tipos e labels |

Cada scenario exporta `options`, uma função `<jornada>Scenario`, `engine` e a exportação default. O profile aponta `exec` para `engine`, que delega à função de scenario, e esta chama o flow.

```text
k6 → options/profile → engine → Scenario → Flow → Use Case
                                                    ├── helper HTTP → API
                                                    └── helper de checks → k6 check
```

A Response é retornada pelo helper HTTP ao use case e deste ao flow. Isso permite extrair o token do login e o identificador do pedido criado.

## 4. Jornadas implementadas

| ID | Jornada | Ações, na ordem | Requisições por iteração | Checks por iteração |
|---|---|---|---:|---:|
| CT-01 | Autenticação | login | 1 | 2 |
| CT-02 | Catálogo | login → listar produtos → consultar produto p1 | 3 | 6 |
| CT-03 | Criação | login → consultar produto p1 → criar pedido | 3 | 6 |
| CT-04 | Consulta | login → criar pedido → consultar pedido created | 3 | 7 |
| CT-05 | Atualização | login → criar pedido → confirmar pedido → consultar pedido confirmed | 4 | 9 |

As criações usam `{ productId: "p1", quantity: 1 }`. Os flows escolhem esses dados e os passam aos use cases. O pedido consultado ou atualizado utiliza o identificador retornado pela criação.

O login ocorre **uma vez em cada execução do flow**, dentro da iteração. O token retornado é reutilizado nas demais ações daquela execução. Uma nova iteração realiza novo login. Não há autenticação em setup nem cache de tokens.

A instrução de autenticar e extrair o token ainda aparece em quatro flows. O flow exclusivo de autenticação apenas chama login. A composição com um flow de autenticação reutilizável foi discutida, mas não foi implementada.

## 5. Configuração de carga

O profile base é `profiles/comum/smoke.profile.js`:

```js
export const smokeProfile = {
    executor: "shared-iterations",
    exec: "engine",
    vus: OPTIONS.vus,
    iterations: OPTIONS.iterations,
};
```

`OPTIONS`, em `shared/config.js`, fornece 1 VU, 1 iteração e o threshold `checks: ["rate==1"]`. Cada jornada recebe uma cópia superficial do profile por meio de `{ ...smokeProfile }` e pode sobrescrever seus parâmetros.

| Jornada | VUs | Iterações totais |
|---|---:|---:|
| Autenticação | 1 | 1 |
| Catálogo | 1 | 1 |
| Criação | 1 | 1 |
| Consulta | 1 | 1 |
| Atualização | 1 | 1 |

Em `shared-iterations`, as iterações são compartilhadas entre os VUs. O CT-05 atual herda `{ ...smokeProfile }`, sem sobrescrever VUs ou iterações. Todos os cinco cenários possuem 1 VU e 1 iteração, como a suíte tradicional.

A versão anterior deste relatório descrevia CT-05 com 5 VUs e 10 iterações. Essa informação foi atualizada na validação final: a implementação encontrada já estava com a sobrescrita removida. Isso restabelece os parâmetros de carga esperados, mas não comprova equivalência funcional sem execução real bem-sucedida. Ver [relatório de validação final](RELATORIO_VALIDACAO_FINAL.md).

## 6. Helper HTTP

`helpers/http/http.js` exporta `get`, `post` e `patch`. O helper centraliza:

- Header padrão `Content-Type: application/json`.
- Header `Authorization: Bearer <token>`, quando um token é informado.
- Serialização de objetos e arrays com `JSON.stringify`.
- Preservação de strings, null e corpos binários.
- Encaminhamento das opções do k6 e retorno da Response original.

Headers explícitos prevalecem sobre os padrões; uma Authorization explícita também prevalece sobre o token. O helper cria novos objetos de parâmetros e headers, sem modificar os objetos recebidos. A opção auxiliar `token` é removida antes do envio ao k6.

Não há fallback para token de ambiente: o login é enviado sem Authorization, e as operações seguintes recebem explicitamente o token retornado pela API. O helper não adiciona checks ou plugins.

Exemplo de chamada atual:

```js
const r = patch(
    `${baseUrl}/orders/${orderId}/status`,
    { status },
    { token },
);
```

## 7. Checks parametrizados

`helpers/checks/checks.js` exporta `checkResponse` e `checkFields`. Os seis use cases utilizam `checkResponse`, que permite declarar status HTTP e regras para campos JSON:

```js
checkResponse(r, {
    status: { expected: 200, label: "consulta 200" },
    fields: {
        id: { expected: orderId, label: "pedido corresponde" },
        status: { expected: expectedStatus, label: "status esperado" },
    },
});
```

| Parâmetro | Comportamento |
|---|---|
| expected | Compara o valor por igualdade estrita, sem coerção |
| type | Verifica o tipo; array tem tratamento específico com Array.isArray |
| nonEmpty | Exige um array com pelo menos um item |
| label | Define o nome do check; em campos, usa o nome do campo se omitido |

Campos com o mesmo label são combinados por AND em um único check. Em `createOrder`, id string e status created compartilham `pedido criado`; ambas as condições precisam passar. Isso mantém os nomes e a contagem das verificações originais.

As regras suportam as necessidades atuais da suíte; o helper não é um validador JSON Schema. Ele também não transforma erros de parsing JSON em checks falsos: uma resposta sem JSON válido ainda pode interromper a execução. Um check falso, isoladamente, não impede as ações seguintes do flow; o threshold exige taxa de aprovação de 100% ao final.

## 8. Execução e configuração de ambiente

A configuração comum usa `__ENV.BASE_URL`, com fallback para `http://127.0.0.1:3333`. As credenciais atuais são dados fixos de teste em `shared/config.js`.

Na raiz do projeto, inicie a API:

```bash
npm run api
```

Em outro terminal, execute a jornada desejada:

```bash
k6 run modular/scenarios/autenticacao/autenticacao.scenario.js
k6 run modular/scenarios/catalogo/catalogo.scenario.js
k6 run modular/scenarios/pedidos/criacao.scenario.js
k6 run modular/scenarios/pedidos/consulta.scenario.js
k6 run modular/scenarios/pedidos/atualizacao.scenario.js
```

Para outra API compatível:

```bash
k6 run -e BASE_URL=http://host:3333 modular/scenarios/catalogo/catalogo.scenario.js
```

## 9. Verificação e limites

Nesta revisão, foram executados novamente:

| Verificação | Resultado |
|---|---|
| Testes do helper HTTP | 4 passaram |
| Testes do helper de checks | 4 passaram |
| k6 inspect nos cinco scenarios | 5 passaram |

Comandos dos testes:

```bash
node --experimental-vm-modules tests/http-helper.test.js
node --experimental-vm-modules tests/checks-helper.test.js
```

Os testes usam módulos k6 simulados no Node.js. As versões observadas são Node.js v24.18.0 e k6 v2.0.0 (commit 8c3be52cc1).

Na implementação dos helpers, também foi realizada uma comparação simulada de uma iteração dos cinco pares tradicional/modular, usando respostas válidas e inválidas. Requisições e checks coincidiram nessas condições. Isso não comprova equivalência sob concorrência ou carga real.

A tentativa anterior de iniciar a API neste ambiente falhou com `listen EPERM` em `127.0.0.1:3333`; os testes da API também falharam nessa condição. Não foi realizada nova tentativa de rede nesta revisão documental. A execução HTTP real dos cenários e a equivalência experimental completa permanecem pendentes.

Não foram coletadas métricas de latência, throughput, duplicação, manutenção ou produtividade nesta revisão. A organização atual separa responsabilidades e centraliza código repetido, mas seus efeitos quantitativos precisam ser medidos conforme o protocolo experimental.
