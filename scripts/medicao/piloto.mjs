import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {Collector,summarize} from './coletor.mjs';
const dir=path.resolve(process.argv[2]||'evidencias/piloto-neutro/'+new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(dir,{recursive:true});
const unit='PILOTO-NEUTRO-NÃO-EXPERIMENTAL';
const c=new Collector(path.join(dir,'eventos'),unit);
const commands=[];
function execute(expression,name) {
  const r=spawnSync(process.execPath,['-e',expression,dir],{encoding:'utf8',windowsHide:true});
  commands.push({command:[process.execPath,'-e',expression,dir],exit_code:r.status,stdout:r.stdout,stderr:r.stderr});
  fs.writeFileSync(path.join(dir,name+'.command.json'),JSON.stringify(commands.at(-1),null,2)+'\n');
  assert.equal(r.status,0);
}
let span=c.start('ferramenta_externa','Ordenar palavras e conferir arquivo neutro');
execute("const fs=require('node:fs');const p=require('node:path');const d=process.argv[1];const words=['gama','alfa','beta'];fs.writeFileSync(p.join(d,'palavras.json'),JSON.stringify([...words].sort()));",'ordenacao');
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'palavras.json'),'utf8')),['alfa','beta','gama']);
c.pause('Pausa técnica do piloto para ler registros persistidos; não é tempo humano medido');
const persisted=fs.readFileSync(path.join(dir,'eventos','events.'+c.session+'.jsonl'),'utf8');
assert.ok(persisted.includes(span.event_id));
span=c.resume('Continuar segunda parte da tarefa neutra');
execute("const fs=require('node:fs');const p=require('node:path');const d=process.argv[1];fs.writeFileSync(p.join(d,'soma.json'),JSON.stringify({sum:[2,3,5].reduce((a,b)=>a+b,0)}));",'soma');
assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'soma.json'),'utf8')).sum,10);
c.end(span.event_id);c.close();
const report={purpose:'Ensaio técnico neutro; fora das suítes, sem CT-06–CT-15 ou esforço definitivo',unit_id:unit,
  measured_scope:'somente subprocessos neutros e operações de arquivo deste piloto; não é duração do turno Codex nem esforço humano',
  task_passed:true,commands,summary:summarize(path.join(dir,'eventos'))};
fs.writeFileSync(path.join(dir,'resultado-piloto.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
