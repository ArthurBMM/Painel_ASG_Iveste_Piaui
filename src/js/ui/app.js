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
import { abrirImportacao } from "./importar.js";
import { carregarRegistro } from "../nucleo/registro.js";
import { validarMetricas } from "../nucleo/pontuacao.js";
import { leitorHttp, leitorComSubstitutos } from "../nucleo/leitores.js";

const PAGINAS = [
  { id: "visao", rotulo: "Visão ASG" }, { id: "A", rotulo: "Ambiental" }, { id: "S", rotulo: "Social" },
  { id: "G", rotulo: "Governança" }, { id: "empresas", rotulo: "Empresas e projetos" }, { id: "metodo", rotulo: "Indicadores e método" },
];
const ORDEM_CLASSE = ["Verde", "Neutra", "Alto impacto"];
const unicos = (a) => [...new Set(a)].sort((x, y) => String(x).localeCompare(String(y), "pt-BR"));
const opcoes = (pares, vazio) => `<option value="">${esc(vazio)}</option>` + pares.map(([v, r]) => `<option value="${esc(v)}">${esc(r)}</option>`).join("");

// iniciarApp pode rodar de novo depois de uma importação (ou ao voltar à demonstração). Como os listeners
// globais (hashchange, teclado, tela cheia) ficam no window/document, guardamos como removê-los para não acumular.
let removerGlobais = [];

/**
 * @param {object} args
 * @param {object} [args.importado]  presente quando os dados vieram de arquivos do usuário: { arquivos: [...] }
 * @param {object} [args.demo]       os argumentos ORIGINAIS (demonstração), para o botão "Voltar à demonstração"
 */
export function iniciarApp(args) {
  const { modelo, registro, indice, metricas = null, problemasMetricas = null, importado = null } = args;
  const demo = args.demo || args;
  const tema = modelo.tema;
  // identidade: o que não vier do config/identidade.json cai nestes padrões
  const id = { nome_instituicao: "Investe Piauí", titulo_painel: "Painel ASG", logo: null, ...(args.identidade || {}) };
  const cores = { primaria: "#1D4E63", destaque: "#E2741F", ...(args.identidade?.cores || {}) };
  document.documentElement.style.setProperty("--primaria", cores.primaria);
  document.documentElement.style.setProperty("--alerta", cores.destaque);
  const projetos = [...modelo.projetos.values()], empresasLista = [...modelo.empresas.values()];
  const anos = unicos(modelo.meses.map((m) => m.slice(0, 4)));
  const ultimoAno = anos[anos.length - 1];
  const mesesDoUltimo = modelo.meses.filter((m) => m.startsWith(ultimoAno)).length;
  const padrao = { ano: ultimoAno, setor: "", municipio: "", empresa: "", projeto: "", origem: "", classe: "" };
  const lerHash = () => (PAGINAS.find((p) => p.id === location.hash.slice(1)) || PAGINAS[0]).id;
  const estado = { ...padrao, pagina: lerHash() };

  document.title = `${id.titulo_painel} · ${id.nome_instituicao} · ${tema.titulo}`;
  document.getElementById("app").innerHTML = `
    <header><div class="topo"><div class="marca">
        ${id.logo ? `<span class="logo-caixa"><img src="${esc(id.logo)}" alt="${esc(id.nome_instituicao)}" onerror="this.parentNode.remove()"></span>` : ""}
        <div><h1>${esc(id.titulo_painel)} · ${esc(id.nome_instituicao)}</h1>
          <p class="sub">Indicadores das Normas GRI para acompanhar a carteira. Tema: <b>${esc(tema.titulo)}</b></p></div></div>
      <div class="acoes">
        <button type="button" id="btn-filtros" class="ghost" aria-expanded="true" aria-controls="filtros" title="Mostrar ou esconder os filtros (tecla F)">Filtros</button>
        <button type="button" id="btn-apresentar" class="ghost" title="Tela cheia, letras maiores e atalhos de teclado (tecla P)">Apresentar</button>
        <button type="button" id="btn-importar" class="ghost">Importar dados</button></div></div>
      <nav role="tablist" aria-label="Páginas">${PAGINAS.map((p) => `<button role="tab" data-p="${p.id}">${esc(p.rotulo)}</button>`).join("")}</nav></header>
    ${importado
      ? `<div class="aviso importado"><span><b>Dados importados</b> (${importado.arquivos.map((x) => esc(x)).join(", ")}). Não são os dados de demonstração e valem só nesta sessão.</span> <button type="button" id="voltar-demo" class="link">Voltar à demonstração</button></div>`
      : `<div class="aviso">${esc(tema.aviso_dados || "")}</div>`}
    <div class="filtros" id="filtros">
      <label>Ano<select id="f-ano">${opcoes(anos.map((a) => [a, a === ultimoAno && mesesDoUltimo < 12 ? `${a} (jan–${["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"][mesesDoUltimo - 1]})` : a]), "Todo o período")}</select></label>
      <label>Origem<select id="f-origem">${opcoes(unicos(empresasLista.map((e) => e.origem)).map((o) => [o, o]), "Todas")}</select></label>
      <label>Empresa / instituição<select id="f-empresa">${opcoes(empresasLista.map((e) => [e.empresa_id, e.nome_empresa]), "Todas")}</select></label>
      <label>Projeto<select id="f-projeto">${opcoes(projetos.map((p) => [p.projeto_id, p.nome_projeto]), "Todos")}</select></label>
      <label>Setor<select id="f-setor">${opcoes(unicos(projetos.map((p) => p.setor)).map((s) => [s, s]), "Todos")}</select></label>
      <label>Município<select id="f-municipio">${opcoes(unicos(projetos.map((p) => p.municipio)).map((m) => [m, m]), "Todos")}</select></label>
      <label id="rot-classe">Classe de ocupação<select id="f-classe">${opcoes(ORDEM_CLASSE.filter((c) => [...modelo.ocupacoes.values()].some((o) => o.classe === c)).map((c) => [c, c]), "Todas")}</select></label>
      <button class="limpar" id="limpar" type="button">Limpar filtros</button></div>
    <div class="resumo-filtros" id="resumo" hidden></div>
    <div class="dica" id="dica"></div>
    <main id="principal"></main>
    <div class="dicas-teclas" id="dicas" aria-hidden="true">← → mudar de página · 1–6 ir direto · F filtros · Esc sair</div>`;

  const $ = (id) => document.getElementById(id);
  const campos = { ano: "f-ano", origem: "f-origem", empresa: "f-empresa", projeto: "f-projeto", setor: "f-setor", municipio: "f-municipio", classe: "f-classe" };
  const sincronizarCampos = () => Object.entries(campos).forEach(([k, id]) => { $(id).value = estado[k]; });
  for (const [k, id] of Object.entries(campos)) $(id).addEventListener("change", (e) => { estado[k] = e.target.value; desenhar(); });
  $("limpar").addEventListener("click", () => { Object.assign(estado, padrao); sincronizarCampos(); desenhar(); });
  document.querySelectorAll("nav button").forEach((b) => b.addEventListener("click", () => { location.hash = b.dataset.p; }));
  removerGlobais.forEach((f) => f());
  removerGlobais = [];
  /** Registra um listener global e guarda como removê-lo quando a app for redesenhada. */
  const global = (alvo, evento, fn) => { alvo.addEventListener(evento, fn); removerGlobais.push(() => alvo.removeEventListener(evento, fn)); };
  global(window, "hashchange", () => { estado.pagina = lerHash(); desenhar(); });

  // ---------- filtros recolhíveis e modo apresentação ----------
  const corpo = document.body;
  const apresentando = () => corpo.classList.contains("apresentando");
  /** Mostra/esconde o painel de filtros. Recolhido, uma linha de resumo mostra o que está filtrado. */
  function filtrosVisiveis(sim) {
    $("filtros").hidden = !sim;
    $("btn-filtros").setAttribute("aria-expanded", String(sim));
    $("resumo").hidden = sim;
    if (!sim) resumirFiltros();
  }
  function resumirFiltros() {
    const nome = (mapa, k) => mapa.get(k)?.nome_empresa || mapa.get(k)?.nome_projeto || k;
    const partes = [estado.ano ? `Ano ${estado.ano}` : "Todo o período"];
    if (estado.origem) partes.push(estado.origem);
    if (estado.empresa) partes.push(nome(modelo.empresas, estado.empresa));
    if (estado.projeto) partes.push(nome(modelo.projetos, estado.projeto));
    if (estado.setor) partes.push(estado.setor);
    if (estado.municipio) partes.push(estado.municipio);
    if (estado.pagina === "S" && estado.classe) partes.push(estado.classe);
    $("resumo").textContent = `Filtros: ${partes.join(" · ")}`;
  }
  /** Liga/desliga o modo apresentação: letras maiores, cabeçalho enxuto, filtros recolhidos e tela cheia. */
  function modoApresentacao(ligar, { telaCheia = true } = {}) {
    corpo.classList.toggle("apresentando", ligar);
    $("btn-apresentar").textContent = ligar ? "Sair" : "Apresentar";
    filtrosVisiveis(!ligar);
    if (telaCheia) {
      if (ligar && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
      if (!ligar && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  }
  $("btn-filtros").addEventListener("click", () => filtrosVisiveis($("filtros").hidden));
  $("btn-apresentar").addEventListener("click", () => modoApresentacao(!apresentando()));
  // sair da tela cheia com Esc (que o navegador consome) também encerra o modo
  global(document, "fullscreenchange", () => { if (!document.fullscreenElement && apresentando()) modoApresentacao(false, { telaCheia: false }); });
  global(document, "keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
    const emCampo = e.target.closest?.("select, input, textarea");
    if (emCampo && e.key !== "Escape") return;                 // dentro de um filtro, as setas mudam o filtro
    const k = e.key.toLowerCase(), i = PAGINAS.findIndex((p) => p.id === estado.pagina);
    const ir = (j) => { if (j >= 0 && j < PAGINAS.length) location.hash = PAGINAS[j].id; };
    if (k === "p" && !apresentando()) { e.preventDefault(); modoApresentacao(true); return; }
    if (!apresentando()) return;                               // os demais atalhos só valem apresentando
    if (k === "arrowright" || k === "pagedown") { e.preventDefault(); ir(i + 1); }
    else if (k === "arrowleft" || k === "pageup") { e.preventDefault(); ir(i - 1); }
    else if (/^[1-9]$/.test(k)) ir(Number(k) - 1);
    else if (k === "f") filtrosVisiveis($("filtros").hidden);
    else if (k === "p" || k === "escape") modoApresentacao(false);
  });

  $("btn-importar").addEventListener("click", () => abrirImportacao({
    tema, contrato: modelo.contrato, registro,
    aplicar: async (r) => {
      // catálogo GRI importado → refaz o registro com ele; senão mantém o atual
      const reg = r.catalogoTexto ? await carregarRegistro(leitorComSubstitutos({ "privado/gri_catalogo.json": r.catalogoTexto }, leitorHttp)) : registro;
      const met = r.metricas || metricas;
      const probs = r.metricas ? validarMetricas(r.metricas, reg, tema.indicadores) : problemasMetricas;
      iniciarApp({ modelo: r.modelo || modelo, registro: reg, indice, metricas: met, problemasMetricas: probs, demo,
                   importado: { arquivos: r.relatorio.lidos.map((l) => l.arquivo) } });
    },
  }));
  $("voltar-demo")?.addEventListener("click", () => iniciarApp(demo));

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
    if (!$("resumo").hidden) resumirFiltros();
    $("dica").textContent = !estado.ano ? "Dica: escolha um ano para ver a variação contra o ano anterior."
      : estado.ano === ultimoAno && mesesDoUltimo < 12 ? `${ultimoAno} tem ${mesesDoUltimo} meses de dados; totais são anualizados (× 12 ÷ ${mesesDoUltimo}) para comparar com anos inteiros.` : "";
    const principal = $("principal");
    try {
      const ctx = criarContexto(modelo, filtrosDoMotor());
      const c = { modelo, registro, ctx, tema, estado, metricas, problemasMetricas };
      const html = estado.pagina === "visao" ? visao.render(c) : ["A", "S", "G"].includes(estado.pagina) ? pilar.render(estado.pagina, c)
        : estado.pagina === "empresas" ? empresas.render(c) : metodo.render(c);
      principal.innerHTML = `<section class="pagina">${html}</section>`;
      if (estado.pagina === "metodo") metodo.depois(principal, c);
    } catch (e) {
      console.error(e);
      principal.innerHTML = `<div class="caixa"><h3>Não foi possível montar esta página</h3><p class="sub">${esc(e.message)}</p></div>`;
    }
  }
  sincronizarCampos(); desenhar();
  modoApresentacao(apresentando(), { telaCheia: false });   // mantém o modo se a app foi redesenhada (ex.: após importar)
}
