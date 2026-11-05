// Simulador explícito de transporte JSONL para testes; NÃO é Codex.
let input='';for await(const chunk of process.stdin)input+=chunk;
if(!input.includes('2+3+5'))throw Error('Fixture aceita apenas a tarefa neutra');
console.log(JSON.stringify({type:'thread.started',thread_id:'SIMULADOR-NAO-CODEX'}));
console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:String(2+3+5)}}));
console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:null,output_tokens:null}}));
