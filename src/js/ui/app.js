// =====================================================================================
// app.js — monta a casca da aplicação (cabeçalho, abas, filtros) e redesenha a página atual
//
// Fluxo simples e previsível:  estado (o que o usuário escolheu)  →  contexto de filtros do motor
//                              →  página.render(...) devolve HTML  →  main.innerHTML = HTML
// Os dados são pequenos (milhares de linhas), então redesenhar a página inteira a cada mudança
// de filtro leva uma fração de segundo e deixa o código muito mais fácil de entender.
// =====================================================================================
import { criarContexto } from "../nucleo/contexto.js";
import * as visao from "./paginas/visao.js";
import * as pilar from "./paginas/pilar.js";
import * as empresas from "./paginas/empresas.js";
import * as metodo from "./paginas/metodo.js";
import { esc } from "./util.js";

const PAGINAS = [
  { id: "visao", rotulo: "Visão ASG" }, { id: "A", rotulo: "Ambiental" }, { id: "S", rotulo: "Social" },
  { id: "G", rotulo: "Governança" }, { id: "empresas", rotulo: "Empresas e projetos" }, { id: "metodo", rotulo: "Indicadores e método" },
];
const ORDEM_CLASSE = ["Verde", "Neutra", "Alto impacto"];
const unicos = (a) => [...new Set(a)].sort((x, y) => String(x).localeCompare(String(y), "pt-BR"));
const opcoes = (pares, vazio) => `<option value="">${esc(vazio)}</option>` + pares.map(([v, r]) => `<option value="${esc(v)}">${esc(r)}</option>`).join("");

export function iniciarApp({ modelo, registro, indice }) {
  const tema = modelo.tema;
  const projetos = [...modelo.projetos.values()], empresasLista = [...modelo.empresas.values()];
  const anos = unicos(modelo.meses.map((m) => m.slice(0, 4)));
  const ultimoAno = anos[anos.length - 1];
  const mesesDoUltimo = modelo.meses.filter((m) => m.startsWith(ultimoAno)).length;
  const padrao = { ano: ultimoAno, setor: "", municipio: "", empresa: "", projeto: "", origem: "", classe: "" };
  const lerHash = () => (PAGINAS.find((p) => p.id === location.hash.slice(1)) || PAGINAS[0]).id;
  const estado = { ...padrao, pagina: lerHash() };

  document.title = `ASG Investe Piauí · ${tema.titulo}`;
  document.getElementById("app").innerHTML = `
    <header><h1>Painel ASG · Investe Piauí</h1>
      <p class="sub">Indicadores das Normas GRI para acompanhar a carteira. Tema: <b>${esc(tema.titulo)}</b></p>
      <nav role="tablist" aria-label="Páginas">${PAGINAS.map((p) => `<button role="tab" data-p="${p.id}">${esc(p.rotulo)}</button>`).join("")}</nav></header>
    <div class="aviso">${esc(tema.aviso_dados || "")}</div>
    <div class="filtros" id="filtros">
      <label>Ano<select id="f-ano">${opcoes(anos.map((a) => [a, a === ultimoAno && mesesDoUltimo < 12 ? `${a} (jan–${["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"][mesesDoUltimo - 1]})` : a]), "Todo o período")}</select></label>
      <label>Origem<select id="f-origem">${opcoes(unicos(empresasLista.map((e) => e.origem)).map((o) => [o, o]), "Todas")}</select></label>
      <label>Empresa / instituição<select id="f-empresa">${opcoes(empresasLista.map((e) => [e.empresa_id, e.nome_empresa]), "Todas")}</select></label>
      <label>Projeto<select id="f-projeto">${opcoes(projetos.map((p) => [p.projeto_id, p.nome_projeto]), "Todos")}</select></label>
      <label>Setor<select id="f-setor">${opcoes(unicos(projetos.map((p) => p.setor)).map((s) => [s, s]), "Todos")}</select></label>
      <label>Município<select id="f-municipio">${opcoes(unicos(projetos.map((p) => p.municipio)).map((m) => [m, m]), "Todos")}</select></label>
      <label id="rot-classe">Classe de ocupação<select id="f-classe">${opcoes(ORDEM_CLASSE.filter((c) => [...modelo.ocupacoes.values()].some((o) => o.classe === c)).map((c) => [c, c]), "Todas")}</select></label>
      <button class="limpar" id="limpar" type="button">Limpar filtros</button></div>
    <div class="dica" id="dica"></div>
    <main id="principal"></main>`;

  const $ = (id) => document.getElementById(id);
  const campos = { ano: "f-ano", origem: "f-origem", empresa: "f-empresa", projeto: "f-projeto", setor: "f-setor", municipio: "f-municipio", classe: "f-classe" };
  const sincronizarCampos = () => Object.entries(campos).forEach(([k, id]) => { $(id).value = estado[k]; });
  for (const [k, id] of Object.entries(campos)) $(id).addEventListener("change", (e) => { estado[k] = e.target.value; desenhar(); });
  $("limpar").addEventListener("click", () => { Object.assign(estado, padrao); sincronizarCampos(); desenhar(); });
  document.querySelectorAll("nav button").forEach((b) => b.addEventListener("click", () => { location.hash = b.dataset.p; }));
  window.addEventListener("hashchange", () => { estado.pagina = lerHash(); desenhar(); });

  /** Traduz o estado da tela para os filtros que o motor entende. */
  function filtrosDoMotor() {
    const uma = (v) => (v ? [v] : []);
    return {
      periodo: estado.ano ? { de: `${estado.ano}-01`, ate: `${estado.ano}-12` } : {},
      origens: uma(estado.origem), empresas: uma(estado.empresa), projetos: uma(estado.projeto),
      setores: uma(estado.setor), municipios: uma(estado.municipio),
      classes: estado.pagina === "S" ? uma(estado.classe) : [], // a classe só vale na página Social
    };
  }

  function desenhar() {
    document.querySelectorAll("nav button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.p === estado.pagina)));
    $("rot-classe").hidden = estado.pagina !== "S";
    $("dica").textContent = !estado.ano ? "Dica: escolha um ano para ver a variação contra o ano anterior."
      : estado.ano === ultimoAno && mesesDoUltimo < 12 ? `${ultimoAno} tem ${mesesDoUltimo} meses de dados; totais são anualizados (× 12 ÷ ${mesesDoUltimo}) para comparar com anos inteiros.` : "";
    const principal = $("principal");
    try {
      const ctx = criarContexto(modelo, filtrosDoMotor());
      const c = { modelo, registro, ctx, tema, estado };
      const html = estado.pagina === "visao" ? visao.render(c) : ["A", "S", "G"].includes(estado.pagina) ? pilar.render(estado.pagina, c)
        : estado.pagina === "empresas" ? empresas.render(c) : metodo.render(c);
      principal.innerHTML = `<section class="pagina">${html}</section>`;
      if (estado.pagina === "metodo") metodo.depois(principal);
    } catch (e) {
      console.error(e);
      principal.innerHTML = `<div class="caixa"><h3>Não foi possível montar esta página</h3><p class="sub">${esc(e.message)}</p></div>`;
    }
  }
  sincronizarCampos(); desenhar();
}
