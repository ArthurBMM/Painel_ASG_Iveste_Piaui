# Arquitetura

## Ideia central

> O conhecimento sobre indicadores vive em **dados** (JSON), não em código. O código é um **motor genérico** que lê esses dados.

Vantagem: adicionar o indicador GRI 403-9 é editar `catalogo/indicadores.json`, não escrever uma tela nova.
Custo: o interpretador de fórmulas (`avaliador.js`) é mais abstrato do que uma função por indicador. Em troca, ele é testado uma vez e vale para todos.

## Fluxo de dados

```
temas/<tema>/dados/*.csv ──► modelo.js ──► contexto.js ──► avaliador.js ──► registro.js ──► ui/paginas/*
        (+ contrato.json)     lê, valida    aplica filtros   executa a        junta com GRI,    desenha HTML
                              e indexa      (ano, empresa…)  fórmula          variação, balanço
catalogo/indicadores.json ───────────────────────────────────► (fórmulas e metadados)
privado/gri_catalogo.json (opcional, FORA do Git) ──► tela "Indicadores e método" (130 conteúdos) e páginas nos cartões
```

| Arquivo | Responsabilidade |
|---|---|
| `nucleo/csv.js` | Lê CSV (aspas, vírgulas) e converte para objetos |
| `nucleo/modelo.js` | Carrega o tema, valida contra o contrato (erros e avisos), monta índices de projetos, ocupações, empresas e meses |
| `nucleo/contexto.js` | "Quais linhas valem agora?": período, origem, empresa, projeto, setor, município, classe |
| `nucleo/avaliador.js` | Interpreta a árvore de expressão de uma medida (`soma`, `estoque_medio`, `razao`…) |
| `nucleo/registro.js` | Une catálogo + indicadores; calcula variação, balanço por pilar e níveis de maturidade |
| `nucleo/formato.js` | Formatação pt-BR (percentual, número, delta em pp) e cor pelo *sentido* |
| `nucleo/series.js` | Séries mensais/anuais para gráficos |
| `ui/app.js` | Casca: abas (rota por `#hash`), filtros, redesenho |
| `ui/paginas/*` | `visao`, `pilar` (A/S/G), `empresas`, `metodo` |
| `ui/componentes/*` | cartão de indicador, gráficos SVG, bloco de balanço |

Redesenhamos a página inteira a cada filtro: com milhares de linhas é instantâneo, e o código fica muito mais simples do que atualizar pedaços.

## Regras de cálculo (herdadas do Power BI/DAX e testadas)

1. **Estoque × fluxo.** Empregados é *estoque*: usa a **média dos meses**, nunca a soma (`estoque_medio`). Contratações, horas, emissões são *fluxo*: somam.
2. **Anualização.** Um total de 10 meses não se compara a um de 12. Total de período parcial é multiplicado por `12 ÷ meses com dado`. Razões (percentuais) não precisam.
3. **Nulo ≠ zero.** Sem dado é "—", não 0 (equivalente ao BLANK do DAX).
4. **Variação contra o ano anterior** só quando o período escolhido é exatamente **um ano**; o ano anterior é sempre o ano inteiro. Medidas marcadas `depende_do_periodo` não são comparadas em ano parcial.
5. **Cor pelo sentido, não pelo sinal.** Em emissões, subir é ruim (vermelho). O campo `sentido` (`up`/`down`/`neutro`) decide.
6. **Guardas de filtro.** Indicadores `ocupacional` respeitam o filtro de classe (verde/neutra/alto impacto); os que não são por ocupação ignoram esse filtro; `bloqueia_faixa` impede mostrar faixa etária onde não faz sentido.
7. **Balanço do pilar** = quantos indicadores melhoraram, pioraram ou ficaram estáveis vs. ano anterior (leitura de **tendência**).
8. **Pontuação** (`nucleo/pontuacao.js`, implementada): nota 0–100 por normalização linear com piso/teto fixos, média ponderada por pilar com renormalização dos pesos quando falta dado, e **cobertura** exibida junto. Totais absolutos (`pontuar:false`) ficam fora da nota. Parâmetros em `config/metricas.json`. Ver `contexto-ia/02-metricas-pesos-e-normalizacao.md` e `decisoes.md` (D5).

## Como um indicador é descrito (resumo)

```jsonc
{
  "id": "EV1", "pilar": "S", "titulo": "...",
  "gri": [{ "id": "2-7:2021", "parte": "a" }],     // ligação com o catálogo (código:versão)
  "por_que_asg": "...", "como_calcula": "...",      // texto da tela e do método
  "ocupacional": true, "cobertura": "completa",
  "medidas": [{ "chave": "verde", "principal": true, "sentido": "up",
                "formato": { "tipo": "percentual", "casas": 1 },
                "expr": { "op": "razao", "num": { "op": "estoque_medio", "tabela": "emprego_mensal", ... }, "den": { ... } } }]
}
```

Os operadores disponíveis estão em `src/js/nucleo/avaliador.js` (cada um comentado).

## Por que sem framework, sem Chart.js, sem build?

| Alternativa | Por que não agora |
|---|---|
| React/Vite | Exige `npm install` e build; para 5 pessoas aprendendo, mais uma camada para quebrar |
| Chart.js | Tentamos instalar; o registro npm estava bloqueado no ambiente de desenvolvimento. Gráficos SVG simples (`graficos.js`) bastam e não dependem de CDN |
| Uma função JS por indicador | Escala mal: 130 indicadores = 130 funções. A árvore de expressão é dado, testável e inspecionável |

Se o projeto crescer, trocar para Vite + Chart.js é viável porque `nucleo/` não depende do navegador (é testado em Node puro).

## Escalabilidade: três eixos

1. **Mais temas**: pasta nova em `temas/` (ver `contrato-de-dados.md`).
2. **Mais indicadores**: entrada nova em `catalogo/indicadores.json`; sobe de nível de maturidade sozinho quando os dados existem.
3. **Mais entidades**: linhas novas em `empresas.csv`/`projetos.csv`; as telas se montam a partir dos CSVs.
