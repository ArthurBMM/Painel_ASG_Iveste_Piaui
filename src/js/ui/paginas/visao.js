// =====================================================================================
// visao.js — página "Visão ASG": a história do tema + os três pilares lado a lado
// =====================================================================================
import { cartao } from "../componentes/cartao.js";
import { renderGrafico } from "../componentes/graficos.js";
import { htmlBalanco } from "../componentes/balanco.js";
import { esc } from "../util.js";

export function render({ registro, ctx, tema }) {
  const h = tema.historia || { titulo: "", pontos: [] };
  const topo = (tema.cartoes_topo || []).map((r) => cartao(registro, r, ctx, { mostrarGRI: false })).join("");

  const pilares = ["A", "S", "G"].map((p) => {
    const info = registro.pilares[p];
    const ids = tema.indicadores.filter((id) => registro.porId.get(id)?.pilar === p);
    const dest = (tema.destaques?.[p] || []).map((r) => cartao(registro, r, ctx)).join("");
    return `<section class="pilar p-${p}">
      <h2><a href="#${p}">${esc(info.nome)}</a></h2>
      <p class="pergunta">${esc(info.pergunta)}</p>
      ${htmlBalanco(registro, ctx, p, ids)}
      <div class="cartoes">${dest}</div>
      <a class="ver-mais" href="#${p}">Ver os ${ids.length} indicadores de ${esc(info.nome.toLowerCase())} →</a>
    </section>`;
  }).join("");

  const graficos = (tema.graficos?.visao || []).map((g) => renderGrafico(g, { registro, ctx, tema })).join("");
  return `<h2 class="titulo-pagina">Visão ASG</h2>
    <p class="sub-pagina">${esc(tema.resumo)}</p>
    ${h.titulo ? `<div class="historia"><h2>${esc(h.titulo)}</h2><ul>${h.pontos.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>` : ""}
    <div class="cartoes">${topo}</div>
    <div class="pilares">${pilares}</div>
    <div class="grade">${graficos}</div>`;
}
