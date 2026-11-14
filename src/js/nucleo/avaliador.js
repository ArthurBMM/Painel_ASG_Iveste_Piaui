// =====================================================================================
// avaliador.js — o "motor": calcula uma EXPRESSÃO de indicador dentro de um contexto
//
// Cada medida do registro (catalogo/indicadores.json) é uma pequena árvore, por exemplo
//   ES1 % renovável = razao( soma(renovavel), soma_de( soma(renovavel), soma(nao_renovavel) ) )
// Em vez de uma função JavaScript por indicador, temos poucas OPERAÇÕES genéricas. Para criar um
// indicador novo basta escrever JSON, sem mexer neste arquivo. É isso que torna a ferramenta escalável.
//
// REGRA DE OURO (vem do trabalho no Power BI): "sem dado" (null) não é "zero".
//   - SOMA de nada = null (como o SUM do DAX devolve BLANK).
//   - Divisão por zero ou por null = null (como o DIVIDE).
//   - Multiplicar por null = null; somar ignora os nulos.
//   Assim um filtro que esvazia a tabela mostra "–" no cartão em vez de um 0 enganoso.
//
// OPERAÇÕES
//   estoque_medio   média, entre os meses, da soma mensal de um ESTOQUE (ex.: empregados no fim do mês)
//   soma            soma de um FLUXO (ex.: contratações, MWh)
//   contagem        número de linhas (ou de valores distintos, com "distinto": coluna)
//   media           média simples de uma coluna
//   media_mensal_razao  média, entre os meses, de (soma do numerador ÷ soma do denominador) de cada mês
//   fator_anual     12 ÷ nº de meses com dado: leva um total de N meses para "por ano"
//   razao, mult, soma_de, const   combinam resultados
// Parâmetros opcionais de uma operação de tabela:
//   onde     {coluna: valor} ou {coluna: {"!=": valor}}  filtro fixo da fórmula (equivale ao CALCULATE)
//   ignorar  ["classe"|"genero"|"faixa_etaria"]          ignora o filtro do usuário (REMOVEFILTERS)
//   ano      "ultimo"  usa só o último ano do período (para tabelas anuais)
// =====================================================================================

const soNumeros = (v) => v.filter((x) => x != null && Number.isFinite(x));

/** Valor de uma coluna da linha; "classe" mora em ocupacoes (precisa de um join). */
function valorDe(ctx, tabela, linha, coluna) {
  if (coluna === "classe") return ctx.modelo.ocupacoes.get(linha.ocupacao_id)?.classe;
  return linha[coluna];
}

function passaOnde(ctx, tabela, linha, onde) {
  if (!onde) return true;
  for (const [col, cond] of Object.entries(onde)) {
    const v = valorDe(ctx, tabela, linha, col);
    if (cond !== null && typeof cond === "object") { if ("!=" in cond && v === cond["!="]) return false; }
    else if (v !== cond) return false;
  }
  return true;
}

/** Linhas da tabela depois dos filtros do contexto + "onde" + "ano". */
function linhasDa(op, ctx) {
  let rows = ctx.linhas(op.tabela, op.ignorar || []);
  if (op.ano === "ultimo") {
    const ultimo = Math.max(...ctx.anos);
    rows = rows.filter((r) => r.ano === ultimo);
  }
  return op.onde ? rows.filter((r) => passaOnde(ctx, op.tabela, r, op.onde)) : rows;
}

/** Soma por mês de uma coluna (para estoques e razões mensais). */
function somaPorMes(rows, campo) {
  const m = new Map();
  for (const r of rows) {
    if (r[campo] == null) continue;
    m.set(r.mes.slice(0, 7), (m.get(r.mes.slice(0, 7)) || 0) + r[campo]);
  }
  return m;
}

/**
 * Avalia uma expressão.
 * @returns {number|null}
 */
export function avaliar(expr, ctx) {
  switch (expr.op) {
    case "const": return expr.valor;

    case "estoque_medio": {
      const porMes = somaPorMes(linhasDa(expr, ctx), expr.campo);
      const v = [...porMes.values()];
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    }
    case "soma": {
      const v = soNumeros(linhasDa(expr, ctx).map((r) => r[expr.campo]));
      return v.length ? v.reduce((a, b) => a + b, 0) : null;
    }
    case "contagem": {
      const rows = linhasDa(expr, ctx);
      if (expr.distinto) return new Set(rows.map((r) => r[expr.distinto])).size;
      return rows.length;
    }
    case "media": {
      const v = soNumeros(linhasDa(expr, ctx).map((r) => r[expr.campo]));
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    }
    case "media_mensal_razao": {
      const n = somaPorMes(ctx.linhas(expr.num.tabela), expr.num.campo);
      const d = somaPorMes(ctx.linhas(expr.den.tabela), expr.den.campo);
      const razoes = [];
      for (const [mes, den] of d) if (den > 0 && n.has(mes)) razoes.push(n.get(mes) / den);
      return razoes.length ? razoes.reduce((a, b) => a + b, 0) / razoes.length : null;
    }
    case "fator_anual": {
      // meses COM DADO de emprego no contexto atual (um projeto novo, por ex., tem menos meses)
      const meses = new Set(ctx.linhas("emprego_mensal").map((r) => r.mes.slice(0, 7))).size;
      return meses ? 12 / meses : null;
    }
    case "razao": {
      const n = avaliar(expr.num, ctx), d = avaliar(expr.den, ctx);
      return n == null || d == null || d === 0 ? null : n / d;
    }
    case "mult": {
      let p = 1;
      for (const a of expr.args) { const v = avaliar(a, ctx); if (v == null) return null; p *= v; }
      return p;
    }
    case "soma_de": {
      const v = soNumeros(expr.args.map((a) => avaliar(a, ctx)));
      return v.length ? v.reduce((a, b) => a + b, 0) : null;
    }
    default: throw new Error(`Operação desconhecida no registro: ${expr.op}`);
  }
}

/**
 * Avalia UMA MEDIDA de um indicador aplicando as regras de bloqueio do modelo Power BI:
 *  - se há filtro de classe/gênero/faixa e o indicador não é "ocupacional" (energia, resíduos,
 *    comunidade não têm esses cortes), devolve null — mostrar o mesmo número em todas as classes
 *    seria enganoso;
 *  - se há filtro de faixa etária e o indicador usa capacitação (que não tem faixa), devolve null.
 */
export function avaliarMedida(indicador, medida, ctx) {
  if (ctx.recorteOcupacional && !indicador.ocupacional) return null;
  if (ctx.faixaFiltrada && indicador.bloqueia_faixa) return null;
  return avaliar(medida.expr, ctx);
}

/** Lista "tabela.coluna" que uma expressão lê; serve para saber se os dados importados bastam. */
export function camposUsados(expr, acc = new Set()) {
  if (expr.tabela) {
    if (expr.campo) acc.add(`${expr.tabela}.${expr.campo}`);
    if (expr.distinto) acc.add(`${expr.tabela}.${expr.distinto}`);
    for (const col of Object.keys(expr.onde || {})) acc.add(col === "classe" ? "ocupacoes.classe" : `${expr.tabela}.${col}`);
    if (expr.ano === "ultimo") acc.add(`${expr.tabela}.ano`);
  }
  if (expr.num && expr.num.tabela && expr.op === "media_mensal_razao") {
    acc.add(`${expr.num.tabela}.${expr.num.campo}`); acc.add(`${expr.den.tabela}.${expr.den.campo}`);
  } else {
    if (expr.num) camposUsados(expr.num, acc);
    if (expr.den) camposUsados(expr.den, acc);
  }
  (expr.args || []).forEach((a) => camposUsados(a, acc));
  if (expr.op === "fator_anual") acc.add("emprego_mensal.mes");
  return acc;
}
