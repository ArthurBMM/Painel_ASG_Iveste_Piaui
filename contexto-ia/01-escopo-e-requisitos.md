# Escopo e requisitos

Legenda: ✅ feito · 🟡 parcial · ❌ não iniciado

## Por que a Investe Piauí quer isso

Ela quer um painel para monitorar **o próprio trabalho** (a Investe Piauí como instituição: iniciativas próprias) **e** as empresas e instituições com as quais tem parceria ou que ela ajudou a constituir, comparando-as com os critérios ASG. Por isso a **entidade** (empresa/instituição/projeto) é uma dimensão tão importante quanto o pilar.

## Requisitos

| # | Requisito | Estado | Notas |
|---|---|---|---|
| R1 | **Escalável por tema.** Outros temas entram sem mexer em `src/`, com a mesma leitura de tópicos e gráficos dos mesmos estilos | 🟡 | Mecanismo existe (tema = pasta). Falta um **segundo tema de demonstração** para provar |
| R2 | **Importação de arquivos pelo navegador, em CSV e em XLSX** (planilhas Excel), sem servidor e sem persistência | 🟡 | **CSV implementado** (`nucleo/importacao.js`, `ui/importar.js`, 18 testes). **XLSX pendente** (D16); a planilha de exemplo foi regerada com as 12 tabelas |
| R3 | **Páginas por pilar** (Ambiental, Social, Governança) **e uma página ASG geral**, todas com os mesmos filtros (ano, origem, empresa/instituição, projeto, setor, município) | 🟡 | Páginas, filtros e notas (por pilar e geral) existem; falta reforçar G (poucos indicadores) |
| R4 | **Avaliar cada empresa/projeto e a Investe Piauí** nos três critérios | 🟡 | Nota A, S, G e geral com faixa e cobertura por entidade, mais balanço (▲▼) e aviso de sensibilidade aos pesos |
| R5 | **Catálogo completo de indicadores GRI**, com cada indicador usado claramente identificado (código; página e título quando o catálogo privado estiver carregado) | ✅ | 130 conteúdos; níveis de maturidade. **Catálogo é privado** (`privado/`, fora do Git) e opcional em tempo de execução |
| R14 | **Conteúdo GRI fora do repositório**: só códigos no Git; catálogo distribuído por e-mail e carregado de `privado/` ou **importado pela interface** | ✅ | `gri_catalogo.json` pode ser escolhido na janela Importar; também continua valendo `privado/` |
| R6 | **Métricas, pesos, normalização e faixas com justificativa, fáceis de alterar** | ✅ | Implementado em `config/metricas.json` + `nucleo/pontuacao.js`; ver `02-…`. Parâmetros são hipóteses a revisar com dados reais |
| R7 | **Transparência dos cálculos** para a professora e a Investe Piauí | ✅ | Página *Indicadores e método* mostra parâmetros, justificativas, onde editar e a conta passo a passo de uma entidade |
| R8 | **Quanto mais indicadores GRI, melhor** (só os que fazem sentido no tema), com **Governança reforçada** | 🟡 | 26 indicadores; G tem 7 (CL1, AC1, AC2 e PO1 entraram) e S ganhou SST1 (403-9). Candidatos em `docs/indicadores-candidatos.md` |
| R9 | **Site estático**, sem back-end complexo | ✅ | |
| R10 | **Apresentação focada no T8** | 🟡 | Roteiro em `docs/roteiro-apresentacao.md`; o segundo tema entra só como prova de escalabilidade |
| R11 | **Modo apresentação**: a interface é a apresentação (tela cheia, tipografia grande, navegação por teclado, painel de filtros recolhível), com nível de acabamento de reunião séria | ✅ | Botão Apresentar / tecla P: tela cheia, letras maiores, setas e números, filtros recolhíveis (D17) |
| R12 | **Identidade da Investe Piauí** como marca principal (logo no cabeçalho, nome da instituição), configurável | ✅ | Logo em `assets/`, cabeçalho branco e azul da Investe Piauí; nome, cores e logo em `config/identidade.json` |
| R13 | **Dados de demonstração fixos** do T8, trocáveis por importação | 🟡 | Os dados do T8 em `temas/t8-empregos-verdes/dados/` são a demonstração; explicar à Investe Piauí que podem ser substituídos |

## Importação (R2) — como pensamos em fazer

> **Estado (17/11/2026):** a importação de **CSV** (e `metricas.json`, `gri_catalogo.json`) está pronta. A decisão do grupo foi deixar o **XLSX para depois** (D16); o texto abaixo descreve o caminho previsto para ele.

- O motor já recebe uma função `leitor(caminho) → texto` (ver `src/js/main.js` e `carregarTema` em `nucleo/modelo.js`). Hoje ela usa `fetch`. A importação é **um novo leitor** que lê de um mapa em memória `{ caminho → texto }` montado a partir de arquivos que o usuário escolhe (`<input type="file" webkitdirectory multiple>` e arrastar-e-soltar, via `File.text()`).
- Formatos aceitos: **(a)** vários CSV, um por tabela, nomeados como no contrato; **(b)** **um arquivo XLSX com uma aba por tabela** (nome da aba = nome da tabela), como o de exemplo; **(c)** a pasta do tema inteira (`tema.json`, `contrato.json`, `dados/`). Opcionalmente um `gri_catalogo.json` (catálogo GRI privado) e um `metricas.json` próprio, que **substitui** o padrão (é assim que a Investe Piauí aplicaria os parâmetros dela).
- Validação pelo contrato com mensagens claras: o que faltou, qual aba/coluna, qual linha.
- **XLSX é obrigatório** (a Investe Piauí trabalha com planilhas). Duas opções, decidir na frente de importação:
  - **A. Leitor próprio, sem biblioteca** (recomendado para começar): um `.xlsx` é um ZIP; `DecompressionStream('deflate-raw')` (navegadores atuais e Node 18+) descompacta e `DOMParser` lê o XML (`sharedStrings.xml` + `sheetN.xml`). ~150 linhas, didático, mantém a regra de zero dependências. Limite: lê valores, não fórmulas; **datas do Excel vêm como número serial**; atenção a células vazias e textos compartilhados.
  - **B. Biblioteca versionada em `vendor/`** (ex.: SheetJS edição comunitária), mais robusta com planilhas reais bagunçadas, ao custo de uma dependência de ~1 MB.
- Teste obrigatório: importar `temas/t8-empregos-verdes/exemplo-importacao/t8-empregos-verdes.xlsx` e obter **os mesmos números** que os CSVs.
- Sem persistência: tudo na memória da aba. Se a professora pedir permanência, avaliar `localStorage`/IndexedDB.

## Apresentação e identidade (R11, R12)

- O público é a Investe Piauí em **reunião séria**: a ferramenta substitui o slide. Pense em: **modo apresentação** (esconde o painel de filtros, tela cheia), **tipografia legível à distância**, **setas do teclado para trocar de página**, transições discretas, nada de elementos de "protótipo".
- **Identidade:** logo da Investe Piauí no cabeçalho como marca principal, nome da instituição e cores configuráveis em `config/identidade.json` (a criar). **O arquivo oficial do logo deve ser colocado em `assets/` pelo grupo**; IA nenhuma deve desenhar ou "recriar" o logo. Enquanto não houver arquivo, usar um espaço reservado neutro.
- Emojis na interface são aceitáveis, com moderação.

## Fora de escopo (por ora)

**Exportação** de qualquer tipo (PDF, imagem, relatório): **decidido que não existe** (a apresentação acontece dentro da ferramenta). Autenticação, banco de dados, multiusuário, histórico de versões, dados reais.

## O que a professora disse (resumo para contexto)

- Estipular pesos/normalização próprios é **aceito**, desde que o resultado final **mostre os cálculos e um breve embasamento**.
- A Investe Piauí **não pode fornecer dados oficiais** ao grupo; ela deve poder **trocar os parâmetros depois**, com os dados reais.
- A interpretação do GRI como catálogo com metadados (sem calcular todos os conteúdos) é **suficiente**.
