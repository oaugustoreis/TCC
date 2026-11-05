# Contratos HTTP — versão inicial (baseline)

Servidor local: `http://127.0.0.1:3333`. Todas as rotas exceto `/auth/login` e `/health` exigem `Authorization: Bearer token-experimental`.

| Método | Rota | Entrada | Saída esperada |
|---|---|---|---|
| POST | `/auth/login` | `{"username":"pesquisador","password":"teste123"}` | 200 `{"token":"token-experimental","tokenType":"Bearer"}` |
| GET | `/products` | — | 200 `{"items":[{"id":"p1","name":"Produto A","price":100},...]}` |
| GET | `/products/p1` | — | 200 `{"id":"p1","name":"Produto A","price":100}` |
| POST | `/orders` | `{"productId":"p1","quantity":1}` | 201 `{"id":"oN","productId":"p1","quantity":1,"status":"created"}` |
| GET | `/orders/oN` | — | 200 objeto do pedido |
| PATCH | `/orders/oN/status` | `{"status":"confirmed"}` | 200 objeto atualizado |

O identificador `oN` é dinâmico. Para testes repetíveis, reinicie o processo da API entre condições experimentais; os dados de produtos são fixos. Não há persistência em disco. Para testes concorrentes, cada criação retorna um identificador exclusivo. Não há endpoint de reset exposto para evitar interferência durante a carga.

## Matriz de equivalência inicial

| ID | Operações na ordem | Verificações |
|---|---|---|
| CT-01 | login | HTTP 200; token string |
| CT-02 | login, products, product | login; lista 200/não vazia; produto 200/id p1 |
| CT-03 | login, product, create | login; produto 200/id p1; pedido 201/id/status created |
| CT-04 | login, create, get order | login; pedido 201/id/status created; consulta 200/id/status created |
| CT-05 | login, create, patch, get order | login; pedido 201/id/status created; patch 200/status confirmed; consulta 200/id/status confirmed |

Os nomes de checks, requisições e dados são idênticos entre as duas implementações. O comportamento é validado primeiro com 1 VU e 1 iteração.
