import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ExternalController,auditController} from './controlador.mjs';
import {summarize,readEvents} from './coletor.mjs';
const base=path.resolve(process.env.CONTROLLER_TEST_DIR||'evidencias/testes-controlador/'+new Date().toISOString().replace(/[:.]/g,'-'));
function setup(name){
 const dir=path.join(base,name);fs.mkdirSync(dir,{recursive:true});
 const prompt=path.join(dir,'input.txt');fs.writeFileSync(prompt,'tarefa neutra de teste');
 return {dir,prompt,session:path.join(dir,'sessao')};
}
test('marcadores externos persistem antes da entrega e separam humanos, Codex e sobreposição',()=>{
 const {dir,prompt,session}=setup('sequencia');
 const c=new ExternalController(session,'TESTE',{mode:'ensaio'});
 c.humanStart('preparação simulada','simulacao');
 const receipt=c.arm(prompt);
 assert.equal(receipt.ready_to_send,true);
 const state=JSON.parse(fs.readFileSync(path.join(session,'controller.json'),'utf8'));
 assert.equal(state.main.event_id,receipt.start_event_id);
 assert.ok(readEvents(path.join(session,'eventos')).some(e=>e.event_id===receipt.start_event_id));
 c.sent();c.auxStart('revisão humana simulada','simulacao');
 assert.throws(()=>c.receive(),/auxiliar/);
 assert.throws(()=>c.pause('humano ausente'),/não é pausa humana/);
 c.auxStop();c.receive();
 const response=path.join(dir,'resposta.txt');fs.writeFileSync(response,'resposta neutra');
 c.attachResponse(response);c.humanStart('conferência simulada','simulacao');c.humanStop();c.close();
 const audit=auditController(session);assert.equal(audit.passed,true);
 assert.equal(audit.human_observed_ms,null);assert.equal(audit.active_total_ms,null);
 const s=audit.summary;
 assert.equal(s.known_condition_active_ms,s.known_category_ms.humano_ativo+s.known_category_ms.codex_execucao);
 assert.ok(s.known_human_observed_ms>=s.known_category_ms.humano_ativo);
 assert.throws(()=>new ExternalController(session,'TESTE'),/já existe/);
});
test('pausa e retomada exigem ação explícita e motivo',()=>{
 const {session}=setup('pausa');const c=new ExternalController(session,'TESTE');
 assert.throws(()=>c.humanStart('atividade'),/observation/);
 c.humanStart('simulada','simulacao');assert.throws(()=>c.pause(),/Motivo/);
 c.pause('ausência simulada');assert.throws(()=>c.humanStop(),/não está ativo/);
 c.resume('retomada explícita');c.humanStop();c.close();
 const s=summarize(path.join(session,'eventos'));assert.equal(s.complete,true);
 assert.equal(s.intervals.filter(i=>i.category==='pausa').length,1);
});
test('auditoria rejeita despacho ausente e resposta não arquivada',()=>{
 const {session,prompt}=setup('incompleto');const c=new ExternalController(session,'TESTE');
 c.humanStart('simulada','simulacao');c.arm(prompt);c.receive();c.close();
 const r=auditController(session);assert.equal(r.passed,false);
 assert.ok(r.errors.some(e=>e.includes('ordem temporal')));
 assert.ok(r.errors.some(e=>e.includes('artefato')));
});
test('auditoria detecta alteração do prompt depois da entrega',()=>{
 const {dir,session,prompt}=setup('hash');const c=new ExternalController(session,'TESTE');
 c.humanStart('simulada','simulacao');c.arm(prompt);c.sent();c.receive();
 const response=path.join(dir,'response.txt');fs.writeFileSync(response,'ok');c.attachResponse(response);c.close();
 fs.writeFileSync(path.join(session,'turnos','001','prompt.txt'),'adulterado no teste');
 assert.equal(auditController(session).passed,false);
});
test('modo experimental recusa simulação e transporte CLI de ensaio',async()=>{
 const {session}=setup('politica');const c=new ExternalController(session,'TESTE',{mode:'experimental'});
 assert.throws(()=>c.humanStart('simulada','simulacao'),/Simulação proibida/);
 await assert.rejects(c.runCodex({}),/restrito ao ensaio/);c.close();
});
test('falha de transporte é registrada e não aprovada como resposta',async()=>{
 const {session,prompt,dir}=setup('falha');const c=new ExternalController(session,'TESTE');
 c.humanStart('simulada','simulacao');
 const run=await c.runCodex({prompt_file:prompt,executable:path.join(dir,'nao-existe.exe'),cwd:dir,args:['--json','-']});
 const turn=await run.done;assert.equal(turn.status,'failed');c.close();
 const audit=auditController(session);assert.equal(audit.passed,false);
 assert.equal(audit.summary.open_intervals.length,0);
 assert.equal(audit.codex_execution_ms,null);assert.ok(audit.codex_interval_attempts_ms>=0);
});
test('limite é checado antes de entregar novo prompt sem inventar duração',()=>{
 const {session,prompt}=setup('limite');const c=new ExternalController(session,'TESTE');
 c.humanStart('simulada','simulacao');
 // Injeção apenas em memória para testar a guarda, nunca é resultado de esforço.
 c.main={...c.main,monotonic_ns:String(BigInt(c.main.monotonic_ns)-121n*60n*1000000000n)};
 assert.throws(()=>c.arm(prompt),/120 minutos/);c.humanStop();c.close();
});

test('transporte JSONL simulado completa ciclo sem virar medição humana ou Codex real',async()=>{
 const {session,prompt,dir}=setup('transporte-simulado');fs.writeFileSync(prompt,'Calcule 2+3+5');
 const c=new ExternalController(session,'TESTE');c.humanStart('simulada','simulacao');
 const run=await c.runCodex({prompt_file:prompt,executable:process.execPath,cwd:dir,args:[fileURLToPath(new URL('./simulador-transporte.mjs',import.meta.url)),'--json','-'],subject:'simulador'});
 const turn=await run.done;assert.equal(turn.status,'received');c.close();
 const audit=auditController(session);assert.equal(audit.passed,true);assert.equal(audit.codex_subject_simulated,true);assert.equal(audit.codex_execution_ms,null);assert.equal(audit.human_observed_ms,null);assert.equal(audit.active_total_ms,null);
});
