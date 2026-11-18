// =====================================================================================
// metodo.js — "Indicadores e método": o que está nos bastidores (GRI, fórmulas, maturidade)
// Aqui moram as explicações que deixam as outras páginas limpas.
// =====================================================================================
import { niveisDoCatalogo, statusDoIndicador } from "../../nucleo/registro.js";
import { esc } from "../util.js";
import { formatarValor } from "../../nucleo/formato.js";
import { pontuarASG, detalharNormalizacao } from "../../nucleo/pontuacao.js";
import { fmtNota, rotuloFaixa } from "../componentes/nota.js";

const NIVEIS = [["em_painel", "Em painel"], ["calculavel", "Calculável"], ["mapeado", "Mapeado"], ["catalogado", "Catalogado"]];
const SENTIDO = { up: "↑ subir é bom", down: "↓ cair é bom", neutro: "neutro" };

const PCT1 = { tipo: "percentual", casas: 1 };
const medidaPontuada = (ind, cfg) => (cfg.medida ? ind.medidas.find((m) => m.chave === cfg.medida) : ind.principal);

/**
 * Tabela com TODOS os parâmetros da pontuação e o caminho exato de cada um em config/metricas.json.
 * É a resposta à pergunta "onde eu mudo esse peso?" — a Investe Piauí pode editar o arquivo sem tocar no código.
 */
function htmlParametros({ registro, tema, metricas }) {
  const linhas = tema.indicadores.map((id) => registro.porId.get(id)).map((ind) => {
    const cfg = metricas.indicadores[ind.id];
    const pil = `<span class="pill ${ind.pilar}">${ind.pilar}</span>`;
    const onde = `<code>indicadores.${esc(ind.id)}</code>`;
    if (!cfg) return `<tr><td><b>${esc(ind.id)}</b></td><td>${esc(ind.titulo)}</td><td>${pil}</td><td colspan="4" class="just">Sem parâmetros: aparece como valor, não entra na nota.</td><td>${onde}</td></tr>`;
    if (cfg.pontuar === false) return `<tr><td><b>${esc(ind.id)}</b></td><td>${esc(ind.titulo)}</td><td>${pil}</td><td colspan="4" class="just"><b>Sem nota.</b> ${esc(cfg.motivo)}</td><td>${onde}</td></tr>`;
    const fmt = (x) => formatarValor(x, medidaPontuada(ind, cfg).formato);
    const n = cfg.normalizacao;
    return `<tr><td><b>${esc(ind.id)}</b></td><td>${esc(ind.titulo)}</td><td>${pil}</td><td class="num">${cfg.peso}</td>
      <td class="num">${esc(fmt(n.piso))}</td><td class="num">${esc(fmt(n.teto))}</td><td class="just">${esc(cfg.justificativa)}<br><i>Fonte: ${esc(cfg.fonte)}</i></td><td>${onde}</td></tr>`;
  }).join("");
  const f = metricas.faixas, pp = metricas.pesos_pilares;
  return `<div class="rolagem"><table class="params"><tr><th>Cód.</th><th>Indicador</th><th>Pilar</th><th class="num">Peso</th><th class="num">Piso (0 pts)</th><th class="num">Teto (100 pts)</th><th>Justificativa e fonte</th><th>Onde editar</th></tr>${linhas}</table></div>
    <p class="rodape">Pesos dos pilares (<code>pesos_pilares</code>): Ambiental ${pp.A} · Social ${pp.S} · Governança ${pp.G}. Faixas (<code>faixas</code>): <b>${esc(rotuloFaixa(metricas, "alinhado"))}</b> a partir de ${f.alinhado}; <b>${esc(rotuloFaixa(metricas, "atencao"))}</b> de ${f.atencao} a ${f.alinhado}; <b>${esc(rotuloFaixa(metricas, "critico"))}</b> abaixo de ${f.atencao}; com cobertura menor que ${Math.round(f.cobertura_minima * 100)}% a faixa é <b>${esc(rotuloFaixa(metricas, "sem_dados"))}</b>.</p>`;
}

/** A conta de uma entidade (ou da carteira) passo a passo: valor → nota → peso → média do pilar → nota ASG. */
function htmlDemo({ modelo, registro, ctx, tema, metricas }, empresaId) {
  const cx = empresaId ? ctx.derivar({ empresas: [empresaId] }) : ctx;
  const asg = pontuarASG(registro, metricas, cx, tema.indicadores);
  const blocos = ["A", "S", "G"].map((p) => {
    const r = asg[p];
    const linhas = r.itens.map((it) => {
      const ind = registro.porId.get(it.id), cfg = metricas.indicadores[it.id], n = cfg.normalizacao;
      const fmt = (x) => formatarValor(x, medidaPontuada(ind, cfg).formato);
      const d = detalharNormalizacao(it.valor, n);
      const conta = d ? `(${esc(fmt(d.valor))} − ${esc(fmt(n.piso))}) ÷ (${esc(fmt(n.teto))} − ${esc(fmt(n.piso))}) = ${esc(formatarValor(d.bruto, PCT1))}${d.travou ? ` → limitado ao ${d.travou}` : ""}` : "sem dado: fica fora da média";
      return `<tr><td><b>${esc(it.id)}</b></td><td>${esc(ind.titulo)}</td><td class="num">${d ? esc(fmt(d.valor)) : "–"}</td><td class="conta">${conta}</td><td class="num">${fmtNota(it.nota)}</td><td class="num">${it.peso}</td><td class="num">${it.nota == null ? "–" : (it.nota * it.peso).toFixed(1)}</td></tr>`;
    }).join("");
    const com = r.itens.filter((x) => x.nota != null);
    const somaPN = com.reduce((s, x) => s + x.nota * x.peso, 0), somaP = com.reduce((s, x) => s + x.peso, 0), somaTodos = r.itens.reduce((s, x) => s + x.peso, 0);
    const resumo = r.nota == null
      ? `Sem nota: nenhum indicador deste pilar tem dado neste recorte.`
      : `Nota do pilar = Σ(nota × peso) ÷ Σ(peso) = ${somaPN.toFixed(1)} ÷ ${somaP} = <b>${fmtNota(r.nota)}</b> · cobertura = ${somaP} ÷ ${somaTodos} de peso com dado = ${Math.round(r.cobertura * 100)}% · <b>${esc(rotuloFaixa(metricas, r.faixa))}</b>`;
    return `<h4><span class="pill ${p}">${p}</span> ${esc(registro.pilares[p].nome)}</h4>
      <div class="rolagem"><table class="demo"><tr><th>Cód.</th><th>Indicador</th><th class="num">Valor</th><th>Conta da nota (valor − piso) ÷ (teto − piso)</th><th class="num">Nota</th><th class="num">Peso</th><th class="num">Nota × peso</th></tr>
      ${linhas}<tr class="resumo"><td colspan="7">${resumo}</td></tr></table></div>`;
  }).join("");
  const pp = metricas.pesos_pilares, g = asg.geral;
  const partes = ["A", "S", "G"].filter((p) => asg[p].nota != null);
  const somaP = partes.reduce((s, p) => s + pp[p], 0);
  const geral = g.nota == null ? "Sem nota geral." : `Nota ASG = Σ(nota do pilar × peso do pilar) ÷ Σ(peso dos pilares) = (${partes.map((p) => `${fmtNota(asg[p].nota)} × ${pp[p]}`).join(" + ")}) ÷ ${somaP} = <b>${fmtNota(g.nota)}</b> · cobertura geral ${Math.round(g.cobertura * 100)}% · <b>${esc(rotuloFaixa(metricas, g.faixa))}</b>`;
  return `${blocos}<p class="demo-geral"><b>Nota geral.</b> ${geral}</p>`;
}

/** Seção "Pontuação ASG": avisos de problema, parâmetros e demonstração da conta. */
function htmlSecaoPontuacao(c) {
  const { metricas, problemasMetricas, modelo } = c;
  const aviso = `<div class="caixa larga atencao"><h3>Parâmetros estimados pelo grupo</h3><p class="sub">Pesos, pisos e tetos <b>não vêm do GRI nem de metas oficiais</b> da Investe Piauí: são hipóteses do grupo para demonstrar o método, cada uma com justificativa. Para trocar qualquer número, edite só o arquivo <code>config/metricas.json</code>; nenhum valor está escondido no código.</p></div>`;
  if (problemasMetricas?.erros.length) return `<h3 style="margin-top:22px">Pontuação ASG</h3>${aviso}<div class="caixa larga atencao"><h3>config/metricas.json tem erros: as notas foram desligadas</h3><ul>${problemasMetricas.erros.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>`;
  if (!metricas) return `<h3 style="margin-top:22px">Pontuação ASG</h3><p class="sub-pagina">O arquivo <code>config/metricas.json</code> não foi encontrado: a ferramenta mostra valores e balanço, mas não calcula notas.</p>`;
  const avisos = (problemasMetricas?.avisos || []).map((a) => `<li>${esc(a)}</li>`).join("");
  const opcoes = `<option value="">Carteira inteira (filtros atuais)</option>` + [...modelo.empresas.values()].map((e) => `<option value="${esc(e.empresa_id)}">${esc(e.nome_empresa)}</option>`).join("");
  return `<h3 style="margin-top:22px">Pontuação ASG: parâmetros e conta</h3>
    <p class="sub-pagina">Cada indicador vira uma nota de 0 a 100: <code>(valor − piso) ÷ (teto − piso)</code>, limitada entre 0 e 100 (se o piso for maior que o teto, menor é melhor). A nota do pilar é a média ponderada pelos pesos, só com os indicadores que têm dado; dado ausente nunca vira zero e reduz a <b>cobertura</b>. A nota ASG é a média ponderada dos três pilares.</p>
    ${aviso}${avisos ? `<div class="caixa larga"><h3>Avisos</h3><ul>${avisos}</ul></div>` : ""}
    ${htmlParametros(c)}
    <h3 style="margin-top:22px">Demonstração da conta</h3>
    <div class="demo-barra"><label>Entidade <select id="sel-demo" aria-label="Entidade para demonstrar a conta">${opcoes}</select></label>
      <span class="sub-pagina">Respeita os filtros de cima (ano, projeto etc.).</span></div>
    <div id="demo">${htmlDemo(c, "")}</div>`;
}

export function render({ modelo, registro, tema, ctx, metricas, problemasMetricas }) {
  const cat = registro.catalogoDisponivel ? niveisDoCatalogo(registro, modelo) : [];
  const cont = (n) => cat.filter((c) => c.nivel === n).length;
  const niveis = `<div class="niveis">${NIVEIS.map(([k, r]) => `<div class="nivel"><b>${cont(k)}</b><span>${r}</span></div>`).join("")}
    <div class="nivel"><b>${cat.length}</b><span>conteúdos GRI no catálogo</span></div></div>`;
  // O catálogo GRI é privado (fora do Git). Sem ele, explicamos como obtê-lo em vez de mostrar uma tabela vazia.
  const avisoCatalogo = `<div class="caixa larga atencao"><h3>Catálogo GRI não carregado</h3>
    <p class="sub">O catálogo completo das Normas GRI (títulos, páginas, níveis de maturidade) é material privado do grupo e não fica no repositório.
    Para vê-lo, use <b>🔒 Desbloquear GRI</b> no cabeçalho com a senha do grupo (o catálogo é publicado cifrado), ou importe o arquivo <code>gri_catalogo.json</code> em <b>Importar dados</b>.
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
      <li>As notas de 0 a 100 usam <b>parâmetros estimados pelo grupo</b> (pesos, pisos e tetos em <code>config/metricas.json</code>), não metas oficiais. A conta é mostrada abaixo.</li>
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
    ${htmlSecaoPontuacao({ modelo, registro, tema, ctx, metricas, problemasMetricas })}
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
export function depois(raiz, c) {
  // demonstração da conta: ao trocar a entidade, refaz só aquele bloco
  const sel = raiz.querySelector("#sel-demo");
  if (sel && c?.metricas) sel.addEventListener("change", () => { raiz.querySelector("#demo").innerHTML = htmlDemo(c, sel.value); });
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
