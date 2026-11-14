# Instruções para assistentes de IA

Antes de qualquer tarefa, **leia toda a pasta `contexto-ia/`**, começando por `contexto-ia/00-LEIA-PRIMEIRO.md`.

Resumo das regras de ouro (detalhes lá):

1. Somente dados **fictícios**; nada confidencial no repositório ou em prompts.
2. **Escalabilidade:** tema = pasta em `temas/`; nada específico do T8 em `src/`.
3. Pesos, pisos/tetos e faixas ficam em `config/metricas.json`, com justificativa e fonte; sem números mágicos no código.
4. Todo cálculo precisa ser demonstrável na página *Indicadores e método*.
5. Site **estático**, sem persistência: importar → calcular → apresentar. Sem dependências nem build.
6. `npm test` verde antes de PR. Explique o porquê e comente o código; o usuário é estudante.
7. Ao fim da sessão, atualize `contexto-ia/04-estado-e-tarefas.md`.
