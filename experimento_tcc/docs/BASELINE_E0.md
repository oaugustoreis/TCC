# Baseline experimental E0

Preparada em 05/11/2026. Estado: cinco cenários tradicionais e cinco modulares funcionalmente validados nas condições do relatório histórico. Nenhum cenário expandido implementado.

- Commit inicial: `e93c3fcf8e954dc1a1e8a05d621c9f23b8ccdc87`.
- Tag anotada: `e0-baseline-validada`.
- Branch inicial: `main`.
- Git observado: 2.51.0.windows.2. Repositório local; não houve publicação remota.
- Suítes: cinco arquivos em tradicional/ e 24 arquivos JS em modular/, incluindo ambos os helpers.
- Carga E0: 1 VU e 1 iteração por entrada.
- Evidência funcional: [resultado aprovado](../evidencias/validacao_final/2026-11-05T17-07-25-732Z/result.json), 10/10 execuções reais, 28 requisições e 60 checks. Nenhuma execução nova foi necessária para a preparação.
- Fontes da tag confrontados byte a byte, por SHA-256, com o manifesto da validação anterior: nenhuma divergência.
- Dependências node_modules e caches Python não versionados. Código autoral, documentação e logs das evidências oficiais em `evidencias/validacao_final/2026-11-05T17-07-25-732Z/` foram preservados.

O commit E0 antecede os três documentos do estudo incremental, que pertencem ao commit de preparação seguinte. A tag E0 não será movida para incorporar planejamento ou expansões.

O Git inicialmente exigiu reconhecimento do diretório por diferença entre proprietário do workspace e usuário de execução. As operações foram executadas com a opção pontual `git -c safe.directory=D:/TCC ...`, sem alterar configuração global. O lançador de shell apresentou erro técnico após a inicialização; a conclusão foi realizada com Git chamado pelo Node no mesmo workspace.

Conferência:

```powershell
git -c safe.directory=D:/TCC rev-parse 'e0-baseline-validada^{commit}'
git -c safe.directory=D:/TCC show --no-patch e0-baseline-validada
```

Consultar [PROTOCOLO_EVOLUCAO_INCREMENTAL.md](PROTOCOLO_EVOLUCAO_INCREMENTAL.md), [MATRIZ_REQUISITOS_EXPANSAO.md](MATRIZ_REQUISITOS_EXPANSAO.md) e [PLANO_MEDICAO_ESFORCO.md](PLANO_MEDICAO_ESFORCO.md) para E1–E4. O piloto de coleta e a ficha efetiva do Codex foram conferidos na revisão seguinte, documentada em RELATORIO_PRONTIDAO_EXPERIMENTO.md (documento da automação removida). O documento atualiza apenas a identificação/referência; a tag E0 e seus fontes permanecem intactos.
