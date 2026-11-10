// Adaptador de auditoria: não altera o coletor nem o algoritmo experimental.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {collectStageMetrics,formatMarkdownSummary} from './coletar-metricas.original.mjs';
const [state,base,target,rootDir,outDir]=process.argv.slice(2);
if(!state||!target||!rootDir||!outDir) throw Error('Uso: node recoletar.mjs ESTADO BASE|- SHA WORKTREE DESTINO');
if(fs.existsSync(outDir)) throw Error('Destino já existe; use uma pasta nova de evidências');
const git=(...args)=>execFileSync('git',['-C',rootDir,...args],{encoding:'utf8'}).trim();
if(git('rev-parse','HEAD')!==target) throw Error('HEAD não corresponde ao SHA final');
if(git('status','--porcelain','--','tradicional','modular','api','shared','scripts')) throw Error('Fontes alterados');
const ev=path.join(rootDir,'evidencias/evolucao',state);
const opts=state==='E0'?{}:{
 validationResultPath:path.join(ev,'validacao_both/result.json'),
 tradTranscriptPath:path.join(ev,'transcripts/tradicional.transcript.jsonl'),
 modTranscriptPath:path.join(ev,'transcripts/modular.transcript.jsonl'),
 tradValidationAttempts:path.join(ev,'tentativas_tradicional'),
 modValidationAttempts:path.join(ev,'tentativas_modular'),
};
const report=collectStageMetrics({stateId:state,baseRef:base==='-'?null:base,targetRef:target,rootDir,...opts});
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'metricas.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'RELATORIO_METRICAS.md'),formatMarkdownSummary(report));
