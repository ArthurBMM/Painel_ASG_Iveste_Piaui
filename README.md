# Painel ASG · Investe Piauí

Ferramenta web que organiza **indicadores das Normas GRI** nos três pilares **ASG (Ambiental, Social e Governança)** para a Investe Piauí acompanhar **a própria atuação** e a das **empresas e instituições parceiras**, projeto a projeto.

> **Disciplina:** Ciência de Dados (iCEV) · **Desafio:** ASG Investe Piauí · **Tema:** T8, *Empregos verdes e qualificação para a transição energética*.
> **Todos os dados são fictícios** (gerados por scripts nossos, com semente fixa). O que propomos é a **ferramenta e o método**, não os números.

**Versão online:** https://arthurbmm.github.io/Painel_ASG_Iveste_Piaui/ (GitHub Pages) · **Repositório:** https://github.com/ArthurBMM/Painel_ASG_Iveste_Piaui

---

## Em 1 minuto: como abrir

Precisa só do [Node.js](https://nodejs.org) 20 ou mais novo. Não há `npm install` nem dependências.

```bash
npm run servir        # abre o painel em http://localhost:8080
```

Sem Node, com Python: `python -m http.server 8080` na pasta do projeto. Abrir o `index.html` com duplo clique **não funciona**, porque o navegador bloqueia a leitura dos dados em `file://`.

No painel:
- tecla **P** liga o modo apresentação;
- **🔒 Desbloquear GRI** pede a senha do grupo e mostra títulos e páginas das Normas (ver [Catálogo GRI](#catálogo-gri-cifrado));
- o seletor no cabeçalho troca de tema.

---

## O que o painel mostra

| Aba | Para quê |
|---|---|
| **Visão ASG** | Nota ASG geral e por pilar (0 a 100, com faixa e cobertura), a "história" do tema e os indicadores-chave |
| **Ambiental · Social · Governança** | Cada indicador com valor, variação contra o ano anterior (cor pelo **sentido desejável**, não pelo sinal), nota, peso e referência GRI; gráficos do tema |
| **Empresas e projetos** | Cada empresa, instituição parceira e a **própria Investe Piauí** com notas A, S, G e ASG, balanço de melhoras e pioras e projetos; teste de sensibilidade aos pesos |
| **Indicadores e método** | Todos os parâmetros da nota (piso, teto, peso, justificativa, fonte), a **conta passo a passo** para uma entidade e o catálogo GRI com níveis de maturidade |

Os **filtros** (ano, origem, empresa, projeto, setor, município e, no Social, classe de ocupação) valem para todas as abas.

---

## Os dados

| O quê | Onde |
|---|---|
| **Tabelas geradas (CSV)**, que o painel lê | `temas/t8-empregos-verdes/dados/` (12 tabelas) e `temas/gestao-ambiental/dados/` (9 tabelas) |
| **As mesmas tabelas em Excel** (uma aba por tabela) | `temas/<tema>/exemplo-importacao/<tema>.xlsx` |
| **Dicionário de dados** (cada tabela e coluna: significado, unidade, tipo, chave, faixa de valores, vazios e quais indicadores a usam) | [`docs/dicionario-de-dados.md`](docs/dicionario-de-dados.md) e, para Excel, `docs/dicionario-de-dados.csv` |
| **Geradores dos dados fictícios** | `tools/gerador/` (Python; semente fixa: rodar de novo dá os mesmos números) |
| **Contrato de dados** (o "molde" que outro conjunto de dados precisa seguir) | `temas/<tema>/contrato.json`, explicado em [`docs/contrato-de-dados.md`](docs/contrato-de-dados.md) |

O dicionário e as planilhas são **gerados a partir dos próprios dados**: `npm run dicionario` (dados e indicadores) e `npm run planilhas`. Um teste falha se alguém criar uma coluna sem descrevê-la ou esquecer de regenerar o dicionário.

Dados novos entram pelo botão **Importar dados**, em CSV no mesmo molde. A importação valida tudo, mostra um relatório e não guarda nada: ao recarregar a página, volta a demonstração.

---

## Como a nota ASG é calculada

1. **Indicador → nota 0 a 100:** `nota = (valor − piso) ÷ (teto − piso)`, limitada entre 0 e 100.
   - É uma *normalização min-max com limites fixos*.
   - Quando "menor é melhor" (por exemplo, emissões), o piso é maior que o teto e a mesma fórmula funciona.
2. **Pilar:** média ponderada das notas dos indicadores **que têm dado**. Dado ausente **não vira zero**, e a **cobertura** mostra quanto do peso tinha dado.
3. **ASG geral:** média ponderada dos três pilares.
4. **Faixas:** *Alinhado* (70 ou mais), *Em atenção* (de 40 a 70), *Crítico* (abaixo de 40). Com cobertura abaixo de 50%, a faixa é *Sem dados suficientes*.

**Pesos, pisos, tetos e faixas são hipóteses do grupo**, não metas oficiais (a Investe Piauí não forneceu metas). Ficam todos num único arquivo editável, [`config/metricas.json`](config/metricas.json), **cada um com justificativa e fonte**, e aparecem na aba *Indicadores e método*. Totais absolutos (que crescem com o tamanho da empresa) ficam fora da nota. A comparação com referências de mercado (EcoVadis, ISE B3, Sustainalytics) e as técnicas de normalização que avaliamos estão em [`contexto-ia/02-metricas-pesos-e-normalizacao.md`](contexto-ia/02-metricas-pesos-e-normalizacao.md).

---

## Indicadores e GRI

> **Dicionário de indicadores, fórmulas e SCORE ASG:** [`docs/dicionario-de-indicadores.md`](docs/dicionario-de-indicadores.md) (e `.csv` para Excel). Para cada indicador: por que importa, como é calculado, a fórmula exata que o motor executa, o GRI correspondente e os parâmetros da nota (peso, piso, teto, justificativa).

- **26 indicadores** no T8 (9 Ambientais, 10 Sociais, 7 de Governança), cada um ligado ao seu conteúdo GRI (ex.: GRI 403-9).
- As fórmulas ficam em [`catalogo/indicadores.json`](catalogo/indicadores.json) como **dados**, não como código. Um indicador novo é escrito ali, sem programar.
- O **pilar** de cada indicador é decisão do grupo, porque o GRI não classifica seus conteúdos em A, S ou G. A justificativa está em [`docs/mapeamento-asg.md`](docs/mapeamento-asg.md).

### Catálogo GRI cifrado

O catálogo das Normas GRI (130 conteúdos, com título e página) é material **restrito**. No repositório ele existe só **cifrado** (`catalogo/gri_catalogo.cifrado.json`, AES-256-GCM com chave derivada da senha). Quem tem a senha clica em **🔒 Desbloquear GRI**, e o navegador decifra o catálogo na memória, sem enviar nem salvar nada. Sem a senha, tudo funciona, e as referências aparecem só pelo código. Detalhes e limites: [`privado/LEIA-ME.md`](privado/LEIA-ME.md).

---

## Escalável para outros temas

Um tema é **uma pasta**, `temas/<id>/`, com `tema.json` (título, história, quais indicadores e gráficos mostrar), `contrato.json` (tabelas e colunas) e os CSV. O motor e as telas não mudam.

**Prova:** o segundo tema, `gestao-ambiental` (energia, água e resíduos), entrou só como pasta, sem alterar uma linha de `src/`. Passo a passo e molde: [`docs/contrato-de-dados.md`](docs/contrato-de-dados.md) e `temas/_modelo/`.

---

## Tecnologias empregadas

| Parte | Tecnologia | Por quê |
|---|---|---|
| Painel | **HTML, CSS e JavaScript puros** (módulos ES), gráficos em **SVG** próprio | Site estático: abre em qualquer navegador e publica no GitHub Pages sem servidor nem build |
| Motor de cálculo | JavaScript, com as fórmulas guardadas como **dados** (JSON) | Indicador novo ou tema novo sem mexer no código |
| Criptografia do catálogo GRI | **Web Crypto API** do navegador (PBKDF2-SHA256 + AES-256-GCM) | Nativa e auditada; nenhuma biblioteca externa |
| Geração dos dados fictícios e referências independentes | **Python** (pandas, NumPy, openpyxl) | Gerar bases coerentes e recalcular os indicadores por outro caminho para conferir |
| Testes | **Node.js** (`node --test`, nativo) | Mais de 100 testes automáticos, sem dependências |
| Protótipo inicial | **Power BI** | Os primeiros números foram validados lá e viraram "âncoras" nos testes |
| Versionamento e publicação | **Git, GitHub e GitHub Pages** | Histórico do trabalho do grupo e versão online |

Não há dependências para instalar: o painel e os testes usam só o que vem com o navegador e com o Node.js.

---

## Como sabemos que os números estão certos

`npm test` roda **mais de 100 testes automáticos** (Node, sem dependências). Entre eles:
- cada indicador comparado com um **cálculo independente em pandas** (14 recortes de filtro);
- as notas comparadas com uma **reimplementação em Python** escrita de outro jeito;
- números-âncora conferidos contra o protótipo em **Power BI**;
- coerência dos dados gerados (estoque = anterior + contratações − desligamentos; recuperados + disposição final = gerados);
- a importação de CSV e a criptografia do catálogo;
- o dicionário de dados atualizado.

---

## Limites conhecidos

- **Protótipo estático:** sem login, sem banco de dados, sem histórico. Dados importados valem só enquanto a aba estiver aberta.
- **Importação só em CSV.** XLSX ficou para depois; no Excel, use *Salvar como CSV*.
- **Parâmetros da nota são hipóteses** e foram parcialmente calibrados olhando os dados fictícios. Devem ser revistos com dados reais.
- **O ranking entre entidades depende dos pesos.** A aba Empresas mostra isso; por isso falamos em **faixas**, não em "A é melhor que B".
- **Governança tem menos indicadores** do que os outros pilares (7 no T8 e 2 no tema de gestão ambiental).

---

## Mapa das pastas

```
index.html              página única do painel
src/js/nucleo/          motor: lê CSV, valida contrato, avalia fórmulas, notas, importação, cifra (sem HTML; testável)
src/js/ui/              telas: cabeçalho, abas, cartões, gráficos SVG, janelas de importar e desbloquear
catalogo/               indicadores.json (fórmulas), dicionario-dados.json (descrições), gri_catalogo.cifrado.json
config/                 metricas.json (parâmetros da nota) e identidade.json (nome, cores, logo)
temas/                  um tema por pasta (dados, contrato, planilha) + _modelo/
docs/                   manual de uso, roteiro da apresentação, dicionário de dados, contrato, arquitetura, decisões
tests/                  testes automáticos e referências independentes (pandas e Python)
tools/                  servidor local, geradores de dados, dicionário, planilhas, cifra do catálogo GRI
contexto-ia/            contexto do projeto para assistentes de IA usados pelo grupo
privado/                só o LEIA-ME vai para o Git (o catálogo aberto fica fora)
```

## Documentação

| Para | Leia |
|---|---|
| Usar e apresentar | [`docs/manual-de-uso.md`](docs/manual-de-uso.md) · [`docs/roteiro-apresentacao.md`](docs/roteiro-apresentacao.md) |
| Entender os dados | [`docs/dicionario-de-dados.md`](docs/dicionario-de-dados.md) · [`docs/contrato-de-dados.md`](docs/contrato-de-dados.md) |
| Entender os indicadores e a nota | [`docs/dicionario-de-indicadores.md`](docs/dicionario-de-indicadores.md) |
| Entender o método | [`contexto-ia/02-metricas-pesos-e-normalizacao.md`](contexto-ia/02-metricas-pesos-e-normalizacao.md) · [`docs/mapeamento-asg.md`](docs/mapeamento-asg.md) |
| Entender as escolhas | [`docs/decisoes.md`](docs/decisoes.md) (cada decisão com o porquê e o que foi descartado) |
| Mexer no código | [`docs/arquitetura.md`](docs/arquitetura.md) · [`CONTRIBUTING.md`](CONTRIBUTING.md) · `AGENTS.md` e `contexto-ia/` (para assistentes de IA) |
