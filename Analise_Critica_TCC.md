# Análise crítica do TCC — visão de uma banca examinadora

**Título do TCC:** Arquitetura modular em camadas para testes de performance: uma análise comparativa frente à escrita tradicional em k6.

**Documento avaliado:** TCC_Figura_4_Posicionamento_Corrigido(1).docx — 39 páginas.

## Critérios de avaliação

A leitura considera não apenas a qualidade acadêmica da escrita, mas também se um leitor que desconhece o projeto conseguiria entender o problema, a arquitetura proposta, o experimento realizado e a relevância dos resultados.

Para cada capítulo, são considerados quatro aspectos:

- **Entendimento:** o que foi possível compreender exclusivamente pela leitura.
- **Análise crítica:** a qualidade da argumentação e do conteúdo científico.
- **Pontos de confusão:** informações ausentes, ambíguas ou insuficientemente explicadas.
- **Questionamentos da banca:** perguntas que poderiam surgir durante a defesa.

A avaliação não parte do pressuposto de que a arquitetura modular precisa ser superior. O que interessa é se o trabalho consegue sustentar suas conclusões por meio das evidências apresentadas.

---

# 1. Avaliação geral

| Capítulo | Avaliação qualitativa |
|---|---:|
| Introdução | 8,5/10 |
| Justificativa | 7,5/10 |
| Objetivos | 9,0/10 |
| Referencial teórico | 8,0/10 |
| Metodologia | 7,0/10 |
| Resultados e discussão | 7,5/10 |
| Conclusões | 8,5/10 |
| **Avaliação geral** | **8,0/10** |

*Notas subjetivas atribuídas à qualidade do documento, não equivalentes à nota oficial de uma banca.*

O TCC apresenta uma proposta coerente com a área de Engenharia da Computação, especialmente no contexto de arquitetura de software, engenharia de qualidade e manutenção de sistemas.

O principal problema identificado **não está na ideia da pesquisa, mas na capacidade do documento de explicar concretamente o que foi desenvolvido e como o experimento foi conduzido**.

Em diversos momentos, é possível compreender o conceito apresentado, mas não visualizar sua implementação real apenas pela leitura.

Também existe uma preocupação muito grande em explicar o que a pesquisa não comprova. Essa preocupação é cientificamente válida, mas, em excesso, torna o texto repetitivo e defensivo.

## O que entendi sobre o trabalho como um todo

A pesquisa procura investigar se a maneira como organizamos o código de testes de carga influencia sua evolução e manutenção.

Para isso, foram construídas duas suítes de testes que executam as mesmas jornadas sobre uma API de gerenciamento de pedidos:

| Arquitetura tradicional | Arquitetura modular |
|---|---|
| Scripts CT-01, CT-02, CT-03 etc. independentes | Profile, Scenario, Flow e Use Case |
| Requisições HTTP, lógica e checks próximos no mesmo arquivo | Responsabilidades distribuídas em quatro camadas |

Inicialmente, ambas possuem cinco cenários. Posteriormente, são expandidas para quinze e submetidas a três mudanças de contrato da API.

O objetivo é observar qual organização apresenta menos duplicação, maior reutilização, menor dispersão de alterações e quais custos estruturais são introduzidos pela modularização.

Portanto, foi possível compreender a proposta central do TCC. A pesquisa não procura descobrir qual arquitetura gera mais carga ou produz menor tempo de resposta na API, mas qual é o impacto da organização sobre o código de teste. Essa distinção é fundamental.

---

# 2. Elementos pré-textuais — título e resumo

**Páginas:** 1 a 10. **Compreensão:** boa.

## Título

O título é adequado, mas pode gerar uma expectativa ligeiramente diferente da pesquisa realizada.

Ao ler “Arquitetura modular em camadas para testes de performance”, inicialmente poderia imaginar que seriam comparados indicadores como latência, throughput, consumo de recursos e capacidade de geração de carga.

Entretanto, o trabalho investiga principalmente evolução e manutenção do código.

Sugestão de título mais específico:

> Análise comparativa da evolução e manutenção de suítes de testes de carga em k6: uma abordagem modular em camadas frente a scripts independentes.

A mudança não é obrigatória, mas deixaria o objeto científico mais evidente.

## Resumo

O resumo é bem construído. Apresenta o problema, o método, os resultados quantitativos e as limitações.

A principal dificuldade está na quantidade de termos técnicos introduzidos sem contextualização, como E0, E4, M1, M3, duplicação lexical, churn e SLOC. Para alguém da engenharia de software, isso é compreensível. Para um avaliador de outra área da Engenharia da Computação, pode dificultar a leitura.

Também substituiria a expressão “duas implementações de uma mesma API REST” por “duas implementações de suítes de testes sobre uma mesma API REST”. A expressão original pode dar a entender que foram desenvolvidas duas APIs, quando, na realidade, foram desenvolvidas duas suítes de testes.

---

# 3. Capítulo 1 — Introdução

**Páginas:** 11 e 12. **Compreensão:** boa.

## O que entendi

A introdução estabelece a seguinte sequência de raciocínio:

1. Sistemas precisam ser avaliados quanto ao desempenho.
2. Ferramentas como o k6 permitem desenvolver testes de carga como código.
3. O código desses testes também precisa acompanhar a evolução dos sistemas.
4. Uma organização inadequada pode favorecer duplicações e dificultar alterações.
5. A modularidade surge como uma alternativa a ser investigada.
6. A pesquisa compara empiricamente essas duas organizações.

A sequência é lógica e não apresenta grandes problemas de compreensão.

## Análise crítica

Um dos pontos mais positivos é que o texto não responsabiliza o k6 pela duplicação de código. Ele deixa claro que o problema está na organização da implementação.

Também é acertada a delimitação do termo “tradicional”, evitando generalizar uma prática para todos os usuários do k6.

Entretanto, falta uma apresentação mais concreta do problema que motivou a pesquisa. O texto fala sobre duplicação e manutenção, mas não mostra inicialmente uma situação que permita ao leitor perceber a dimensão desse problema.

Por exemplo, imagine que quinze scripts realizem autenticação e que o contrato desse endpoint seja alterado. Na ausência de uma operação compartilhada, quinze scripts podem precisar ser modificados. Esse exemplo simples ajudaria muito a introduzir o problema.

## Pontos de confusão

1. **De onde surgiu a arquitetura proposta?** Não é possível identificar se ela foi criada especificamente para o TCC, se surgiu de uma experiência prática anterior ou se foi adaptada de alguma arquitetura existente.
2. **Por que especificamente quatro camadas?** É possível entender que a modularidade pode ser benéfica, mas ainda não por que Profile, Scenario, Flow e Use Case foram escolhidas como solução.
3. **Por que agentes de IA foram utilizados?** A inteligência artificial aparece diretamente na pergunta de pesquisa, mas não é apresentada anteriormente como uma decisão metodológica. Sua introdução parece abrupta.

A pergunta de pesquisa é coerente, mas bastante extensa. Uma formulação mais direta poderia facilitar a identificação do problema principal:

> Quais são os benefícios e os custos estruturais de uma arquitetura modular em camadas, em comparação com scripts independentes, durante a evolução e a manutenção de suítes de testes de carga em k6?

O emprego dos agentes poderia ser apresentado como uma delimitação metodológica complementar.

## Perguntas de banca

- Qual problema concreto motivou o desenvolvimento dessa arquitetura?
- Qual é a contribuição original da arquitetura proposta?
- Por que utilizar agentes de IA em vez de desenvolvedores humanos?
- O problema investigado é específico do k6 ou poderia ocorrer em qualquer ferramenta de testes como código?

**Avaliação:** a introdução cumpre seu papel, mas precisa apresentar melhor a origem da proposta e a motivação da escolha metodológica.

---

# 4. Capítulo 2 — Justificativa

**Página:** 13. **Compreensão:** boa.

## O que entendi

A pesquisa se justifica porque o código de testes precisa evoluir juntamente com o software e porque a introdução de modularidade pode reduzir determinados problemas de manutenção, embora também possa gerar custos adicionais. O trabalho busca evidências empíricas para analisar esses benefícios e custos.

## Análise crítica

A justificativa é coerente, mas relativamente genérica. Praticamente toda pesquisa sobre modularidade de software poderia utilizar uma justificativa semelhante.

| Dimensão | O que precisa ser esclarecido |
|---|---|
| Relevância prática | Como o problema afeta equipes que mantêm testes de carga? |
| Relevância científica | Qual lacuna específica da literatura está sendo investigada? |
| Relevância tecnológica | Como os resultados podem orientar decisões arquiteturais? |

O documento afirma que os estudos existentes não determinam antecipadamente os efeitos dessa decomposição em uma suíte k6. Essa afirmação é razoável, mas ainda não estabelece claramente uma lacuna científica.

## Pontos de confusão

Não ficou totalmente claro se a pesquisa pretende:

- Demonstrar empiricamente um princípio conhecido de modularidade em outro contexto;
- Propor uma arquitetura original para testes de carga;
- Estabelecer uma metodologia de comparação entre arquiteturas de testes;
- Ou combinar essas três contribuições.

As três possibilidades são academicamente válidas, mas o documento precisa deixar explícito qual delas constitui sua contribuição principal.

## Perguntas de banca

- Considerando que os benefícios da reutilização de código já são conhecidos, o que essa pesquisa acrescenta?
- Por que é necessário estudar modularidade especificamente em suítes de testes de carga?
- Quem poderá utilizar os resultados desse trabalho e em quais situações?

**Avaliação:** a justificativa apresenta argumentos corretos, mas precisa defender melhor a relevância específica da pesquisa.

---

# 5. Capítulo 3 — Objetivos

**Página:** 14. **Compreensão:** muito clara.

## O que entendi

O objetivo geral é comparar duas organizações de código de testes de carga durante atividades de evolução e manutenção. Os objetivos específicos procuram operacionalizar essa comparação por meio da arquitetura, implementação, validação e coleta de métricas.

## Análise crítica

Este é um dos capítulos mais bem estruturados do TCC. Os objetivos são mensuráveis e possuem correspondência com os resultados apresentados posteriormente.

| Objetivo específico | Atendimento no trabalho |
|---|---|
| Especificar a arquitetura modular | Atendido conceitualmente, mas poderia ser mais detalhado |
| Desenvolver suítes equivalentes | Atendido conforme as validações relatadas |
| Quantificar duplicação e tamanho | Atendido |
| Comparar alterações de contrato | Atendido |
| Registrar reutilização | Parcialmente demonstrado no texto |
| Interpretar resultados e limitações | Atendido |

## Pontos de confusão

Existe uma pequena redundância entre o objetivo de desenvolver e validar suítes funcionalmente equivalentes e o objetivo de verificar sua equivalência funcional.

Além disso, o objetivo relacionado à reutilização não recebe, no capítulo de resultados, o mesmo nível de detalhamento que os objetivos sobre duplicação e manutenção.

Há também uma diferença entre o objetivo que menciona “um agente de IA em condições de execução padronizadas” e as limitações metodológicas que posteriormente descrevem agentes, sobreposição temporal e lacunas nos registros.

Seria importante esclarecer se foi utilizado um mesmo modelo em diferentes sessões, um agente controlador com subagentes ou múltiplos agentes independentes.

**Avaliação:** não foram identificados problemas graves. Os objetivos estão bem alinhados com a pesquisa, embora a especificação arquitetural e a reutilização precisem ser mais bem demonstradas.

---

# 6. Capítulo 4 — Referencial teórico

**Páginas:** 15 a 21. **Compreensão:** boa.

O referencial teórico possui uma organização lógica e utiliza conceitos pertinentes. Entretanto, algumas seções apresentam mais fundamentação conceitual do que fundamentação específica da solução proposta.

## 4.1 — Testes de desempenho e testes de carga

**Entendimento:** completo.

O texto explica adequadamente a diferença entre teste de desempenho e teste de carga, além de esclarecer que a pesquisa avalia o código dos testes, não a escalabilidade da aplicação.

**Dúvida:** se os testes foram executados com apenas um usuário virtual e uma iteração, em que medida as implementações representam efetivamente suítes de testes de carga?

Compreende-se que essa configuração foi utilizada para verificar equivalência funcional. No entanto, seria interessante visualizar um perfil de carga real implementado nas duas arquiteturas, por exemplo, uma configuração de 50 usuários virtuais durante cinco minutos.

Não seria necessariamente preciso executar esse perfil como parte da comparação principal, mas demonstrar sua existência ajudaria a comprovar que os artefatos desenvolvidos possuem características de testes de carga, e não apenas de testes funcionais de API.

## 4.2 — k6 e testes de carga como código

**Entendimento:** completo.

As explicações sobre usuários virtuais, iterações, executores e checks são adequadas. É especialmente importante a distinção entre um cenário nativo do k6 e a camada Scenario da arquitetura proposta.

**O que faltou:** um exemplo pequeno de código k6. O leitor recebe várias definições, mas não consegue observar como elas aparecem em um script.

Exemplo ilustrativo, não necessariamente retirado do experimento:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s'
};

export default function () {
  const response = http.get('http://localhost:3000/products');

  check(response, {
    'status is 200': (r) => r.status === 200
  });
}
```

A partir disso, seria muito mais fácil explicar quais responsabilidades são separadas pela arquitetura modular. O trabalho é sobre organização de código, mas não apresenta ao leitor nenhum trecho concreto das implementações comparadas.

## 4.3 — Evolução, débito técnico e duplicação em código de teste

**Entendimento:** bom.

A relação entre duplicação, manutenção e evolução é apresentada de maneira equilibrada. É particularmente correta a afirmação de que duplicação de código não representa, necessariamente, débito técnico.

A seção introduz o conceito de *test smells*, mas ele não é utilizado diretamente na avaliação experimental. O próprio texto reconhece essa limitação.

Não é necessário remover completamente o assunto, mas seria interessante reduzir sua extensão e aprofundar:

- Tipos de duplicação de código;
- Clones de software;
- Técnicas de detecção de duplicação;
- Limitações de detectores lexicais.

Esses conceitos possuem relação mais direta com uma das principais métricas do trabalho.

## 4.4 — Modularidade, coesão e acoplamento

**Entendimento:** bom.

Esta seção apresenta os fundamentos clássicos da modularidade, incluindo a separação de responsabilidades e a concentração de decisões suscetíveis a mudanças. A utilização de Parnas é pertinente.

**Ponto de confusão:** os conceitos de coesão e acoplamento são apresentados, mas não são medidos. Isso não constitui um erro, pois o documento reconhece essa delimitação. Entretanto, seria interessante demonstrar como esses conceitos influenciaram a construção das quatro camadas.

Quais dependências são permitidas?

- Um Use Case pode chamar outro Use Case?
- Um Flow pode chamar outro Flow?
- Um Scenario pode acessar diretamente um Use Case?
- Um Profile conhece os detalhes internos de uma jornada?

Sem essas regras, é possível compreender a divisão de responsabilidades, mas não identificar completamente os limites arquiteturais da solução.

## 4.5 — Organizações de testes de carga comparadas

**Avaliação:** necessita aprofundamento.

Esta é uma das seções mais importantes do referencial teórico, porque apresenta diretamente o objeto de comparação.

### O que entendi das quatro camadas

Exemplo conceitual de uma jornada de criação de pedido:

| Camada | Responsabilidade ilustrativa |
|---|---|
| Profile | Define quantos usuários executam o teste e durante quanto tempo. |
| Scenario | Estabelece a entrada da jornada de criação de pedido. |
| Flow | Coordena autenticação → consulta de produto → criação de pedido. |
| Use Case | Encapsula cada operação: autenticar, consultar produto, criar pedido. |

*Representação ilustrativa baseada na descrição do TCC, não verificada contra o código-fonte.*

### Pontos de confusão

A relação entre Profile, Scenario e Flow não está completamente clara.

Se o Scenario define qual jornada executar e o Flow organiza toda a sequência dessa jornada, o que exatamente o Scenario faz além de chamar o Flow?

O Profile chama o Scenario? Ou é o Scenario que importa as configurações do Profile?

Essa dúvida é importante porque as figuras apresentam uma sequência linear, mas não especificam se as setas representam fluxo de execução, configuração ou dependência de código.

Também não ficou claro se os Profiles são reutilizados por diferentes Scenarios e se os Flows são reutilizados por diferentes jornadas.

### Recomendação

Apresentar um exemplo da mesma jornada nas duas arquiteturas, incluindo estrutura de diretórios, trechos reais de código, relações de dependência, componentes compartilhados e caminho de execução de uma requisição. Isso provavelmente resolveria boa parte das dúvidas arquiteturais do leitor.

## 4.6 — Significado dos indicadores utilizados

**Entendimento:** muito bom.

O documento diferencia corretamente o que cada indicador representa.

| Indicador | Interpretação |
|---|---|
| Arquivos | Tamanho da estrutura |
| SLOC | Volume de código-fonte |
| Duplicação lexical | Repetição de sequências de código |
| Arquivos alterados | Dispersão das modificações |
| Churn | Volume das alterações entre versões |
| Reutilização | Aproveitamento de componentes |
| Equivalência funcional | Comparabilidade das jornadas |

A preocupação em não confundir essas métricas com produtividade humana ou manutenibilidade global é cientificamente correta. Contudo, essas mesmas ressalvas são repetidas em vários capítulos. Recomenda-se reduzir as repetições e concentrar parte das explicações nesta seção.

## 4.7 — Agentes de IA como executores

**Avaliação:** necessita aprofundamento.

### O que entendi

Os agentes de IA foram utilizados para implementar e modificar as suítes, enquanto a avaliação foi realizada com base no código, nos registros Git e nos validadores. Ou seja, as conclusões não dependem exclusivamente da opinião emitida pela IA. Isso é uma boa decisão.

### Pontos de confusão

Não foi possível compreender plenamente a motivação científica para substituir os desenvolvedores humanos pelos agentes. O texto apresenta referências sobre agentes de engenharia de software, mas não explica suficientemente o motivo da escolha no experimento.

Gostaria de entender se a intenção foi:

- Padronizar a execução das tarefas;
- Reduzir a influência do conhecimento prévio dos pesquisadores;
- Evitar favorecer uma arquitetura por familiaridade;
- Investigar o desenvolvimento assistido por IA;
- Reduzir a necessidade de participantes humanos.

Esses motivos são diferentes e precisam ser explicitados. A IA também introduz uma variável própria: diferentes sessões podem tomar decisões diferentes de implementação, mesmo recebendo instruções semelhantes.

**Avaliação geral do capítulo 4:** a fundamentação é consistente, mas falta uma ligação mais concreta entre os conceitos teóricos e a arquitetura efetivamente implementada.

---
# 7. Capítulo 5 — Metodologia

**Páginas:** 22 a 31. **Avaliação:** capítulo prioritário para revisão.

Este é o capítulo que mais recebeu questionamentos durante a leitura. A metodologia possui uma boa estrutura geral, mas vários procedimentos são mencionados sem que o leitor consiga reconstruir completamente como foram realizados.

Em um trabalho experimental, não basta apresentar os resultados. É necessário demonstrar como esses resultados foram obtidos e oferecer condições para que outro pesquisador possa verificá-los.

## 5.1 — Caracterização e delineamento da pesquisa

### O que entendi

O experimento possui duas condições: implementação tradicional baseada em scripts independentes e implementação modular baseada em quatro camadas. As duas condições são submetidas às mesmas tarefas de evolução e manutenção.

**Fase 1 — Evolução cumulativa:**

`E0 (5 cenários) → E1 (7) → E2 (10) → E3 (12) → E4 (15)`

**Fase 2 — Manutenções independentes:**

| Estado inicial | Tarefa independente |
|---|---|
| E4 validado | M1 — expiresIn |
| E4 validado | M2 — currency |
| E4 validado | M3 — createdAt |

Cada manutenção parte individualmente de E4, sem acumular as alterações anteriores. Essa separação é uma boa decisão metodológica, pois evita que uma manutenção anterior interfira diretamente na próxima.

### O que faltou

Uma apresentação formal das variáveis experimentais:

| Tipo | Variável |
|---|---|
| Independente | Organização arquitetural |
| Dependentes | Duplicação, SLOC, arquivos, churn e reutilização |
| Controle | API, linguagem, requisitos, ferramenta e critérios funcionais |
| Intervenientes | Comportamento dos agentes, contexto e condições de execução |

Também seria interessante apresentar explicitamente as hipóteses de pesquisa antes dos resultados. Por exemplo, a hipótese de que a arquitetura modular reduz a dispersão de alterações em contratos compartilhados, mas aumenta o volume estrutural da implementação.

## 5.2 — Sistema-alvo e ambiente de execução

### O que entendi

Foi utilizada uma API REST local, implementada em Node.js, relacionada a um sistema de gerenciamento de pedidos, com autenticação, produtos, carrinho e pagamentos simulados. A API possui estado reinicializável, permitindo controlar as condições dos testes.

### Pontos de confusão

A API é descrita principalmente por seus endpoints, mas não pelo funcionamento do sistema. Não foi possível determinar completamente:

- Quais são as entidades e regras de negócio;
- Como os dados são armazenados;
- Como o estado é reinicializado;
- Como funciona a autenticação;
- Se existem dependências externas;
- Qual é a complexidade real das jornadas.

A Figura 1, na página 23, explica a relação entre as suítes, o k6 e a API, mas não detalha o domínio do sistema-alvo.

Também há uma diferença entre o ambiente histórico e o ambiente de auditoria: Windows e Linux/WSL, além de versões diferentes do Node.js e do k6. O texto reconhece essa diferença, o que é positivo. Entretanto, seria interessante demonstrar quais consequências essas diferenças poderiam ter para os indicadores utilizados.

Uma alteração de ambiente provavelmente tem menos impacto sobre métricas estáticas de código do que sobre métricas de execução, mas essa distinção deveria ser explicitada.

## 5.3 — Cenários e estados de evolução

**Avaliação:** informações insuficientes.

### O que entendi

A suíte começa com cinco cenários e cresce progressivamente até quinze.

| Etapa | Funcionalidades adicionadas | Total |
|---|---|---:|
| E0 | Autenticação, produtos e pedidos | 5 |
| E1 | Catálogo e estoque | 7 |
| E2 | Carrinho | 10 |
| E3 | Operações de pedidos | 12 |
| E4 | Pagamentos e compra completa | 15 |

### Pontos de confusão

Quais são exatamente os quinze cenários? Os cinco iniciais são descritos individualmente, mas os dez adicionais aparecem agrupados por domínio.

O documento afirma que existe uma matriz de requisitos, porém não apresenta essa matriz integralmente. Essa ausência impede avaliar a complexidade da evolução.

Por exemplo, adicionar um cenário de consulta de estoque pode exigir uma única requisição adicional, enquanto um checkout completo pode exigir várias operações encadeadas. Contar apenas cenários não demonstra que as etapas possuem dificuldade semelhante.

### Recomendação

Adicionar uma tabela completa de CT-01 a CT-15, contendo:

| Campo | Finalidade |
|---|---|
| Identificador | Identificar o cenário |
| Descrição | Apresentar seu objetivo |
| Etapa | Identificar quando foi introduzido |
| Operações HTTP | Demonstrar a composição da jornada |
| Checks esperados | Demonstrar o esforço de validação |
| Dependências | Identificar encadeamentos de dados |

Isso permitiria ao leitor compreender não somente que a suíte cresceu, mas **como sua complexidade evoluiu**.

## 5.4 — Implementações comparadas

**Avaliação:** problema arquitetural importante.

Esta é uma das seções que mais precisam de aprofundamento.

### O que entendi

A implementação tradicional mantém suas jornadas em scripts independentes, enquanto a modular distribui responsabilidades entre quatro camadas e componentes auxiliares.

O documento apresenta duas figuras conceituais, nas páginas 24 e 25, e informa que a implementação inicial possuía cinco arquivos tradicionais e 24 arquivos modulares.

### Primeira dúvida: a comparação é justa?

O texto afirma:

> O protocolo não vedou recursos de reutilização compatíveis com essa organização, de modo a não impor duplicação artificial em favor da condição modular.

Essa afirmação é importante, mas deixa uma dúvida metodológica. Se a implementação tradicional podia criar funções compartilhadas, por que permaneceu com scripts independentes e sem imports internos?

- O agente foi instruído a não criar módulos?
- Ele poderia criar um arquivo de autenticação compartilhado?
- Se criasse esse arquivo, a implementação deixaria de ser considerada tradicional?
- Qual era o limite permitido de modularização?

Essas questões não significam que a comparação seja injusta. Significam que as regras que garantem sua justiça precisam ser apresentadas com maior precisão.

Uma banca pode argumentar que comparar código sem reutilização com código reutilizável naturalmente resultará em vantagens para a segunda abordagem. O trabalho precisa demonstrar que não favoreceu artificialmente a solução proposta.

### Segunda dúvida: por que existem tantos arquivos?

A arquitetura começa com 24 arquivos para cinco cenários e termina com 57 arquivos para quinze cenários. Seria interessante entender a distribuição desses arquivos: quantos pertencem a Profiles, Scenarios, Flows, Use Cases e Helpers?

Sem esse inventário, não é possível identificar onde está o principal custo estrutural da modularização.

### Terceira dúvida: qual é o diferencial das quatro camadas?

Os resultados de manutenção parecem estar fortemente relacionados à centralização de requisições e checks na camada Use Case.

**Seria possível obter resultados semelhantes utilizando apenas scripts independentes e funções HTTP compartilhadas, sem implementar todas as quatro camadas?**

Essa é uma das perguntas mais importantes para a defesa. O trabalho consegue comparar as duas implementações selecionadas, mas não consegue isolar quanto do benefício é causado pela arquitetura completa e quanto é causado simplesmente pela reutilização de operações compartilhadas.

Isso não invalida o estudo. Apenas delimita a conclusão que pode ser extraída dele.

## 5.5 — Controle de equivalência funcional

**Avaliação:** boa decisão metodológica.

### O que entendi

Para garantir que uma implementação não pareça melhor simplesmente por executar menos operações, foram comparados os seguintes aspectos:

- Métodos e rotas HTTP;
- Parâmetros, payloads e headers;
- Códigos e campos de resposta;
- Quantidade, ordem e resultado dos checks;
- Encadeamento dos identificadores retornados;
- Condições de execução e isolamento da API.

Esse controle é um dos pontos fortes do experimento.

### Pontos de confusão

O documento menciona validadores e oráculos de teste, mas não explica suficientemente como eles funcionam.

Como foi detectado que uma requisição realizada pela implementação tradicional era equivalente à requisição realizada pela implementação modular?

Os dados foram capturados pela própria API? Foi utilizado um proxy HTTP? Foram comparados logs de requisições? Os validadores inspecionavam também os efeitos sobre o estado da aplicação?

Também seria interessante ver um exemplo do relatório de validação de um cenário. O texto descreve adequadamente **o que foi validado**, mas não demonstra com a mesma profundidade **como foi validado**.

## 5.6 — Indicadores e instrumentos de coleta

**Avaliação:** problema de reprodutibilidade.

Os indicadores selecionados são pertinentes, mas faltam informações técnicas sobre sua coleta.

### Duplicação lexical

O trabalho utiliza clones de Tipo 1 com limiar mínimo de 25 tokens. Entretanto, não foi possível identificar no texto:

- O nome e a versão do detector utilizado;
- O motivo da escolha de 25 tokens;
- As regras exatas de normalização;
- A fórmula do percentual de duplicação;
- O tratamento de clones sobrepostos;
- Se imports e configurações repetidas foram considerados.

Essas informações são particularmente importantes porque a duplicação lexical constitui um dos principais resultados da pesquisa. O leitor precisa ter condições de entender e reproduzir percentuais como 90,36% e 32,36%.

### SLOC

O documento informa que foram contabilizadas linhas de código-fonte, mas não detalha completamente as regras de contagem do coletor.

Comentários, linhas em branco, chaves isoladas e instruções distribuídas em várias linhas foram considerados? Como o código JavaScript pode ser formatado de diferentes maneiras, a definição operacional da métrica precisa ser explícita.

### Churn

Esta métrica é bem explicada.

**Churn = Adições + Remoções**

Por exemplo, se uma alteração adiciona dez linhas e remove quatro, seu churn é de 14 linhas, independentemente de o arquivo ter crescido apenas seis linhas. O texto diferencia adequadamente o churn final do esforço real de implementação.

### Reutilização

Esta é a métrica menos clara. O documento distingue reutilização sem edição, adaptação de componentes e criação de novos componentes compartilhados.

Porém, posteriormente, apresenta apenas de maneira resumida as 18 ocorrências de reutilização sem edição. Não foi possível identificar quais componentes foram reutilizados, em quais etapas ou por quais cenários.

Seria importante apresentar uma tabela por etapa, relacionando os componentes e seus consumidores.

## 5.7 — Procedimento experimental e controle de variáveis

**Avaliação:** principal fragilidade metodológica.

A Figura 4, na página 28, apresenta uma sequência compreensível: congelamento dos requisitos, preparação da API, implementação das duas condições, validação, coleta das métricas e aceitação do estado.

A ordem alternada das expansões também é informada:

| Etapa | Ordem |
|---|---|
| E1 | Tradicional → Modular |
| E2 | Modular → Tradicional |
| E3 | Tradicional → Modular |
| E4 | Modular → Tradicional |

No entanto, a figura e o texto não detalham suficientemente a execução pelos agentes.

### Informações que não foram encontradas claramente

| Informação | Por que é importante? |
|---|---|
| Modelo de IA e versão | Identificar o executor utilizado |
| Configurações dos agentes | Avaliar a padronização |
| Prompts e instruções | Identificar possíveis vieses |
| Contexto inicial de cada sessão | Avaliar influência de tarefas anteriores |
| Ferramentas disponíveis | Verificar igualdade das condições |
| Intervenções humanas | Identificar interferências |
| Critérios de encerramento | Determinar quando uma tarefa foi considerada concluída |
| Tratamento de falhas | Entender como foram realizadas novas tentativas |

O texto informa que existiram lacunas nas transcrições e que as sessões não foram reexecutadas retrospectivamente. Isso é tratado com transparência, o que é positivo. Contudo, a auditoria dos estados finais não substitui o controle do processo que produziu esses estados.

### Por que isso importa?

Imagine que um agente tenha recebido instruções mais detalhadas para implementar a arquitetura modular do que para implementar a tradicional. Nesse caso, parte das diferenças encontradas poderia decorrer das instruções e não exclusivamente da arquitetura.

Não se afirma que isso aconteceu. Trata-se de uma possibilidade que o texto, isoladamente, não permite descartar.

## 5.8 — Organização e análise dos dados

**Entendimento:** bom.

Os procedimentos de análise descritiva estão adequados. O documento distingue corretamente diferenças em pontos percentuais de reduções relativas.

Também é acertado não tratar arquivos, requisições ou checks como réplicas independentes do experimento.

A ausência de testes estatísticos não é necessariamente uma falha para uma comparação descritiva de duas implementações em um sistema controlado. O problema surgiria se o trabalho pretendesse generalizar estatisticamente os resultados, algo que o documento explicitamente evita.

## 5.9 — Ameaças à validade e reprodutibilidade

**Entendimento:** muito bom.

Esta seção demonstra maturidade científica ao reconhecer:

- Variabilidade dos agentes;
- Limitações dos registros;
- Diferenças ambientais;
- Ausência de replicações independentes;
- Limitações das métricas;
- Restrições de generalização.

### Ressalva

A Tabela 3 apresenta o isolamento dos workspaces como medida contra contaminação entre arquiteturas. Porém, não fica suficientemente demonstrado como esse isolamento foi garantido, especialmente considerando as limitações dos registros históricos.

Recomenda-se distinguir os controles planejados, os controles efetivamente aplicados e aqueles cuja execução pôde ser confirmada pela auditoria.

## 5.10 — Rastreabilidade Git e auditoria técnica

**Entendimento:** parcial.

É possível entender que os estados preservados no Git foram recuperados separadamente e que as métricas e validações funcionais foram novamente verificadas.

A conferência de 446 valores numéricos ou booleanos, sem divergências nas medições reproduzidas, é uma evidência interessante de consistência dos resultados.

### Pontos de confusão

A auditoria técnica aparece diversas vezes no documento, mas não está suficientemente materializada para o leitor.

Não foi encontrada uma tabela dos commits correspondentes a E0–E4 e M1–M3, nem a localização dos relatórios e instrumentos utilizados. Também não ficou claro quem conduziu a auditoria, quais scripts foram executados e como os 446 valores foram selecionados.

Não é necessário incluir centenas de registros no corpo do trabalho. Um apêndice ou repositório versionado, com instruções de reprodução e referência formal, seria suficiente para melhorar muito a rastreabilidade.

**Avaliação geral da metodologia:** o delineamento é coerente, mas existem lacunas importantes de documentação. É possível entender o que foi feito em termos gerais, porém não seria possível reproduzir integralmente o experimento apenas com as informações do TCC.

---

# 8. Capítulo 6 — Resultados e discussão

**Páginas:** 32 a 35. **Avaliação:** resultados claros, discussão insuficiente.

Este capítulo apresenta resultados interessantes, mas eles poderiam ser explorados com muito mais profundidade. O documento apresenta os números e interpreta suas implicações mais imediatas. Entretanto, ainda não investiga suficientemente os motivos pelos quais esses resultados foram encontrados.

## 6.1 — Etapas comparadas

### O que entendi

As duas suítes cresceram de cinco para quinze cenários, mantendo equivalência funcional conforme os critérios definidos.

| Indicador por suíte | E0 | E4 |
|---|---:|---:|
| Cenários | 5 | 15 |
| Requisições | 14 | 66 |
| Checks | 30 | 134 |

Esses números demonstram que houve ampliação do conteúdo funcional das suítes. Porém, como a matriz completa de cenários não foi apresentada na metodologia, ainda não é possível compreender quais funcionalidades são responsáveis pelos maiores aumentos de complexidade.

## 6.2 — Crescimento estrutural e duplicação

### Evolução da duplicação lexical

| Etapa | Tradicional | Modular | Diferença |
|---|---:|---:|---:|
| E0 | 90,36% | 7,94% | 82,42 p.p. |
| E1 | 73,77% | 5,52% | 68,25 p.p. |
| E2 | 75,37% | 22,84% | 52,53 p.p. |
| E3 | 74,52% | 24,99% | 49,53 p.p. |
| E4 | 73,35% | 32,36% | 40,99 p.p. |

*Dados da Tabela 4, página 32.*

O documento enfatiza que a arquitetura modular apresenta menos duplicação em todas as etapas, o que está correto. Contudo, existe outro fenômeno interessante que merece investigação: **a duplicação da arquitetura modular aumenta consideravelmente durante a evolução**.

A diferença entre as arquiteturas diminui ao longo de todas as etapas.

### Pontos de confusão

Por que a arquitetura modular começou com 7,94% de duplicação e terminou com 32,36%? O documento reconhece esse crescimento, mas não explica satisfatoriamente suas causas.

Foram criados Profiles semelhantes? Os agentes repetiram a estrutura dos Scenarios? Os Use Cases possuem validações semelhantes? Existem Flows que poderiam ter sido reutilizados?

Seria necessário examinar os clones detectados e identificar em quais camadas eles estão concentrados.

Também chama atenção o percentual de 90,36% de duplicação inicial da implementação tradicional. É um percentual bastante elevado e merece uma explicação concreta, acompanhada de exemplos de trechos duplicados.

Outra questão é que percentuais de duplicação dependem do volume total de tokens. Como a arquitetura modular possui mais código, seria útil apresentar também a quantidade absoluta de tokens totais e duplicados. Um percentual menor não demonstra, sozinho, uma quantidade absoluta proporcionalmente menor de código duplicado.

Não se afirma que esses resultados estejam incorretos, mas a discussão precisa explicar melhor o comportamento observado.

### Evolução das linhas de código

| Etapa | SLOC tradicional | SLOC modular |
|---|---:|---:|
| E0 | 76 | 286 |
| E1 | 140 | 421 |
| E2 | 341 | 752 |
| E3 | 434 | 953 |
| E4 | 733 | 1.377 |

A arquitetura modular apresenta maior quantidade de código em todas as etapas. Porém, existe um resultado que não recebeu destaque suficiente:

| Indicador | E0 | E4 |
|---|---:|---:|
| SLOC tradicional | 76 | 733 |
| SLOC modular | 286 | 1.377 |
| Proporção modular/tradicional | 3,76 vezes | 1,88 vez |

Embora a diferença absoluta de linhas tenha aumentado, o custo estrutural **relativo** da arquitetura modular diminuiu. Inicialmente, ela possuía aproximadamente 3,76 vezes o volume de código da tradicional. Ao final, essa proporção caiu para 1,88 vez.

Isso é interessante porque pode indicar uma diluição relativa do custo da estrutura modular conforme o escopo cresce. Não demonstra que a modular se tornará menor em etapas futuras, mas constitui um comportamento observado que merece discussão.

### Evolução da quantidade de arquivos

| Etapa | Arquivos tradicionais | Arquivos modulares |
|---|---:|---:|
| E0 | 5 | 24 |
| E1 | 7 | 29 |
| E2 | 10 | 41 |
| E3 | 12 | 48 |
| E4 | 15 | 57 |

Novamente, falta uma análise por camada. Se o objetivo é avaliar uma arquitetura modular em quatro camadas, seria interessante identificar quais delas mais contribuem para o aumento estrutural.

### Churn durante a evolução

| Arquitetura | Churn final agregado E1–E4 |
|---|---:|
| Tradicional | 699 linhas |
| Modular | 1.307 linhas |

A abordagem modular apresentou aproximadamente 87% mais churn durante as atividades de expansão. Este resultado é relevante e precisa ser valorizado na discussão, pois mostra que a modularização não apresenta vantagens em todas as dimensões.

Seria interessante saber se esse churn está associado principalmente à criação de novos componentes, à adaptação de componentes existentes ou à necessidade de modificar vários pontos da estrutura. O total agregado não permite distinguir essas possibilidades.

## 6.3 — Manutenção de contratos

**Avaliação:** resultado mais convincente do trabalho.

Esta seção apresenta a evidência mais direta dos benefícios da centralização de operações.

| Manutenção | Mudança | Arquivos T/M | Churn T/M |
|---|---|---:|---:|
| M1 | Autenticação — expiresIn | 15 / 1 | 30 / 2 |
| M2 | Criação de pedidos — currency | 8 / 1 | 37 / 15 |
| M3 | Consulta de pedidos — createdAt | 7 / 1 | 24 / 15 |
| **Total** | | **30 / 3** | **91 / 32** |

- **Redução de arquivos alterados:** 90% (30 → 3 ocorrências).
- **Redução do churn final:** 64,8% (91 → 32 linhas).

O resultado demonstra que as alterações ficaram concentradas em menos arquivos na arquitetura modular.

### Análise crítica

Existe, entretanto, uma limitação importante na seleção das manutenções. As três mudanças estão associadas a contratos de operações HTTP compartilháveis. Todas beneficiam diretamente a centralização implementada na camada Use Case.

Mas o que aconteceria se a manutenção exigisse modificar:

- A ordem de execução de uma jornada;
- A configuração de carga;
- Uma regra de negócio específica de um único cenário;
- A composição de vários Flows;
- Uma dependência compartilhada entre camadas?

Essas tarefas poderiam produzir resultados diferentes. Portanto, os resultados sustentam que a modularização beneficia as mudanças de contrato examinadas, mas não representam todos os tipos possíveis de manutenção.

### Recomendação

Adicionar um exemplo real de código antes e depois de M1, mostrando a alteração tradicional e a alteração modular. Isso permitiria ao leitor observar diretamente o mecanismo responsável pela redução de quinze arquivos para apenas um.

## 6.4 — Validação funcional e leitura conjunta dos resultados

**Entendimento:** bom.

| Indicador acumulado | Total |
|---|---:|
| Execuções de cenários | 188 |
| Requisições HTTP | 748 |
| Checks aprovados | 1.528 |

É positivo que o trabalho esclareça que esses números são agregados de diferentes estados e não representam 188 repetições independentes do experimento. Entretanto, uma tabela de validação por etapa e arquitetura tornaria os resultados mais transparentes.

### Um resultado interessante pouco explorado

O documento relata que, na manutenção M2 modular, o agente apresentou uma atividade de navegação excepcionalmente elevada, apesar de modificar apenas um arquivo.

Isso é bastante relevante. A arquitetura pode concentrar mudanças em um único componente, mas o desenvolvedor ou agente ainda precisa localizar esse componente, entender suas dependências e identificar possíveis efeitos colaterais.

**Menor dispersão de alterações não significa necessariamente menor dificuldade de manutenção.**

Esse episódio poderia receber uma discussão qualitativa mais detalhada, deixando claro que os registros disponíveis não permitem estabelecer sua causa com segurança.

## 6.5 — Limitações e interpretação dos achados

Esta seção é cientificamente adequada. O documento evita concluir que:

- A arquitetura modular é universalmente superior;
- O desempenho da API foi melhorado;
- A produtividade humana aumentou;
- Os resultados possuem generalização estatística.

Essa cautela deve ser preservada. Porém, parte dessas limitações já foi discutida no referencial teórico, na metodologia e nas seções anteriores. A repetição excessiva acaba ocupando espaço que poderia ser utilizado para discutir os resultados propriamente ditos.

## 6.6 — Resposta à pergunta de pesquisa

A pergunta de pesquisa é respondida adequadamente dentro das limitações apresentadas.

| Dimensão | Melhor resultado no contexto avaliado |
|---|---|
| Menor duplicação lexical | Modular |
| Menor quantidade de arquivos | Tradicional |
| Menor volume de código | Tradicional |
| Menor churn na expansão | Tradicional |
| Menor dispersão das manutenções | Modular |
| Menor churn na manutenção | Modular |
| Equivalência funcional observada | Ambas |

O fato de a arquitetura modular não vencer em todas as métricas torna a pesquisa mais interessante, pois permite discutir os custos e benefícios das decisões arquiteturais.

**Avaliação geral do capítulo 6:** os resultados são coerentes com os objetivos, mas o capítulo está mais próximo de uma apresentação descritiva de métricas do que de uma discussão aprofundada dos fenômenos observados. Recomenda-se adicionar gráficos, exemplos de código e explicações sobre as causas das diferenças.

---

# 9. Capítulo 7 — Conclusões e trabalhos futuros

**Páginas:** 36 e 37. **Compreensão:** boa.

## O que entendi

A arquitetura modular apresentou menor duplicação lexical e maior concentração das mudanças de contrato, mas introduziu maior volume de código, arquivos e alterações durante a expansão. A pesquisa não sustenta superioridade absoluta da modularização.

## Análise crítica

A conclusão é coerente com os resultados e não apresenta afirmações que extrapolam claramente o experimento. Entretanto, falta uma orientação prática derivada dos resultados.

Depois de ler todo o trabalho, seria interessante entender em quais circunstâncias um engenheiro deveria considerar a adoção da arquitetura proposta.

| Contexto | Implicação sugerida pelos resultados |
|---|---|
| Suíte pequena e pouco reutilizada | A estrutura tradicional pode apresentar menor custo estrutural |
| Operações compartilhadas entre muitas jornadas | A modularização pode reduzir repetição |
| Contratos de API frequentemente alterados | A centralização pode reduzir a dispersão das mudanças |
| Expansão frequente de cenários | É necessário ponderar o custo adicional dos componentes |
| Equipes grandes | São necessárias avaliações adicionais sobre navegação e compreensão |

Essas são implicações condicionais, não regras universais comprovadas pelo estudo.

## Trabalhos futuros

As propostas existentes são adequadas. Acrescentaria especialmente uma comparação com uma terceira implementação, baseada em scripts independentes e funções compartilhadas, mas sem as quatro camadas completas.

| Condição | Organização |
|---|---|
| A — Tradicional | Scripts independentes |
| B — Intermediária | Scripts com funções compartilhadas, sem quatro camadas |
| C — Modular | Profile, Scenario, Flow e Use Case |

Essa comparação permitiria investigar se as quatro camadas produzem benefícios adicionais em relação à simples reutilização de funções.

Não é necessário realizar esse novo experimento para concluir o TCC atual, desde que as conclusões permaneçam restritas às duas implementações avaliadas.

---

# 10. Análise das referências bibliográficas

As referências possuem uma composição temática adequada ao trabalho. O documento combina fundamentos clássicos e trabalhos mais recentes sobre modularidade, débito técnico, testes de desempenho, evolução de código de teste e agentes de IA.

| Referência | Relevância para o trabalho |
|---|---|
| Parnas (1972) | Decomposição e modularidade |
| Cunningham (1992) | Débito técnico |
| Kude et al. (2023) | Modularidade arquitetural |
| Di Meglio et al. (2025) | Evolução e manutenção de testes de performance |
| Martins et al. (2020) | Testes de performance web |
| Jimenez et al. (2024) | Agentes aplicados à engenharia de software |
| Yang et al. (2024) | Interação dos agentes com ferramentas |

## O que acrescentaria

Faltam referências mais específicas sobre detecção de clones de código, classificação de clones e métricas de duplicação. Como a duplicação lexical é um dos pilares da pesquisa, é importante fundamentar cientificamente o método utilizado para medi-la.

Também incluiria uma referência metodológica sobre experimentação em engenharia de software, especialmente para fundamentar o delineamento, as variáveis, as ameaças à validade e a análise descritiva.

Outro ponto é que o **Relatório Experimental Completo (2026)** aparece como fonte das tabelas de resultados, mas não está identificado na lista final de referências. Recomenda-se referenciá-lo formalmente e disponibilizá-lo juntamente com as evidências experimentais.

A avaliação considera a pertinência das referências apresentadas no documento. Não foi realizada uma verificação externa individual dos artigos, DOIs e das afirmações atribuídas a cada fonte.

---

# 11. Registro consolidado de pontos de confusão

Checklist de revisão do TCC, com 21 pontos organizados por prioridade.

## Prioridade alta

- [ ] **Introdução:** qual é a origem e a contribuição original da arquitetura proposta?
- [ ] **Justificativa:** qual lacuna científica específica o trabalho procura preencher?
- [ ] **4.5 / 5.4:** por que foram escolhidas exatamente quatro camadas?
- [ ] **4.5 / 5.4:** quais são as dependências permitidas entre as camadas?
- [ ] **5.4:** qual é a diferença prática entre Scenario e Flow?
- [ ] **5.4:** por que a abordagem tradicional não utilizou funções compartilhadas?
- [ ] **4.7 / 5.7:** qual foi a motivação para utilizar agentes de IA?
- [ ] **5.7:** quais modelos, prompts, configurações e condições foram utilizados?
- [ ] **5.3:** quais são exatamente os quinze cenários implementados?
- [ ] **5.5:** como o validador funcional funciona internamente?
- [ ] **5.6:** qual detector de duplicação foi utilizado e por que o limite de 25 tokens?
- [ ] **5.10:** onde estão os commits, relatórios e evidências da auditoria?
- [ ] **6.2:** por que a duplicação modular cresceu de 7,94% para 32,36%?
- [ ] **6.3:** os benefícios resultam das quatro camadas ou apenas da centralização de operações?

## Prioridade média

- [ ] **5.2:** qual é a estrutura interna e a complexidade do sistema-alvo?
- [ ] **5.4:** como os 57 arquivos modulares estão distribuídos entre as camadas?
- [ ] **5.6:** quais são as regras exatas para contagem de SLOC e reutilização?
- [ ] **6.2:** quais componentes foram reutilizados nas dezoito ocorrências?
- [ ] **6.4:** o que pode explicar a navegação excepcional do agente em M2?
- [ ] **6.3:** o comportamento seria diferente para manutenções em Profiles, Flows e Scenarios?
- [ ] **7:** em quais situações práticas vale considerar a adoção da arquitetura proposta?

---

# 12. Perguntas que poderiam surgir na banca

1. **Por que desenvolver uma arquitetura com quatro camadas quando o JavaScript já permite reutilizar funções?** Avalia a contribuição original e a necessidade das abstrações propostas.
2. **Como vocês garantiram que a implementação tradicional não foi artificialmente prejudicada?** Avalia a justiça da comparação e as restrições impostas a cada condição.
3. **Por que utilizar agentes de IA em vez de desenvolvedores humanos?** Avalia a fundamentação da decisão metodológica.
4. **Como vocês controlaram a variabilidade dos agentes?** Avalia a validade interna do experimento.
5. **Por que a duplicação lexical da arquitetura modular aumentou durante a evolução?** Avalia a capacidade de interpretar resultados desfavoráveis à proposta.
6. **Se a arquitetura modular possui mais arquivos e linhas de código, por que ela seria vantajosa?** Avalia a compreensão dos custos e benefícios arquiteturais.
7. **Como vocês garantiram a equivalência funcional entre as duas suítes?** Avalia o mecanismo de validação experimental.
8. **Por que realizar somente uma iteração com um usuário virtual em um trabalho sobre testes de carga?** Avalia a delimitação do objeto de pesquisa.
9. **Por que foram selecionadas apenas mudanças de contrato nas manutenções?** Avalia a representatividade das tarefas escolhidas.
10. **Qual é a principal contribuição científica deste trabalho, considerando que os benefícios da modularidade já são conhecidos?** Avalia a relevância e a originalidade da pesquisa.

Responder bem a essas perguntas e apresentar as evidências correspondentes ajudará na preparação para a defesa.

---

# 13. Recomendação de revisão

Não é necessário reescrever todo o TCC. Recomenda-se concentrar os esforços nos seguintes pontos:

| Prioridade | Alteração | Impacto |
|---:|---|---|
| 1 | Apresentar as implementações reais com exemplos de código | Muito alto |
| 2 | Detalhar o protocolo de execução dos agentes de IA | Muito alto |
| 3 | Especificar as regras das duas arquiteturas comparadas | Muito alto |
| 4 | Adicionar a matriz completa dos quinze cenários | Alto |
| 5 | Detalhar os instrumentos de coleta e validação | Alto |
| 6 | Disponibilizar commits, prompts e evidências experimentais | Alto |
| 7 | Aprofundar a discussão dos resultados | Alto |
| 8 | Apresentar gráficos de evolução e manutenção | Alto |
| 9 | Fortalecer a justificativa científica | Médio |
| 10 | Reduzir repetições sobre limitações | Médio |

---

# Parecer final

**Foi possível entender o que o TCC pretende investigar, como o experimento foi estruturado em termos gerais e quais resultados foram obtidos.**

Não há confusão quanto ao propósito central do trabalho. As principais dúvidas surgiram ao tentar entender a implementação concreta da arquitetura, as condições de execução experimental e os mecanismos responsáveis pelos resultados.

A maior crítica é que o documento é um TCC sobre arquitetura de código, mas praticamente não mostra código.

É um trabalho sobre modularidade, mas não apresenta suficientemente as dependências entre seus módulos.

É uma pesquisa experimental, mas parte dos instrumentos, requisitos e procedimentos necessários para sua reprodução não está apresentada no próprio documento.

Por outro lado, são pontos fortes a equivalência funcional relatada, o crescimento incremental, a separação das manutenções, as métricas objetivas e a transparência ao reconhecer resultados desfavoráveis à arquitetura proposta.

A análise foi realizada sobre o documento enviado, sem acesso ao repositório experimental, ao código-fonte das suítes, às transcrições dos agentes ou aos relatórios originais. Por isso, os resultados foram avaliados quanto à sua coerência e apresentação, e não independentemente reproduzidos.

**O trabalho não precisa necessariamente de mais complexidade neste momento. Ele precisa explicar e explorar melhor a complexidade que já possui.** O maior ganho de qualidade acadêmica virá do aprofundamento dos capítulos 5 e 6, e não necessariamente da realização de novos experimentos.
