# Estado atual e tarefas

> **Atualize este arquivo ao fim de cada sessão de trabalho** (humano ou IA). Ele deve sempre refletir a verdade do `main`.

Última atualização: 14/11/2026 · Próxima entrega: **16/11** · Apresentação: **27/11**

## O que existe hoje (`main`)

- Motor genérico + registro de **26 indicadores / 42 medidas** (9 A · 10 S · 7 G), validado contra cálculo independente em pandas (14 contextos × 42 medidas; 100 testes verdes e 3 pulados sem a senha, incluindo pontuação, importação, segundo tema e cifra).
- Páginas: Visão ASG, Ambiental, Social, Governança, Empresas e projetos (empresas, instituições parceiras e iniciativas próprias, com projetos), Indicadores e método.
- Catálogo GRI com 130 conteúdos e níveis de maturidade (catalogado → mapeado → calculável → em painel). **O catálogo é privado** (`privado/gri_catalogo.json`, fora do Git, por e-mail); sem ele o app mostra só os códigos GRI.
- Tema T8 com dados fictícios; **segundo tema `gestao-ambiental`** (prova de escalabilidade, entrou só como pasta); molde em `temas/_modelo/`; **seletor de tema** no cabeçalho.
- **Pontuação 0–100** implementada (frente 1): `config/metricas.json` (23 indicadores pontuados; `C1`, `ES6`, `H1` fora por serem totais absolutos), nota A/S/G/geral com faixa e cobertura em todas as páginas, notas por entidade, sensibilidade a pesos e demonstração da conta em *Indicadores e método*.
- Entidade/projeto avaliados por **nota** e por **balanço de tendência** (▲▼).
- **Importação de CSV** pelo navegador (com validação em português, separador `;`, vírgula decimal, datas DD/MM/AAAA, Windows-1252), **modo apresentação** (tecla P) e identidade configurável (`config/identidade.json`).
- **Manual** (`docs/manual-de-uso.md`) e **roteiro** (`docs/roteiro-apresentacao.md`).
- **Catálogo GRI cifrado** no repositório público (`catalogo/gri_catalogo.cifrado.json`, D18): botão *Desbloquear GRI* com a senha do grupo; gerar/trocar senha com `npm run cifrar-gri`.

## Pontuação v1.0 (resumo para o grupo)

> Texto curto para colar no grupo:
>
> "Eu e a IA montamos uma função que transforma cada indicador em uma **nota de 0 a 100**. Dados brutos grandes e pequenos ficam na mesma escala: cada indicador tem um **piso** (vale 0) e um **teto** (vale 100), e a nota cresce em linha reta entre os dois; fora deles, trava em 0 ou 100. É a *normalização min-max com limites fixos* (um *clipping*, não uma sigmoide). Depois fazemos a **média ponderada** por pilar (A, S, G) e a nota ASG geral. Dado ausente não vira zero, e mostramos a **cobertura**. **Todos os números** (piso, teto, peso, faixas 70/40) são **hipóteses nossas** e estão em `config/metricas.json`, cada um com justificativa e fonte; para mudar, é só editar esse arquivo. Totais absolutos (C1, ES6, H1) ficam fora da nota porque dependem do tamanho da empresa. Detalhes em `contexto-ia/02-metricas-pesos-e-normalizacao.md`. Falta vocês revisarem os limites e reforçarem Governança."

Arquivos da v1.0: `config/metricas.json`, `src/js/nucleo/pontuacao.js`, `src/js/ui/componentes/nota.js`, `tests/pontuacao.test.mjs`, `tools/referencia_pontuacao.py`.

## O que falta (prioridade)

| Pri | Item | Req. | Frente |
|---|---|---|---|
| 1 | Reforçar **Governança**: 6 a 8 indicadores novos e tabela(s) de dados fictícios (feitos: CL1 / 2-27, AC1 / 205-3, AC2 / 205-2, PO1 / 2-23; faltam 2-26, 2-9 e outros) | R8 | 4 |
| 2 | **Importação XLSX** (a de CSV está pronta): leitor próprio ou biblioteca; ver `01-…` e D16 | R2 | 2 |
| 3 | Evoluções v1.1 da pontuação (percentil na carteira, critério por pilar, simulação): ver `02-…`, última seção | R6 | 1 |
| 2 | Revisar piso/teto/pesos com a professora ou com dados reais; criar medidas proporcionais para `C1`, `ES6`, `H1` | R6 | 1 |
| 2 | Tema `gestao-ambiental`: Governança com só 2 indicadores (T1, Q3). Para reforçar, incluir as tabelas `conformidade` e `integridade` (geradores já existem em `tools/gerador/`) | R8 | 4 |
| 3 | Análise de sensibilidade dos pesos | R6 | 1 |
| 3 | Mais indicadores A e S (ver `docs/indicadores-candidatos.md`; feito: SST1 / 403-9 com a tabela `seguranca`) | R8 | 3 |
| 3 | Revisão do pilar de cada indicador (Q3, T1…) | — | todos |
| 2 | Ensaiar o roteiro (`docs/roteiro-apresentacao.md`) e revisar o manual (`docs/manual-de-uso.md`) | R10 | 5 |

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
| 14/11/2026 (Social) | Luiz + IA | **Indicador SST1 (GRI 403-9, acidentes de trabalho):** tabela fictícia `seguranca.csv` gerada por `tools/gerador/gerar_seguranca.py` (semente 31, horas coerentes com `emprego_mensal`), contrato, registro (taxa por 1 milhão de horas, acidentes e dias perdidos), tema (destaque e quadro anual em S), `config/metricas.json` (peso 2, menor é melhor, piso 15 e teto 0), referência pandas, 1 contexto novo e testes (61 verdes). Valores antigos de `referencia.json` ficaram intactos | Aba `seguranca` na planilha de exemplo; óbitos e lesões de grande consequência (403-9 completo); revisar piso/teto com dados reais; abrir a página Social no navegador para conferir o quadro |
| 14/11/2026 (Governança 2) | Manoel + IA | **Indicadores AC1 (GRI 205-3), AC2 (205-2) e PO1 (2-23):** tabela fictícia `integridade.csv` (mesmo gerador, `gerar_governanca.py`), contrato, registro, tema, `config/metricas.json` (AC1 peso 2; AC2 e PO1 peso 1), referência pandas e testes (59 verdes) | Aba `integridade` na planilha de exemplo; 2-26 e 2-9; revisar piso/teto com a professora |
| 14/11/2026 (Governança) | Manoel + IA | **Indicador CL1 (GRI 2-27, conformidade):** tabela fictícia `conformidade.csv` gerada por `tools/gerador/gerar_governanca.py`, contrato, registro, tema, `config/metricas.json` (peso 2, menor é melhor), referência pandas e testes (57 verdes) | Regenerar a planilha de exemplo com a aba `conformidade`; indicadores 205-2, 205-3, 2-23 e demais de G |
| 18/11/2026 | Arthur + IA | **Catálogo GRI cifrado** (`nucleo/cifra.js`, `ui/desbloquear.js`, `tools/cifrar_gri.mjs`, 10 testes); troca de tema sem recarregar; correção: importar CSV apagava o logo (a identidade não era repassada) | Arthur gera o cifrado com a senha; repositório público; Pages (opcional) |
| 17/11/2026 (fim da tarde) | Arthur + IA | Revisão do tema `gestao-ambiental` (93 testes verdes, sem erro nas telas); **seletor de tema**; aviso de Governança tirado de `src/` e movido para `tema.json → notas_pilar` (havia "T8" escrito no código); legenda de governança do T8 atualizada (7 indicadores) | Visão por setor; molde para IA |
| 17/11/2026 (tarde) | Arthur + IA | Logo da Investe Piauí no cabeçalho, visual branco e azul (cor medida no logo), selo do tema (`codigo` em `tema.json`), `--destaque` separado de `--alerta` (a cor da faixa "Em atenção" não muda com a identidade), aviso de não recarregar ao apresentar com dados importados | Feedback do Arthur sobre visão por setor e importação de tema |
| 17/11/2026 | Arthur + IA | **Importação de CSV** (`nucleo/importacao.js`, `ui/importar.js`), **modo apresentação** e **identidade** (`config/identidade.json`, `assets/`), manual e roteiro, planilha XLSX de exemplo regerada. XLSX adiado (D16) | Logo oficial; XLSX; segundo tema (outro integrante); ensaio |
| 14/11/2026 (noite) | Arthur + IA | **Pontuação v1.0 fechada:** método e referências de mercado gravados em `config/metricas.json` (`metodo`, `referencias_externas`), técnicas de normalização documentadas em `02-…`. Antes, **frente 1 concluída:** `config/metricas.json`, `nucleo/pontuacao.js`, `componentes/nota.js`, notas nas páginas, referência Python independente e 26 testes novos (56 no total) | Calibração dos limites com dados reais; medidas proporcionais para totais absolutos |
| 14/11/2026 | Arthur + IA | Catálogo GRI movido para `privado/` (fora do Git) com fallback no app e testes pulados sem ele. Antes: estrutura inicial do repositório, motor, UI, catálogo GRI, documentação, `contexto-ia/` e planilha XLSX de exemplo; decisões: 5 pessoas, sem exportação, XLSX obrigatório, modo apresentação, identidade da Investe Piauí | Itens da tabela acima |
