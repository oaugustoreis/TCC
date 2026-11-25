const http = require('node:http');
const fs = require('node:fs');
const products = [{id:1,name:'Produto T1',price:10}];
http.createServer((req,res) => {
  req.resume();
  let status=200, body;
  if(req.method==='POST' && req.url==='/authentication') body={token:'t1-token'};
  else if(req.headers.authorization!=='Bearer t1-token') {status=401;body={error:'unauthorized'};}
  else if(req.method==='GET' && req.url==='/products') body=products;
  else if(req.method==='GET' && req.url==='/products/1') body=products[0];
  else {status=404;body={error:'not found'};}
  fs.appendFileSync(process.env.MOCK_LOG || '../evidence/mock-requests.jsonl',JSON.stringify({time:new Date().toISOString(),method:req.method,path:req.url,authorization:req.headers.authorization||null,status})+'\n');
  res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));
}).listen(3333,'127.0.0.1',()=>console.log('T1 mock listening on 127.0.0.1:3333'));
