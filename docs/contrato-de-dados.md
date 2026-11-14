# Contrato de dados (como importar um tema)

Um **tema** é uma pasta. O **contrato** (`contrato.json`) descreve as tabelas CSV que ela deve ter. Ao carregar, o `modelo.js` confere os arquivos contra o contrato e separa:

- **erros** (impedem o uso: arquivo obrigatório ausente, coluna faltando, chave duplicada);
- **avisos** (seguem funcionando: coluna extra, tipo estranho).

## Estrutura de um tema

```
temas/meu-tema/
├── tema.json        título, aviso, quais indicadores usa, destaques por pilar, cartões do topo, "história"
├── contrato.json    tabelas, colunas e tipos
└── dados/*.csv      UTF-8, cabeçalho na 1ª linha, vírgula como separador, ponto como decimal
```

E registrar o tema em `temas/index.json`:

```json
{ "id": "meu-tema", "titulo": "…", "pasta": "temas/meu-tema" }
```

## Passo a passo para criar um tema

1. Copie `temas/_modelo/` para `temas/meu-tema/`.
2. Edite `contrato.json`: liste as tabelas, as colunas e os tipos (`texto`, `numero`, `inteiro`, `data`).
3. Coloque os CSVs em `dados/`.
4. Em `tema.json`, escolha em `indicadores` quais IDs do `catalogo/indicadores.json` o tema usa.
   - Um indicador só aparece **com dados** se as tabelas/colunas que ele usa existirem no tema. A tela *Indicadores e método* mostra "faltam: …" quando não existem.
5. `npm run servir` → `http://localhost:8080/?tema=meu-tema`.

## Tabelas do T8 (referência)

| Tabela | Chave | Conteúdo (colunas principais) |
|---|---|---|
| `empresas` | `empresa_id` | `nome_empresa`, `origem` (empresa parceira, instituição parceira ou iniciativa própria) |
| `projetos` | `projeto_id` | `nome_projeto`, `setor`, `municipio`, `regiao`, `mw_instalado`, `data_inicio`, `empresa_id` |
| `ocupacoes` | `ocupacao_id` | `ocupacao`, `categoria_funcional`, `classe` (Verde / Neutra / Alto impacto), `justificativa_classe` |
| `emprego_mensal` | projeto × ocupação × mês × gênero × faixa etária | `empregados_fim_mes` (estoque), `contratacoes`, `desligamentos` |
| `capacitacao` | projeto × ocupação × mês × gênero | `horas_capacitacao`, `empregados_avaliados` |
| `programas` | `programa_id` | `projeto_id`, `nome_programa`, `tipo`, `publico_alvo`, `vagas`, `concluintes`, `contratados_verde` |
| `energia_emissoes` | projeto × mês | energia renovável/não renovável (MWh), redução de consumo, emissões escopo 1 e 2, redução de emissões (tCO2e) |
| `ambiental_mensal` | projeto × mês | resíduos (perigosos, não perigosos, recuperados, disposição final, em toneladas), água (megalitros), habitat restaurado (ha) |
| `comunidade` | projeto × **ano** | investimento em infraestrutura, tipo, programa na comunidade, prazo de aviso (semanas), investimento total e renovável, plano de encerramento |

As relações (chaves estrangeiras) também ficam no contrato, em `relacoes` (ex.: `emprego_mensal.projeto_id → projetos.projeto_id`), e são validadas.

Os tipos e colunas exatos estão em `temas/t8-empregos-verdes/contrato.json`.

## Regras práticas

- Meses no formato `AAAA-MM`.
- Estoques (empregados no fim do mês) e fluxos (contratações no mês) ficam em colunas distintas; o registro sabe qual somar e qual tirar a média.
- Percentuais ficam em **fração** (0,45) ou calculados por razão, conforme o indicador; ver `como_calcula` de cada um.
- Não coloque dados pessoais: use sempre agregados por projeto/mês/ocupação.

## Importação de XLSX / interface de upload

Ainda não existe. Hoje o "import" é copiar a pasta do tema. Está no `roadmap.md` (Fase 3). Alternativa simples antes disso: converter XLSX → CSV (Excel: *Salvar como CSV UTF-8*).
