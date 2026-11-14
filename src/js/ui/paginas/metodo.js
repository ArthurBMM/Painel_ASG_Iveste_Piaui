// =====================================================================================
// metodo.js — "Indicadores e método": o que está nos bastidores (GRI, fórmulas, maturidade)
// Aqui moram as explicações que deixam as outras páginas limpas.
// =====================================================================================
import { niveisDoCatalogo, statusDoIndicador } from "../../nucleo/registro.js";
import { esc } from "../util.js";

const NIVEIS = [["em_painel", "Em painel"], ["calculavel", "Calculável"], ["mapeado", "Mapeado"], ["catalogado", "Catalogado"]];
const SENTIDO = { up: "↑ subir é bom", down: "↓ cair é bom", neutro: "neutro" };

export function render({ modelo, registro, tema }) {
  const cat = registro.catalogoDisponivel ? niveisDoCatalogo(registro, modelo) : [];
  const cont = (n) => cat.filter((c) => c.nivel === n).length;
  const niveis = `<div class="niveis">${NIVEIS.map(([k, r]) => `<div class="nivel"><b>${cont(k)}</b><span>${r}</span></div>`).join("")}
    <div class="nivel"><b>${cat.length}</b><span>conteúdos GRI no catálogo</span></div></div>`;
  // O catálogo GRI é privado (fora do Git). Sem ele, explicamos como obtê-lo em vez de mostrar uma tabela vazia.
  const avisoCatalogo = `<div class="caixa larga atencao"><h3>Catálogo GRI não carregado</h3>
    <p class="sub">O catálogo completo das Normas GRI (títulos, páginas, níveis de maturidade) é material privado do grupo e não fica no repositório.
    Peça o arquivo <code>gri_catalogo.json</code> ao grupo e coloque em <code>privado/</code>; depois recarregue a página.
    Os indicadores abaixo continuam identificados pelo código GRI.</p></div>`;

  const linhasInd = tema.indicadores.map((id) => registro.porId.get(id)).map((i) => {
    const st = statusDoIndicador(i, modelo);
    return `<tr><td><b>${esc(i.id)}</b></td><td>${esc(i.titulo)}</td><td><span class="pill ${i.pilar}">${esc(registro.pilares[i.pilar].nome)}</span></td>
      <td>${i.referencias.map((r) => `${esc(r.rotulo)}${r.pagina ? ` (p. ${r.pagina})` : ""}`).join("<br>")}</td>
      <td>${esc(SENTIDO[i.principal.sentido])}</td><td>${i.cobertura === "parcial" ? '<span class="chip parcial">parcial</span>' : "completa"}</td>
      <td>${st.ativo ? "com dados" : `<span class="chip parcial">faltam: ${esc(st.faltando.join(", "))}</span>`}</td></tr>`;
  }).join("");

  const linhasCat = cat.map((c) => `<tr data-nivel="${c.nivel}" data-pilar="${c.pilar_padrao}" data-busca="${esc((c.codigo + " " + c.titulo + " " + c.norma).toLowerCase())}">
      <td><b>${esc(c.codigo)}</b></td><td>${esc(c.titulo)}</td><td>${esc(c.norma)}</td><td class="num">${c.pagina}</td>
      <td><span class="pill ${c.pilar_padrao}">${c.pilar_padrao}</span></td>
      <td><span class="niv ${c.nivel}">${NIVEIS.find((n) => n[0] === c.nivel)[1]}</span>${c.indicadores.length ? ` · ${c.indicadores.join(", ")}` : ""}</td></tr>`).join("");

  return `<h2 class="titulo-pagina">Indicadores e método</h2>
    <p class="sub-pagina">O que sustenta os números das outras páginas: de onde vem cada indicador no GRI, como se calcula e o que ainda falta. ${esc(tema.aviso_dados || "")}</p>
    <div class="caixa larga atencao"><h3>Pontos de atenção</h3><ul>
      <li>Os dados são <b>fictícios</b>; a ferramenta é o que está sendo proposto.</li>
      <li>Verde, neutra e alto impacto são um <b>critério do grupo</b>, aplicado por ocupação. O GRI não define "emprego verde".</li>
      <li>O pilar de cada indicador (A, S ou G) é uma <b>decisão do grupo</b>; o GRI não classifica conteúdos em A, S ou G.</li>
      <li>Governança tem <b>cobertura parcial</b> neste tema. Trabalho decente é medido só em parte (rotatividade e diversidade); indicadores de remuneração foram retirados.</li>
      <li>Totais de períodos de tamanhos diferentes são <b>anualizados</b> (× 12 ÷ meses com dado). 2026 tem 10 meses.</li>
      <li>Empregados são um <b>estoque</b>: usa-se a média dos meses, nunca a soma.</li></ul></div>
    ${registro.catalogoDisponivel ? `<h3>Níveis de maturidade do catálogo GRI</h3>
    <p class="sub-pagina"><b>Catalogado</b>: só consta no catálogo. <b>Mapeado</b>: tem fórmula, faltam dados. <b>Calculável</b>: tem fórmula e dados. <b>Em painel</b>: calculável e exibido neste tema.</p>
    ${niveis}` : avisoCatalogo}
    <h3>Indicadores deste tema (${tema.indicadores.length})</h3>
    <div class="rolagem"><table><tr><th>Cód.</th><th>Indicador</th><th>Pilar</th><th>GRI</th><th>Sentido</th><th>Cobertura</th><th>Dados</th></tr>${linhasInd}</table></div>
    ${registro.catalogoDisponivel ? `
    <h3 style="margin-top:22px">Catálogo GRI completo</h3>
    <div class="busca"><input id="busca-gri" type="search" placeholder="Buscar por código ou título (ex.: 403, água, corrupção)" size="44" aria-label="Buscar no catálogo GRI">
      <select id="filtro-nivel" aria-label="Filtrar por nível"><option value="">Todos os níveis</option>${NIVEIS.map(([k, r]) => `<option value="${k}">${r}</option>`).join("")}</select>
      <select id="filtro-pilar" aria-label="Filtrar por pilar"><option value="">Todos os pilares</option><option value="A">Ambiental</option><option value="S">Social</option><option value="G">Governança</option></select>
      <span id="contagem-gri" class="sub-pagina" style="align-self:center"></span></div>
    <div class="rolagem"><table id="tab-gri"><tr><th>Cód.</th><th>Conteúdo</th><th>Norma</th><th class="num">Pág.</th><th>Pilar*</th><th>Nível</th></tr>${linhasCat}</table></div>
    <p class="rodape">*Pilar sugerido por norma; precisa de revisão do grupo. Páginas conforme a numeração das Normas GRI consolidadas em português.</p>` : ""}`;
}

/** Liga a busca e os filtros do catálogo (roda depois que o HTML entrou na página). */
export function depois(raiz) {
  const q = raiz.querySelector("#busca-gri"), nv = raiz.querySelector("#filtro-nivel"), pl = raiz.querySelector("#filtro-pilar");
  if (!q) return; // catálogo GRI privado não carregado: não há busca para ligar
  const linhas = [...raiz.querySelectorAll("#tab-gri tr[data-nivel]")], cnt = raiz.querySelector("#contagem-gri");
  const aplicar = () => {
    const t = q.value.trim().toLowerCase(); let n = 0;
    for (const tr of linhas) {
      const ok = (!t || tr.dataset.busca.includes(t)) && (!nv.value || tr.dataset.nivel === nv.value) && (!pl.value || tr.dataset.pilar === pl.value);
      tr.hidden = !ok; if (ok) n++;
    }
    cnt.textContent = `${n} de ${linhas.length} conteúdos`;
  };
  [q, nv, pl].forEach((el) => el.addEventListener("input", aplicar)); aplicar();
}
