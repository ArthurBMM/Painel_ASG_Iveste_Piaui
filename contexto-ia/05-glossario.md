# Glossário

| Termo | Significado neste projeto |
|---|---|
| **ASG** (ou ESG) | Ambiental, Social e Governança: os três pilares de avaliação |
| **GRI** | *Global Reporting Initiative*. As Normas GRI listam **conteúdos** (ex.: 305-1 Emissões diretas) usados em relatórios de sustentabilidade. Aqui, a fonte dos indicadores |
| **Conteúdo GRI** | Item de uma norma, com código (ex.: `404-1`). O catálogo privado (130 itens) traz também título e página |
| **Pilar** | A, S ou G. Atribuído **pelo grupo** a cada indicador (o GRI não classifica assim) |
| **Tema** | Um conjunto de dados + indicadores sobre uma pergunta (ex.: T8 "Empregos verdes"). É uma pasta em `temas/` |
| **T8** | Tema do desafio: *Empregos verdes e qualificação para a transição energética* |
| **Contrato de dados** | `contrato.json`: tabelas, colunas, tipos e relações que um tema deve ter |
| **Registro** | `catalogo/indicadores.json`: descreve cada indicador calculável (fórmula como dado) |
| **Medida** | Cada número calculado de um indicador (um indicador pode ter várias; uma é a `principal`) |
| **Nível de maturidade** | catalogado → mapeado → calculável → em painel |
| **Entidade** | Empresa parceira, instituição parceira ou iniciativa própria da Investe Piauí (campo `origem`) |
| **Estoque × fluxo** | Estoque (ex.: empregados no fim do mês) usa **média**; fluxo (ex.: contratações) **soma** |
| **Anualização** | Total de período parcial × 12 ÷ meses com dado, para comparar com anos inteiros |
| **Balanço** | Quantos indicadores de um pilar melhoraram/pioraram/ficaram estáveis vs. ano anterior |
| **Piso / teto** | Valor que dá 0 / 100 pontos na normalização linear (ver `02-…`) |
| **Peso** | Importância relativa de um indicador (ou pilar) na média ponderada |
| **Normalização** | Trazer indicadores de unidades diferentes para uma escala comum (aqui, 0 a 100). Em ciência de dados: *feature scaling* |
| **Min-max** | Normalização linear entre um mínimo e um máximo. Nós usamos limites **fixos** (piso/teto), não os dos dados |
| **Clipping (saturação)** | Travar o resultado nas pontas: abaixo do piso vale 0, acima do teto vale 100 |
| **Z-score** | `(x − média) / desvio`: posição relativa à carteira. Não usado na v1.0 |
| **Percentil** | Fração das entidades com valor menor. Não usado na v1.0 |
| **Agregação compensatória** | Média em que um pilar bom compensa um ruim |
| **Cobertura** | Fração do peso do pilar que tem dado; mostra a confiabilidade da nota |
| **Sensibilidade** | Quanto o resultado muda ao alterar pesos |
| **Fictício** | Todos os dados do repositório. Nunca confundir com resultado real da Investe Piauí |
