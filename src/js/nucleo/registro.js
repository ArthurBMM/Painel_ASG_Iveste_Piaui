// =====================================================================================
// registro.js — o REGISTRO de indicadores (catalogo/indicadores.json) + o CATÁLOGO GRI
//
// O registro diz O QUE calcular (expressões), em qual PILAR (A/S/G) cada indicador cai, qual é
// o SENTIDO desejável e qual GRI o sustenta. O catálogo GRI (gri_catalogo.json) é a lista de
// todas as divulgações das Normas GRI, com a página onde estão.
//
// NÍVEIS DE MATURIDADE de um item do catálogo (mostrados na página "Indicadores e método"):
//   catalogado  → só consta no catálogo GRI (código, título, página)
//   mapeado     → já tem fórmula no registro, mas faltam dados para calcular
//   calculavel  → tem fórmula E os dados necessários estão presentes
//   em_painel   → calculável e escolhido pelo tema para aparecer no painel
// =====================================================================================
import { anoSelecionado } from "./contexto.js";
import { avaliarMedida, camposUsados } from "./avaliador.js";
import { classeDaVariacao } from "./formato.js";

/**
 * Carrega o registro (PÚBLICO, no Git) e, se existir, o catálogo GRI (PRIVADO, fora do Git).
 *
 * Por que o catálogo é opcional? Ele reproduz títulos e páginas das Normas GRI e o grupo decidiu
 * NÃO versioná-lo: cada integrante o recebe por e-mail e o coloca em privado/gri_catalogo.json
 * (ou o importa pela interface, quando a importação existir). O registro público guarda só o
 * CÓDIGO do conteúdo GRI (ex.: "305-1:2016"), o que basta para rastrear o indicador.
 *
 * Sem o catálogo o app funciona normalmente: as referências mostram só o código, e a página
 * "Indicadores e método" avisa que o catálogo não foi carregado (registro.catalogoDisponivel = false).
 *
 * @param catalogoPrivado  conteúdo JSON (texto) do catálogo, se o chamador já o tiver; senão tentamos ler da rota.
 */
export async function carregarRegistro(leitor, raiz = "catalogo", rotaPrivada = "privado/gri_catalogo.json") {
  const reg = JSON.parse(await leitor(`${raiz}/indicadores.json`));
  let cat = null;
  try { cat = JSON.parse(await leitor(rotaPrivada)); } catch { /* ausente: modo sem catálogo */ }
  const catPorId = new Map((cat?.conteudos || []).map((c) => [c.id, c]));

  for (const ind of reg.indicadores) {
    // cada referência vira {rotulo, pagina?, titulo?, norma?, setorial?}; com catálogo ganha página e título
    ind.referencias = ind.gri.map((g) => {
      if (g.setorial) {
        const extra = cat?.refs_setoriais?.[`${ind.id}|${g.norma}`] || {};
        return { rotulo: g.norma, pagina: extra.pagina, titulo: extra.titulo, norma: extra.norma || g.norma, setorial: true };
      }
      const codigo = g.id.split(":")[0];
      const rotulo = `GRI ${codigo}${g.parte ? "-" + g.parte : ""}`;
      const c = catPorId.get(g.id);
      if (cat && !c) throw new Error(`Indicador ${ind.id}: referência GRI "${g.id}" não existe no catálogo`);
      return { rotulo, pagina: c?.pagina, titulo: c?.titulo, norma: c?.norma, codigo };
    });
    ind.principal = ind.medidas.find((m) => m.principal) || ind.medidas[0];
  }
  return { pilares: reg.pilares, indicadores: reg.indicadores, catalogo: cat?.conteudos || [], catalogoDisponivel: !!cat,
           porId: new Map(reg.indicadores.map((i) => [i.id, i])) };
}

/** Os dados presentes bastam para calcular este indicador? Devolve {ativo, faltando[]}. */
export function statusDoIndicador(ind, modelo) {
  const faltando = new Set();
  for (const m of ind.medidas) for (const c of camposUsados(m.expr)) if (!modelo.camposDisponiveis.has(c)) faltando.add(c);
  return { ativo: faltando.size === 0, faltando: [...faltando] };
}

/** Resolve "EV1" (medida principal) ou "EV1.alto_impacto" em {ind, medida}. */
export function resolverRef(registro, ref) {
  const [id, chave] = ref.split(".");
  const ind = registro.porId.get(id);
  if (!ind) throw new Error(`Indicador desconhecido: ${id}`);
  const medida = chave ? ind.medidas.find((m) => m.chave === chave) : ind.principal;
  if (!medida) throw new Error(`Medida desconhecida: ${ref}`);
  return { ind, medida };
}

export const valorDe = (registro, ref, ctx) => { const { ind, medida } = resolverRef(registro, ref); return avaliarMedida(ind, medida, ctx); };

/**
 * Variação contra o ano anterior (só existe quando o período é UM ano civil; senão tudo null).
 * O ano anterior é sempre o ano INTEIRO (jan–dez), igual ao modelo Power BI.
 */
export function variacao(ind, medida, ctx) {
  const atual = avaliarMedida(ind, medida, ctx);
  const ano = anoSelecionado(ctx);
  if (ano == null) return { atual, anterior: null, delta: null, classe: "neutro" };
  // Totais SEM anualização (contratações, MWh, nº de programas...) dependem de quantos meses o período tem.
  // Em ano parcial (ex.: 2026 com 10 meses) comparar com o ano anterior inteiro seria enganoso: não mostramos.
  if (medida.depende_do_periodo && ctx.meses.size < 12) return { atual, anterior: null, delta: null, classe: "neutro" };
  const anterior = avaliarMedida(ind, medida, ctx.derivar({ periodo: { de: `${ano - 1}-01`, ate: `${ano - 1}-12` } }));
  const delta = atual == null || anterior == null ? null : atual - anterior;
  return { atual, anterior, delta, classe: classeDaVariacao(delta, medida.sentido) };
}

/**
 * Balanço de um pilar: de quantos indicadores avaliáveis, quantos MELHORARAM ou PIORARAM no ano.
 * Não é um índice composto (o grupo decidiu não criar nota única): é uma contagem transparente.
 * Só entram medidas principais com sentido definido (up/down) e variação calculável.
 */
export function balancoPilar(registro, ctx, pilar, idsPermitidos = null) {
  const r = { melhoraram: 0, pioraram: 0, estaveis: 0, semDado: 0, total: 0, detalhes: [] };
  for (const ind of registro.indicadores) {
    if (ind.pilar !== pilar || (idsPermitidos && !idsPermitidos.includes(ind.id))) continue;
    const m = ind.principal;
    if (m.sentido === "neutro") continue;
    r.total++;
    const v = variacao(ind, m, ctx);
    if (v.delta == null) { r.semDado++; r.detalhes.push({ id: ind.id, estado: "sem_dado" }); continue; }
    const estado = v.classe === "bom" ? "melhorou" : v.classe === "ruim" ? "piorou" : "estavel";
    if (estado === "melhorou") r.melhoraram++; else if (estado === "piorou") r.pioraram++; else r.estaveis++;
    r.detalhes.push({ id: ind.id, estado, delta: v.delta });
  }
  return r;
}

/** Nível de maturidade de cada item do catálogo GRI. */
export function niveisDoCatalogo(registro, modelo) {
  const usados = new Map(); // id do catálogo → indicadores do registro que o citam
  for (const ind of registro.indicadores) for (const g of ind.gri) if (g.id) usados.set(g.id, [...(usados.get(g.id) || []), ind]);
  const emPainel = new Set(modelo.tema.indicadores);
  return registro.catalogo.map((c) => {
    const inds = usados.get(c.id) || [];
    let nivel = "catalogado";
    if (inds.length) {
      const ativos = inds.filter((i) => statusDoIndicador(i, modelo).ativo);
      nivel = ativos.length === 0 ? "mapeado" : ativos.some((i) => emPainel.has(i.id)) ? "em_painel" : "calculavel";
    }
    return { ...c, nivel, indicadores: inds.map((i) => i.id) };
  });
}
