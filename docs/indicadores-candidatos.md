# Indicadores GRI candidatos para expandir

Os códigos abaixo constam no catálogo privado (`privado/gri_catalogo.json`, fora do Git, onde ficam título e página). Aqui só há **código e um resumo nosso do tema**. O **pilar** é sugestão do grupo, para revisão. A coluna *Dados novos* indica o que precisa existir nos CSVs.

## Ambiental

| GRI | Tema | Dados novos (fictícios) |
|---|---|---|
| 305-4 | Intensidade de emissões de GEE | Já derivável de `energia_emissoes` + denominador (ex.: MWh gerado ou empregados) |
| 303-3 | Captação de água | Coluna de captação por fonte em `ambiental_mensal` |
| 303-4 | Descarte de água | Coluna de descarte em `ambiental_mensal` |

## Social

| GRI | Tema | Dados novos |
|---|---|---|
| 403-9 | Acidentes de trabalho | Tabela `seguranca` (horas trabalhadas, acidentes, dias perdidos) |
| 403-5 | Capacitação em saúde e segurança | Horas de capacitação em SST em `capacitacao` |
| 401-3 | Licença maternidade/paternidade | Tabela por gênero (tiraram licença, retornaram) |
| 406-1 | Casos de discriminação e medidas | Tabela `ocorrencias` (casos, medidas) |
| 202-2 | Diretoria contratada na comunidade local | Coluna em tabela de governança/pessoas |
| 413-2 | Operações com impactos negativos nas comunidades | Em `comunidade` (flag + descrição) |
| 414-1 | Novos fornecedores com critérios sociais | Tabela de fornecedores (agregada) |
| 408-1 | Risco de trabalho infantil em fornecedores | Fornecedores (agregado) |
| 409-1 | Risco de trabalho forçado em fornecedores | Fornecedores (agregado) |

## Governança (reforço de G)

| GRI | Tema | Dados novos |
|---|---|---|
| 2-9 | Estrutura de governança e composição | Tabela `governanca` (membros, independentes, gênero) |
| 2-16 | Comunicação de preocupações cruciais | Contagem de preocupações reportadas ao órgão máximo |
| 2-23 | Compromissos de política | Flags: política ambiental, de direitos humanos, anticorrupção |
| 2-26 | Mecanismos para apresentação de preocupações | Flag/canal de denúncia e casos recebidos |
| 2-27 | Conformidade com leis e regulamentos | Multas e sanções (número e valor) |
| 205-2 | Comunicação e capacitação anticorrupção | % de empregados/gestores capacitados |
| 205-3 | Casos confirmados de corrupção | Contagem (fictícia) por ano |

## Sugestão de ordem

1. **G primeiro** (2-27, 205-2, 205-3, 2-23): é onde a cobertura está mais frágil e os dados fictícios são simples (contagens e flags por projeto/ano).
2. **403-9**: indicador "clássico" de SST, ótimo para a apresentação do T8 (mineração × energia limpa).
3. **305-4, 303-3/4**: aproveitam dados já existentes.

Ao incluir: siga o checklist de `divisao-de-tarefas.md` e atualize `docs/mapeamento-asg.md`.
