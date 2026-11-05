Vamos transformar o experimento do TCC em um estudo de evolução incremental de duas arquiteturas de testes de carga em k6.

**Objetivo:** preservar as duas implementações atuais, com cinco cenários funcionalmente equivalentes, e expandi-las progressivamente até 15 cenários, quantificando o esforço necessário em cada arquitetura.

### Fase inicial — Preparação

1. Preserve a baseline validada das implementações tradicional e modular.
2. Inicialize o Git, caso necessário, e registre um commit inicial com os arquivos autorais e a documentação relevante.
3. Preserve separadamente os relatórios e as evidências da validação funcional anterior.
4. Defina cinco estados experimentais: E0, E1, E2, E3 e E4.
5. Documente os requisitos funcionais e critérios de aceitação de cada etapa antes de implementá-la.
6. Crie um protocolo de medição do esforço de implementação com tempo ativo, linhas adicionadas/removidas, arquivos criados/modificados, componentes reutilizados, defeitos e ciclos de correção.
7. Estabeleça uma política de uso do Codex idêntica para ambas as arquiteturas, registrando modelo, configuração, prompts, intervenções e tempo de execução.
8. Defina uma estratégia para alternar a ordem de implementação das arquiteturas entre as etapas.

### Expansão planejada

- E0: cinco cenários atuais.
- E1: dois cenários adicionais de catálogo e estoque.
- E2: três cenários adicionais de carrinho.
- E3: dois cenários adicionais de pedidos.
- E4: três cenários adicionais de pagamentos e compra completa.

### Regras

- Não modificar os cenários da baseline sem necessidade funcional documentada.
- Não executar medições definitivas antes de congelar o protocolo.
- Não favorecer nenhuma arquitetura na definição dos requisitos.
- Não excluir helpers ou arquivos autorais das métricas.
- Não utilizar quantidade de linhas como substituto isolado de dificuldade.
- Não misturar alterações da API com alterações das suítes de teste.
- Não inventar tempos ou resultados que não tenham sido registrados durante o desenvolvimento.

### Entregáveis desta etapa

- `PROTOCOLO_EVOLUCAO_INCREMENTAL.md`
- `MATRIZ_REQUISITOS_EXPANSAO.md`
- `PLANO_MEDICAO_ESFORCO.md`
- Baseline E0 versionada e identificada.

**Nesta execução, faça apenas a preparação e o planejamento. Não implemente ainda os cenários expandidos.**
