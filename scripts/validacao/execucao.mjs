import fs from 'node:fs';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const write=(p,value)=>fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n');
export const lines=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean).map(l=>JSON.parse(l)):[];
export function command(args,folder,name,{timeout=30000,env=process.env}={}){
 const started_utc=new Date().toISOString();
 const r=spawnSync(args[0],args.slice(1),{cwd:ROOT,env,encoding:'utf8',timeout,maxBuffer:16*1024*1024,windowsHide:true});
 const record={command:args,cwd:ROOT,started_utc,exit_code:r.status,error:r.error?.message??null,signal:r.signal};
 write(path.join(folder,name+'.command.json'),record);
 fs.writeFileSync(path.join(folder,name+'.stdout.log'),r.stdout||'');
 fs.writeFileSync(path.join(folder,name+'.stderr.log'),r.stderr||'');
 return {...record,stdout:r.stdout||'',stderr:r.stderr||''};
}
export function cleanK6Environment(){
 const env={...process.env};
 for(const key of Object.keys(env))if(/^K6_/i.test(key))delete env[key];
 return env;
}
export async function startObservedApi(folder){
 const env={...process.env,PORT:'0',TRACE_FILE:path.join(folder,'server-requests.jsonl'),READY_FILE:path.join(folder,'api-ready.json')};
 const args=['node','scripts/validacao/api-observada.mjs'];
 write(path.join(folder,'api.command.json'),{command:args,cwd:ROOT,environment:Object.fromEntries(['PORT','TRACE_FILE','READY_FILE'].map(k=>[k,env[k]]))});
 const stdout=fs.openSync(path.join(folder,'api.stdout.log'),'w'),stderr=fs.openSync(path.join(folder,'api.stderr.log'),'w');
 const child=spawn(args[0],args.slice(1),{cwd:ROOT,env,stdio:['ignore',stdout,stderr],windowsHide:true});
 let launchError=null;
 child.on('error',e=>{launchError=e.message;});
 const deadline=Date.now()+5000;
 while(!fs.existsSync(env.READY_FILE)&&child.exitCode===null&&!launchError&&Date.now()<deadline)await new Promise(r=>setTimeout(r,25));
 const ready=fs.existsSync(env.READY_FILE)&&child.exitCode===null&&!launchError;
 const address=ready?JSON.parse(fs.readFileSync(env.READY_FILE,'utf8')):null;
 return {ready,baseUrl:ready?'http://127.0.0.1:'+address.port:null,
  async stop(){
   if(child.pid&&child.exitCode===null&&child.signalCode===null){const ended=once(child,'close');child.kill();await ended;}
   fs.closeSync(stdout);fs.closeSync(stderr);
   write(path.join(folder,'api-exit.json'),{exit_code:child.exitCode,signal:child.signalCode,launch_error:launchError});
  }
 };
}
