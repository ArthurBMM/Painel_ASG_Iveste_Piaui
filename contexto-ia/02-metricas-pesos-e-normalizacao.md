# Métricas, pesos e normalização

> **Estado (14/11/2026):** **implementado.** A conta está em `src/js/nucleo/pontuacao.js`, os parâmetros em `config/metricas.json`, a apresentação em `src/js/ui/componentes/nota.js` e nas páginas, e os testes em `tests/pontuacao.test.mjs` (comparados com uma referência independente em Python, `tools/referencia_pontuacao.py`). O restante deste arquivo é a especificação, que continua valendo como explicação do modelo.
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
