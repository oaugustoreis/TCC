import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

export const CATEGORIES = ['humano_ativo','codex_execucao','ferramenta_externa','pausa','bloqueio_ambiente','coordenacao_comum'];
const id = () => crypto.randomUUID();
export function readEvents(dir) {
  const all = [];
  for (const name of fs.readdirSync(dir).filter(n => /^events\..+\.jsonl$/.test(n)).sort()) {
    const raw = fs.readFileSync(path.join(dir, name), 'utf8');
    if (raw && !raw.endsWith('\n')) throw Error('Log truncado; preservar arquivo e auditar: '+name);
    for (const [index, line] of raw.split('\n').filter(Boolean).entries()) {
      let e; try { e=JSON.parse(line); } catch { throw Error('JSON inválido: '+name+':'+(index+1)); }
      all.push(e);
    }
  }
  return all;
}
export function summarize(dir) {
  const events=readEvents(dir), ids=new Set(), starts=new Map(), ends=new Map(), sessions=new Map();
  for (const e of events) {
    if (ids.has(e.event_id)) throw Error('event_id duplicado');
    ids.add(e.event_id);
    if (!e.clock_session_id || !e.utc || typeof e.monotonic_ns!=='string') throw Error('Evento sem relógio');
    const previous=sessions.get(e.clock_session_id);
    if (previous!==undefined && BigInt(e.monotonic_ns)<previous) throw Error('Relógio regressivo');
    sessions.set(e.clock_session_id,BigInt(e.monotonic_ns));
    if (e.type==='start') starts.set(e.event_id,e);
    if (e.type==='end') {
      if (ends.has(e.start_event_id)) throw Error('Intervalo encerrado duas vezes');
      ends.set(e.start_event_id,e);
    }
  }
  const sessionBounds=[...sessions.keys()].map(session=>{const rows=events.filter(e=>e.clock_session_id===session);const first=rows.find(e=>e.type==='session_start');const last=rows.find(e=>e.type==='session_end');return {clock_session_id:session,elapsed_ms:first&&last?Number(BigInt(last.monotonic_ns)-BigInt(first.monotonic_ns))/1e6:null};});
  const totals=Object.fromEntries(CATEGORIES.map(c=>[c,0]));
  const intervals=[], unknown=[];
  let auxiliaryHuman=0, commands=0;
  for (const s of starts.values()) {
    const end=ends.get(s.event_id);
    if (!end) {unknown.push({start_event_id:s.event_id,clock_session_id:s.clock_session_id,category:s.category,track:s.track,duration_ms:null,reason:'início persistido sem término'});continue;}
    if (end.clock_session_id!==s.clock_session_id) throw Error('Não subtrair relógios de sessões diferentes');
    const duration=Number(BigInt(end.monotonic_ns)-BigInt(s.monotonic_ns))/1e6;
    if (duration<0) throw Error('Duração negativa');
    if (s.track==='principal') totals[s.category]+=duration;
    if (s.track==='humano_auxiliar') auxiliaryHuman+=duration;
    if (s.track==='comando') commands+=duration;
    intervals.push({start_event_id:s.event_id,clock_session_id:s.clock_session_id,category:s.category,track:s.track,duration_ms:duration,activity:s.activity});
  }
  for (const key of ends.keys()) if(!starts.has(key))throw Error('Término órfão');
  const knownHuman=totals.humano_ativo+auxiliaryHuman;
  const active=totals.humano_ativo+totals.codex_execucao;
  return {schema_version:1,events:events.length,clock_sessions:sessions.size,intervals,open_intervals:unknown,
    complete:unknown.length===0,session_elapsed:sessionBounds,unit_elapsed_ms:sessionBounds.length===1?sessionBounds[0].elapsed_ms:null,inter_session_gaps_unknown:sessionBounds.length>1,known_category_ms:totals,known_human_observed_ms:knownHuman,
    known_codex_execution_ms:totals.codex_execucao,known_condition_active_ms:active,known_command_ms:commands,
    condition_active_ms:sessionBounds.length>1?null:!intervals.some(x=>x.track==='principal'&&['humano_ativo','codex_execucao'].includes(x.category))?null:unknown.some(x=>x.track==='principal'&&['humano_ativo','codex_execucao'].includes(x.category))?null:active,
    codex_execution_ms:sessionBounds.length>1?null:!intervals.some(x=>x.category==='codex_execucao')||unknown.some(x=>x.category==='codex_execucao')?null:totals.codex_execucao,
    human_observed_ms:sessionBounds.length>1?null:!intervals.some(x=>x.category==='humano_ativo')?null:unknown.some(x=>x.track==='humano_auxiliar'||x.category==='humano_ativo')?null:knownHuman,
    note:'Categorias sem intervalo observado têm métricas públicas null, não esforço zero. Totais known são somas apenas dos intervalos encerrados. Totais conhecidos não imputam intervalos abertos. Nenhuma subtração entre sessões; subeventos de comando não são somados ao tempo ativo.'};
}
export class Collector {
  constructor(dir, unitId, {recover=false}={}) {
    if (!unitId) throw Error('unit_id obrigatório');
    fs.mkdirSync(dir,{recursive:true});
    this.dir=dir;this.unitId=unitId;this.session=id();this.active=new Map();this.suspended=null;this.closed=false;
    const previous=readEvents(dir);
    const previousSummary=summarize(dir);
    if(previous.some(e=>e.unit_id!==unitId))throw Error('Diretório pertence a outra unidade');
    this.lockPath=path.join(dir,'writer.lock');
    if (fs.existsSync(this.lockPath)) {
      if (!recover) throw Error('Writer existente; retomar somente com --recover após confirmar processo morto');
      const old=JSON.parse(fs.readFileSync(this.lockPath,'utf8'));
      try {process.kill(old.pid,0);throw Error('Writer ainda vivo; recuperação recusada');}
      catch(e){if(e.code!=='ESRCH')throw e;}
      fs.unlinkSync(this.lockPath);
    }
    this.lock=fs.openSync(this.lockPath,'wx');
    fs.writeFileSync(this.lock,JSON.stringify({pid:process.pid,unit_id:unitId,clock_session_id:this.session}));
    fs.fsyncSync(this.lock);
    this.fd=fs.openSync(path.join(dir,'events.'+this.session+'.jsonl'),'ax');
    this.emit({type:'session_start',category:null,activity:'abrir coletor',track:'controle',recovery:recover,
      previous_open_intervals:previousSummary.open_intervals,clock_source:'process.hrtime.bigint'});
  }
  emit(fields) {
    if(this.closed)throw Error('Coletor fechado');
    const mono=process.hrtime.bigint();
    const e={schema_version:1,event_id:id(),unit_id:this.unitId,clock_session_id:this.session,
      utc:new Date().toISOString(),utc_offset_minutes:-new Date().getTimezoneOffset(),
      monotonic_ns:String(mono),monotonic_ms:Number(mono)/1e6,...fields};
    fs.writeSync(this.fd,JSON.stringify(e)+'\n');fs.fsyncSync(this.fd);
    return e;
  }
  start(category,activity,{track='principal',related_start_id=null,reason=null}={}) {
    if(!CATEGORIES.includes(category))throw Error('Categoria inválida');
    if(!activity)throw Error('Atividade obrigatória');
    if(!['principal','humano_auxiliar','comando'].includes(track))throw Error('Trilha inválida');
    const principal=[...this.active.values()].find(e=>e.track==='principal');
    if(track==='principal'&&principal)throw Error('Relógio principal já ativo');
    if(track!=='principal'&&(!principal||related_start_id!==principal.event_id))throw Error('Subevento exige referência ao principal ativo');
    if(track==='humano_auxiliar'&&(category!=='humano_ativo'||principal.category!=='codex_execucao'))throw Error('Humano auxiliar somente durante Codex');
    if(track==='humano_auxiliar'&&[...this.active.values()].some(e=>e.track===track))throw Error('Humano auxiliar já ativo');
    const e=this.emit({type:'start',category,activity,track,related_start_id,reason});
    this.active.set(e.event_id,e);return e;
  }
  end(startId,reason=null) {
    const s=this.active.get(startId);if(!s)throw Error('Início inexistente ou já encerrado nesta sessão');
    if(s.track==='principal'&&[...this.active.values()].some(e=>e.related_start_id===startId))throw Error('Encerrar subeventos primeiro');
    const e=this.emit({type:'end',start_event_id:startId,category:s.category,activity:s.activity,track:s.track,reason});
    this.active.delete(startId);return e;
  }
  pause(reason) {
    if(!reason)throw Error('Motivo da pausa obrigatório');
    const s=[...this.active.values()].find(e=>e.track==='principal');
    if(!s||s.category==='pausa'||this.suspended)throw Error('Nenhuma atividade para pausar');
    this.end(s.event_id,reason);this.suspended={category:s.category,activity:s.activity};
    return this.start('pausa','pausa',{reason});
  }
  resume(reason) {
    if(!reason||!this.suspended)throw Error('Retomada exige pausa e motivo');
    const p=[...this.active.values()].find(e=>e.track==='principal');
    if(!p||p.category!=='pausa')throw Error('Pausa não ativa');
    this.end(p.event_id,reason);const s=this.suspended;this.suspended=null;
    return this.start(s.category,s.activity,{reason});
  }
  release(){if(this.lock!==undefined){fs.closeSync(this.lock);this.lock=undefined;fs.unlinkSync(this.lockPath);}}
  close() {
    if(this.active.size||this.suspended)throw Error('Intervalos ativos: encerrar antes de fechar');
    const e=this.emit({type:'session_end',category:null,track:'controle',activity:'fechar coletor'});
    fs.closeSync(this.fd);this.closed=true;this.release();return e;
  }
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);
  const value=k=>args[args.indexOf(k)+1];
  const dir=value('--dir');
  if(!args.includes('--dir')||!dir){console.error('Uso: node coletor.mjs --dir <pasta> --unit <id> [--recover|--summary]');process.exitCode=1;}
  else if(args.includes('--summary'))console.log(JSON.stringify(summarize(dir),null,2));
  else {
    let collector;
    try {
      collector=new Collector(dir,args.includes('--unit')?value('--unit'):null,{recover:args.includes('--recover')});
      console.log(JSON.stringify({ready:true,clock_session_id:collector.session}));
      const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
      for await (const line of input) {
        try {
          const c=JSON.parse(line);let event;
          if(c.action==='start')event=collector.start(c.category,c.activity,c);
          else if(c.action==='end')event=collector.end(c.start_event_id,c.reason);
          else if(c.action==='pause')event=collector.pause(c.reason);
          else if(c.action==='resume')event=collector.resume(c.reason);
          else if(c.action==='close'){event=collector.close();console.log(JSON.stringify({ok:true,event}));input.close();break;}
          else throw Error('Ação desconhecida');
          console.log(JSON.stringify({ok:true,event}));
        } catch(e){console.log(JSON.stringify({ok:false,error:e.message}));}
      }
      if(!collector.closed)collector.close();
    } catch(e){console.error(e.message);process.exitCode=1;}
  }
}
