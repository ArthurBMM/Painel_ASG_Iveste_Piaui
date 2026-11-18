# Dicionário de indicadores, fórmulas e SCORE ASG

> **Arquivo gerado** por `npm run dicionario` (`tools/gerar_dicionario_indicadores.mjs`) a partir do registro de indicadores (`catalogo/indicadores.json`) e dos parâmetros da nota (`config/metricas.json`). Não edite à mão. As fórmulas abaixo são traduzidas automaticamente das expressões que o motor executa. Versão para Excel: `docs/dicionario-de-indicadores.csv`. As colunas citadas nas fórmulas estão descritas em `docs/dicionario-de-dados.md`.

## 1. SCORE ASG (nota de 0 a 100)

**Passo 1, cada indicador vira uma nota (normalização min-max com limites fixos):**

```
nota_indicador = limitar( (valor − piso) ÷ (teto − piso), 0, 1 ) × 100
```

- **Piso** = valor que vale 0 pontos; **teto** = valor que vale 100. Fora do intervalo, a nota trava em 0 ou 100.
- Quando "menor é melhor" (ex.: emissões, acidentes), o piso é **maior** que o teto, e a mesma fórmula funciona.
- Piso e teto são **fixos** (não saem dos dados): a nota de uma entidade não muda quando outra entra na carteira.

**Passo 2, nota de cada pilar (A, S, G):**

```
nota_pilar = Σ (peso × nota_indicador) ÷ Σ peso        (só indicadores COM dado no recorte)
cobertura  = Σ peso dos indicadores com dado ÷ Σ peso de todos os indicadores pontuáveis do pilar
```

Dado ausente **não vira zero**: sai da média e reduz a cobertura.

**Passo 3, nota ASG geral:**

```
nota_ASG = (1 × nota_A + 1 × nota_S + 1 × nota_G) ÷ 3        (pilares sem nota saem da conta)
```

**Passo 4, faixa:**

| Faixa | Regra |
|---|---|
| Alinhado | nota ≥ 70 |
| Em atenção | 40 ≤ nota < 70 |
| Crítico | nota < 40 |
| Sem dados suficientes | cobertura < 50% |

**Todos os parâmetros (pesos, pisos, tetos, faixas) são hipóteses do grupo**, não metas oficiais, e cada um tem justificativa e fonte em `config/metricas.json`. Indicadores de **total absoluto** (que crescem com o tamanho da empresa) ficam fora da nota. A comparação com referências de mercado (EcoVadis, ISE B3, Sustainalytics) e as técnicas de normalização avaliadas estão em `contexto-ia/02-metricas-pesos-e-normalizacao.md`. O painel mostra a conta passo a passo na aba *Indicadores e método*.

### Como ler as fórmulas

- `Σ tabela.coluna`: soma da coluna nas linhas do recorte (filtros de ano, empresa, projeto, setor, município etc.).
- `média mensal de Σ …`: soma por mês e depois a média entre os meses. É usada para **estoques** (empregados no fim do mês), que não se somam entre meses.
- `(12 ÷ meses com dado)`: anualiza totais de períodos incompletos (ex.: 2026 tem 10 meses).
- `[classe = Verde]`, `[último ano do período]`: filtro fixo da própria fórmula. `ignora o filtro de classe`: a parte da conta que não deve mudar quando o usuário filtra por classe (ex.: o denominador de um percentual).
- Divisão por zero ou falta de dado resultam em **sem dado**, nunca em zero.
- **Percentuais aparecem como fração** nos pisos e tetos: `0,6` = 60%.

## 2. Resumo dos indicadores

| Código | Indicador | Pilar | GRI | Medida da nota | Sentido | Peso | Piso | Teto | Temas |
|---|---|---|---|---|---|---|---|---|---|
| `ES1` | Consumo de energia renovável e não renovável | Ambiental | GRI 302-1 | % de energia renovável | ↑ subir é bom | 2 | 0 | 1 | t8-empregos-verdes, gestao-ambiental |
| `ES2` | Intensidade energética | Ambiental | GRI 302-3 | MWh por empregado (ao ano) | ↓ cair é bom | 1 | 120 | 20 | t8-empregos-verdes, gestao-ambiental |
| `ES3` | Redução do consumo de energia | Ambiental | GRI 302-4 | % de redução do consumo | ↑ subir é bom | 1 | 0 | 0,02 | t8-empregos-verdes, gestao-ambiental |
| `ES4` | Emissões de gases de efeito estufa (escopos 1 e 2) | Ambiental | GRI 305-1, GRI 305-2 | tCO2e por empregado (ao ano) | ↓ cair é bom | 3 | 40 | 1 | t8-empregos-verdes, gestao-ambiental |
| `ES6` | Redução de emissões por iniciativas | Ambiental | GRI 305-5 | fora da nota | – | – | – | – | t8-empregos-verdes, gestao-ambiental |
| `R1` | Resíduos gerados | Ambiental | GRI 306-3 | Resíduos por empregado (t ao ano) | ↓ cair é bom | 1 | 25 | 1 | t8-empregos-verdes, gestao-ambiental |
| `R2` | Resíduos não destinados à disposição final | Ambiental | GRI 306-4 | % de resíduos recuperados | ↑ subir é bom | 1 | 0 | 0,8 | t8-empregos-verdes, gestao-ambiental |
| `A1` | Consumo de água | Ambiental | GRI 303-5 | Água por empregado (ML ao ano) | ↓ cair é bom | 1 | 1,5 | 0,05 | t8-empregos-verdes, gestao-ambiental |
| `H1` | Habitats protegidos ou restaurados | Ambiental | GRI 304-3 | fora da nota | – | – | – | – | t8-empregos-verdes, gestao-ambiental |
| `EV1` | Empregos verdes na força de trabalho | Social | GRI 2-7-a | % de empregos verdes | ↑ subir é bom | 3 | 0,1 | 0,6 | t8-empregos-verdes |
| `EV2` | Novas contratações e taxa de contratação | Social | GRI 401-1-a | Taxa de contratação (ao ano) | ↑ subir é bom | 1 | 0,05 | 0,25 | t8-empregos-verdes |
| `EV3` | Rotatividade de empregados | Social | GRI 401-1-b | Rotatividade (ao ano) | ↓ cair é bom | 1 | 0,4 | 0,1 | t8-empregos-verdes, gestao-ambiental |
| `EV4` | Diversidade nos empregos | Social | GRI 405-1-b | % de mulheres | ↑ subir é bom | 1 | 0,1 | 0,4 | t8-empregos-verdes, gestao-ambiental |
| `Q1` | Horas de capacitação por empregado | Social | GRI 404-1 | Horas de capacitação por empregado (ao ano) | ↑ subir é bom | 2 | 0 | 40 | t8-empregos-verdes, gestao-ambiental |
| `Q2` | Programas de qualificação e transição de carreira | Social | GRI 404-2 | % de concluintes recolocados em vaga verde | ↑ subir é bom | 2 | 0 | 0,6 | t8-empregos-verdes, gestao-ambiental |
| `N1` | Prazo de aviso sobre mudanças operacionais | Social | GRI 402-1 | Prazo médio de aviso (semanas) | ↑ subir é bom | 1 | 0 | 8 | t8-empregos-verdes, gestao-ambiental |
| `C1` | Investimentos em infraestrutura e apoio a serviços | Social | GRI 203-1 | fora da nota | – | – | – | – | t8-empregos-verdes, gestao-ambiental |
| `C3` | Operações com programa para a comunidade local | Social | GRI 413-1 | % de projetos com programa comunitário | ↑ subir é bom | 1 | 0 | 1 | t8-empregos-verdes, gestao-ambiental |
| `SST1` | Acidentes de trabalho | Social | GRI 403-9 | Acidentes por 1 milhão de horas trabalhadas | ↓ cair é bom | 2 | 15 | 0 | t8-empregos-verdes |
| `Q3` | Empregados com avaliação regular de desempenho | Governança | GRI 404-3 | % de empregados avaliados | ↑ subir é bom | 1 | 0 | 1 | t8-empregos-verdes, gestao-ambiental |
| `T1` | Direcionamento do investimento para a transição | Governança | GRI 201-2, GRI 11, GRI 12 | % do investimento em renovável | ↑ subir é bom | 2 | 0 | 1 | t8-empregos-verdes, gestao-ambiental |
| `M1` | Planejamento de encerramento das minas | Governança | GRI 14 | % das minas com plano de encerramento | ↑ subir é bom | 1 | 0 | 1 | t8-empregos-verdes |
| `CL1` | Conformidade com leis e regulamentos | Governança | GRI 2-27 | % de projetos com multa no ano | ↓ cair é bom | 2 | 0,5 | 0 | t8-empregos-verdes |
| `AC1` | Casos confirmados de corrupção | Governança | GRI 205-3 | % de projetos com caso de corrupção no ano | ↓ cair é bom | 2 | 0,25 | 0 | t8-empregos-verdes |
| `AC2` | Capacitação em políticas anticorrupção | Governança | GRI 205-2 | % de gestores capacitados em anticorrupção | ↑ subir é bom | 1 | 0,2 | 0,9 | t8-empregos-verdes |
| `PO1` | Compromissos de política | Governança | GRI 2-23 | % das 3 políticas adotadas | ↑ subir é bom | 1 | 0 | 1 | t8-empregos-verdes |

## 3. Indicadores em detalhe

## Ambiental (9 indicadores)

### `ES1` · Consumo de energia renovável e não renovável

**Pilar:** Ambiental · **GRI:** GRI 302-1 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra o avanço da matriz energética das operações.

**Como é calculado:** % renovável = MWh renovável ÷ (renovável + não renovável) no período.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `ES1.pct_renovavel` (principal) | % de energia renovável | % | ↑ subir é bom | Σ energia_emissoes.energia_renovavel_mwh ÷ (Σ energia_emissoes.energia_renovavel_mwh + Σ energia_emissoes.energia_nao_renovavel_mwh) |
| `ES1.renovavel` | Energia renovável (MWh) | MWh | ↑ subir é bom | Σ energia_emissoes.energia_renovavel_mwh |

**Na nota ASG:** pontua `ES1.pct_renovavel` com **peso 2**, **piso 0** (vale 0) e **teto 1** (vale 100). Nota = (valor − 0) ÷ (1 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 2. % de energia renovável no consumo; proporção natural (0% a 100%). *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `ES2` · Intensidade energética

**Pilar:** Ambiental · **GRI:** GRI 302-3 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Normaliza o consumo de energia pelo tamanho da equipe, para comparar projetos de portes diferentes.

**Como é calculado:** MWh anuais por empregado = (renovável + não renovável) × (12 ÷ meses com dado) ÷ empregados (média mensal).

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `ES2.mwh_por_empregado` (principal) | MWh por empregado (ao ano) | MWh | ↓ cair é bom | ((Σ energia_emissoes.energia_renovavel_mwh + Σ energia_emissoes.energia_nao_renovavel_mwh) × (12 ÷ meses com dado)) ÷ média mensal de Σ emprego_mensal.empregados_fim_mes |

**Na nota ASG:** pontua `ES2.mwh_por_empregado` com **peso 1**, **piso 120** (vale 0) e **teto 20** (vale 100), ou seja, menor é melhor. Nota = (valor − 120) ÷ (20 − 120) × 100, limitada a 0–100.

*Justificativa:* Peso 1. MWh por empregado ao ano (menor é melhor). 120 ou mais vale 0 e 20 ou menos vale 100; limites escolhidos em torno da faixa observada nos dados fictícios, a rever com dados reais. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `ES3` · Redução do consumo de energia

**Pilar:** Ambiental · **GRI:** GRI 302-4 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra o resultado de iniciativas de eficiência energética.

**Como é calculado:** % de redução = MWh economizados por iniciativas ÷ consumo total de energia no período.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `ES3.pct_reducao` (principal) | % de redução do consumo | % | ↑ subir é bom | Σ energia_emissoes.reducao_consumo_mwh ÷ (Σ energia_emissoes.energia_renovavel_mwh + Σ energia_emissoes.energia_nao_renovavel_mwh) |

**Na nota ASG:** pontua `ES3.pct_reducao` com **peso 1**, **piso 0** (vale 0) e **teto 0,02** (vale 100). Nota = (valor − 0) ÷ (0,02 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 1. % de redução do consumo de energia; 0% vale 0 e 2% ao ano vale 100 (hipótese do grupo para uma redução ambiciosa). A validar com dados reais. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `ES4` · Emissões de gases de efeito estufa (escopos 1 e 2)

**Pilar:** Ambiental · **GRI:** GRI 305-1, GRI 305-2 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Normaliza as emissões pelo tamanho da equipe: é a pegada de carbono por posto de trabalho.

**Como é calculado:** tCO2e anuais por empregado = (escopo 1 + escopo 2) × (12 ÷ meses com dado) ÷ empregados (média mensal).

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `ES4.tco2e_por_empregado` (principal) | tCO2e por empregado (ao ano) | tCO2e | ↓ cair é bom | ((Σ energia_emissoes.emissoes_escopo1_tco2e + Σ energia_emissoes.emissoes_escopo2_tco2e) × (12 ÷ meses com dado)) ÷ média mensal de Σ emprego_mensal.empregados_fim_mes |
| `ES4.total` | Emissões escopos 1+2 (tCO2e) | tCO2e | ↓ cair é bom | Σ energia_emissoes.emissoes_escopo1_tco2e + Σ energia_emissoes.emissoes_escopo2_tco2e |

**Na nota ASG:** pontua `ES4.tco2e_por_empregado` com **peso 3**, **piso 40** (vale 0) e **teto 1** (vale 100), ou seja, menor é melhor. Nota = (valor − 40) ÷ (1 − 40) × 100, limitada a 0–100.

*Justificativa:* Peso 3: emissões são o núcleo ambiental da transição energética. tCO2e por empregado ao ano (menor é melhor). 40 ou mais vale 0 e 1 ou menos vale 100; limites em torno da faixa observada nos dados fictícios. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `ES6` · Redução de emissões por iniciativas

**Pilar:** Ambiental · **GRI:** GRI 305-5 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra o resultado de iniciativas de descarbonização.

**Como é calculado:** tCO2e anuais evitados = redução de emissões do período × (12 ÷ meses com dado).

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `ES6.reducao_ano` (principal) | Redução de emissões (tCO2e ao ano) | tCO2e | ↑ subir é bom | Σ energia_emissoes.reducao_emissoes_tco2e × (12 ÷ meses com dado) |

**Fora da nota ASG:** Total absoluto de tCO2e reduzidas: cresce com o tamanho da entidade. Sem nota até existir medida proporcional.

### `R1` · Resíduos gerados

**Pilar:** Ambiental · **GRI:** GRI 306-3 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Liga o emprego ao desempenho ambiental: quanto resíduo cada posto de trabalho gera.

**Como é calculado:** t anuais por empregado = (perigosos + não perigosos) × (12 ÷ meses com dado) ÷ empregados (média mensal).

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `R1.por_empregado` (principal) | Resíduos por empregado (t ao ano) | t | ↓ cair é bom | ((Σ ambiental_mensal.residuos_perigosos_ton + Σ ambiental_mensal.residuos_nao_perigosos_ton) × (12 ÷ meses com dado)) ÷ média mensal de Σ emprego_mensal.empregados_fim_mes |
| `R1.gerados` | Resíduos gerados (t) | t | ↓ cair é bom | Σ ambiental_mensal.residuos_perigosos_ton + Σ ambiental_mensal.residuos_nao_perigosos_ton |

**Na nota ASG:** pontua `R1.por_empregado` com **peso 1**, **piso 25** (vale 0) e **teto 1** (vale 100), ou seja, menor é melhor. Nota = (valor − 25) ÷ (1 − 25) × 100, limitada a 0–100.

*Justificativa:* Peso 1. Toneladas de resíduos por empregado ao ano (menor é melhor). 25 ou mais vale 0 e 1 ou menos vale 100. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `R2` · Resíduos não destinados à disposição final

**Pilar:** Ambiental · **GRI:** GRI 306-4 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra quanto do resíduo é recuperado em vez de ir para aterro ou descarte.

**Como é calculado:** % recuperados = resíduos recuperados ÷ resíduos gerados.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `R2.pct_recuperados` (principal) | % de resíduos recuperados | % | ↑ subir é bom | Σ ambiental_mensal.residuos_recuperados_ton ÷ (Σ ambiental_mensal.residuos_perigosos_ton + Σ ambiental_mensal.residuos_nao_perigosos_ton) |

**Na nota ASG:** pontua `R2.pct_recuperados` com **peso 1**, **piso 0** (vale 0) e **teto 0,8** (vale 100). Nota = (valor − 0) ÷ (0,8 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 1. % de resíduos recuperados (não enviados à disposição final); 0% vale 0 e 80% vale 100. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `A1` · Consumo de água

**Pilar:** Ambiental · **GRI:** GRI 303-5 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Liga o emprego ao uso de água, um recurso crítico no semiárido piauiense.

**Como é calculado:** ML anuais por empregado = consumo × (12 ÷ meses com dado) ÷ empregados (média mensal).

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `A1.agua_por_empregado` (principal) | Água por empregado (ML ao ano) | ML | ↓ cair é bom | (Σ ambiental_mensal.consumo_agua_megalitros × (12 ÷ meses com dado)) ÷ média mensal de Σ emprego_mensal.empregados_fim_mes |

**Na nota ASG:** pontua `A1.agua_por_empregado` com **peso 1**, **piso 1,5** (vale 0) e **teto 0,05** (vale 100), ou seja, menor é melhor. Nota = (valor − 1,5) ÷ (0,05 − 1,5) × 100, limitada a 0–100.

*Justificativa:* Peso 1. Megalitros de água por empregado ao ano (menor é melhor). 1,5 ML ou mais vale 0 e 0,05 ML ou menos vale 100. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `H1` · Habitats protegidos ou restaurados

**Pilar:** Ambiental · **GRI:** GRI 304-3 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra a entrega de restauração ambiental, normalmente feita por empregos verdes.

**Como é calculado:** ha anuais = habitat restaurado no período × (12 ÷ meses com dado).

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `H1.ha_ano` (principal) | Habitat restaurado (ha ao ano) | ha | ↑ subir é bom | Σ ambiental_mensal.habitat_restaurado_ha × (12 ÷ meses com dado) |

**Fora da nota ASG:** Total absoluto de hectares restaurados: cresce com o tamanho da entidade (e do território). Sem nota até existir medida proporcional (ex.: por MW instalado).

## Social (10 indicadores)

### `EV1` · Empregos verdes na força de trabalho

**Pilar:** Social · **GRI:** GRI 2-7-a · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes

**Por que importa:** Mede o tamanho da força de trabalho e quanto dela já está em empregos verdes ou ainda em atividade de alto impacto. É o termômetro da transição justa: social no efeito, ambiental na direção.

**Como é calculado:** Empregados = média dos meses do total de empregados no fim de cada mês (estoque, nunca soma de meses). % por classe = média mensal da classe ÷ média mensal total. A classe (Verde, Neutra, Alto impacto) é critério do grupo, aplicado só pela ocupação.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `EV1.verde` (principal) | % de empregos verdes | % | ↑ subir é bom | média mensal de Σ emprego_mensal.empregados_fim_mes [classe = Verde; ignora o filtro de classe] ÷ média mensal de Σ emprego_mensal.empregados_fim_mes [ignora o filtro de classe] |
| `EV1.alto_impacto` | % em alto impacto | % | ↓ cair é bom | média mensal de Σ emprego_mensal.empregados_fim_mes [classe = Alto impacto; ignora o filtro de classe] ÷ média mensal de Σ emprego_mensal.empregados_fim_mes [ignora o filtro de classe] |
| `EV1.neutra` | % em ocupações neutras | % | – | média mensal de Σ emprego_mensal.empregados_fim_mes [classe = Neutra; ignora o filtro de classe] ÷ média mensal de Σ emprego_mensal.empregados_fim_mes [ignora o filtro de classe] |
| `EV1.empregados` | Empregados (média mensal) |  | – | média mensal de Σ emprego_mensal.empregados_fim_mes |

**Na nota ASG:** pontua `EV1.verde` com **peso 3**, **piso 0,1** (vale 0) e **teto 0,6** (vale 100). Nota = (valor − 0,1) ÷ (0,6 − 0,1) × 100, limitada a 0–100.

*Justificativa:* Peso 3: é a pergunta central do T8 (transição de empregos). Piso 10%: carteira praticamente sem empregos verdes; teto 60%: carteira em que a maioria dos empregos já é verde. Valores intermediários são proporcionais. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `EV2` · Novas contratações e taxa de contratação

**Pilar:** Social · **GRI:** GRI 401-1-a · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes

**Por que importa:** Mostra se os projetos estão criando vagas, que é a face social do investimento.

**Como é calculado:** Taxa anual = contratações do período × (12 ÷ meses com dado) ÷ empregados (média mensal). A anualização deixa períodos de tamanhos diferentes comparáveis.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `EV2.taxa` (principal) | Taxa de contratação (ao ano) | % | ↑ subir é bom | (Σ emprego_mensal.contratacoes × (12 ÷ meses com dado)) ÷ média mensal de Σ emprego_mensal.empregados_fim_mes |
| `EV2.contratacoes` | Contratações (nº) |  | ↑ subir é bom | Σ emprego_mensal.contratacoes |

**Na nota ASG:** pontua `EV2.taxa` com **peso 1**, **piso 0,05** (vale 0) e **teto 0,25** (vale 100). Nota = (valor − 0,05) ÷ (0,25 − 0,05) × 100, limitada a 0–100.

*Justificativa:* Peso 1. Taxa de contratação ao ano como sinal de geração de vagas. Piso 5% (quase sem contratar) e teto 25% (expansão forte). Ser alta não é sempre bom (ver rotatividade, EV3); por isso o peso é baixo. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `EV3` · Rotatividade de empregados

**Pilar:** Social · **GRI:** GRI 401-1-b · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra a estabilidade do emprego, incluindo o choque de desligamentos da eólica em fev/2025.

**Como é calculado:** Taxa anual = desligamentos do período × (12 ÷ meses com dado) ÷ empregados (média mensal).

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `EV3.taxa` (principal) | Rotatividade (ao ano) | % | ↓ cair é bom | (Σ emprego_mensal.desligamentos × (12 ÷ meses com dado)) ÷ média mensal de Σ emprego_mensal.empregados_fim_mes |
| `EV3.desligamentos` | Desligamentos (nº) |  | ↓ cair é bom | Σ emprego_mensal.desligamentos |

**Na nota ASG:** pontua `EV3.taxa` com **peso 1**, **piso 0,4** (vale 0) e **teto 0,1** (vale 100), ou seja, menor é melhor. Nota = (valor − 0,4) ÷ (0,1 − 0,4) × 100, limitada a 0–100.

*Justificativa:* Peso 1. Rotatividade ao ano; quanto menor, melhor (piso > teto). 40% ou mais ao ano vale 0 pontos; 10% ou menos vale 100. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `EV4` · Diversidade nos empregos

**Pilar:** Social · **GRI:** GRI 405-1-b · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra quem ocupa os empregos: a transição só é justa se o emprego novo não excluir mulheres nem faixas etárias.

**Como é calculado:** % de mulheres = média mensal de empregadas ÷ média mensal total. O recorte por faixa etária usa o filtro de faixa.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `EV4.mulheres` (principal) | % de mulheres | % | ↑ subir é bom | média mensal de Σ emprego_mensal.empregados_fim_mes [genero = F; ignora o filtro de genero] ÷ média mensal de Σ emprego_mensal.empregados_fim_mes [ignora o filtro de genero] |

**Na nota ASG:** pontua `EV4.mulheres` com **peso 1**, **piso 0,1** (vale 0) e **teto 0,4** (vale 100). Nota = (valor − 0,1) ÷ (0,4 − 0,1) × 100, limitada a 0–100.

*Justificativa:* Peso 1. % de mulheres. Piso 10%; teto 40%. O teto fica abaixo de 50% porque o grupo considera o ponto de partida dos setores de energia e mineração; hipótese a rever com a Investe Piauí. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `Q1` · Horas de capacitação por empregado

**Pilar:** Social · **GRI:** GRI 404-1 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Compara o investimento em formação entre classes de emprego: sem capacitação não há migração de quem sai da atividade de alto impacto.

**Como é calculado:** Horas anuais = horas de capacitação × (12 ÷ meses com dado) ÷ empregados (média mensal). A tabela de capacitação não tem faixa etária, então o filtro de faixa devolve vazio.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `Q1.horas_por_empregado` (principal) | Horas de capacitação por empregado (ao ano) | h | ↑ subir é bom | (Σ capacitacao.horas_capacitacao × (12 ÷ meses com dado)) ÷ média mensal de Σ emprego_mensal.empregados_fim_mes |
| `Q1.horas_total` | Horas de capacitação (total) | h | ↑ subir é bom | Σ capacitacao.horas_capacitacao |

**Na nota ASG:** pontua `Q1.horas_por_empregado` com **peso 2**, **piso 0** (vale 0) e **teto 40** (vale 100). Nota = (valor − 0) ÷ (40 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 2: qualificação é o segundo eixo do T8. Horas de capacitação por empregado ao ano; 0 h vale 0 e 40 h (cerca de uma semana de trabalho) vale 100. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `Q2` · Programas de qualificação e transição de carreira

**Pilar:** Social · **GRI:** GRI 404-2 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra se quem sai da mineração é de fato requalificado e recolocado em função verde. A transição é incompleta: só parte dos concluintes é recontratada.

**Como é calculado:** Taxa de conclusão = concluintes ÷ vagas. % recolocados = contratados em vaga verde ÷ concluintes. Programas contam no mês de início.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `Q2.recolocados_verde` (principal) | % de concluintes recolocados em vaga verde | % | ↑ subir é bom | Σ programas.contratados_verde ÷ Σ programas.concluintes |
| `Q2.taxa_conclusao` | Taxa de conclusão dos programas | % | ↑ subir é bom | Σ programas.concluintes ÷ Σ programas.vagas |
| `Q2.programas` | Programas iniciados |  | ↑ subir é bom | nº de programa_id distintos em programas |
| `Q2.concluintes` | Concluintes |  | ↑ subir é bom | Σ programas.concluintes |

**Na nota ASG:** pontua `Q2.recolocados_verde` com **peso 2**, **piso 0** (vale 0) e **teto 0,6** (vale 100). Nota = (valor − 0) ÷ (0,6 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 2: mede se a qualificação vira vaga verde. % de concluintes recolocados em vaga verde; 0% vale 0 e 60% vale 100 (meta ambiciosa para um programa de transição). *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `N1` · Prazo de aviso sobre mudanças operacionais

**Pilar:** Social · **GRI:** GRI 402-1 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mede a proteção do trabalhador quando a operação muda ou fecha, parte central de uma transição justa.

**Como é calculado:** Média, entre os projetos selecionados, do prazo mínimo de aviso (em semanas) no último ano do período.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `N1.prazo_aviso` (principal) | Prazo médio de aviso (semanas) | sem. | ↑ subir é bom | média de comunidade.prazo_aviso_semanas [último ano do período] |

**Na nota ASG:** pontua `N1.prazo_aviso` com **peso 1**, **piso 0** (vale 0) e **teto 8** (vale 100). Nota = (valor − 0) ÷ (8 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 1. Prazo de aviso sobre mudanças operacionais, em semanas. 0 vale 0 e 8 semanas vale 100; 4 semanas (aprox. 1 mês) fica em 50. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `C1` · Investimentos em infraestrutura e apoio a serviços

**Pilar:** Social · **GRI:** GRI 203-1 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra o retorno ao território onde os projetos operam.

**Como é calculado:** Soma do investimento em infraestrutura nos anos do período selecionado.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `C1.investimento` (principal) | Investimento em infraestrutura |  | ↑ subir é bom | Σ comunidade.investimento_infraestrutura_rs |

**Fora da nota ASG:** Total absoluto em reais: cresce com o tamanho da entidade e não é comparável entre empresas. Fica como valor, sem nota, até existir medida proporcional (ex.: por empregado ou por MW).

### `C3` · Operações com programa para a comunidade local

**Pilar:** Social · **GRI:** GRI 413-1 · **Cobertura do GRI:** completa · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra o engajamento local: se a transição acontece com a comunidade e não apesar dela.

**Como é calculado:** % de projetos com programa = linhas projeto-ano com programa ÷ total de linhas projeto-ano, nos anos do período.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `C3.pct_com_programa` (principal) | % de projetos com programa comunitário | % | ↑ subir é bom | nº de linhas de comunidade [tem_programa_comunidade = Sim] ÷ nº de linhas de comunidade |

**Na nota ASG:** pontua `C3.pct_com_programa` com **peso 1**, **piso 0** (vale 0) e **teto 1** (vale 100). Nota = (valor − 0) ÷ (1 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 1. % de projetos com programa para a comunidade local; já é uma proporção natural (0% a 100%). *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `SST1` · Acidentes de trabalho

**Pilar:** Social · **GRI:** GRI 403-9 · **Cobertura do GRI:** parcial · **Temas:** t8-empregos-verdes

**Por que importa:** Emprego verde só é bom se for seguro: mede quantas lesões de trabalho acontecem a cada milhão de horas trabalhadas, o que permite comparar projetos grandes e pequenos e mostra onde a transição ainda traz risco para quem trabalha.

**Como é calculado:** Taxa de frequência = acidentes registráveis × 1.000.000 ÷ horas trabalhadas, somando os anos que o período selecionado alcança (a tabela é anual). Mostra também o total de acidentes e de dias perdidos.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `SST1.taxa_frequencia` (principal) | Acidentes por 1 milhão de horas trabalhadas | por 1 mi h | ↓ cair é bom | (Σ seguranca.acidentes_registraveis × 1.000.000) ÷ Σ seguranca.horas_trabalhadas |
| `SST1.acidentes` | Acidentes registráveis no período | acidentes | ↓ cair é bom | Σ seguranca.acidentes_registraveis |
| `SST1.dias_perdidos` | Dias de trabalho perdidos no período | dias | ↓ cair é bom | Σ seguranca.dias_perdidos |

**Na nota ASG:** pontua `SST1.taxa_frequencia` com **peso 2**, **piso 15** (vale 0) e **teto 0** (vale 100), ou seja, menor é melhor. Nota = (valor − 15) ÷ (0 − 15) × 100, limitada a 0–100.

*Justificativa:* Peso 2: a segurança de quem trabalha é o sinal social mais direto de que o emprego criado é bom, por isso pesa mais que a maioria dos indicadores sociais. Menor é melhor: piso 15 (15 ou mais acidentes por milhão de horas vale 0; a mineração fictícia chega a cerca de 16 em 2023) e teto 0 (nenhum acidente vale 100). Limites em torno da faixa observada nos dados fictícios, a rever com dados reais. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

## Governança (7 indicadores)

### `Q3` · Empregados com avaliação regular de desempenho

**Pilar:** Governança · **GRI:** GRI 404-3 · **Cobertura do GRI:** parcial · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra se há gestão formal de desempenho e carreira, uma prática de governança de pessoas.

**Como é calculado:** Para cada mês: avaliados ÷ empregados; depois, a média entre os meses.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `Q3.pct_avaliados` (principal) | % de empregados avaliados | % | ↑ subir é bom | média, mês a mês, de (Σ capacitacao.empregados_avaliados ÷ Σ emprego_mensal.empregados_fim_mes) |

**Na nota ASG:** pontua `Q3.pct_avaliados` com **peso 1**, **piso 0** (vale 0) e **teto 1** (vale 100). Nota = (valor − 0) ÷ (1 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 1. % de empregados com avaliação regular de desempenho; proporção natural (0% a 100%). *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `T1` · Direcionamento do investimento para a transição

**Pilar:** Governança · **GRI:** GRI 201-2, GRI 11, GRI 12 · **Cobertura do GRI:** parcial · **Temas:** t8-empregos-verdes, gestao-ambiental

**Por que importa:** Mostra quanto do capital vai para a transição: é decisão de estratégia e governança, não de operação.

**Como é calculado:** % do investimento em renovável = investimento em renováveis ÷ investimento total, nos anos do período.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `T1.pct_renovavel` (principal) | % do investimento em renovável | % | ↑ subir é bom | Σ comunidade.investimento_renovavel_rs ÷ Σ comunidade.investimento_total_rs |

**Na nota ASG:** pontua `T1.pct_renovavel` com **peso 2**, **piso 0** (vale 0) e **teto 1** (vale 100). Nota = (valor − 0) ÷ (1 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 2: é o indicador de governança mais ligado ao tema (direcionamento do investimento para a transição). % do investimento em renovável; 0% a 100%. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `M1` · Planejamento de encerramento das minas

**Pilar:** Governança · **GRI:** GRI 14 · **Cobertura do GRI:** parcial · **Temas:** t8-empregos-verdes

**Por que importa:** Mostra se a saída da atividade de alto impacto foi planejada: encerramento sem plano é risco social e ambiental.

**Como é calculado:** % das minas com plano = minas com plano de encerramento ÷ minas (as demais atividades não se aplicam), no último ano do período.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `M1.pct_com_plano` (principal) | % das minas com plano de encerramento | % | ↑ subir é bom | nº de linhas de comunidade [tem_plano_encerramento = Sim; último ano do período] ÷ nº de linhas de comunidade [tem_plano_encerramento = [object Object]; último ano do período] |

**Na nota ASG:** pontua `M1.pct_com_plano` com **peso 1**, **piso 0** (vale 0) e **teto 1** (vale 100). Nota = (valor − 0) ÷ (1 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 1. % das minas com plano de encerramento; só existe para projetos de mineração (outros setores ficam sem dado e não entram na média). *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `CL1` · Conformidade com leis e regulamentos

**Pilar:** Governança · **GRI:** GRI 2-27 · **Cobertura do GRI:** parcial · **Temas:** t8-empregos-verdes

**Por que importa:** Multas e sanções mostram se a operação cumpre as leis ambientais, trabalhistas e de licenciamento: é o teste mais direto de governança na prática.

**Como é calculado:** % de projetos com ao menos uma multa = projetos com multa no ano ÷ projetos com dado de conformidade, no último ano do período. O total de multas soma o período inteiro.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `CL1.pct_com_multa` (principal) | % de projetos com multa no ano | % | ↓ cair é bom | nº de linhas de conformidade [teve_multa = Sim; último ano do período] ÷ nº de linhas de conformidade [último ano do período] |
| `CL1.multas_total` | Multas e sanções no período | multas | ↓ cair é bom | Σ conformidade.multas_qtd |

**Na nota ASG:** pontua `CL1.pct_com_multa` com **peso 2**, **piso 0,5** (vale 0) e **teto 0** (vale 100), ou seja, menor é melhor. Nota = (valor − 0,5) ÷ (0 − 0,5) × 100, limitada a 0–100.

*Justificativa:* Peso 2: multas e sanções são o sinal mais direto de falha de conformidade, por isso pesa mais que os demais de Governança. Menor é melhor: piso 50% (metade ou mais dos projetos multados no ano vale 0) e teto 0% (nenhum projeto multado vale 100). *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `AC1` · Casos confirmados de corrupção

**Pilar:** Governança · **GRI:** GRI 205-3 · **Cobertura do GRI:** parcial · **Temas:** t8-empregos-verdes

**Por que importa:** Um caso confirmado de corrupção é falha grave de governança e risco direto para a reputação e para o acesso a financiamento.

**Como é calculado:** % de projetos com ao menos um caso confirmado = projetos com caso no ano ÷ projetos com dado, no último ano do período. O total de casos soma o período inteiro.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `AC1.pct_com_caso` (principal) | % de projetos com caso de corrupção no ano | % | ↓ cair é bom | nº de linhas de integridade [teve_caso_corrupcao = Sim; último ano do período] ÷ nº de linhas de integridade [último ano do período] |
| `AC1.casos_total` | Casos confirmados no período | casos | ↓ cair é bom | Σ integridade.casos_corrupcao |

**Na nota ASG:** pontua `AC1.pct_com_caso` com **peso 2**, **piso 0,25** (vale 0) e **teto 0** (vale 100), ou seja, menor é melhor. Nota = (valor − 0,25) ÷ (0 − 0,25) × 100, limitada a 0–100.

*Justificativa:* Peso 2: corrupção confirmada é a falha de governança mais grave. Menor é melhor: piso 25% (um em cada quatro projetos com caso no ano vale 0) e teto 0% (nenhum projeto com caso vale 100). *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `AC2` · Capacitação em políticas anticorrupção

**Pilar:** Governança · **GRI:** GRI 205-2 · **Cobertura do GRI:** parcial · **Temas:** t8-empregos-verdes

**Por que importa:** Políticas só funcionam se quem decide as conhece: mede quanto da liderança foi capacitada para reconhecer e evitar corrupção.

**Como é calculado:** % de gestores capacitados = gestores capacitados em anticorrupção ÷ gestores e membros da direção, no último ano do período.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `AC2.pct_capacitados` (principal) | % de gestores capacitados em anticorrupção | % | ↑ subir é bom | Σ integridade.gestores_capacitados_anticorrupcao [último ano do período] ÷ Σ integridade.gestores_total [último ano do período] |

**Na nota ASG:** pontua `AC2.pct_capacitados` com **peso 1**, **piso 0,2** (vale 0) e **teto 0,9** (vale 100). Nota = (valor − 0,2) ÷ (0,9 − 0,2) × 100, limitada a 0–100.

*Justificativa:* Peso 1. Maior é melhor: piso 20% (poucos gestores capacitados vale 0) e teto 90% (quase toda a liderança capacitada vale 100). 100% foi evitado como teto porque há rotatividade de gestores ao longo do ano. *Fonte:* estimativa do grupo (a validar com a Investe Piauí).

### `PO1` · Compromissos de política

**Pilar:** Governança · **GRI:** GRI 2-23 · **Cobertura do GRI:** parcial · **Temas:** t8-empregos-verdes

**Por que importa:** Compromissos formais (ambiental, direitos humanos e anticorrupção) são o ponto de partida de uma governança responsável: sem política escrita não há o que cobrar.

**Como é calculado:** % de políticas adotadas = políticas existentes ÷ (3 × projetos com dado), no último ano do período. As três políticas são ambiental, direitos humanos e anticorrupção.

| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |
|---|---|---|---|---|
| `PO1.pct_politicas` (principal) | % das 3 políticas adotadas | % | ↑ subir é bom | Σ integridade.politicas_adotadas_qtd [último ano do período] ÷ (nº de linhas de integridade [último ano do período] × 3) |

**Na nota ASG:** pontua `PO1.pct_politicas` com **peso 1**, **piso 0** (vale 0) e **teto 1** (vale 100). Nota = (valor − 0) ÷ (1 − 0) × 100, limitada a 0–100.

*Justificativa:* Peso 1. Proporção natural de 0% (nenhuma das três políticas) a 100% (ambiental, direitos humanos e anticorrupção em todos os projetos). *Fonte:* estimativa do grupo (a validar com a Investe Piauí).
