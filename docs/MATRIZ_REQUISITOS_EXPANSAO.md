# Matriz de requisitos da expansão

Versão 1.0 — requisitos prospectivos, definidos antes da implementação. E0 existe e foi validado; E1–E4 estão somente planejados. Aplicação idêntica às duas arquiteturas. Governança: [protocolo](PROTOCOLO_EVOLUCAO_INCREMENTAL.md); coleta: [plano de esforço](PLANO_MEDICAO_ESFORCO.md).

## Regras e fixtures

Todas as entradas executam login dentro da iteração, usam o token retornado e funcionam isoladamente. API reiniciada por entrada, estado em memória vazio, sem dependência entre cenários. 1 VU, 1 iteração, threshold `checks: rate==1`. As quantidades abaixo incluem login; GET /health usado pelo coordenador não entra nos rastros do cenário nem na contagem.

Produtos existentes: p1, Produto A, preço 100; p2, Produto B, preço 50. E1 acrescentará categoria `principal` para p1, `acessorio` para p2 e estoque informativo p1=10, p2=0, sem alterar id/nome/preço antigos. Valores monetários são inteiros na mesma unidade dos preços E0; total = soma de quantidade × preço, sem frete, imposto ou arredondamento.

Carrinho novo: id string não vazia, status `open`, items=[], total=0. Item: productId, quantity inteira positiva, unitPrice e subtotal. Nos cenários, somente p1; adicionar quantity=1 custa 100, atualizar para 3 custa 300. Carrinho vazio após remoção tem total 0. Estoque é apenas consultivo nesta versão; não há reserva/baixa nem disputa concorrente. Esse recorte vale para ambas as suítes.

Pedidos E0 via `{productId:"p1",quantity:1}` conservam contrato e semântica. Criação a partir de carrinho usa `{cartId:<retornado>}`, produz um pedido `created` com id, cartId, cópia de items e total, e marca o carrinho `checked_out` atomicamente. O carrinho usado não é reutilizado em outro cenário. Pedido de produto único e pedido de carrinho suportam `confirmed`; E3 acrescenta `cancelled` somente para pedido `created`. Pagamento aprovado muda pedido `confirmed` para `paid`; pagamento recusado mantém `confirmed`.

IDs de carrinho/pedido/pagamento são retornados pela API e encadeados, nunca presumidos. APIs são locais, sem cobrança, credenciais externas ou sistemas de terceiros. Pagamento simulado `method:"test_approved"` produz aprovação; `method:"test_declined"` produz recusa. Recusa é operação HTTP válida (201) com estado de negócio `declined`, não falha HTTP.

## Contratos adicionais a preparar

Todas as rotas abaixo exigem Bearer token válido e JSON quando há body. Campos adicionais não especificados não são exigidos nem usados para diferenciar arquiteturas. Listas têm ordem estável por id. Rotas antigas e credenciais mantêm contrato de [docs/contratos.md](contratos.md).

| Etapa | Método e rota | Entrada | Status e corpo de sucesso relevante |
|---|---|---|---|
| E1 | GET /products?category=principal | — | 200, items exatamente [p1], categoria principal e preço 100 |
| E1 | GET /products/p1 | — | 200, produto E0 com category=principal |
| E1 | GET /products/p1/stock | — | 200, productId=p1, quantity=10, available=true |
| E1 | GET /products/p2/stock | — | 200, productId=p2, quantity=0, available=false |
| E2 | POST /carts | {} | 201, carrinho open vazio com id e total=0 |
| E2 | POST /carts/:cartId/items | {productId:"p1",quantity:1} | 201, snapshot do carrinho open com um item p1, quantity=1, unitPrice=100, subtotal=100, total=100 |
| E2 | PATCH /carts/:cartId/items/p1 | {quantity:3} | 200, snapshot com um item p1, quantity=3, unitPrice=100, subtotal=300, total=300 |
| E2 | DELETE /carts/:cartId/items/p1 | Sem body | 200, snapshot do carrinho open, items=[], total=0 |
| E2 | GET /carts/:cartId | — | 200, snapshot persistido do carrinho |
| E3 | GET /orders?status=created | — | 200, items contendo exatamente o pedido recém-criado no cenário |
| E3 | PATCH /orders/:orderId/status | {status:"cancelled"} | 200, pedido id correspondente, productId=p1, quantity=1, status=cancelled |
| E4 | POST /payments | {orderId:<id>,method:"test_approved"} ou test_declined | 201, id string não vazia, orderId correspondente, amount igual ao total do pedido (100 nestes cenários), status=approved ou declined |
| E4 | GET /payments/:paymentId | — | 200, mesmo id/orderId/amount/status da criação |
| E4 | POST /orders | {cartId:<id>} | 201, pedido created, id string não vazia, cartId correspondente, um item p1 quantity=1/unitPrice=100/subtotal=100, total=100 |
| E4 | GET /orders/:orderId | — | 200, pedido correspondente, incluindo snapshot de carrinho quando aplicável e status após pagamento |

O POST /orders atual para produto único não precisa ganhar campos: a API pode calcular o valor do pagamento internamente. Os testes novos verificam productId/quantity nos pedidos simples; os pedidos de carrinho verificam cartId/items/total.

Testes da API, em trabalho separado, devem verificar também autenticação ausente→401; produto/carrinho/pedido/pagamento desconhecido→404; quantidade não inteira/menor que 1 e método de pagamento desconhecido→400; transição inválida, carrinho vazio no checkout e pagamento de pedido não confirmado→409. Não acrescentar essas chamadas aos dez novos cenários nem às métricas deles. Nenhuma decisão de validação da API depende da arquitetura de teste.

## E0 — baseline preservada (cinco cenários)

| ID | Jornada e chamadas em ordem | Requests | Checks E0 existentes |
|---|---|---:|---:|
| CT-01 | Login | 1 | 2 |
| CT-02 | Login → listar produtos → consultar p1 | 3 | 6 |
| CT-03 | Login → consultar p1 → criar pedido simples | 3 | 6 |
| CT-04 | Login → criar pedido simples → consultar created | 3 | 7 |
| CT-05 | Login → criar pedido simples → confirmar → consultar confirmed | 4 | 9 |

Aceitação: contratos/checks/labels existentes, sem reescrever os arquivos. Evidências detalhadas: [relatório anterior](RELATORIO_VALIDACAO_FINAL.md). Novos campos compatíveis da API não autorizam mudança na baseline.

## Padrão comum de checks novos

Para CT-06–CT-15, cada resposta gera exatamente dois checks, nessa ordem: status HTTP e predicado conjunto dos campos esperados. Label determinístico: `CT-XX NN status` e `CT-XX NN corpo`, em que NN é o índice da chamada, 01 para login. Não prescrever como implementar esses checks (diretos ou helper); prescrever apenas comportamento e labels.

Login (operação 01): status=200; corpo com token string não vazia e tokenType=Bearer. O token retornado alimenta as demais requisições. Todos os predicados de corpo abaixo são conjunções, não alternativas. JSON inválido torna a validação reprovada; erro de execução não é sucesso. Para respostas que criam entidades, verificar id string não vazia; nas consultas/transições seguintes, verificar igualdade com o id retornado. Verificar também snapshots de negócio, evitando aprovar somente pela presença de um id.

## E1 — catálogo e estoque (total sete)

### CT-06 — filtrar catálogo e consultar produto

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01 | POST /auth/login com credenciais E0 | 200 | Login conforme padrão |
| 02 | GET /products?category=principal | 200 | items array com exatamente um produto: id=p1, name=Produto A, price=100, category=principal |
| 03 | GET /products/p1 | 200 | id=p1, name=Produto A, price=100, category=principal, consistentes com a lista |

Aceitação: **3 requests, 6 checks**; filtro aplicado pela API, não simulado na suíte.

### CT-07 — consultar disponibilidade positiva e zero

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01 | Login | 200 | Padrão |
| 02 | GET /products/p1/stock | 200 | productId=p1, quantity=10, available=true |
| 03 | GET /products/p2/stock | 200 | productId=p2, quantity=0, available=false |

Aceitação: **3 requests, 6 checks**; valores booleanos e quantidades exatos.

## E2 — carrinho (total dez)

### CT-08 — criar carrinho, adicionar e consultar

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01 | Login | 200 | Padrão |
| 02 | POST /carts {} | 201 | id não vazio, status=open, items=[], total=0 |
| 03 | POST /carts/:id/items {productId:"p1",quantity:1} | 201 | id do carrinho, status=open, exatamente um item p1/1/100/100, total=100 |
| 04 | GET /carts/:id | 200 | Mesmo id, status e snapshot de item/total da operação 03 |

Aceitação: **4 requests, 8 checks**.

### CT-09 — alterar quantidade e recalcular total

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01–03 | Login → criar carrinho → adicionar p1 quantity=1 | 200/201/201 | Mesmos predicados de CT-08 |
| 04 | PATCH /carts/:id/items/p1 {quantity:3} | 200 | Mesmo carrinho open, um item p1 quantity=3/unitPrice=100/subtotal=300, total=300 |
| 05 | GET /carts/:id | 200 | Mesmo id, status e snapshot da operação 04 |

Aceitação: **5 requests, 10 checks**. Atualizar não cria segundo item.

### CT-10 — remover item e verificar carrinho vazio

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01–03 | Login → criar carrinho → adicionar p1 quantity=1 | 200/201/201 | Mesmos predicados de CT-08 |
| 04 | DELETE /carts/:id/items/p1, sem body | 200 | Mesmo carrinho open, items=[], total=0 |
| 05 | GET /carts/:id | 200 | Mesmo carrinho open, vazio e total=0 persistidos |

Aceitação: **5 requests, 10 checks**. A remoção é uma chamada HTTP adicional explícita.

## E3 — pedidos (total doze)

### CT-11 — criar e localizar pedido na listagem filtrada

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01 | Login | 200 | Padrão |
| 02 | POST /orders {productId:"p1",quantity:1} | 201 | id não vazio, productId=p1, quantity=1, status=created |
| 03 | GET /orders/:id | 200 | Mesmo id, productId=p1, quantity=1, status=created |
| 04 | GET /orders?status=created | 200 | items array com exatamente esse pedido, campos id/productId/quantity/status iguais |

Aceitação: **4 requests, 8 checks**; lista não depende de resíduos de outros cenários.

### CT-12 — cancelar e consultar pedido

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01–02 | Login → criar pedido simples | 200/201 | Mesmos predicados de CT-11 |
| 03 | PATCH /orders/:id/status {status:"cancelled"} | 200 | Mesmo id, productId=p1, quantity=1, status=cancelled |
| 04 | GET /orders/:id | 200 | Mesmos campos e status=cancelled persistido |

Aceitação: **4 requests, 8 checks**. Não alterar a jornada CT-05 de confirmação.

## E4 — pagamentos e compra completa (total quinze)

### CT-13 — aprovar pagamento de pedido confirmado

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01–02 | Login → criar pedido simples | 200/201 | Mesmos predicados de CT-11 |
| 03 | PATCH /orders/:id/status {status:"confirmed"} | 200 | Mesmo id/productId/quantity, status=confirmed |
| 04 | POST /payments {orderId:<id>,method:"test_approved"} | 201 | payment id não vazio, orderId correspondente, amount=100, status=approved |
| 05 | GET /payments/:paymentId | 200 | Mesmo payment id/orderId/amount/status |
| 06 | GET /orders/:id | 200 | Mesmo pedido simples, status=paid |

Aceitação: **6 requests, 12 checks**; comprovar efeito no pedido, além do registro do pagamento.

### CT-14 — recusar pagamento e preservar pedido confirmado

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01–03 | Login → criar pedido simples → confirmar | 200/201/200 | Mesmos predicados de CT-13 |
| 04 | POST /payments {orderId:<id>,method:"test_declined"} | 201 | payment id não vazio, orderId correspondente, amount=100, status=declined |
| 05 | GET /payments/:paymentId | 200 | Mesmo payment id/orderId/amount/status |
| 06 | GET /orders/:id | 200 | Mesmo pedido simples, status=confirmed, sem tornar-se paid |

Aceitação: **6 requests, 12 checks**. Testar o caminho de negócio negativo com checks aprovados quando a recusa ocorrer.

### CT-15 — compra completa por carrinho

| Op. | Requisição | Status | Predicado de corpo |
|---|---|---:|---|
| 01 | Login | 200 | Padrão |
| 02 | GET /products/p1 | 200 | id=p1, name=Produto A, price=100, category=principal |
| 03 | GET /products/p1/stock | 200 | productId=p1, quantity=10, available=true |
| 04 | POST /carts {} | 201 | id não vazio, status=open, items=[], total=0 |
| 05 | POST /carts/:cartId/items {productId:"p1",quantity:1} | 201 | Mesmo carrinho open, um item p1/1/100/100, total=100 |
| 06 | GET /carts/:cartId | 200 | Mesmo snapshot da operação 05 |
| 07 | POST /orders {cartId:<cartId>} | 201 | order id não vazio, cartId correspondente, status=created, um item p1/1/100/100, total=100 |
| 08 | PATCH /orders/:orderId/status {status:"confirmed"} | 200 | Mesmo order id/cartId/items/total, status=confirmed |
| 09 | POST /payments {orderId:<orderId>,method:"test_approved"} | 201 | payment id não vazio, orderId correspondente, amount=100, status=approved |
| 10 | GET /payments/:paymentId | 200 | Mesmo pagamento aprovado |
| 11 | GET /orders/:orderId | 200 | Mesmo pedido de carrinho e valores, status=paid |
| 12 | GET /carts/:cartId | 200 | Mesmo cartId/items/total, status=checked_out |

Aceitação: **12 requests, 24 checks**; validar os vínculos produto→carrinho→pedido→pagamento e a persistência final. Compra completa é esse recorte local, sem envio, estoque transacional, gateway real ou UI.

## Totais e gates cumulativos

| Estado | Novos IDs | Requests novos por suíte | Checks novos por suíte | Requests totais por suíte | Checks totais por suíte |
|---|---|---:|---:|---:|---:|
| E0 | CT-01–05 | — | — | 14 | 30 |
| E1 | CT-06–07 | 6 | 12 | 20 | 42 |
| E2 | CT-08–10 | 14 | 28 | 34 | 70 |
| E3 | CT-11–12 | 8 | 16 | 42 | 86 |
| E4 | CT-13–15 | 24 | 48 | 66 | 134 |

Para a comparação das duas suítes, multiplicar os totais por dois. Os números são expectativas prospectivas, não resultados de execução. Não contar requisições de testes de contrato, prontidão ou do coordenador como chamadas dos cenários.

Aceitação de lote exige todos os critérios novos, regressão dos anteriores, execuções reais e comparação com o oráculo e entre pares. Os cenários atuais mantêm seus labels/checks; somente os novos seguem o padrão de dois checks por operação. Não introduzir chamadas extras para melhorar apenas uma arquitetura.

## Rastreabilidade e mudanças

Cada novo arquivo/edição/defeito registra o(s) CT(s) atendido(s); componentes compartilhados podem ter vários CTs. As contagens e sequências da matriz devem alimentar o futuro validador em commit comum separado, antes das implementações medidas.

Contratos ambíguos são resolvidos por emenda antes do lote, aplicada aos dois braços; não ajustar a aceitação para acomodar uma solução já produzida. Toda mudança de contrato precisa declarar efeitos nos cenários antigos, novos, fixtures, oráculos e métricas. Os dez novos cenários permanecem não implementados nesta entrega.

## Conferência de prontidão de 05/11/2026

A auditoria scripts/prontidao/auditar.mjs conta os índices/ranges de operações de CT-06–CT-15, confere dois checks por resposta nova, a sequência de IDs, os cinco cenários E0 e as somas por etapa. Totais confirmados por suíte: E0 14/30; E1 20/42; E2 34/70; E3 42/86; E4 66/134 (requests/checks). Não houve mudança nos requisitos ou nos números previstos. Esses valores continuam expectativas, não execuções da expansão.

A revisão manual confirmou que os dois braços recebem os mesmos dados, ordem, labels e predicados. A API e a futura validação de E1 continuam pendentes; nenhuma equivalência de CT-06–CT-15 é declarada. Evidências e decisão em [RELATORIO_PRONTIDAO_EXPERIMENTO.md](RELATORIO_PRONTIDAO_EXPERIMENTO.md).
