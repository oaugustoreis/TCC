import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {Collector,summarize,readEvents} from './coletor.mjs';
const base=path.resolve(process.env.COLLECTOR_TEST_DIR||'evidencias/testes-coletor/'+new Date().toISOString().replace(/[:.]/g,'-'));
const cli=fileURLToPath(new URL('./coletor.mjs',import.meta.url));
function folder(name){const p=path.join(base,name);fs.mkdirSync(p,{recursive:true});return p}
test('persistência anterior ao término, exclusividade e referência',()=>{
  const d=folder('persistencia');const c=new Collector(d,'teste');
  const s=c.start('coordenacao_comum','atividade de teste');
  assert.ok(readEvents(d).some(e=>e.event_id===s.event_id));
  assert.throws(()=>c.start('pausa','sobreposição'),/já ativo/);
  assert.throws(()=>new Collector(d,'teste'),/Writer existente/);
  assert.throws(()=>c.end('inexistente'),/Início inexistente/);
  assert.throws(()=>c.close(),/Intervalos ativos/);
  c.end(s.event_id);assert.throws(()=>c.end(s.event_id),/encerrado/);c.close();
  const report=summarize(d);
  assert.equal(report.complete,true);assert.equal(report.human_observed_ms,null);assert.equal(report.condition_active_ms,null);assert.ok(report.unit_elapsed_ms>=report.intervals[0].duration_ms);assert.equal(report.intervals.length,1);
  assert.ok(report.intervals[0].duration_ms>=0);
});
test('pausa/retomada e trilhas auxiliares não duplicam tempo ativo',()=>{
  const d=folder('trilhas');const c=new Collector(d,'teste');
  let s=c.start('codex_execucao','categoria simulada de teste, não é turno real');
  assert.throws(()=>c.start('humano_ativo','sem pai',{track:'humano_auxiliar'}),/referência/);
  const h=c.start('humano_ativo','sobreposição simulada',{track:'humano_auxiliar',related_start_id:s.event_id});
  const command=c.start('ferramenta_externa','comando simulado',{track:'comando',related_start_id:s.event_id});
  assert.throws(()=>c.end(s.event_id),/subeventos/);
  c.end(h.event_id);c.end(command.event_id);
  c.pause('pausa de teste');s=c.resume('retomar teste');c.end(s.event_id);c.close();
  const r=summarize(d);
  assert.equal(r.known_condition_active_ms,r.known_category_ms.codex_execucao);
  assert.equal(r.human_observed_ms,r.intervals.filter(x=>x.track==='humano_auxiliar').reduce((a,b)=>a+b.duration_ms,0));
  assert.equal(r.intervals.filter(x=>x.category==='pausa').length,1);
});
test('queda preserva início; recuperação cria outro relógio e duração desconhecida',async()=>{
  const d=folder('queda');
  const child=spawn(process.execPath,[cli,'--dir',d,'--unit','teste'],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  let buffer='';const messages=[];const waiters=[];
  child.stdout.setEncoding('utf8');child.stdout.on('data',s=>{buffer+=s;let i;while((i=buffer.indexOf('\n'))>=0){messages.push(JSON.parse(buffer.slice(0,i)));buffer=buffer.slice(i+1);waiters.shift()?.()}});
  async function message(){while(!messages.length)await new Promise(r=>waiters.push(r));return messages.shift()}
  const ready=await message();assert.equal(ready.ready,true);
  child.stdin.write(JSON.stringify({action:'start',category:'codex_execucao',activity:'intervalo simulado para teste de queda'})+'\n');
  const ack=await message();assert.equal(ack.ok,true);
  assert.throws(()=>new Collector(d,'teste',{recover:true}),/vivo/);
  child.kill();await once(child,'exit');
  const afterCrash=summarize(d);assert.equal(afterCrash.open_intervals.length,1);assert.equal(afterCrash.condition_active_ms,null);
  const next=new Collector(d,'teste',{recover:true});assert.notEqual(next.session,ready.clock_session_id);
  const s=next.start('coordenacao_comum','após recuperação');next.end(s.event_id);next.close();
  const report=summarize(d);assert.equal(report.clock_sessions,2);assert.equal(report.unit_elapsed_ms,null);assert.equal(report.inter_session_gaps_unknown,true);assert.equal(report.open_intervals.length,1);
  assert.equal(report.condition_active_ms,null);
  fs.writeFileSync(path.join(d,'resumo-recuperacao.json'),JSON.stringify(report,null,2)+'\n');
});
test('JSON truncado é detectado e não reescrito',()=>{
  const d=folder('truncado');const f=path.join(d,'events.corrompido.jsonl');
  fs.writeFileSync(f,'{"parcial":');assert.throws(()=>summarize(d),/truncado/);
  assert.throws(()=>new Collector(d,'teste'),/truncado/);assert.equal(fs.existsSync(path.join(d,'writer.lock')),false);
  assert.equal(fs.readFileSync(f,'utf8'),'{"parcial":');
});
test('tentativa de misturar sessões de relógio é rejeitada',()=>{
  const d=folder('relogios');const c=new Collector(d,'teste');const s=c.start('coordenacao_comum','teste de integridade');c.end(s.event_id);c.close();
  const records=readEvents(d);const end=records.find(e=>e.type==='end');end.clock_session_id='sessao-adulterada-no-teste';
  const target=folder('relogios-invalido');fs.writeFileSync(path.join(target,'events.adulterado.jsonl'),records.map(e=>JSON.stringify(e)).join('\n')+'\n');
  assert.throws(()=>summarize(target),/sessões diferentes/);
});
