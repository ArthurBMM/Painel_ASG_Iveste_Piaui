# Como contribuir

Somos cinco pessoas no mesmo código. Poucas regras simples evitam a maior parte dos conflitos.

## Fluxo de trabalho (Git)

1. `main` está sempre funcionando (testes passando). **Ninguém commita direto nela.**
2. Para cada tarefa, crie um branch: `git switch -c area/descricao-curta` (ex.: `ambiental/indicador-305-4`).
3. Faça commits pequenos, com mensagem que diga *o quê e por quê* (ex.: `Adiciona GRI 403-9 (acidentes) ao registro`).
4. Antes de abrir o Pull Request: `npm test` precisa passar e a tela precisa abrir (`npm run servir`).
5. Abra o PR e peça revisão de **uma** pessoa do grupo. Quem revisa também aprende o trecho.
6. Atualize seu branch com `main` antes de mergear (`git pull origin main`).

## Regras de dados (importante)

- **Só dados fictícios** no repositório. Nada de dados reais da Investe Piauí, de empresas ou de pessoas.
- Material confidencial da disciplina (cronograma, enunciados com links) **não entra** no Git e **não vai para ferramentas de IA**. A pasta `material-privado/` está no `.gitignore` para isso.
- Dados fictícios precisam ser plausíveis. Se mudar um gerador (`tools/gerador/`), rode a validação (`python tools/gerador/validar_base_v2.py`).

## Onde mexer em cada tipo de mudança

| Quero… | Mexo em… | Tem teste? |
|---|---|---|
| Adicionar/alterar um indicador | `catalogo/indicadores.json` (+ colunas nos CSVs do tema, se faltarem) | sim: `tests/` |
| Mudar de pilar um indicador | `catalogo/indicadores.json` (campo `pilar`) e registrar em `docs/mapeamento-asg.md` | sim |
| Criar um tema novo | copiar `temas/_modelo/` | validação de contrato |
| Mudar visual | `src/css/estilo.css`, `src/js/ui/` | confira no navegador |
| Mudar a lógica de cálculo | `src/js/nucleo/` | **obrigatório** rodar `npm test` |

## Estilo de código

- JavaScript moderno (módulos ES), sem bibliotecas externas e sem build. Mantemos assim de propósito: qualquer pessoa abre e entende.
- **Comente o porquê**, não o óbvio. Exemplo bom: `// estoque: usa média dos meses, nunca soma`.
- Nomes em português, como o domínio (`empregados`, `balanco`, `pilar`).
- Funções pequenas, uma responsabilidade. A pasta `nucleo/` **não** mexe em HTML; a pasta `ui/` **não** faz conta.

## Testes

- `npm test` roda os testes de regressão: o motor calcula 35 medidas em 13 contextos de filtro e compara com `tests/referencia.json`.
- Essa referência vem de um cálculo **independente em pandas** (`npm run referencia`, precisa de Python + pandas). Assim o motor não "corrige a si mesmo".
- Mudou a regra de cálculo de propósito? Regenere a referência, explique no PR por que os números mudaram.
- Indicador novo: adicione ao menos um contexto em `tests/contextos.json` que o exercite (com filtro de projeto e de ano).

## Dúvidas de conteúdo ASG

Anote em `docs/decisoes.md` (seção "Em aberto") em vez de decidir sozinho no código. Decisões de conteúdo são do grupo.
