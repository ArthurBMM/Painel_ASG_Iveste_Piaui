# Dicionário de dados

> **Arquivo gerado** por `npm run dicionario` (`tools/gerar_dicionario.mjs`). Não edite à mão: as descrições ficam em `catalogo/dicionario-dados.json` (e, se um tema mudar o significado de algo, em `temas/<id>/dicionario.json`); tipos, chaves e ligações vêm do `contrato.json` de cada tema; contagens, faixas e exemplos são lidos dos próprios CSV. Versão para Excel: `docs/dicionario-de-dados.csv`.

**Todos os dados são fictícios**, gerados pelos scripts de `tools/gerador/` (semente fixa: rodar de novo produz os mesmos números).

## Convenções

- **Tipos:** `texto`, `numero` (decimal com ponto), `inteiro`, `data` (`AAAA-MM-DD`; meses sempre no dia 1).
- **Célula vazia em coluna numérica = sem dado** (não é zero). O painel tira esse valor da conta em vez de somar zero.
- **Estoque × fluxo:** `empregados_fim_mes` é estoque (foto do fim do mês) e não se soma entre meses; contratações, desligamentos, horas, energia, emissões e resíduos são fluxos do período e se somam.
- **Usada por:** indicadores do registro cuja fórmula lê a coluna. "documentação" = a coluna é guardada para contexto ou conferência, mas nenhuma fórmula atual a usa.
- **Chave:** colunas que identificam uma linha (não se repetem juntas). **Liga com:** coluna de outra tabela que ela referencia.

## Visão geral das tabelas

| Tema | Tabela | Uma linha = | Linhas | Obrigatória | O que é |
|---|---|---|---|---|---|
| t8-empregos-verdes | `projetos` | um projeto | 12 | sim | Projetos e operações da carteira acompanhados pela Investe Piauí. |
| t8-empregos-verdes | `empresas` | uma entidade | 9 | não | Entidades avaliadas: empresas parceiras, instituições parceiras e a própria Investe Piauí (iniciativas próprias). |
| t8-empregos-verdes | `ocupacoes` | uma ocupação | 18 | sim | Cadastro de ocupações (funções) e sua classificação ambiental. |
| t8-empregos-verdes | `emprego_mensal` | projeto × ocupação × mês × gênero × faixa etária | 27.366 | sim | Quadro de pessoal mês a mês, aberto por ocupação, gênero e faixa etária. É a base de quase todos os indicadores 'por empregado'. |
| t8-empregos-verdes | `capacitacao` | projeto × ocupação × mês × gênero | 10.379 | não | Treinamento e avaliação de desempenho dos empregados. |
| t8-empregos-verdes | `programas` | um programa (turma) | 33 | não | Programas de qualificação, requalificação e transição de carreira. |
| t8-empregos-verdes | `energia_emissoes` | projeto × mês | 552 | não | Consumo de energia e emissões de gases de efeito estufa. |
| t8-empregos-verdes | `ambiental_mensal` | projeto × mês | 552 | não | Resíduos, água e áreas restauradas. |
| t8-empregos-verdes | `comunidade` | projeto × ano | 48 | não | Relação com a comunidade e decisões de investimento, por ano. |
| t8-empregos-verdes | `conformidade` | projeto × ano | 48 | não | Multas e sanções por descumprimento de leis e regulamentos. |
| t8-empregos-verdes | `integridade` | projeto × ano | 48 | não | Anticorrupção e políticas de compromisso. |
| t8-empregos-verdes | `seguranca` | projeto × ano | 48 | não | Saúde e segurança do trabalho. |
| gestao-ambiental | `projetos` | um projeto | 9 | sim | Projetos e operações da carteira acompanhados pela Investe Piauí. |
| gestao-ambiental | `empresas` | uma entidade | 6 | não | Entidades avaliadas: empresas parceiras, instituições parceiras e a própria Investe Piauí (iniciativas próprias). |
| gestao-ambiental | `ocupacoes` | uma ocupação | 15 | sim | Cadastro de ocupações (funções) e sua classificação ambiental. |
| gestao-ambiental | `emprego_mensal` | projeto × ocupação × mês × gênero × faixa etária | 14.737 | sim | Quadro de pessoal mês a mês, aberto por ocupação, gênero e faixa etária. É a base de quase todos os indicadores 'por empregado'. |
| gestao-ambiental | `capacitacao` | projeto × ocupação × mês × gênero | 6.668 | não | Treinamento e avaliação de desempenho dos empregados. |
| gestao-ambiental | `programas` | um programa (turma) | 37 | não | Programas de qualificação, requalificação e transição de carreira. |
| gestao-ambiental | `energia_emissoes` | projeto × mês | 395 | não | Consumo de energia e emissões de gases de efeito estufa. |
| gestao-ambiental | `ambiental_mensal` | projeto × mês | 395 | não | Resíduos, água e áreas restauradas. |
| gestao-ambiental | `comunidade` | projeto × ano | 35 | não | Relação com a comunidade e decisões de investimento, por ano. |

## Tema: Empregos verdes e qualificação para a transição energética (`t8-empregos-verdes`)

Pasta dos dados: `temas/t8-empregos-verdes/dados/` · contrato: `temas/t8-empregos-verdes/contrato.json`

### `projetos`

Projetos e operações da carteira acompanhados pela Investe Piauí.

Arquivo `projetos.csv` · **uma linha = um projeto** · 12 linhas · obrigatória · chave: `projeto_id`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Identificador do projeto (chave usada por todas as tabelas de fatos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave |
| `nome_projeto` | texto |  | Nome do projeto ou unidade. | 12 valor(es): Parque Eólico Serra Azul, Complexo Ventos do Sertão, Parque Eólico Costa Branca, Usina Solar Sol do Sertão, … | 0% | documentação |
| `setor` | texto |  | Setor de atividade do projeto. Alimenta o filtro Setor e a coluna de setores da aba Empresas. | 5 valor(es): Eólica, Solar, Hidrelétrica, Obras sustentáveis, … | 0% | documentação |
| `municipio` | texto |  | Município do Piauí onde o projeto opera. Alimenta o filtro Município. | 12 valor(es): Marcolândia, Simões, Parnaíba, São João do Piauí, … | 0% | documentação |
| `regiao` | texto |  | Região do estado (agrupamento do grupo). | 5 valor(es): Semiárido, Litoral, Centro, Sul, … | 0% | documentação |
| `mw_instalado` | numero | MW | Capacidade instalada de geração. Vazio quando o projeto não gera energia (ex.: mineração, obras). | 60 a 300 | 42% | documentação |
| `data_inicio` | data |  | Início da operação do projeto (primeiro dia do mês). | 2020-01-01 a 2024-06-01 | 0% | documentação |
| `empresa_id` | texto |  | Empresa ou instituição responsável pelo projeto (liga com empresas). | 9 valor(es): E01, E02, E03, E04, … | 0% | liga com `empresas.empresa_id` |

### `empresas`

Entidades avaliadas: empresas parceiras, instituições parceiras e a própria Investe Piauí (iniciativas próprias).

Arquivo `empresas.csv` · **uma linha = uma entidade** · 9 linhas · opcional · chave: `empresa_id`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `empresa_id` | texto |  | Identificador da entidade. | 9 valor(es): E01, E02, E03, E04, … | 0% | chave |
| `nome_empresa` | texto |  | Nome da empresa ou instituição. | 9 valor(es): Ventos do Piauí Energia S.A., Brisa Litoral Renováveis Ltda., Solaris Nordeste Geração S.A., Sol de Picos Energia Ltda., … | 0% | documentação |
| `origem` | texto |  | Relação com a Investe Piauí: Empresa parceira, Instituição parceira ou Iniciativa própria. Alimenta o filtro Origem. | 3 valor(es): Empresa parceira, Instituição parceira, Iniciativa própria | 0% | documentação |

### `ocupacoes`

Cadastro de ocupações (funções) e sua classificação ambiental.

Arquivo `ocupacoes.csv` · **uma linha = uma ocupação** · 18 linhas · obrigatória · chave: `ocupacao_id`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `ocupacao_id` | texto |  | Identificador da ocupação. | 18 valor(es): O01, O02, O03, O04, … | 0% | chave |
| `ocupacao` | texto |  | Nome da função. | 18 valor(es): Engenheiro eólico, Engenheiro de usina solar ou hidrelétrica, Engenheiro civil (obras sustentáveis), Arquiteto (projetos sustentáveis), … | 0% | documentação |
| `categoria_funcional` | texto |  | Grupo funcional (ex.: Engenharia, Técnico, Operacional, Administrativo, Gestão). | 5 valor(es): Engenharia, Técnico, Operacional, Administrativo, … | 0% | documentação |
| `classe` | texto |  | Classe ambiental da função: Verde, Neutra ou Alto impacto. Critério DO GRUPO (o GRI não classifica ocupações assim); a razão de cada uma está em justificativa_classe. Alimenta o filtro de classe da aba Social. | 3 valor(es): Verde, Neutra, Alto impacto | 0% | EV1 |
| `justificativa_classe` | texto |  | Por que a ocupação recebeu aquela classe (texto curto). | 14 valor(es): Projeta e opera parques de energia renovável, Projeta e opera geração renovável, Obras de baixo impacto ambiental, Projetos de arquitetura de baixo impacto, … | 0% | documentação |

### `emprego_mensal`

Quadro de pessoal mês a mês, aberto por ocupação, gênero e faixa etária. É a base de quase todos os indicadores 'por empregado'.

Arquivo `emprego_mensal.csv` · **uma linha = projeto × ocupação × mês × gênero × faixa etária** · 27.366 linhas · obrigatória · chave: `projeto_id` + `ocupacao_id` + `mes` + `genero` + `faixa_etaria`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ocupacao_id` | texto |  | Ocupação (liga com ocupacoes). | 18 valor(es): O01, O05, O07, O08, … | 0% | chave · liga com `ocupacoes.ocupacao_id` |
| `mes` | data |  | Mês de referência, sempre no dia 1 (AAAA-MM-01). | 2023-01-01 a 2026-10-01 | 0% | chave · A1, ES2, ES4, ES6, EV2, EV3, H1, Q1, R1 |
| `genero` | texto |  | Gênero declarado: F ou M. | 2 valor(es): F, M | 0% | chave · EV4 |
| `faixa_etaria` | texto |  | Faixa etária: Abaixo de 30, De 30 a 50 ou Acima de 50. | 3 valor(es): Abaixo de 30, De 30 a 50, Acima de 50 | 0% | chave |
| `empregados_fim_mes` | inteiro | pessoas | ESTOQUE: pessoas empregadas no último dia do mês. Média mensal = soma dos estoques ÷ número de meses (não se soma estoque entre meses). | 0 a 55 | 0% | A1, ES2, ES4, EV1, EV2, EV3, EV4, Q1, Q3, R1 |
| `contratacoes` | inteiro | pessoas | FLUXO: contratações no mês. | 0 a 5 | 0% | EV2 |
| `desligamentos` | inteiro | pessoas | FLUXO: desligamentos no mês (voluntários ou não). | 0 a 12 | 0% | EV3 |

### `capacitacao`

Treinamento e avaliação de desempenho dos empregados.

Arquivo `capacitacao.csv` · **uma linha = projeto × ocupação × mês × gênero** · 10.379 linhas · opcional · chave: `projeto_id` + `ocupacao_id` + `mes` + `genero`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ocupacao_id` | texto |  | Ocupação (liga com ocupacoes). | 18 valor(es): O01, O05, O07, O08, … | 0% | chave · liga com `ocupacoes.ocupacao_id` |
| `mes` | data |  | Mês de referência (AAAA-MM-01). | 2023-01-01 a 2026-10-01 | 0% | chave |
| `genero` | texto |  | Gênero: F ou M. | 2 valor(es): F, M | 0% | chave |
| `horas_capacitacao` | numero | horas | Horas de treinamento realizadas no mês (soma das horas de todas as pessoas do grupo). | 0 a 239 | 0% | Q1 |
| `empregados_avaliados` | inteiro | pessoas | Pessoas que passaram por avaliação regular de desempenho no mês. | 0 a 73 | 0% | Q3 |

### `programas`

Programas de qualificação, requalificação e transição de carreira.

Arquivo `programas.csv` · **uma linha = um programa (turma)** · 33 linhas · opcional · chave: `programa_id`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `programa_id` | texto |  | Identificador do programa. | 33 valor(es): PR01, PR02, PR03, PR04, … | 0% | chave · Q2 |
| `projeto_id` | texto |  | Projeto que oferece o programa (liga com projetos). | 11 valor(es): P01, P02, P03, P04, … | 0% | liga com `projetos.projeto_id` |
| `nome_programa` | texto |  | Nome do curso ou programa. | 8 valor(es): Técnico de manutenção de aerogerador, Apoio a graduação em engenharia, Transição de carreira (desligados da eólica), Requalificação para energia renovável, … | 0% | documentação |
| `tipo` | texto |  | Tipo: Curso interno, Apoio a curso externo, Transição de carreira ou Requalificação. | 4 valor(es): Curso interno, Apoio a curso externo, Transição de carreira, Requalificação | 0% | documentação |
| `publico_alvo` | texto |  | A quem o programa se destina. | 8 valor(es): Técnicos, Técnicos e administrativos, Desligados em 2025, Ex-operadores de mina, … | 0% | documentação |
| `data_inicio` | data |  | Início da turma (primeiro dia do mês). | 2023-07-01 a 2026-04-01 | 0% | documentação |
| `vagas` | inteiro | pessoas | Vagas oferecidas. | 21 a 75 | 0% | Q2 |
| `concluintes` | inteiro | pessoas | Pessoas que concluíram (nunca mais que as vagas). | 15 a 55 | 0% | Q2 |
| `contratados_verde` | inteiro | pessoas | Concluintes recolocados em função de classe Verde (mede se a qualificação vira emprego verde). | 0 a 25 | 0% | Q2 |

### `energia_emissoes`

Consumo de energia e emissões de gases de efeito estufa.

Arquivo `energia_emissoes.csv` · **uma linha = projeto × mês** · 552 linhas · opcional · chave: `projeto_id` + `mes`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `mes` | data |  | Mês de referência (AAAA-MM-01). | 2023-01-01 a 2026-10-01 | 0% | chave |
| `energia_renovavel_mwh` | numero | MWh | Energia consumida de fontes renováveis. | 66 a 1.004,8 | 0% | ES1, ES2, ES3 |
| `energia_nao_renovavel_mwh` | numero | MWh | Energia consumida de fontes não renováveis. | 9,1 a 3.102 | 0% | ES1, ES2, ES3 |
| `reducao_consumo_mwh` | numero | MWh | Energia economizada no mês por ações de eficiência. | 0,6 a 52,7 | 0% | ES3 |
| `emissoes_escopo1_tco2e` | numero | tCO2e | Emissões diretas (escopo 1: combustíveis e processos próprios). | 3,6 a 1.008,2 | 0% | ES4 |
| `emissoes_escopo2_tco2e` | numero | tCO2e | Emissões indiretas da energia comprada (escopo 2). | 0,5 a 192,7 | 0% | ES4 |
| `reducao_emissoes_tco2e` | numero | tCO2e | Emissões evitadas no mês por iniciativas de redução. | 0,1 a 11,9 | 0% | ES6 |

### `ambiental_mensal`

Resíduos, água e áreas restauradas.

Arquivo `ambiental_mensal.csv` · **uma linha = projeto × mês** · 552 linhas · opcional · chave: `projeto_id` + `mes`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `mes` | data |  | Mês de referência (AAAA-MM-01). | 2023-01-01 a 2026-10-01 | 0% | chave |
| `residuos_perigosos_ton` | numero | t | Resíduos perigosos gerados. | 0,58 a 171,84 | 0% | R1, R2 |
| `residuos_nao_perigosos_ton` | numero | t | Resíduos não perigosos gerados. | 8,24 a 591,87 | 0% | R1, R2 |
| `residuos_recuperados_ton` | numero | t | Resíduos desviados da disposição final (reciclagem, compostagem, reúso). | 4,22 a 134,06 | 0% | R2 |
| `residuos_disposicao_final_ton` | numero | t | Resíduos enviados para disposição final (aterro, incineração). Recuperados + disposição final = gerados. | 4,69 a 645,25 | 0% | documentação |
| `consumo_agua_megalitros` | numero | ML | Água consumida (1 megalitro = 1 milhão de litros). | 0,22 a 49,44 | 0% | A1 |
| `habitat_restaurado_ha` | numero | ha | Área de habitat restaurada no mês. | 0,06 a 4,41 | 0% | H1 |

### `comunidade`

Relação com a comunidade e decisões de investimento, por ano.

Arquivo `comunidade.csv` · **uma linha = projeto × ano** · 48 linhas · opcional · chave: `projeto_id` + `ano`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ano` | inteiro | ano | Ano de referência. | 2.023 a 2.026 | 0% | chave · M1, N1 |
| `investimento_infraestrutura_rs` | numero | R$ | Investimento em infraestrutura para a comunidade no ano. | 228.000 a 2.865.000 | 0% | C1 |
| `tipo_investimento` | texto |  | Principal tipo de infraestrutura apoiada (ex.: saneamento, escola técnica). | 5 valor(es): Estrada de acesso, Posto de saúde, Energia comunitária, Escola técnica, … | 0% | documentação |
| `tem_programa_comunidade` | texto |  | O projeto tem programa de engajamento com a comunidade local? Sim ou Não. | 2 valor(es): Sim, Não | 0% | C3 |
| `prazo_aviso_semanas` | inteiro | semanas | Antecedência mínima com que os empregados são avisados de mudanças operacionais. | 2 a 6 | 0% | N1 |
| `investimento_total_rs` | numero | R$ | Investimento total do projeto no ano. | 6.219.000 a 67.640.000 | 0% | T1 |
| `investimento_renovavel_rs` | numero | R$ | Parte do investimento total destinada a energia renovável e à transição. | 1.285.000 a 35.377.000 | 0% | T1 |
| `tem_plano_encerramento` | texto |  | Há plano de fechamento da operação (relevante para mineração)? Sim, Não ou Não se aplica. | 3 valor(es): Não se aplica, Não, Sim | 0% | M1 |

### `conformidade`

Multas e sanções por descumprimento de leis e regulamentos.

Arquivo `conformidade.csv` · **uma linha = projeto × ano** · 48 linhas · opcional · chave: `projeto_id` + `ano`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ano` | inteiro | ano | Ano de referência. | 2.023 a 2.026 | 0% | chave · CL1 |
| `multas_qtd` | inteiro | ocorrências | Número de multas ou sanções no ano. | 0 a 3 | 0% | CL1 |
| `multas_valor_rs` | numero | R$ | Valor total das multas no ano. | 0 a 739.000 | 0% | documentação |
| `teve_multa` | texto |  | Teve ao menos uma multa no ano? Sim ou Não (coerente com multas_qtd). | 2 valor(es): Não, Sim | 0% | CL1 |

### `integridade`

Anticorrupção e políticas de compromisso.

Arquivo `integridade.csv` · **uma linha = projeto × ano** · 48 linhas · opcional · chave: `projeto_id` + `ano`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ano` | inteiro | ano | Ano de referência. | 2.023 a 2.026 | 0% | chave · AC1, AC2, PO1 |
| `casos_corrupcao` | inteiro | ocorrências | Casos de corrupção confirmados no ano. | 0 a 2 | 0% | AC1 |
| `teve_caso_corrupcao` | texto |  | Teve ao menos um caso confirmado no ano? Sim ou Não. | 2 valor(es): Não, Sim | 0% | AC1 |
| `gestores_total` | inteiro | pessoas | Gestores do projeto no ano. | 7 a 27 | 0% | AC2 |
| `gestores_capacitados_anticorrupcao` | inteiro | pessoas | Gestores capacitados em políticas anticorrupção (nunca mais que o total). | 3 a 19 | 0% | AC2 |
| `politica_ambiental` | texto |  | Tem política ambiental formal? Sim ou Não. | 2 valor(es): Sim, Não | 0% | documentação |
| `politica_direitos_humanos` | texto |  | Tem política de direitos humanos formal? Sim ou Não. | 2 valor(es): Sim, Não | 0% | documentação |
| `politica_anticorrupcao` | texto |  | Tem política anticorrupção formal? Sim ou Não. | 2 valor(es): Sim, Não | 0% | documentação |
| `politicas_adotadas_qtd` | inteiro | políticas | Quantas das três políticas acima o projeto adota (0 a 3). | 0 a 3 | 0% | PO1 |

### `seguranca`

Saúde e segurança do trabalho.

Arquivo `seguranca.csv` · **uma linha = projeto × ano** · 48 linhas · opcional · chave: `projeto_id` + `ano`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 12 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ano` | inteiro | ano | Ano de referência. | 2.023 a 2.026 | 0% | chave |
| `horas_trabalhadas` | inteiro | horas | Total de horas trabalhadas no ano (base para as taxas por milhão de horas). | 50.200 a 753.800 | 0% | SST1 |
| `acidentes_registraveis` | inteiro | ocorrências | Acidentes de trabalho registráveis no ano. | 0 a 14 | 0% | SST1 |
| `dias_perdidos` | inteiro | dias | Dias de trabalho perdidos por acidentes no ano. | 0 a 245 | 0% | SST1 |

## Tema: Gestão ambiental na operação: energia, água e resíduos (`gestao-ambiental`)

Pasta dos dados: `temas/gestao-ambiental/dados/` · contrato: `temas/gestao-ambiental/contrato.json`

### `projetos`

Projetos e operações da carteira acompanhados pela Investe Piauí.

Arquivo `projetos.csv` · **uma linha = um projeto** · 9 linhas · obrigatória · chave: `projeto_id`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Identificador do projeto (chave usada por todas as tabelas de fatos). | 9 valor(es): P01, P02, P03, P04, … | 0% | chave |
| `nome_projeto` | texto |  | Nome do projeto ou unidade. | 9 valor(es): Cerâmica Barro Vivo – Unidade Teresina, Cerâmica Barro Vivo – Unidade Altos, Beneficiamento de Castanha de Caju, Polpa e Sucos Piripiri, … | 0% | documentação |
| `setor` | texto |  | Setor de atividade (ex.: Cerâmica, Agroindústria, Laticínios, Resíduos sólidos, Saneamento). Alimenta o filtro Setor. | 6 valor(es): Cerâmica, Agroindústria, Laticínios, Resíduos sólidos, … | 0% | documentação |
| `municipio` | texto |  | Município do Piauí onde o projeto opera. Alimenta o filtro Município. | 7 valor(es): Teresina, Altos, Parnaíba, Piripiri, … | 0% | documentação |
| `regiao` | texto |  | Região do estado (agrupamento do grupo). | 5 valor(es): Centro, Litoral, Norte, Semiárido, … | 0% | documentação |
| `data_inicio` | data |  | Início da operação do projeto (primeiro dia do mês). | 2019-05-01 a 2024-03-01 | 0% | documentação |
| `empresa_id` | texto |  | Empresa ou instituição responsável pelo projeto (liga com empresas). | 6 valor(es): E01, E02, E03, E04, … | 0% | liga com `empresas.empresa_id` |

### `empresas`

Entidades avaliadas: empresas parceiras, instituições parceiras e a própria Investe Piauí (iniciativas próprias).

Arquivo `empresas.csv` · **uma linha = uma entidade** · 6 linhas · opcional · chave: `empresa_id`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `empresa_id` | texto |  | Identificador da entidade. | 6 valor(es): E01, E02, E03, E04, … | 0% | chave |
| `nome_empresa` | texto |  | Nome da empresa ou instituição. | 6 valor(es): Cerâmica Barro Vivo Ltda., Agroindustrial Caju Dourado S.A., Laticínios Serra Branca Ltda., Consórcio Intermunicipal Ambiental do Sul, … | 0% | documentação |
| `origem` | texto |  | Relação com a Investe Piauí: Empresa parceira, Instituição parceira ou Iniciativa própria. Alimenta o filtro Origem. | 3 valor(es): Empresa parceira, Instituição parceira, Iniciativa própria | 0% | documentação |

### `ocupacoes`

Cadastro de ocupações (funções) e sua classificação ambiental.

Arquivo `ocupacoes.csv` · **uma linha = uma ocupação** · 15 linhas · obrigatória · chave: `ocupacao_id`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `ocupacao_id` | texto |  | Identificador da ocupação. | 15 valor(es): O01, O02, O03, O04, … | 0% | chave |
| `ocupacao` | texto |  | Nome da função. | 15 valor(es): Técnico de tratamento de efluentes, Analista de gestão ambiental, Operador de triagem e reciclagem, Técnico em eficiência energética, … | 0% | documentação |
| `categoria_funcional` | texto |  | Grupo funcional (ex.: Engenharia, Técnico, Operacional, Administrativo, Gestão). | 4 valor(es): Técnico, Gestão, Operacional, Administrativo | 0% | documentação |
| `classe` | texto |  | Classe ambiental da função: Verde, Neutra ou Alto impacto. Neste tema, Verde é a função cujo trabalho principal é ambiental (tratamento de efluentes, triagem, compostagem, eficiência energética). Critério DO GRUPO, não do GRI. | 3 valor(es): Verde, Neutra, Alto impacto | 0% | EV1 |
| `justificativa_classe` | texto |  | Por que a ocupação recebeu aquela classe (texto curto). | 11 valor(es): Opera estações de tratamento e sistemas de reúso de água, Licenciamento, monitoramento e relatórios ambientais, Separa e encaminha materiais recicláveis, Reduz o consumo de energia e troca fontes por renováveis, … | 0% | documentação |

### `emprego_mensal`

Quadro de pessoal mês a mês, aberto por ocupação, gênero e faixa etária. É a base de quase todos os indicadores 'por empregado'.

Arquivo `emprego_mensal.csv` · **uma linha = projeto × ocupação × mês × gênero × faixa etária** · 14.737 linhas · obrigatória · chave: `projeto_id` + `ocupacao_id` + `mes` + `genero` + `faixa_etaria`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 9 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ocupacao_id` | texto |  | Ocupação (liga com ocupacoes). | 15 valor(es): O13, O12, O15, O04, … | 0% | chave · liga com `ocupacoes.ocupacao_id` |
| `mes` | data |  | Mês de referência, sempre no dia 1 (AAAA-MM-01). | 2023-01-01 a 2026-10-01 | 0% | chave · A1, ES2, ES4, ES6, EV2, EV3, H1, Q1, R1 |
| `genero` | texto |  | Gênero declarado: F ou M. | 2 valor(es): F, M | 0% | chave · EV4 |
| `faixa_etaria` | texto |  | Faixa etária: Abaixo de 30, De 30 a 50 ou Acima de 50. | 3 valor(es): De 30 a 50, Acima de 50, Abaixo de 30 | 0% | chave |
| `empregados_fim_mes` | inteiro | pessoas | ESTOQUE: pessoas empregadas no último dia do mês. Média mensal = soma dos estoques ÷ número de meses (não se soma estoque entre meses). | 0 a 27 | 0% | A1, ES2, ES4, EV1, EV2, EV3, EV4, Q1, Q3, R1 |
| `contratacoes` | inteiro | pessoas | FLUXO: contratações no mês. | 0 a 3 | 0% | EV2 |
| `desligamentos` | inteiro | pessoas | FLUXO: desligamentos no mês (voluntários ou não). | 0 a 4 | 0% | EV3 |

### `capacitacao`

Treinamento e avaliação de desempenho dos empregados.

Arquivo `capacitacao.csv` · **uma linha = projeto × ocupação × mês × gênero** · 6.668 linhas · opcional · chave: `projeto_id` + `ocupacao_id` + `mes` + `genero`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 9 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ocupacao_id` | texto |  | Ocupação (liga com ocupacoes). | 15 valor(es): O01, O02, O04, O07, … | 0% | chave · liga com `ocupacoes.ocupacao_id` |
| `mes` | data |  | Mês de referência (AAAA-MM-01). | 2023-01-01 a 2026-10-01 | 0% | chave |
| `genero` | texto |  | Gênero: F ou M. | 2 valor(es): F, M | 0% | chave |
| `horas_capacitacao` | numero | horas | Horas de treinamento realizadas no mês (soma das horas de todas as pessoas do grupo). | 0 a 85 | 0% | Q1 |
| `empregados_avaliados` | inteiro | pessoas | Pessoas que passaram por avaliação regular de desempenho no mês. | 0 a 34 | 0% | Q3 |

### `programas`

Programas de qualificação, requalificação e transição de carreira.

Arquivo `programas.csv` · **uma linha = um programa (turma)** · 37 linhas · opcional · chave: `programa_id`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `programa_id` | texto |  | Identificador do programa. | 37 valor(es): PR01, PR02, PR03, PR04, … | 0% | chave · Q2 |
| `projeto_id` | texto |  | Projeto que oferece o programa (liga com projetos). | 9 valor(es): P03, P04, P05, P08, … | 0% | liga com `projetos.projeto_id` |
| `nome_programa` | texto |  | Nome do curso ou programa. | 7 valor(es): Operador de ETE e reúso de água, Técnico em eficiência energética, Operação segura e eficiente de fornos e caldeiras, Inclusão produtiva de catadores, … | 0% | documentação |
| `tipo` | texto |  | Tipo: Curso interno, Apoio a curso externo, Transição de carreira ou Requalificação. | 4 valor(es): Curso interno, Transição de carreira, Requalificação, Apoio a curso externo | 0% | documentação |
| `publico_alvo` | texto |  | A quem o programa se destina. | 6 valor(es): Operacionais, Técnicos, Operadores de forno e caldeira, Catadores e ex-trabalhadores de lixão, … | 0% | documentação |
| `data_inicio` | data |  | Início da turma (primeiro dia do mês). | 2023-03-01 a 2026-03-01 | 0% | documentação |
| `vagas` | inteiro | pessoas | Vagas oferecidas. | 20 a 60 | 0% | Q2 |
| `concluintes` | inteiro | pessoas | Pessoas que concluíram (nunca mais que as vagas). | 15 a 52 | 0% | Q2 |
| `contratados_verde` | inteiro | pessoas | Concluintes recolocados em função de classe Verde (mede se a qualificação vira emprego verde). | 0 a 31 | 0% | Q2 |

### `energia_emissoes`

Consumo de energia e emissões de gases de efeito estufa.

Arquivo `energia_emissoes.csv` · **uma linha = projeto × mês** · 395 linhas · opcional · chave: `projeto_id` + `mes`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 9 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `mes` | data |  | Mês de referência (AAAA-MM-01). | 2023-01-01 a 2026-10-01 | 0% | chave |
| `energia_renovavel_mwh` | numero | MWh | Energia consumida de fontes renováveis. | 15 a 830,5 | 0% | ES1, ES2, ES3 |
| `energia_nao_renovavel_mwh` | numero | MWh | Energia consumida de fontes não renováveis. | 5,5 a 889,3 | 0% | ES1, ES2, ES3 |
| `reducao_consumo_mwh` | numero | MWh | Energia economizada no mês por ações de eficiência. | 0,1 a 25 | 0% | ES3 |
| `emissoes_escopo1_tco2e` | numero | tCO2e | Emissões diretas (escopo 1: combustíveis e processos próprios). | 0,4 a 273,4 | 0% | ES4 |
| `emissoes_escopo2_tco2e` | numero | tCO2e | Emissões indiretas da energia comprada (escopo 2). | 0,3 a 53,1 | 0% | ES4 |
| `reducao_emissoes_tco2e` | numero | tCO2e | Emissões evitadas no mês por iniciativas de redução. | 0 a 11,7 | 0% | ES6 |

### `ambiental_mensal`

Resíduos, água e áreas restauradas.

Arquivo `ambiental_mensal.csv` · **uma linha = projeto × mês** · 395 linhas · opcional · chave: `projeto_id` + `mes`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 9 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `mes` | data |  | Mês de referência (AAAA-MM-01). | 2023-01-01 a 2026-10-01 | 0% | chave |
| `residuos_perigosos_ton` | numero | t | Resíduos perigosos gerados. | 0,07 a 12,67 | 0% | R1, R2 |
| `residuos_nao_perigosos_ton` | numero | t | Resíduos não perigosos gerados. | 0,68 a 404,54 | 0% | R1, R2 |
| `residuos_recuperados_ton` | numero | t | Resíduos desviados da disposição final (reciclagem, compostagem, reúso). | 0,41 a 216,92 | 0% | R2 |
| `residuos_disposicao_final_ton` | numero | t | Resíduos enviados para disposição final (aterro, incineração). Recuperados + disposição final = gerados. | 0,31 a 258,31 | 0% | documentação |
| `consumo_agua_megalitros` | numero | ML | Água consumida (1 megalitro = 1 milhão de litros). | 0,04 a 17,54 | 0% | A1 |
| `habitat_restaurado_ha` | numero | ha | Área de habitat restaurada no mês. | 0,02 a 2,69 | 0% | H1 |

### `comunidade`

Relação com a comunidade e decisões de investimento, por ano.

Arquivo `comunidade.csv` · **uma linha = projeto × ano** · 35 linhas · opcional · chave: `projeto_id` + `ano`

| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |
|---|---|---|---|---|---|---|
| `projeto_id` | texto |  | Projeto (liga com projetos). | 9 valor(es): P01, P02, P03, P04, … | 0% | chave · liga com `projetos.projeto_id` |
| `ano` | inteiro | ano | Ano de referência. | 2.023 a 2.026 | 0% | chave · M1, N1 |
| `investimento_infraestrutura_rs` | numero | R$ | Investimento em infraestrutura para a comunidade no ano. | 395.000 a 1.623.000 | 0% | C1 |
| `tipo_investimento` | texto |  | Principal tipo de infraestrutura apoiada (ex.: saneamento, escola técnica). | 5 valor(es): Escola técnica ambiental, Cisternas comunitárias, Horta e compostagem comunitária, Saneamento rural, … | 0% | documentação |
| `tem_programa_comunidade` | texto |  | O projeto tem programa de engajamento com a comunidade local? Sim ou Não. | 2 valor(es): Não, Sim | 0% | C3 |
| `prazo_aviso_semanas` | inteiro | semanas | Antecedência mínima com que os empregados são avisados de mudanças operacionais. | 2 a 6 | 0% | N1 |
| `investimento_total_rs` | numero | R$ | Investimento total do projeto no ano. | 3.463.000 a 32.500.000 | 0% | T1 |
| `investimento_renovavel_rs` | numero | R$ | Parte do investimento total destinada a energia renovável e à transição. | 786.000 a 7.055.000 | 0% | T1 |
| `tem_plano_encerramento` | texto |  | Há plano de fechamento da operação (relevante para mineração)? Sim, Não ou Não se aplica. | 1 valor(es): Não se aplica | 0% | M1 |
