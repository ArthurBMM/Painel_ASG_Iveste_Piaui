// =====================================================================================
// pilar.js — uma página genérica para cada pilar (A, S ou G). O MESMO código serve aos três:
// o que muda é só a lista de indicadores que o tema atribui ao pilar (dado, não código).
// =====================================================================================
import { cartaoIndicador } from "../componentes/cartao.js";
import { renderGrafico } from "../componentes/graficos.js";
import { htmlBalanco } from "../componentes/balanco.js";
import { esc } from "../util.js";

export function render(pilar, { registro, ctx, tema, estado }) {
  const info = registro.pilares[pilar];
  const inds = tema.indicadores.map((id) => registro.porId.get(id)).filter((i) => i && i.pilar === pilar);
  const parciais = inds.filter((i) => i.cobertura === "parcial").length;
  const notas = [];
  if (pilar === "G") notas.push("Governança tem cobertura parcial neste tema: os indicadores abaixo são os que a base do T8 sustenta. Outros conteúdos GRI de governança estão no catálogo (página Indicadores e método) e podem ser ativados com mais dados.");
  if (pilar === "S" && estado.classe) notas.push("Com filtro de classe, indicadores que não têm corte por ocupação (Q2, N1, C1, C3) aparecem como – de propósito: mostrar o mesmo número para todas as classes seria enganoso.");
  const graficos = (tema.graficos?.[pilar] || []).map((g) => renderGrafico(g, { registro, ctx, tema })).join("");
  return `<h2 class="titulo-pagina">${esc(info.nome)}</h2>
    <p class="sub-pagina">${esc(info.pergunta)} ${inds.length} indicadores${parciais ? `, ${parciais} com cobertura parcial` : ""}.</p>
    ${htmlBalanco(registro, ctx, pilar, inds.map((i) => i.id))}
    ${notas.map((n) => `<div class="aviso" style="margin:8px 0;border:1px solid #f0cfa8;border-radius:4px">${esc(n)}</div>`).join("")}
    <div class="indicadores">${inds.map((i) => cartaoIndicador(registro, i, ctx)).join("")}</div>
    <div class="grade">${graficos}</div>`;
}
