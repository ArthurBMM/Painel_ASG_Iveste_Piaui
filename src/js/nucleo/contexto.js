// =====================================================================================
// contexto.js — o "contexto de filtros"
//
// Em Power BI, cada medida é calculada dentro de um "contexto de filtro" (o que está
// selecionado nas segmentações). Aqui o contexto é um objeto explícito: ele sabe quais projetos,
// meses e classes estão ativos e entrega, para cada tabela, só as LINHAS que passam nos filtros.
//
// Regras herdadas do modelo Power BI (as mesmas que o grupo validou):
//  - Projeto/Município/Setor/Empresa filtram TODAS as tabelas que têm projeto_id.
//  - Período filtra tabelas mensais (coluna "mes"). Programas entram pelo mês de início.
//  - Tabelas anuais (comunidade) entram pelos ANOS que aparecem no período.
//  - Classe/Gênero/Faixa só existem nas tabelas de pessoas (emprego e capacitação).
// =====================================================================================

const nenhum = (lista) => !lista || lista.length === 0;

/**
 * @typedef {Object} Filtros
 * @property {{de?:string, ate?:string}} [periodo]  meses "AAAA-MM", inclusivos
 * @property {string[]} [projetos] @property {string[]} [municipios] @property {string[]} [setores]
 * @property {string[]} [empresas] @property {string[]} [origens]
 * @property {string[]} [classes] @property {string[]} [generos] @property {string[]} [faixas]
 */

/** Cria o contexto. Todo cálculo recebe um contexto; para "mudar de ano" cria-se um novo. */
export function criarContexto(modelo, filtros = {}) {
  const f = {
    periodo: filtros.periodo || {}, projetos: filtros.projetos || [], municipios: filtros.municipios || [],
    setores: filtros.setores || [], empresas: filtros.empresas || [], origens: filtros.origens || [],
    classes: filtros.classes || [], generos: filtros.generos || [], faixas: filtros.faixas || [],
  };

  // 1) projetos que passam nos filtros de "onde" (projeto, município, setor, empresa, origem)
  const idsProjeto = new Set();
  for (const p of modelo.projetos.values()) {
    const emp = modelo.empresas.get(p.empresa_id);
    if (!nenhum(f.projetos) && !f.projetos.includes(p.projeto_id)) continue;
    if (!nenhum(f.municipios) && !f.municipios.includes(p.municipio)) continue;
    if (!nenhum(f.setores) && !f.setores.includes(p.setor)) continue;
    if (!nenhum(f.empresas) && !f.empresas.includes(p.empresa_id)) continue;
    if (!nenhum(f.origens) && !(emp && f.origens.includes(emp.origem))) continue;
    idsProjeto.add(p.projeto_id);
  }

  // 2) meses do calendário que caem no período (comparação de texto AAAA-MM funciona porque a
  //    ordem alfabética dessas strings é a ordem cronológica)
  const de = f.periodo.de || "0000-00", ate = f.periodo.ate || "9999-99";
  const meses = new Set(modelo.meses.filter((m) => m >= de && m <= ate));
  const anos = new Set([...meses].map((m) => Number(m.slice(0, 4))));

  const recorteOcupacional = !nenhum(f.classes) || !nenhum(f.generos) || !nenhum(f.faixas);
  const faixaFiltrada = !nenhum(f.faixas);
  const cache = new Map(); // memoização: a mesma tabela é pedida muitas vezes por medida

  /**
   * Linhas de uma tabela que passam nos filtros.
   * @param {string} tabela
   * @param {string[]} [ignorar]  dimensões a NÃO aplicar ("classe", "genero", "faixa_etaria").
   *   É o equivalente do REMOVEFILTERS do DAX: usado no denominador de "% da classe".
   */
  function linhas(tabela, ignorar = []) {
    const chave = tabela + "|" + [...ignorar].sort().join(",");
    if (cache.has(chave)) return cache.get(chave);
    const base = modelo.tabelas[tabela] || [];
    const amostra = base[0] || {};
    const tem = (c) => c in amostra;
    const out = base.filter((r) => {
      if (tem("projeto_id") && !idsProjeto.has(r.projeto_id)) return false;
      if (tem("mes") && !meses.has(r.mes.slice(0, 7))) return false;
      if (tabela === "programas" && !meses.has(r.data_inicio.slice(0, 7))) return false; // entra no mês de início
      if (tem("ano") && !anos.has(r.ano)) return false;
      if (tem("ocupacao_id")) {
        if (!ignorar.includes("classe") && !nenhum(f.classes) && !f.classes.includes(modelo.ocupacoes.get(r.ocupacao_id)?.classe)) return false;
        if (!ignorar.includes("genero") && !nenhum(f.generos) && !f.generos.includes(r.genero)) return false;
        if (!ignorar.includes("faixa_etaria") && tem("faixa_etaria") && !nenhum(f.faixas) && !f.faixas.includes(r.faixa_etaria)) return false;
      }
      return true;
    });
    cache.set(chave, out);
    return out;
  }

  /** Novo contexto igual a este, com alguns filtros trocados (ex.: o ano anterior). */
  const derivar = (mudancas) => criarContexto(modelo, { ...f, ...mudancas });

  return { modelo, filtros: f, idsProjeto, meses, anos, recorteOcupacional, faixaFiltrada, linhas, derivar };
}

/** Quando o período cobre exatamente UM ano civil, devolve esse ano; senão null (equivale a _Ano selecionado). */
export function anoSelecionado(ctx) {
  return ctx.anos.size === 1 ? [...ctx.anos][0] : null;
}
