# Mock compartilhado T1

Requer Node.js 24.18.0, sem dependências npm.

Neste diretório: `node server.cjs`.

Escuta somente 127.0.0.1:3333. POST /authentication retorna token fixo; GET /products e /products/1 exigem Authorization: Bearer t1-token. Lista/detalhe determinísticos. POST aceita payload de teste sem validar credenciais. Rotas protegidas sem token retornam 401, demais caminhos 404.

Cada requisição é registrada em ../evidence/mock-requests.jsonl. Para reproduzir sem alterar a evidência original: `MOCK_LOG=/tmp/t1-reproduction-requests.jsonl node server.cjs`. Encerre com Ctrl+C.
