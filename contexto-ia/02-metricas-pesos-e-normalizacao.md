# Métricas, pesos e normalização

> **Estado (14/11/2026): versão 1.0 implementada.** A conta está em `src/js/nucleo/pontuacao.js`, os parâmetros em `config/metricas.json`, a apresentação em `src/js/ui/componentes/nota.js` e nas páginas, e os testes em `tests/pontuacao.test.mjs` (comparados com uma referência independente em Python, `tools/referencia_pontuacao.py`). O restante deste arquivo é a especificação, que continua valendo como explicação do modelo.
>
> **Decisões tomadas na implementação:**
> - **Totais absolutos ficam fora da nota** (`C1`, `ES6`, `H1`, marcados com `pontuar:false` e `motivo`): uma empresa grande teria "mais" só por ser grande. Esses indicadores continuam aparecendo como valor. Ideal futuro: medidas proporcionais (por empregado, por MWh).
> - **Piso e teto são fixos** (não saem dos dados), para a nota de uma entidade não mudar quando outra entra.
> - **Parte dos limites foi calibrada olhando os dados fictícios.** Está sinalizado na justificativa e deve ser revisto com dados reais.
> - **Sensibilidade:** a página Empresas compara o ranking com os pesos do arquivo × pesos iguais e avisa quando a ordem muda.
> - Formato real do arquivo: chaves `pesos_pilares`, `faixas`, `rotulos_faixas` e `indicadores.<ID>` com `medida` (opcional), `peso`, `normalizacao {tipo, piso, teto}`, `justificativa`, `fonte`. O validador (`validarMetricas`) rejeita indicador sem justificativa/fonte ou com teto/piso contrários ao sentido do registro.

## Por que pontuar (e por que com cuidado)

A Investe Piauí quer saber se uma entidade "está de acordo" com os critérios. Isso exige transformar indicadores em **unidades diferentes** (%, tCO2e, horas) em algo comparável. É possível, mas **todo peso e todo limite é uma escolha**, sem dado oficial para sustentá-la. Por isso:

1. Os parâmetros são **hipóteses do grupo**, rotuladas como tal na tela.
2. Ficam **todos num único arquivo** (`config/metricas.json`), com justificativa.
3. A tela **mostra a conta** de cada pontuação (valor → normalizado → peso → pilar → ASG).
4. Quem tiver dados reais **troca os parâmetros** sem tocar no código.

## Modelo de cálculo (padrão)

### 1. Normalização linear com piso e teto (por indicador)

Cada indicador recebe um **piso** (valor que vale 0 pontos) e um **teto** (valor que vale 100 pontos), mais um **sentido** (`up`: quanto maior, melhor · `down`: quanto menor, melhor).

```
sentido up:    nota = clamp( (valor − piso) / (teto − piso), 0, 1 ) × 100
sentido down:  nota = clamp( (piso − valor) / (piso − teto), 0, 1 ) × 100     # piso > teto
```

**Por que piso/teto fixos e não min-máx dos dados?** Se o limite vier dos dados da carteira, a nota de uma empresa muda quando *outra* empresa entra, e a comparação deixa de ter significado. Limites fixos e declarados são estáveis, explicáveis e alteráveis. (Alternativas, como z-score ou percentil, dependem da distribuição dos dados reais, que não temos; podem ser opções futuras no mesmo arquivo, por `tipo`.)

### 2. Nota do pilar = média ponderada dos indicadores **com dado**

```
nota_pilar = Σ (peso_i × nota_i) / Σ peso_i          # só i com dado; os pesos são renormalizados
cobertura_pilar = Σ peso_i (com dado) / Σ peso_i (todos do pilar no tema)
```

Dado ausente **não** vira zero. A **cobertura** é exibida junto da nota ("G: 62 · cobertura 60%"), para que um pilar com poucos indicadores não pareça mais confiável do que é.

### 3. Nota ASG geral = média ponderada dos três pilares

Pesos padrão dos pilares: 1/3 cada (editáveis). A página ASG geral mostra a nota geral **e** as três notas, nunca só a geral.

### 4. Classificação por faixas (rótulo, não "aprovação")

| Faixa | Rótulo sugerido |
|---|---|
| ≥ 70 | Alinhado |
| 40 a < 70 | Em atenção |
| < 40 | Crítico |
| sem dados suficientes (cobertura < mínimo) | Sem dados suficientes |

Os cortes (70/40) e a cobertura mínima são **chute inicial do grupo** e ficam no arquivo de configuração.

### 5. Mantém-se o balanço de tendência

A nota mede **nível** (onde está); o balanço (▲▼ vs. ano anterior) mede **tendência** (para onde vai). As duas leituras convivem.

## Normalização: o que usamos e o que ficou de fora

**Normalizar** é trazer variáveis de unidades e escalas diferentes (%, tCO2e, horas) para uma escala comum, para poder compará-las e somá-las. Na ciência de dados isso se chama *feature scaling*.

**O que a versão 1.0 usa:** *min-max com limites fixos e saturação*. É uma função linear por partes: abaixo do piso vale 0, acima do teto vale 100, e entre os dois cresce em linha reta. Quem estudou redes neurais reconhece o formato: é um *clipping* (parecido com o ReLU6 ou o *hard sigmoid*), **não** uma sigmoide. O efeito "espremer valores grandes e esticar valores pequenos" vem de mapear o intervalo [piso, teto] em [0, 100]; valores fora dele são travados nas pontas.

| Técnica | Fórmula | Usada? | Por quê |
|---|---|---|---|
| **Min-max com piso/teto fixos** | `(x − piso) / (teto − piso)`, travada em [0, 1] | ✅ **sim** | Simples de explicar, o limite é declarado e editável, e a nota de uma entidade **não muda** quando outra entra |
| Min-max com mín/máx dos dados | `(x − min) / (max − min)` | ❌ | A nota depende da carteira: entra uma empresa extrema e todas as outras mudam. Um *outlier* esmaga o resto |
| **Z-score** | `(x − média) / desvio` | ❌ ainda | Mede "quantos desvios acima da média", **relativo à carteira**. Com 9 entidades fictícias, média e desvio são instáveis; além disso não diz se o valor é bom em termos absolutos |
| **Percentil / posição** | fração das entidades com valor menor | ❌ ainda | Bom para *ranking* ("está entre os 25% melhores"), mas com poucas entidades dá saltos grandes |
| Escala robusta | `(x − mediana) / IQR` | ❌ | Mais resistente a *outliers* que o z-score; mesma limitação de depender da carteira |
| Log | `log(1 + x)` antes de normalizar | ❌ | Útil para dados muito assimétricos (totais, emissões absolutas). Optamos por **excluir** os totais absolutos (`pontuar:false`) |
| Sigmoide (logística) | `1 / (1 + e^(−k(x−x0)))` | ❌ | Suaviza as pontas, mas é mais difícil de explicar e de editar (exige dois parâmetros sem unidade clara) |

**Regra prática:** limites **fixos** respondem "está de acordo com uma meta?"; técnicas **relativas** (z-score, percentil) respondem "como está em relação aos outros?". Os dois são úteis e **não se substituem**. Os provedores de mercado também separam as duas ideias (ver abaixo).

### Outras escolhas estatísticas da v1.0

- **Média ponderada com renormalização:** indicador sem dado sai da conta e os pesos restantes são reescalados. Dado ausente **nunca** vira zero.
- **Cobertura** (completude dos dados) exibida junto da nota.
- **Agregação compensatória:** na média, um pilar muito bom pode esconder um muito ruim. É uma limitação conhecida; ver "Evoluções" abaixo.
- **Sensibilidade aos pesos:** o ranking é recalculado com pesos iguais e a tela avisa se a ordem muda.
- **Exclusão de totais absolutos** (`C1`, `ES6`, `H1`): dependem do tamanho da entidade, não do desempenho.

## Referências de mercado (comparação, não validação)

Pesquisadas em 14/11/2026. Cada fonte mede outra coisa, com outra escala; servem só para ver a **ordem de grandeza**. As mesmas fontes estão em `config/metricas.json → referencias_externas`.

| Fonte | O que diz |
|---|---|
| [EcoVadis, medalhas](https://support.ecovadis.com/hc/en-us/articles/210460227-Understanding-EcoVadis-Medals-and-Badges) | Medalha por **percentil** (Platinum top 1%, Gold top 5%, Silver top 15%, Bronze top 35%). Notas de corte **indicativas**: 81, 73, 66 e 58 (jul/2024). Selo *Committed* a partir de 45 |
| [ISE B3, metodologia](https://www.b3.com.br/data/files/DB/B2/66/3C/6B6AA71096B63AA7AC094EA8/ISE-Metodologia-pt-br%20vf.pdf) (seção 4.4 e apêndice) | Pontuação qualitativa mínima de **70 pontos percentuais** e nota de corte geral recalculada a cada ciclo com **média e desvio-padrão** dos scores (o texto não informa o valor) |
| [Sustainalytics](https://connect.sustainalytics.com/hubfs/INV/Product%20Brochures/Sustainalytics%20ESG%20Risk%20Ratings.pdf) | Escala de **risco** (menor é melhor): Negligible 0–10, Low 10–20, Medium 20–30, High 30–40, Severe 40+ |

**Conclusão:** não existe um critério universal do tipo "a empresa precisa de 50% ou 75%". Cada provedor define o seu, e os de seleção costumam ser **relativos** (percentil ou desvio-padrão). Os nossos cortes 70/40 estão na mesma vizinhança do mínimo de 70 do ISE e das notas de corte da EcoVadis (58 a 73), mas continuam sendo **hipótese do grupo**.

## Evoluções possíveis (v1.1, não implementadas)

1. **Posição na carteira:** mostrar, ao lado da nota, o **percentil** da entidade entre as demais (leitura relativa, no estilo EcoVadis/ISE). Só faz sentido com mais entidades.
2. **Critério não compensatório:** além da média, exigir "nota geral ≥ X **e** nenhum pilar abaixo de Y" (o ISE exige mínimo por tema). Evita que um pilar excelente esconda um crítico.
3. **Medidas proporcionais** (por empregado, por MWh) para trazer `C1`, `ES6` e `H1` para dentro da nota.
4. **Intervalo de confiança / simulação:** variar pesos, pisos e tetos aleatoriamente (Monte Carlo) e mostrar a faixa em que a nota cai. É a forma probabilística de dizer "quão estável é esta nota".

## Onde ficam os parâmetros: `config/metricas.json`

Formato proposto (o grupo pode refinar, mas **mantenha tudo aqui**):

```jsonc
{
  "versao": 1,
  "aviso": "Parâmetros estimados pelo grupo; não são metas oficiais da Investe Piauí. Ajustar com dados reais.",
  "pesos_pilares": { "A": 1, "S": 1, "G": 1 },
  "faixas": { "alinhado": 70, "atencao": 40, "cobertura_minima": 0.5 },
  "indicadores": {
    "EV1": {
      "medida": "verde",                       // qual medida do indicador é pontuada
      "peso": 2,
      "normalizacao": { "tipo": "linear", "piso": 0.10, "teto": 0.60 },
      "justificativa": "Piso/teto estimados: 10% de empregos verdes é o início da transição; 60% é uma carteira majoritariamente verde.",
      "fonte": "estimativa do grupo"            // ou "GRI 2-7", "literatura: …"
    }
  }
}
```

Regras:

- **Todo indicador pontuado precisa de `justificativa` e `fonte`.** Sem isso, a validação deve acusar erro.
- Indicador sem entrada em `indicadores` **não é pontuado** (aparece como valor, sem nota). É o estado normal de um indicador recém-adicionado.
- O `sentido` vem do registro (`catalogo/indicadores.json`); a normalização só informa piso e teto na direção correta (validar coerência).
- A importação (`R2`) aceita um `metricas.json` do usuário que **substitui** o padrão.

## O que a interface deve mostrar

1. **Página ASG geral:** nota ASG, as três notas de pilar com cobertura e rótulo de faixa; lista curta "o que mais puxa para baixo/cima".
2. **Páginas A, S, G:** nota do pilar; em cada cartão de indicador, o valor, a nota 0–100 e o peso.
3. **Empresas e projetos:** nota A, S, G e geral por entidade (a Investe Piauí incluída), com o rótulo da faixa.
4. **Indicadores e método → "Pontuação":** tabela de todos os parâmetros (piso, teto, peso, justificativa, fonte) e **o caminho do arquivo e a chave** onde editar (ex.: `config/metricas.json → indicadores.EV1`). Um aviso fixo: *"Parâmetros são hipóteses do grupo."*
5. **Demonstração da conta** de uma entidade escolhida: passo a passo numérico (valor → nota → peso → média).

## Análise de sensibilidade (recomendado)

Como os pesos são arbitrários, ajuda mostrar **quanto o resultado depende deles**: ex., recalcular o ranking das entidades com pesos iguais × pesos do arquivo e indicar se a ordem muda. Se mudar muito, avisar na tela. É isso que torna o modelo defensável diante da professora.

## Métricas de governança que o grupo já citou

Exemplos de métricas para fortalecer **G** com dados fictícios: número de ações/iniciativas de integridade e conformidade, demissões (ex.: divergência entre áreas), mulheres em cargos de liderança/órgãos de governança (relaciona-se a GRI 2-9 e 405-1), casos de corrupção confirmados (205-3), capacitação anticorrupção (205-2), multas por não conformidade (2-27). Procure o conteúdo no catálogo, nunca invente código ou página; veja `docs/indicadores-candidatos.md`.

## Testes

- A função de pontuação deve ser **pura** (entrada → saída) e viver em `src/js/nucleo/` (sem HTML).
- Casos mínimos: valor abaixo do piso (0), acima do teto (100), sentido `down`, dado ausente (excluído e pesos renormalizados), cobertura, piso = teto (erro), pilar sem nenhum dado (sem nota).
- Estenda a referência independente em pandas (`tools/referencia_pandas.py`) para as notas, assim o motor não "corrige a si mesmo".
