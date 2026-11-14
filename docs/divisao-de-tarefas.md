# Divisão de tarefas (5 pessoas)

> A versão **viva** (com frentes, donos e estado) está em `contexto-ia/04-estado-e-tarefas.md`. Atualize lá; este arquivo guarda só o ritmo e o checklist de indicador novo.

Datas: **entrega 16/11** (próxima) · **apresentação 27/11**. É uma sugestão: ajustem entre vocês. A ideia é que cada frente seja dona de uma **área do código**, para reduzir conflitos de merge.

As **cinco frentes** (donos, pastas e tarefas) estão em `contexto-ia/04-estado-e-tarefas.md`.

## Para cada indicador novo (checklist)

1. Escolha o conteúdo GRI em `privado/gri_catalogo.json` (código, página e título; arquivo privado recebido por e-mail). No registro versionado cite **só o código**.
2. Defina a **pergunta ASG** que ele responde (`por_que_asg`) e a fórmula em linguagem simples (`como_calcula`).
3. Veja quais colunas faltam nos CSVs; se faltarem, estenda o contrato e o gerador de dados fictícios.
4. Escreva o indicador no registro (copie um parecido, ex.: `ES4`).
5. Adicione um contexto de teste e gere a referência independente.
6. `npm test` → PR → revisão de outra pessoa.

## Ritmo sugerido (curto, com folga)

| Quando | Meta |
|---|---|
| Hoje (sáb, 14/11) | Repositório criado, todos rodando `npm run servir` e `npm test`; ler `arquitetura.md`; cada um escolhe 2 indicadores candidatos |
| Dom, 15/11 | Indicadores novos no registro + dados; segundo tema esboçado; decidir E1 (metas) |
| Seg, 16/11 | **Entrega:** ferramenta rodando, catálogo GRI, documentação |
| 17–26/11 | Importação de tema, metas, polimento, pitch e ensaio |
| 27/11 | Apresentação (foco no T8; mostrar o segundo tema só como prova de escalabilidade) |
