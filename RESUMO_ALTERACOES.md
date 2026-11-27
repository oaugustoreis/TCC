# Resumo das alterações por capítulo

A [monografia revisada](TCC_Revisado.docx) conserva título, pergunta de pesquisa, objetivo geral e delineamento experimental. A revisão trabalhou sobre a cópia fornecida e preservou os originais da pesquisa.

| Parte da monografia | Alteração principal |
|---|---|
| Pré-textuais | Corrigida em português e inglês a formulação que sugeria duas APIs. O resumo esclarece a proporção de tokens repetidos e o total de linhas modificadas. Sumário e listas remetem à paginação revisada. |
| 1. Introdução | O leitor acompanha o problema a partir de uma mudança concreta no contrato de login em quinze jornadas. A razão metodológica para empregar agentes aparece antes da pergunta de pesquisa. |
| 2. Justificativa | A lacuna foi delimitada ao custo de expandir e manter duas organizações com conteúdo funcional comum. A contribuição principal é a comparação empírica e versionada de artefatos em k6. |
| 3. Objetivos | O objetivo específico de construção das suítes foi distinguido do objetivo de verificar equivalência. A formulação sobre agentes passou a refletir a diferença entre padronização pretendida e controle comprovado. |
| 4. Referencial teórico | Checks incorporados aos Use Cases. Um trecho k6 de CT-02 relaciona chamada e check. A discussão de test smells foi condensada e a de correspondência lexical ganhou um exemplo de limitação. |
| 5. Metodologia | Explicitadas variáveis, domínio e estado da API. O CT-04 demonstra o caminho de uma requisição nas duas organizações. Detalhados oráculo, captura HTTP, opções efetivas, algoritmo de duplicação, SLOC, churn e reuso por lote. A Tabela 3 distingue isolamento planejado de isolamento comprovado. As evidências de agentes, falhas e sobreposições estão vinculadas às etapas. |
| 6. Resultados e discussão | Localizados os tokens duplicados em Flows e Use Cases, com numeradores e denominadores por estado. Separado o churn de criação e modificação. Incluídos o diff de M1, o alcance de M2 e M3 e o episódio de navegação de M2 modular. A Figura 5 mostra duplicação na evolução e churn nas manutenções. |
| 7. Conclusões e trabalhos futuros | A orientação prática pondera repetição de operações, frequência de mudança do contrato e custo de expansão. A condição intermediária proposta permite investigar o efeito adicional das quatro camadas em estudo futuro. |
| Referências e Apêndice A | Incluída a referência do Relatório Experimental Completo. As Tabelas 6–9 apresentam matriz CT-01–CT-15, oito estados Git com validações por suíte, inventário e tokens por etapa, e componentes reutilizados com seus consumidores. Incluídos comandos de reprodução em árvore isolada. |

A revisão preserva as medições experimentais originais. A distribuição por camada e o agrupamento do churn por status Git derivam de conferências posteriores sobre os mesmos fontes e diffs. O [relatório de correções](RELATORIO_CORRECOES.md) permite localizar cada decisão. As [pendências de validação](PENDENCIAS_VALIDACAO.md) identificam a evidência necessária para sustentar afirmações adicionais.
