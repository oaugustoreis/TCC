# Revisão da arquitetura modular

Revisão em 2026-11-05. Referências: [README oficial](https://github.com/oaugustoreis/pulse), exemplo documental fornecido pelo usuário e gerador local `pulse/pulse/cli.js` do Pulse 1.3.9. O GitHub Pages não pôde ser acessado neste ambiente. O comando `node pulse/cli.js gen architecture-probe`, executado em `pulse/`, gerou um exemplo para inspeção; os arquivos temporários foram removidos após a análise.

O exemplo documental apresenta cinco camadas, incluindo schemas. Por solicitação do usuário, esta suíte adota quatro camadas e mantém os checks diretamente nos use cases, sem contratos de resposta separados.

| Camada | Responsabilidade local |
|---|---|
| Use Case | Uma ação HTTP por arquivo, seus checks e retorno da Response |
| Flow | Compõe ações, escolhe os dados e extrai token e identificador do pedido |
| Profile | Define executor, função de execução, VUs e iterações |
| Scenario | Seleciona o perfil e os thresholds e delega ao Flow |

`http.useCase.js` foi substituído por `login`, `listProducts`, `getProduct`, `createOrder`, `updateOrder` e `getOrder`, cada um em seu arquivo `.useCase.js`. Produto, payload de criação e status de atualização são parâmetros recebidos dos flows. Os imports da configuração compartilhada usam `../../../shared/config.js` a partir das subpastas de scenarios e profiles.

A suíte usa JavaScript ESM, imports relativos e execução direta com k6. Não utiliza o runtime ou o registro automático do Pulse. O helper HTTP local adapta a centralização do transporte presente no Pulse. Cada jornada possui seu próprio arquivo `<jornada>.profiles.js`, com um mapa nomeado `<jornada>Profiles` importado pelo scenario correspondente. Os parâmetros comuns ficam em `profiles/comum/smoke.profile.js`; cada jornada usa `{ ...smokeProfile }`, podendo sobrescrever parâmetros sem alterar as demais. Setup, grupos, pausas, SLAs e validações adicionais do exemplo não foram introduzidos, preservando as condições da comparação com a suíte tradicional. O login continua em cada iteração.

## Verificação

- `k6 inspect` passou nos cinco cenários após a revisão final.
- Comparação com módulos k6 simulados passou nos cinco pares tradicional/modular, com respostas válidas e inválidas. Foram comparados ordem, método, URL, payload, cabeçalhos, nomes e resultados dos checks. As contagens são 1/3/3/3/4 requisições e 2/6/6/7/9 checks.
- Essa comparação simulada não comprova equivalência HTTP real. A API não pôde iniciar: `listen EPERM` em `127.0.0.1:3333`. `npm run api:test` também falhou neste ambiente. A validação de rede permanece pendente.

As análises e evidências anteriores em `pulse/` são registros históricos e podem descrever a estrutura anterior, incluindo o antigo arquivo agregado e a antiga localização da suíte.

Os arquivos de entrada seguem o padrão `<jornada>.scenario.js`, com funções `<jornada>Scenario`: autenticacao (CT-01), catalogo (CT-02), criacao (CT-03), consulta (CT-04) e atualizacao (CT-05). Os identificadores ct01–ct05 nos mapas de carga foram preservados para rastreabilidade experimental.

Todas as camadas usam subpastas por domínio: `autenticacao/`, `catalogo/` e `pedidos/`. Os flows de criação, consulta e atualização pertencem a pedidos; o profile smoke compartilhado fica em `profiles/comum/`. Na reorganização, CT-05 ainda possuía 5 VUs e 10 iterações. Na validação final, o profile encontrado já herdava 1 VU e 1 iteração do smokeProfile; o k6 inspect confirmou esses valores.

## Helper HTTP

`modular/helpers/http/http.js` exporta `get`, `post` e `patch`. Inspirado em `pulse/pulse/http/http.ts`, centraliza Content-Type JSON, token Bearer, serialização de objetos e encaminhamento de parâmetros k6. Headers explícitos prevalecem; o helper não modifica os parâmetros recebidos nem encaminha a opção auxiliar `token` ao k6. Strings e corpos binários são preservados. O token é explícito, sem fallback para `__ENV.TOKEN`, mantendo o login sem Authorization.

Os use cases continuam responsáveis pelos checks e retornam a Response original. O helper local não adiciona checks de status, plugins ou métricas. Exemplo: `patch(url, { status }, { token })`.

Verificação desta alteração: quatro testes do helper passaram com `node --experimental-vm-modules tests/http-helper.test.js`; os cinco cenários passaram no `k6 inspect`; a comparação simulada dos cinco pares tradicional/modular, com respostas válidas e inválidas, preservou requisições e checks. A comparação simula uma iteração de cada jornada; não verifica carga real. A execução HTTP real permanece pendente devido à restrição de sockets registrada acima.

## Checks parametrizados

`modular/helpers/checks/checks.js` centraliza os checks k6. Todos os use cases usam `checkResponse(response, { status, fields })`, declarando os valores esperados e labels. Também é possível usar `checkFields(response, fields)` para validar apenas campos JSON. As regras utilizadas são `expected` (igualdade estrita), `type` (`string` ou `array` nesta suíte) e `nonEmpty` (array não vazio).

Campos com o mesmo label são agrupados por AND em um único check. Dessa forma, `pedido criado` continua verificando simultaneamente id string e status created, preservando a quantidade e os nomes originais. As regras permanecem declaradas em cada use case; não foram adicionados schemas ou contratos de resposta separados.

Quatro testes do helper de checks passaram com `node --experimental-vm-modules tests/checks-helper.test.js`. Os cinco cenários passaram no `k6 inspect`, e a comparação simulada contra a suíte tradicional preservou requisições e checks nos cinco pares, com respostas válidas e inválidas.
