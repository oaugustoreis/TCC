# Auditoria de rastreabilidade (10/11/2026)

O manifesto SHA-256 (`MANIFESTO_RASTREABILIDADE.json` e `.sha256`) descreve o estado auditado em 10/11/2026, com HEAD inicial `df99b648a2e422e735feba4af922e075f1e92fed`. A verificação de integridade (`verificar_integridade.py`) deve ser executada nesse commit.

No estado atual do repositório o script retorna `integrity_passed: false`, por arquivos alterados depois da auditoria, e não por adulteração das evidências:

- `scripts/validacao/oraculos.mjs` e `scripts/validacao/validar.mjs`: estendidos para validar a condição intermediária e as manutenções repetidas (novembro de 2026).
- `docs/PROTOCOLO_EVOLUCAO_INCREMENTAL.md`, `docs/README.md`, `docs/RELATORIO_EXPERIMENTAL_COMPLETO.md` e `docs/RELATORIO_MODULAR_ATUAL.md`: editados para retirar a referência ao Pulse.
- `docs/arquitetura-pulse.md`: removido pelo mesmo motivo.
- "HEAD alterado" e "Referências Git alteradas": consequência de novos commits e branches após a auditoria.

As evidências brutas (transcritos, tentativas, métricas e validações dos estados E0–M3) não foram alteradas.
