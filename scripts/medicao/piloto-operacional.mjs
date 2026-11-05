// Executar este driver fora do turno Codex observado; não é unidade E1.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ExternalController,auditController} from './controlador.mjs';
const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
const simulated=args.includes('--simulador');
if(!args.includes('--dir')||(!simulated&&!args.includes('--codex')))throw Error('--dir e --codex (ou --simulador) obrigatórios');
const dir=path.resolve(value('--dir'));if(fs.existsSync(dir))throw Error('Usar pasta nova');
fs.mkdirSync(dir,{recursive:true});
const prompt='Ensaio operacional neutro de transporte. Não leia arquivos, não use ferramentas, não altere nada e não consulte qualquer suíte ou projeto. Calcule 2+3+5 e responda somente com o número 10.';
const promptFile=path.join(dir,'tarefa-neutra.txt');fs.writeFileSync(promptFile,prompt+'\n');
const workspace=path.join(dir,'workspace-neutro');fs.mkdirSync(workspace);
const c=new ExternalController(path.join(dir,'sessao'),'ENSAIO-OPERACIONAL-NEUTRO',{mode:'ensaio'});
c.humanStart('SIMULAÇÃO da preparação humana, para testar categorias; não é esforço observado','simulacao');
c.pause('Pausa técnica explícita do ensaio');
c.resume('Retomar o driver de ensaio');
const realArgs=['exec','--json','--color','never','--sandbox','read-only','--skip-git-repo-check',
 '--model','gpt-6.1-sol','-c','model_reasoning_effort="low"','-C',workspace,'-'];
const cliArgs=simulated?[fileURLToPath(new URL('./simulador-transporte.mjs',import.meta.url)),'--json','-']:realArgs;
const {receipt,done}=await c.runCodex({prompt_file:promptFile,executable:simulated?process.execPath:value('--codex'),cwd:workspace,args:cliArgs,subject:simulated?'simulador':'codex'});
fs.writeFileSync(path.join(dir,'recibo-antes-da-tarefa.json'),JSON.stringify(receipt,null,2)+'\n');
const turn=await done;
c.humanStart('SIMULAÇÃO da conferência humana após resposta, não é esforço observado','simulacao');
c.humanStop();c.close();
const audit=auditController(path.join(dir,'sessao'));
const response=turn.response_path?fs.readFileSync(path.join(dir,'sessao',turn.response_path),'utf8').trim():null;
const result={scope:'ensaio operacional neutro, não E1',real_codex_transport:!simulated&&turn.status==='received',codex_subject_simulated:simulated,human_phases_simulated:true,
 expected_response:'10',observed_response:response,passed:audit.passed&&response==='10',audit,
 metadata:{model_requested:'gpt-6.1-sol',reasoning_requested:'low',sandbox_requested:'read-only',
 note:'Perfil read-only somente para o ensaio neutro; não substitui a configuração congelada para E1 nem constitui sua recaptura efetiva.'}};
fs.writeFileSync(path.join(dir,'resultado-operacional.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));process.exitCode=result.passed?0:1;
