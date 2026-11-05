// Ponte operacional externa; reutiliza as regras e o relógio do coletor congelado.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Collector,summarize,readEvents} from './coletor.mjs';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function durable(file,value,flags='w'){
 const fd=fs.openSync(file,flags);
 try{fs.writeFileSync(fd,value);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
}
export class ExternalController {
 constructor(dir,unit,{mode='ensaio'}={}){
  if(!['ensaio','experimental'].includes(mode))throw Error('Modo inválido');
  this.dir=path.resolve(dir);this.mode=mode;this.unit=unit;this.main=null;this.aux=null;this.turns=[];this.running=null;this.closed=false;
  if(fs.existsSync(path.join(this.dir,'controller.json')))throw Error('Sessão já existe; preservar e usar pasta nova. Não recuperar tempos.');
  this.collector=new Collector(path.join(this.dir,'eventos'),unit);
  this.record('controller_ready',{mode,pid:process.pid});this.save();
  this.heartbeat=setInterval(()=>this.save(),1000);this.heartbeat.unref();
 }
 record(type,fields={}){return this.collector.emit({type,track:'controle',category:null,activity:type,...fields});}
 save(){
  const state={schema_version:1,pid:process.pid,unit_id:this.unit,mode:this.mode,closed:this.closed,
   clock_session_id:this.collector.session,updated_utc:new Date().toISOString(),heartbeat_monotonic_ns:String(process.hrtime.bigint()),
   main:this.main?{event_id:this.main.event_id,category:this.main.category,monotonic_ns:this.main.monotonic_ns,utc:this.main.utc}:null,
   auxiliary_human:this.aux?.event_id??null,turns:this.turns};
  durable(path.join(this.dir,'controller.json.tmp'),JSON.stringify(state,null,2)+'\n');
  fs.renameSync(path.join(this.dir,'controller.json.tmp'),path.join(this.dir,'controller.json'));
  return state;
 }
 endMain(reason){
  if(!this.main)throw Error('Sem intervalo principal');
  if(this.aux)throw Error('Encerrar humano auxiliar primeiro');
  this.collector.end(this.main.event_id,reason);this.main=null;
 }
 humanStart(activity,observation){
  if(!activity||!['operador','simulacao'].includes(observation))throw Error('Atividade e observation=operador|simulacao obrigatórios');
  if(observation==='simulacao'&&this.mode!=='ensaio')throw Error('Simulação proibida em unidade experimental');
  if(this.main)throw Error('Encerrar intervalo atual primeiro');
  this.main=this.collector.start('humano_ativo',activity);
  this.record('human_observation',{start_event_id:this.main.event_id,observation});
  return this.save();
 }
 humanStop(){if(this.main?.category!=='humano_ativo')throw Error('Humano não está ativo');this.endMain('operador encerrou atividade humana');return this.save();}
 auxStart(activity,observation){
  if(this.running)throw Error('Ensaio CLI automático não registra sobreposição humana; usar marcadores manuais');
  if(this.main?.category!=='codex_execucao'||this.aux)throw Error('Auxiliar exige turno Codex ativo e trilha livre');
  if(!['operador','simulacao'].includes(observation)||(observation==='simulacao'&&this.mode!=='ensaio'))throw Error('Observação inválida');
  this.aux=this.collector.start('humano_ativo',activity,{track:'humano_auxiliar',related_start_id:this.main.event_id});
  this.record('human_observation',{start_event_id:this.aux.event_id,observation});return this.save();
 }
 auxStop(){if(!this.aux)throw Error('Humano auxiliar não está ativo');this.collector.end(this.aux.event_id);this.aux=null;return this.save();}
 pause(reason){
  if(this.main?.category==='codex_execucao')throw Error('Codex executando não é pausa humana; manter relógio ou encerrar/cancelar o turno');
  if(!this.main)throw Error('Não há atividade para pausar');
  this.main=this.collector.pause(reason);return this.save();
 }
 resume(reason){this.main=this.collector.resume(reason);return this.save();}
 arm(promptFile,transport='manual'){
  if(this.closed||this.running)throw Error('Controlador indisponível');
  if(this.main?.category!=='humano_ativo')throw Error('Registrar a leitura/preparação humana antes de armar o prompt');
  const summary=summarize(path.join(this.dir,'eventos'));
  const elapsed=Number(process.hrtime.bigint()-BigInt(this.main.monotonic_ns))/1e6;
  if(summary.known_condition_active_ms+elapsed>=120*60*1000)throw Error('Limite de 120 minutos alcançado');
  const bytes=fs.readFileSync(promptFile);if(!bytes.length)throw Error('Prompt vazio');
  const number=this.turns.length+1;
  const turnDir=path.join(this.dir,'turnos',String(number).padStart(3,'0'));fs.mkdirSync(turnDir,{recursive:true});
  durable(path.join(turnDir,'prompt.txt'),bytes);
  this.endMain('transição explícita para entrega do prompt');
  this.main=this.collector.start('codex_execucao','Turno '+number);
  const turn={number,start_event_id:this.main.event_id,clock_session_id:this.collector.session,
   start_utc:this.main.utc,prompt_sha256:digest(bytes),prompt_path:path.relative(this.dir,path.join(turnDir,'prompt.txt')).replaceAll('\\','/'),
   transport,status:'armed',response_received:false};
  this.turns.push(turn);this.record('prompt_armed',{number,start_event_id:this.main.event_id,prompt_sha256:turn.prompt_sha256,transport});
  this.save();
  return {ready_to_send:true,unit_id:this.unit,clock_session_id:this.collector.session,start_event_id:this.main.event_id,
   prompt_sha256:turn.prompt_sha256,controller_file:path.join(this.dir,'controller.json'),turn_dir:turnDir};
 }
 sent(source='operador'){
  const turn=this.turns.at(-1);if(!turn||turn.status!=='armed')throw Error('Não há prompt armado');
  const event=this.record('prompt_dispatch',{number:turn.number,source,prompt_sha256:turn.prompt_sha256,start_event_id:turn.start_event_id});
  turn.status='sent';turn.dispatch_event_id=event.event_id;this.save();return event;
 }
 receive({source='operador',failed=false}={}){
  const turn=this.turns.at(-1);
  if(!turn||!['armed','sent'].includes(turn.status)||this.main?.category!=='codex_execucao')throw Error('Nenhum turno aguardando resposta');
  if(this.aux)throw Error('Encerrar observação humana auxiliar antes de receber resposta');
  const end=this.collector.end(this.main.event_id,'resposta/falha observada externamente');this.main=null;
  const event=this.record(failed?'transport_failed':'response_received',{number:turn.number,source,start_event_id:turn.start_event_id,end_event_id:end.event_id});
  turn.response_received=!failed;turn.status=failed?'failed':'received';turn.end_event_id=end.event_id;turn.end_utc=end.utc;turn.received_event_id=event.event_id;
  this.save();return event;
 }
 attachResponse(file){
  const turn=this.turns.at(-1);if(!turn||turn.status!=='received')throw Error('Registrar recebimento antes de anexar');
  const bytes=fs.readFileSync(file);if(!bytes.length)throw Error('Resposta vazia');
  const target=path.join(this.dir,'turnos',String(turn.number).padStart(3,'0'),'response.txt');
  if(fs.existsSync(target))throw Error('Resposta já anexada; não sobrescrever');
  durable(target,bytes);turn.response_sha256=digest(bytes);turn.response_path=path.relative(this.dir,target).replaceAll('\\','/');
  this.record('response_attached',{number:turn.number,response_sha256:turn.response_sha256});
  return this.save();
 }
 async runCodex({prompt_file,executable,cwd,args,subject='codex'}){
  if(this.mode!=='ensaio')throw Error('Adaptador CLI automático restrito ao ensaio; não troca o cliente congelado de E1');
  if(!executable||!cwd||!Array.isArray(args)||!args.includes('--json')||!args.includes('-'))throw Error('Executável/cwd/args --json e stdin - obrigatórios');
  if(args.some(a=>String(a).startsWith('--dangerously-')))throw Error('Não reduzir proteções');
  if(!['codex','simulador'].includes(subject))throw Error('Tipo de sujeito inválido');
  const receipt=this.arm(prompt_file,subject==='codex'?'codex-cli-ensaio':'simulador-jsonl');
  const folder=receipt.turn_dir;const bytes=fs.readFileSync(path.join(folder,'prompt.txt'));
  durable(path.join(folder,'command.json'),JSON.stringify({executable,args,cwd},null,2)+'\n');
  const stdout=fs.openSync(path.join(folder,'stdout.jsonl'),'ax'),stderr=fs.openSync(path.join(folder,'stderr.txt'),'ax');
  let buffer='',lastResponse=null,completed=false,transportError=null;
  const child=spawn(executable,args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});
  this.running=child;
  child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
  child.stdout.on('data',chunk=>{
   fs.writeSync(stdout,chunk);fs.fsyncSync(stdout);buffer+=chunk;
   let index;
   while((index=buffer.indexOf('\n'))>=0){
    const line=buffer.slice(0,index);buffer=buffer.slice(index+1);
    let event;try{event=JSON.parse(line)}catch{continue;}
    if(event.type==='item.completed'&&event.item?.type==='agent_message')lastResponse=event.item.text;
    if(event.type==='turn.completed'&&lastResponse){
     completed=true;
     this.receive({source:'evento turn.completed do cliente'});
     durable(path.join(folder,'cli-response.txt'),lastResponse);
     this.attachResponse(path.join(folder,'cli-response.txt'));
    }
   }
  });
  child.stderr.on('data',chunk=>{fs.writeSync(stderr,chunk);fs.fsyncSync(stderr);});
  child.stdin.on('error',e=>{transportError=e.message});
  child.on('error',e=>{transportError=e.message;});
  const timeout=setTimeout(()=>{transportError='timeout de 45 segundos no ensaio neutro';child.kill();},45000);
  const done=new Promise(resolve=>child.on('close',(code,signal)=>{
   clearTimeout(timeout);
   if(!completed){this.receive({source:'fim/falha de processo CLI',failed:true});}
   const turn=this.turns.at(-1);turn.exit_code=code;turn.signal=signal;turn.transport_error=transportError;
   if(code!==0||transportError)turn.status='failed';
   fs.closeSync(stdout);fs.closeSync(stderr);this.running=null;this.save();resolve(turn);
  }));
  this.sent('stdin do processo externo, antes de escrever os bytes');
  child.stdin.end(bytes);
  return {receipt,done};
 }
 status(){
  const summary=summarize(path.join(this.dir,'eventos'));
  const current=this.main&&['humano_ativo','codex_execucao'].includes(this.main.category)?Number(process.hrtime.bigint()-BigInt(this.main.monotonic_ns))/1e6:0;
  const active_budget_ms=summary.known_condition_active_ms+current;
  return {state:this.save(),summary,active_budget_ms,budget_reached:active_budget_ms>=120*60*1000};
 }
 close(){
  if(this.running)throw Error('Aguardar o processo em execução');
  if(this.aux||this.main)throw Error('Encerrar intervalos primeiro');
  this.record('controller_close');this.collector.close();this.closed=true;clearInterval(this.heartbeat);return this.save();
 }
}
export function auditController(dir){
 const state=JSON.parse(fs.readFileSync(path.join(dir,'controller.json'),'utf8'));
 const events=readEvents(path.join(dir,'eventos')),summary=summarize(path.join(dir,'eventos'));
 const errors=[];
 if(!state.closed)errors.push('controlador não encerrado');
 if(!summary.complete||summary.clock_sessions!==1)errors.push('intervalos incompletos ou múltiplos relógios');
 if(!state.turns.length)errors.push('nenhum turno observado');
 for(const turn of state.turns){
  if(turn.status!=='received'||!turn.response_received||turn.exit_code&&turn.exit_code!==0)errors.push('turno não concluído: '+turn.number);
  for(const [field,hashField]of [['prompt_path','prompt_sha256'],['response_path','response_sha256']]){
   if(!turn[field]||!fs.existsSync(path.join(dir,turn[field]))||digest(fs.readFileSync(path.join(dir,turn[field])))!==turn[hashField])errors.push('artefato ausente/divergente: '+field);
  }
  const start=events.find(e=>e.event_id===turn.start_event_id),dispatch=events.find(e=>e.event_id===turn.dispatch_event_id),end=events.find(e=>e.event_id===turn.end_event_id);
  if(!start||!dispatch||!end||start.clock_session_id!==dispatch.clock_session_id||start.clock_session_id!==end.clock_session_id||BigInt(start.monotonic_ns)>BigInt(dispatch.monotonic_ns)||BigInt(dispatch.monotonic_ns)>BigInt(end.monotonic_ns))errors.push('ordem temporal inválida: '+turn.number);
 }
 const simulated=events.some(e=>e.type==='human_observation'&&e.observation==='simulacao');
 const simulatedSubject=state.turns.some(t=>t.transport==='simulador-jsonl');
 return {passed:errors.length===0,errors,unit_id:state.unit_id,mode:state.mode,
  experimental_measurement:state.mode==='experimental',dispatch_evidence:state.turns.map(t=>({turn:t.number,transport:t.transport,manual_attestation:t.transport==='manual',automatic_transport:t.transport!=='manual'&&t.status==='received'})),human_observed_ms:simulated?null:summary.human_observed_ms,
  human_observation_simulated:simulated,codex_subject_simulated:simulatedSubject,codex_execution_ms:errors.length||simulatedSubject?null:summary.codex_execution_ms,
  codex_interval_attempts_ms:summary.known_category_ms.codex_execucao,
  active_total_ms:simulated||simulatedSubject?null:summary.condition_active_ms,
  technical_category_totals_ms:summary.known_category_ms,summary,
  note:'Marcadores manuais são observações do operador; não provam envio automático. Simulação humana nunca é esforço humano real. Este auditor não substitui captura de configuração nem isolamento do protocolo.'};
}
async function main(){
 const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
 if(!args.includes('--dir'))throw Error('--dir obrigatório');
 const dir=path.resolve(value('--dir'));
 if(args.includes('--audit')){const report=auditController(dir);console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;return;}
 if(!args.includes('--unit'))throw Error('--unit obrigatório');
 const c=new ExternalController(dir,value('--unit'),{mode:args.includes('--mode')?value('--mode'):'ensaio'});
 console.log(JSON.stringify({ready:true,...c.status().state}));
 const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
 for await(const line of input){
  try{
   const op=JSON.parse(line);let result;
   if(op.action==='human-start')result=c.humanStart(op.activity,op.observation);
   else if(op.action==='human-stop')result=c.humanStop();
   else if(op.action==='aux-start')result=c.auxStart(op.activity,op.observation);
   else if(op.action==='aux-stop')result=c.auxStop();
   else if(op.action==='pause')result=c.pause(op.reason);
   else if(op.action==='resume')result=c.resume(op.reason);
   else if(op.action==='codex-start')result=c.arm(op.prompt_file);
   else if(op.action==='sent')result=c.sent();
   else if(op.action==='received')result=c.receive();
   else if(op.action==='cancelled')result=c.receive({source:'cancelamento observado pelo operador',failed:true});
   else if(op.action==='attach-response')result=c.attachResponse(op.response_file);
   else if(op.action==='run-codex'){
    const run=await c.runCodex(op);result=run.receipt;
    run.done.then(turn=>console.log(JSON.stringify({turn_finished:true,turn})));
   }else if(op.action==='status')result=c.status();
   else if(op.action==='close'){result=c.close();console.log(JSON.stringify({ok:true,action:op.action,result}));input.close();break;}
   else throw Error('Ação desconhecida');
   console.log(JSON.stringify({ok:true,action:op.action,result}));
  }catch(e){console.log(JSON.stringify({ok:false,error:e.message}));}
 }
 if(!c.closed)c.close();
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
