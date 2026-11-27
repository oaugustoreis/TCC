# Relatório de correções da monografia

**Documentos confrontados.** O parecer localizado chama-se [Analise_Critica_TCC.md](Analise_Critica_TCC.md). O nome com `(1)` não existe no projeto. O parecer descreve um DOCX com sufixo semelhante. A revisão tomou como fonte a [monografia fornecida nesta sessão](TCC_Figura_4_Posicionamento_Corrigido.docx), incluindo pré-textuais, corpo, legendas, tabelas e referências. A cópia de trabalho é [TCC_Revisado.docx](TCC_Revisado.docx). Os títulos de seção abaixo correspondem à numeração da monografia, não à numeração própria do parecer.

**Escopo da auditoria.** O conjunto correspondente a E0–M3 é `experimento_tcc/` e as árvores Git indicadas na Tabela 7 da revisão. A auditoria histórica é de 10/11/2026. A presente revisão fez conferências documentais e decomposições estáticas adicionais, sem executar tarefas de IA ou ensaios de carga.

## Chave das evidências

| Chave | Fonte e uso |
|---|---|
| AR | [implementação modular](experimento_tcc/modular), [scripts diretos](experimento_tcc/tradicional) e [configuração comum](experimento_tcc/shared/config.js). |
| PR | [Protocolo v2.1](experimento_tcc/docs/PROTOCOLO_EVOLUCAO_INCREMENTAL.md), [plano de medição](experimento_tcc/docs/PLANO_MEDICAO_ESFORCO.md) e [baseline](experimento_tcc/docs/BASELINE_E0.md). O texto prospectivo descreve intenções. |
| CT | [Matriz de requisitos](experimento_tcc/docs/MATRIZ_REQUISITOS_EXPANSAO.md), [API e testes de contrato](experimento_tcc/api) e [rastros pareados de E4](experimento_tcc/evidencias/evolucao/E4/validacao_both). |
| VA | [Validador, captura e oráculos](experimento_tcc/scripts/validacao), com versões próprias nos commits de cada etapa. [Resultado individual de CT-15](experimento_tcc/evidencias/evolucao/E4/validacao_both/tradicional_ct15/result.json). |
| ME | [Coletor e testes](experimento_tcc/scripts/metricas), [oito relatórios por etapa](experimento_tcc/evidencias/metricas), chaves `duplication`, `layers`, `batch_reuse.components` e `git_delta.files_detail`. |
| IA | [Transcrições, manifestos e tentativas por unidade](experimento_tcc/evidencias/evolucao), em particular [M2 modular](experimento_tcc/evidencias/evolucao/M2/transcripts/modular.transcript.jsonl). |
| AU | [Auditoria histórica, §§ 2–6](experimento_tcc/evidencias/auditoria/RELATORIO_AUDITORIA_RASTREABILIDADE.md), [origem das células](experimento_tcc/evidencias/auditoria/ORIGEM_CELULAS_CONSOLIDADO.json) e [adaptador de recoleta](experimento_tcc/evidencias/auditoria/recoletar.mjs). |
| RE | [Relatório Experimental Completo](experimento_tcc/docs/RELATORIO_EXPERIMENTAL_COMPLETO.md), versão de 09/11/2026. Conferido contra ME, CT, VA e AU quando havia informação mais granular. |

## Decisões por recomendação

A classificação se refere ao diagnóstico da recomendação no original. A coluna de decisão identifica a edição aplicada ou a justificativa para preservar o texto. **A** significa aplicável e comprovada, **P** parcialmente aplicável, **J** já atendida, **D** dependente de evidência e **N** não aplicável ou metodologicamente inadequada como mudança neste estudo. As pendências P1–P7 são detalhadas em [PENDENCIAS_VALIDACAO.md](PENDENCIAS_VALIDACAO.md).

| ID | Seção e problema avaliado | Evidência | Decisão, justificativa e limites | Status |
|---|---|---|---|---|
| R01 | Título poderia sugerir comparação de latência. | Título, resumo, §§ 1 e 3.1 | Mantido o título autorizado. Resumo e objetivo já delimitam a organização do código. O título alternativo é uma decisão editorial facultativa. | P |
| R02 | Resumo aparentava comparar duas APIs e empregava termos opacos. | Resumo, abstract, impacto em inglês, CT | Corrigido o objeto nos três trechos afetados. Explicados tokens e volume de linhas alteradas no resumo. E0–E4 e M1–M3 já eram apresentados com a descrição das etapas. | A |
| R03 | § 1 carecia de motivação concreta e origem da proposta. | AR, diff E4→M1 | Introduzido exemplo do contrato de login usado em quinze jornadas. A contribuição é a avaliação da organização modular. | A |
| R04 | § 1 introduzia IA na pergunta sem justificar e sugeria-se encurtar a pergunta. | PR, §§ 1 e 3.1 | Antecipada a razão registrada no plano para usar agentes. Pergunta mantida por delimitar executor, indicadores e condições. A motivação para a medida também se aplica a testes como código em outras ferramentas, mas a evidência cobre k6. | P |
| R05 | § 2 apresentava justificativa genérica, lacuna, público e contribuição pouco específicos. | §§ 2, 4.2–4.5, 7.2; AR, CT | Explicitada a lacuna empírica contextual, o contraste entre expansão e manutenção e a decisão enfrentada por quem mantém suítes. Não se declara ausência de estudos em toda a literatura. | A |
| R06 | § 3.2 repetia validação e descrevia padronização como fato. | Objetivos b/e, PR, IA, AU | b trata da construção e identifica executores e protocolo; e mantém a verificação funcional. Preservados objetivo geral, domínios de medição e finalidade dos objetivos. Reuso e arquitetura foram demonstrados em §§ 5.4 e 6.2 e no apêndice. | A |
| R07 | §§ 4.1–4.2 poderiam exibir um perfil de alta carga. | AR, shared/config.js, VA | Especificado o perfil real, shared-iterations na modular e opções comuns de 1 VU/1 iteração. Um perfil de 50 VUs por cinco minutos não integra a comparação; adicioná-lo como evidência histórica fabricaria uma condição. | P |
| R08 | § 4.2 não mostrava código k6 real; § 5.4 não permitia seguir uma requisição. | CT-02 e CT-04 tradicionais, consulta.scenario.js, consulta.flow.js e getOrder.useCase.js | Inseridos chamada e check reais em § 4.2 e dois trechos do mesmo CT-04 em § 5.4. Descrito o caminho do ID de criação até a consulta em cada organização. | A |
| R09 | § 4.3 dava mais espaço a test smells que à duplicação medida. | ME, §§ 4.3 e 5.6.1 | Condensada a discussão mantendo suas fontes. Explicados identidade lexical, renomeação, coincidências e sensibilidade à janela. Taxonomia bibliográfica mais ampla aguarda P6. | P |
| R10 | §§ 4.4–4.5 e 5.4 não distinguiam diagrama conceitual, import e despacho do k6. | AR, smoke.profile.js, mapas de pagamento, CT-04 | Demonstrados Scenario como entrada, Flow como composição, exec como ligação por nome e Profile como configuração importada. Identificados compartilhamento de perfil e tipos de import observados em E4. Preservado Parnas (1972). Não se convertem convenções observadas em dependências proibidas. | A |
| R11 | §§ 4.5 e 5.4 sugeriam necessidade de exatamente quatro camadas. | AR, PR | Apresentada a justificativa histórica da escolha e o limite de identificação causal. Não há comparação entre decomposições de três, quatro e cinco camadas. | P |
| R12 | §§ 4.6, 5.8, 6.5 e 7.3 repetiam ressalvas; o significado do churn já era adequado. | Texto original §§ 4.6, 5.6.2, 5.8 | Preservadas definições de indicadores e a distinção entre churn final e retrabalho intermediário. Condensadas ressalvas em 5.7, 6.5 e 7.3, privilegiando restrições próprias de cada interpretação. | P |
| R13 | §§ 4.7 e 5.7 confundiam propósito do agente e demonstração de controle. | PR, IA, AU | Motivação do plano em § 1, base conceitual em § 4.7 e controles detalhados em § 5.7. Evita atribuir neutralidade ao agente ou transferir sua telemetria para produtividade humana. | A |
| R14 | § 5.1 não sistematizava variáveis; solicitavam-se hipóteses. | PR, §§ 4.4 e 5.1 | Explicitadas variável de comparação, respostas, controles e fatores intervenientes. A expectativa de concentração e custo já constava de § 4.4. Preservada como expectativa de trabalho, sem convertê-la em hipótese estatística pré-registrada. | P |
| R15 | § 5.2 caracterizava rotas sem explicar domínio, estado ou ambiente. | api/server.js, testes de contrato, VA, AU | Descritos autenticação fixa, mapas reiniciados por processo, cálculo do carrinho, checkout e pagamento simulado. Distintos efeitos plausíveis do ambiente sobre medição estática e execução. | A |
| R16 | §§ 5.3 e 6.1 agrupavam dez novos CTs sem expor complexidade. | CT, VA, 15 registros result.json e traços HTTP | Tabela 6 traz CT-01–CT-15, etapa, objetivo, métodos, rotas ordenadas, contagem de checks, estados esperados e IDs encadeados. Comparação explícita de CT-07 e CT-15. | A |
| R17 | § 5.4 afirmava liberdade de reuso tradicional; faltava o limite comprovado. | PR, AR, ME, IA | Substituída a afirmação categórica. A configuração externa é reutilizada e os scripts têm zero imports internos. O protocolo descreve entradas diretas e os prompts preservados de manutenção especificam arquivos. Liberdade em todas as expansões e motivo da escolha individual permanecem P2. | P |
| R18 | §§ 5.4 e 6.2 não discriminavam os 24/57 arquivos. | ME, inventário Git | Tabela 8 discrimina as cinco categorias nas cinco etapas; helpers entram integralmente no inventário. | A |
| R19 | § 5.5 dizia o que validar sem demonstrar captura, oráculo ou resultado. | VA, CT, AU | Descritos preflight, inspect, servidor observado por entrada, requisições e respostas, headers, rastros canônicos, checks e comparação pareada. Exemplo real CT-15. O estado de negócio é observável nas consultas previstas. | A |
| R20 | § 5.6.1 omitia versão, escopo, normalização, sobreposição, fórmula e justificativa do limiar. | ME, PR | Identificado exact-token-window-union-v1; documentados regra de união, escopo JS, inclusão de imports e configuração, tokens preservados e limiar fixo. A motivação geral consta do plano; não foi encontrada calibração empírica de 25. P4. | P |
| R21 | § 5.6.1 omitia regras de SLOC; § 5.6.2 já definia churn. | countLinesAndSloc, collectGitDelta | Explicitados CRLF, remoção de comentários por regex, linhas vazias, chaves e instruções multilinha. Conservada soma de adições e remoções dos diffs finais. Corrigida a unidade de duplicação na Tabela 2. | A |
| R22 | §§ 5.6.3 e 6.2 não detalhavam a contagem e os dezoito reusos. | computeBatchReuse e batch_reuse.components nos quatro JSONs | Explicados fecho dos imports e status do diff. Tabela 9 identifica componentes e consumidores diretos por lote. Há 2, 3, 4 e 9 ocorrências sem edição. Em E4 o JSON identifica smoke.profile.js; o exemplo narrativo de RE nomeia execution.js sem correspondência nesse inventário. | A |
| R23 | §§ 5.7 e 5.9 não distinguiam isolamento pretendido, observado e comprovado. | PR, IA, AU §§ 4 e 6 | Corrigida a célula da Tabela 3. Descritos sequência alternada E1–E4, sobreposição por par em M1–M3, aprovação individual/pareada, tentativas e o manifesto inválido de E1-T. A Figura 4 identifica o fluxo previsto; o texto discrimina desvios. | A |
| R24 | § 5.7 poderia documentar modelo, configurações, prompts, contexto, ferramentas, intervenções e tentativas. | IA, AU, PR | Identificados 14 registros por unidade e prompts parciais; exemplificados os limites de ferramentas, o conflito leitura/edição e as lacunas E1-M. Há tentativas externas. Não se atribuem versão de modelo, equivalência de contexto, intervenção ou autoria de comandos sem prova. P1–P3. | P |
| R25 | § 5.8 distinguir p.p., redução relativa, réplicas e inferência estatística. | § 5.8 original, delineamento PR | Mantida análise descritiva por par de artefatos, com diferenças de taxas em pontos percentuais. Acrescentar teste inferencial tomando checks ou arquivos como réplicas seria inadequado. | J |
| R26 | § 5.10 omitia commits, instrumentos, seleção das 446 células, identificação e acesso. | AU, RE, Git | Tabela 7 e comandos de reprodução com duas raízes distintas; seção identifica o livro de células e as tabelas de origem, os dois E0 e a base de cada manutenção. Repositório remoto configurado no Git; autoria/independência da auditoria e disponibilização pública dependem de P5. | P |
| R27 | § 6.2 não discutia o crescimento da duplicação modular, os absolutos e os 90,36% iniciais. | ME, tokenização dos blobs Git, scripts E0 | Tabela 8 e Figura 5 contextualizam numeradores e denominadores. Decompostas posições por camada. Em E0, login e preparação de headers exemplificam repetição tradicional. Em E1 modular, numerador estável explica a queda percentual. Nenhuma causa comportamental foi atribuída. | A |
| R28 | § 6.2 pouco explorava custo relativo, churn e resultados desfavoráveis na expansão. | ME, git_delta.files_detail, Tabela 4 | Apresentados razão SLOC 3,76→1,88 e aumento absoluto 210→644. Separados 1.002/305 de churn modular por criação/modificação, contra 699/0 na tradicional. Crescimento da suíte avaliado junto com propagação de contratos. | A |
| R29 | §§ 6.3 e 6.5 pediam exemplo antes/depois e limites de representatividade. | Git E4→M1; diffs M2, M3; CT | Incluídos predicado real tradicional e adição no Use Case. M2 envolve payload e resposta, M3 a consulta. As três tarefas exercitam contratos compartilháveis. Efeito de alterar carga, jornadas ou dependências é questão para replicação. | A |
| R30 | § 6.4 trazia apenas validações acumuladas. | VA, oito reexecuções em AU | Tabela 7 discrimina ambas as suítes por estado; preservados 188/748/1.528. A agregação abrange estados distintos. | A |
| R31 | § 6.4 mencionava navegação excepcional sem explicar seu alcance. | IA M2-M, ME M2, diff E4→M2 | Incluídos 151 eventos de leitura, 152 chamadas e 411 s. O próprio prompt aponta o arquivo. Esses dados não permitem atribuir o episódio à dificuldade de encontrar o componente. P3. | P |
| R32 | §§ 6.6 e 7 precisavam de implicações condicionais; sugeria-se avaliar solução intermediária. | RE, ME, VA e seleção de M1–M3 | Mantida resposta por dimensão. Inseridas condições de uso, custo de expansão e proposta de três condições em 7.4. Sem limite numérico de adoção e sem simular a terceira condição como resultado. | A |
| R33 | Referências careciam de entrada do relatório e de bibliografia específica sobre clones e método. | Lista original, RE, ME, PR | Incluída entrada recuperável do consolidado pelo título, data, commit e caminho históricos. Preservadas as fontes existentes, inclusive Parnas. Inclusões bibliográficas externas ficam para verificação autoral (P6). | P |
| R34 | Parecer §§ 8 e 13 sugeria gráficos e exemplos. | ME, tabelas 4 e 5 originais | Figura 5 apresenta trajetórias de duplicação e churn de cada manutenção em painéis com escalas separadas. Código em 4.2, 5.4 e 6.3; tabelas adicionais no apêndice para manter a sequência original. | A |

## Cobertura do checklist, das perguntas e das prioridades

A ordem segue a seção 11 do parecer. O número permite localizar a decisão e a respectiva evidência na tabela anterior.

| Item | Questão consolidada | Decisão |
|---:|---|---|
| 1 | Origem e contribuição | R03, R05, R11 |
| 2 | Lacuna científica | R05 |
| 3 | Escolha de quatro camadas | R10–R11 |
| 4 | Dependências permitidas | R10, R17. A regra normativa universal depende de P2. |
| 5 | Scenario e Flow | R08, R10 |
| 6 | Ausência de funções compartilhadas na tradicional | R17 |
| 7 | Motivação para agentes | R04, R13 |
| 8 | Modelos, prompts e condições | R23–R24 |
| 9 | Quinze cenários | R16 |
| 10 | Validador interno | R19 |
| 11 | Detector e limiar | R20 |
| 12 | Commits e evidências | R26 |
| 13 | Aumento 7,94%→32,36% | R27 |
| 14 | Quatro camadas ou centralização | R11, R29, R32 |
| 15 | Domínio e complexidade da API | R15–R16 |
| 16 | Distribuição dos 57 arquivos | R18 |
| 17 | Regras de SLOC e reutilização | R21–R22 |
| 18 | Dezoito ocorrências | R22 |
| 19 | Navegação de M2 | R31 |
| 20 | Manutenções em outras camadas | R29, R32 |
| 21 | Orientação prática | R32 |

| Pergunta da banca (§ 12, na ordem original) | Onde a revisão responde |
|---|---|
| 1. Necessidade das quatro camadas | §§ 4.5, 5.4 e 7.4; R10–R11, R32 |
| 2. Justiça da referência | §§ 5.4 e 6.5; R17 |
| 3. Agentes em lugar de humanos | §§ 1, 4.7 e 5.7; R04, R13 |
| 4. Controle da variabilidade | §§ 5.7 e 5.9; R23–R24 |
| 5. Aumento da duplicação modular | § 6.2 e Tabela 8; R27 |
| 6. Benefício frente ao tamanho | §§ 6.2, 6.3 e 7.2; R28–R29 |
| 7. Equivalência | § 5.5 e Tabelas 6 e 7; R19, R30 |
| 8. Somente uma iteração | §§ 4.1, 4.2 e 5.5; R07 |
| 9. Seleção de mudanças de contrato | §§ 5.1, 6.3 e 6.5; R14, R29 |
| 10. Contribuição científica | §§ 2 e 7.2; R05, R32 |

As dez prioridades da seção 13 correspondem, em ordem, a **R08; R23–R24; R10–R11 e R17; R16; R19–R22; R24 e R26; R27–R32; R34; R05; R12**. As recomendações de verificar a política efetiva de ferramentas, o modelo exato e a identidade do auditor são **dependentes de evidência**. Apresentar uma hipótese como pré-registrada, atribuir causalidade exclusiva às camadas ou acrescentar um ensaio concorrente como evidência original seria **metodologicamente inadequado**.

## Evidência quantitativa da revisão

Na revisão, a localização dos clones foi derivada dos blobs históricos. Para reproduzir a decomposição, enumere os `.js` de `modular/` com `git ls-tree -r --name-only <SHA> modular`, leia cada blob com `git show <SHA>:<caminho>` e aplique `tokenizeJs` do coletor. Construa, para cada janela de 25 tokens de um arquivo, a assinatura `valores.join(" ")`, guardando arquivo e posição inicial. Para assinaturas com duas ou mais ocorrências na suíte, marque as 25 posições de **cada** ocorrência. Some as posições distintas por arquivo e depois pelo seu primeiro subdiretório. A soma das camadas deve coincidir com `duplicated_tokens` do JSON daquele estado. SHA-256 do coletor conferido contra a cópia de auditoria: `f6e05520bd422e686bd4646656c8651b6bd88e713902f4ab5f4fe6ebef324064`.

| Estado | Flows | Use Cases | Profiles, Scenarios e helpers | Total marcado / tokens modulares |
|---|---:|---:|---:|---:|
| E0 | 160 | 0 | 0 | 160 / 2.016 |
| E1 | 160 | 0 | 0 | 160 / 2.896 |
| E2 | 367 | 709 | 0 | 1.076 / 4.711 |
| E3 | 491 | 936 | 0 | 1.427 / 5.711 |
| E4 | 873 | 1.651 | 0 | 2.524 / 7.799 |

Por exemplo, os Flows de adição e de atualização de carrinho contêm chamadas a `addCartItem` com a mesma sequência de parâmetros e expectativas até o prefixo particular do CT. Um trecho repetido em um Flow pode continuar marcado mesmo que a requisição HTTP esteja centralizada. A taxa mede posições marcadas dentro da própria condição. A decomposição por camada é uma análise documental posterior, distinguível das métricas publicadas originalmente.

| Lote | Churn modular em arquivos criados | Em arquivos modificados | Soma |
|---|---:|---:|---:|
| E1 | 136 | 43 | 179 |
| E2 | 360 | 4 | 364 |
| E3 | 144 | 100 | 244 |
| E4 | 362 | 158 | 520 |
| Total | 1.002 | 305 | 1.307 |

A agregação soma `added + removed` de cada entrada em `modular.git_delta.files_detail`, por status A/M. Na tradicional, todas as 699 linhas das expansões estão em arquivos criados. Nas manutenções, o pai Git de cada um dos três commits é E4; M3 afeta sete scripts tradicionais, conforme o diff e a lista de CTs, embora o texto prospectivo do protocolo mencione oito.

## Verificação de entrega

- Conferidos os oito JSONs de métricas frente às cópias da auditoria em tamanho, camadas, duplicação, imports, reuso e detalhes dos diffs aplicáveis. Conferidas as 446 entradas do livro de células e os valores nos JSON Pointers de origem.
- Somados os registros individuais das reexecuções preservadas, com aprovação pareada nos oito estados. A soma resulta em 188 execuções, 748 requisições e 1.528 checks aprovados.
- DOCX revisado renderizado no Word para Windows em 43 páginas. Conferidos o sumário e as listas (57 referências de página), legendas, imagens, apresentação das tabelas, referências e continuação da matriz. A Figura 4 e sua fonte estão na página 29.
- Validados o pacote ZIP e o XML. Todas as partes originais, salvo o corpo principal e suas relações atualizadas, foram preservadas byte a byte, inclusive estilos, cabeçalhos, rodapés e imagens originais. A revisão acrescentou uma figura e quatro tabelas. A numeração das cinco tabelas e das quatro figuras anteriores foi mantida.
