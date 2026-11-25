# Extensão T1 — uso ampliado dos recursos Pulse

A pedido do pesquisador, foi criada `pulse-native-variant/`, com novo init/gen/add-env oficiais, preservando os projetos e quatro relatórios originais. Objetivo: explorar os recursos aplicáveis à mesma jornada. Não é repetição independente nem nova medida válida de criação a partir de ambiente/contexto limpos. Não se calculou novo M1 nem percentuais de eficiência; dependências foram reaproveitadas explicitamente por symlink.

## Recursos efetivamente usados

| Recurso | Aplicação |
|---|---|
| CLI init/gen/add-env | Workspace, seis componentes e ambiente DEV |
| Schemas e ps.expect.jsonSchema | Token, lista e produto; lista valida todos os itens |
| ps.expect.bodyNotEmpty/header/hasProperty | Corpo, Content-Type JSON e campos esperados |
| ps.expect.responseTimeLessThan | Verificação individual de duração <1500ms |
| Cliente post/get | JSON, Bearer, status checks e plugins/logging oficiais |
| ps.check | Restrições que o schema nativo não cobre |
| ps.group/ps.sleep | Agrupamento da jornada e pausa |
| Env/configResolver | Seleção da URL por ambiente |
| Descoberta/registro/engine/build | Gerados automaticamente ao executar run |
| Reporter HTML e plugins padrão | HTML gerado e logs oficiais preservados |

A implementação anterior usava HTTP, ps.check/sleep, geração, descoberta, compilação e HTML, mas seus contratos eram customizados. A variante adiciona recursos nativos de contrato e agrupamento. O código-fonte original/núcleo não foi editado.

## Validação e limites do schema

Execução concluída: **10 iterações, 30 requests, 210 checks aprovados, zero falhas**, mesmos endpoints, token, 1 VU/10s e mesmos thresholds. Logs em native-run.log; resumo em native-summary.json; trace em native-mock-requests.jsonl; validação em native-validation.json/native-validate.log. Há 21 checks por iteração: seis verificações originais mais cinco checks expect por resposta. Checks comuns da cadeia agregam várias respostas sob o mesmo nome. ps.group altera os caminhos dos checks no resumo.

A inspeção do validador nativo mostrou suporte a type/required/properties/items, mas não implementação de minLength/minItems/const. Por isso permanecem checks customizados para token/name não vazios, lista não vazia e id correspondente ao selecionado. Não se atribui suporte a keywords ignoradas. Teste somente de caminho de sucesso; nenhum ensaio negativo foi realizado. response.json fora da cadeia expect pode interromper uma iteração em respostas inválidas; isso não ocorreu no mock determinístico.

A equivalência estrita de checks com A original **não existe** nesta extensão: A tem 60 checks e esta variante 210; também há exigência individual de latência/header/corpo/schema em todos os itens. Jornada e carga permanecem equivalentes. Os relatórios T1 originais continuam descrevendo A versus B original. Não substituir silenciosamente seus números por esta variante.

## Como usar esta intenção na comparação principal

Para uma nova comparação de criação com uso amplo do Pulse, fixar antes de começar os 21 checks e os contratos adicionais como especificação de ambas as condições. O manual deve implementar verificações semanticamente equivalentes com k6 nativo. Depois criar dois projetos novos, instrumentando desde o início e instalando dependências dentro do limite temporal definido; registrar aprendizado/ordem e não chamar de independente um ensaio do mesmo agente/contexto. O uso ampliado pode reduzir autoria ou adicionar configuração: a conclusão depende da nova coleta.

GUI, mock integrado, datasets, autenticação alternativa e plugins customizados não foram adicionados: não são necessários à jornada. O mock independente foi preservado conforme o protocolo. Usar mais recursos aplicáveis permite avaliar o framework sem inflar o escopo com funcionalidades sem relação com a tarefa.

Medições e histórico desta adaptação estão separados por prefixo native em commands.jsonl e pulse-native-variant em actions.jsonl. Os arquivos originais e suas medições não foram alterados.
