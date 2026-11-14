# Estado atual e tarefas

> **Atualize este arquivo ao fim de cada sessão de trabalho** (humano ou IA). Ele deve sempre refletir a verdade do `main`.

Última atualização: 14/11/2026 · Próxima entrega: **16/11** · Apresentação: **27/11**

## O que existe hoje (`main`)

- Motor genérico + registro de **21 indicadores / 33 medidas** (9 A · 9 S · 3 G), validado contra cálculo independente em pandas (13 contextos × 33 medidas; 30 testes verdes).
- Páginas: Visão ASG, Ambiental, Social, Governança, Empresas e projetos (empresas, instituições parceiras e iniciativas próprias, com projetos), Indicadores e método.
- Catálogo GRI com 130 conteúdos e níveis de maturidade (catalogado → mapeado → calculável → em painel). **O catálogo é privado** (`privado/gri_catalogo.json`, fora do Git, por e-mail); sem ele o app mostra só os códigos GRI.
- Tema T8 com dados fictícios; molde de tema em `temas/_modelo/`.
- Entidade/projeto avaliados por **balanço de tendência** (▲▼), sem nota.

## O que falta (prioridade)

| Pri | Item | Req. | Frente |
|---|---|---|---|
| 1 | `config/metricas.json` + função de pontuação + testes | R6 | 1 |
| 1 | Reforçar **Governança**: 6 a 8 indicadores novos e tabela(s) de dados fictícios | R8 | 4 |
| 1 | **Importação** em **CSV e XLSX** (e `metricas.json`) pelo navegador, com validação | R2 | 2 |
| 2 | Pontuação nas páginas: ASG geral, A, S, G, empresas | R3, R4 | 1 e 5 |
| 2 | **Segundo tema** de demonstração (ex.: "Gestão ambiental", reaproveitando `ambiental_mensal.csv`) | R1 | 4 |
| 2 | **Modo apresentação** e **identidade da Investe Piauí** (logo, nome, cores em `config/identidade.json`) | R11, R12 | 5 |
| 2 | Página de método: tabela de parâmetros + "onde editar" + demonstração da conta | R7 | 5 |
| 3 | Análise de sensibilidade dos pesos | R6 | 1 |
| 3 | Mais indicadores A e S (ver `docs/indicadores-candidatos.md`) | R8 | 3 |
| 3 | Revisão do pilar de cada indicador (Q3, T1…) | — | todos |
| 3 | Roteiro da apresentação e manual de uso | R10 | 5 |

## Frentes de trabalho (5 pessoas; sugestão, ajustem os nomes)

| Frente | Dono | Pastas | Tarefas |
|---|---|---|---|
| **1 · Pontuação e métricas** | Arthur | `src/js/nucleo/`, `config/metricas.json`, `tests/` | Implementar `02-…`: normalização, pesos, cobertura, faixas, sensibilidade; estender a referência pandas |
| **2 · Importação (CSV e XLSX)** | [nome] | `src/js/nucleo/` (leitor), `src/js/ui/` (tela de importar), `vendor/` se preciso | Leitor sobre arquivos escolhidos/arrastados; leitor XLSX (opção A ou B de `01-…`); validação com mensagens claras; testes com a planilha de exemplo |
| **3 · Indicadores Ambiental e Social + dados** | [nome] | `catalogo/indicadores.json`, `temas/*/dados`, `tools/gerador/` | Novos A e S (ver `docs/indicadores-candidatos.md`); colunas/tabelas novas; manter contrato e gerador coerentes; regerar a planilha de exemplo |
| **4 · Governança + segundo tema** | [nome] | `catalogo/indicadores.json` (pilar G), `temas/`, `docs/mapeamento-asg.md` | 6 a 8 indicadores G com dados fictícios; segundo tema de demonstração (prova de escalabilidade); revisão dos pilares |
| **5 · Apresentação, identidade e documentação** | [nome] | `src/js/ui/`, `src/css/`, `assets/`, `config/identidade.json`, `docs/` | Modo apresentação; logo e identidade da Investe Piauí; página de método com a conta; roteiro e manual |

Todos executam código, revisam o PR de alguém e leem `docs/arquitetura.md`. Conflitos evitam-se respeitando as pastas de cada frente (as frentes 3 e 4 compartilham `catalogo/indicadores.json`: **pequenos commits e pull frequente**). Mudanças em pasta alheia: avisar no grupo.

## Critério de "pronto" (qualquer tarefa)

1. `npm test` verde e a tela abre sem erros no console.
2. Sem dado real, sem número mágico no código, sem nome do T8 em `src/`.
3. Se mexeu em cálculo ou parâmetro: justificativa registrada e visível na tela de método.
4. Comentários explicando o porquê; documentação tocada (`docs/`, `contexto-ia/`).
5. PR revisado por outra pessoa do grupo.

## Decisões vigentes (resumo; detalhes em `docs/decisoes.md`)

- Site estático; fluxo importar (CSV e XLSX) → calcular → apresentar; sem persistência; **sem exportação**.
- A interface é a apresentação (modo apresentação) e usa a identidade da Investe Piauí como marca principal.
- Os dados do T8 são a **demonstração fixa**; a Investe Piauí poderá trocá-los por importação.
- Páginas A, S e G individuais **e** uma página ASG geral, com os mesmos filtros de entidade.
- Pontuação por normalização linear com piso/teto fixos, pesos e justificativas em `config/metricas.json` (hipóteses do grupo, editáveis pela Investe Piauí).
- Balanço de tendência continua, complementando a nota.
- Pilar A/S/G de cada indicador é decisão do grupo, não do GRI.
- Gráficos em SVG próprio, sem bibliotecas.
- Conteúdo das Normas GRI (títulos, páginas) é **privado**: fora do Git, distribuído por e-mail; o Git guarda só códigos.

## Perguntas em aberto

- Quais métricas de Governança usar além dos candidatos? (decidir na frente 2)
- Cortes de faixa (70/40) e cobertura mínima: ok como hipótese inicial?
- A professora aceita importar a cada abertura (sem persistência)? **Arthur confirma na segunda-feira (16/11).**
- Logo oficial da Investe Piauí: **o grupo precisa obter o arquivo** e colocá-lo em `assets/` (não gerar por IA).
- XLSX: leitor próprio (opção A) ou biblioteca (B)? Frente 2 decide e registra.

## Registro de sessões (adicione uma linha por sessão)

| Data | Quem | O que mudou | Pendente |
|---|---|---|---|
| 14/11/2026 | Arthur + IA | Catálogo GRI movido para `privado/` (fora do Git) com fallback no app e testes pulados sem ele. Antes: estrutura inicial do repositório, motor, UI, catálogo GRI, documentação, `contexto-ia/` e planilha XLSX de exemplo; decisões: 5 pessoas, sem exportação, XLSX obrigatório, modo apresentação, identidade da Investe Piauí | Itens da tabela acima |
