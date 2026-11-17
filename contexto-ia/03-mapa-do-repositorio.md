# Mapa do repositório

Itens marcados **(a criar)** ainda não existem.

```
/
├── index.html                 ponto de entrada; só carrega src/js/main.js
├── package.json               scripts: servir, test, referencia
├── AGENTS.md · CLAUDE.md      apontam as IAs para esta pasta (contexto-ia/)
├── contexto-ia/               memória compartilhada do grupo para assistentes de IA (leia 00 primeiro)
├── assets/                    logo oficial da Investe Piauí (o grupo coloca o arquivo; ver assets/LEIA-ME.md)
├── config/                    parâmetros editáveis
│   ├── metricas.json          pesos, piso/teto, faixas, justificativas (existe)
│   └── identidade.json        nome da instituição, caminho do logo, cores (existe)
├── catalogo/                  conhecimento sobre GRI e indicadores (dados, não código)
│   └── indicadores.json       registro PÚBLICO dos indicadores calculáveis (fórmula, pilar, código GRI)
├── privado/                   FORA DO GIT (só o LEIA-ME.md é versionado)
│   └── gri_catalogo.json      130 conteúdos GRI com título, página e pilar sugerido; recebido por e-mail
├── temas/                     um tema = uma pasta
│   ├── index.json             lista dos temas disponíveis
│   ├── _modelo/               molde para copiar ao criar um tema
│   ├── gestao-ambiental/      segundo tema (energia, água e resíduos): prova de que um tema novo é só uma pasta
│   └── t8-empregos-verdes/    tema da apresentação (dados fictícios)
│       ├── tema.json          título, indicadores usados, destaques, cartões do topo
│       ├── contrato.json      tabelas, colunas, tipos e relações esperadas
│       ├── dados/*.csv        os dados (demonstração fixa do T8, fictícios)
│       └── exemplo-importacao/  planilha XLSX com uma aba por tabela (exemplo e caso de teste do importador)
├── src/
│   ├── css/estilo.css         visual (tokens de cor por pilar no topo)
│   └── js/
│       ├── main.js            lê índice, tema e registro; liga o leitor de arquivos
│       ├── nucleo/            MOTOR: sem HTML, roda em Node (por isso é testável); inclui pontuacao.js (notas 0-100), importacao.js (valida CSV/JSON do usuário) e leitores.js
│       └── ui/                TELAS: sem contas; só desenham o que o motor entrega
│           ├── app.js         casca, abas (#hash), filtros, modo apresentação, identidade
│           ├── importar.js    janela "Importar dados" (CSV)
│           ├── paginas/       visao · pilar (A/S/G) · empresas · metodo
│           └── componentes/   cartao · graficos (SVG) · balanco · nota
├── tests/                     testes + referência independente (pandas)
├── tools/                     scripts de apoio (servidor local, extrair catálogo, gerar dados fictícios, referência)
├── vendor/                    (a criar, só se necessário) bibliotecas versionadas (ex.: XLSX, se a opção B for escolhida)
├── docs/                      documentação humana (arquitetura, contrato de dados, decisões, roadmap…)
└── material-privado/          (ignorada pelo Git) material interno da disciplina; NUNCA enviar a IA
```

## O que colocar em cada lugar

| Quero… | Onde |
|---|---|
| Novo indicador (fórmula) | `catalogo/indicadores.json` (cite só o código GRI) |
| Peso, piso/teto, faixa de um indicador | `config/metricas.json` (com `justificativa` e `fonte`) |
| Novo tema | copiar `temas/_modelo/` → `temas/<id>/` e registrar em `temas/index.json` |
| Nova tabela de dados | CSV em `temas/<id>/dados/` + entrada no `contrato.json` |
| Regra de cálculo nova (operador, normalização) | `src/js/nucleo/` + teste em `tests/` |
| Mudança visual | `src/css/estilo.css` e `src/js/ui/` |
| Decisão do grupo | `docs/decisoes.md` (+ resumo em `contexto-ia/04-…`) |
| Gerador de dados fictícios | `tools/gerador/` (rodar a validação depois) |

## Limites entre as camadas (não quebre)

- `nucleo/` **nunca** mexe em HTML/DOM; `ui/` **nunca** faz conta de indicador.
- `src/` **nunca** cita nada específico do T8 (empresa, setor, coluna). Tudo vem dos dados do tema e do registro.
- Dados e conhecimento (JSON/CSV) **não** ficam dentro de `.js`.

## Detalhes técnicos

Fluxo e regras de cálculo (estoque × fluxo, anualização, nulo ≠ zero, variação, cor pelo sentido): `docs/arquitetura.md`.
Contrato de dados e criação de tema: `docs/contrato-de-dados.md`.
