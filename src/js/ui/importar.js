// =====================================================================================
// importar.js — janela "Importar dados": o usuário escolhe CSV (e, se quiser, metricas.json e
// gri_catalogo.json), vê o RELATÓRIO de validação e só então aplica.
//
// Regras de projeto:
//  - Tudo acontece no navegador. Nada é enviado nem gravado; recarregar a página volta à demonstração.
//  - Nada é aplicado com erro. O botão "Usar estes dados" só habilita quando o relatório não tem erros.
//  - A conta e a validação ficam em nucleo/importacao.js (testável); aqui só se lê arquivo e se desenha.
// =====================================================================================
import { prepararImportacao, decodificarTexto, nomeBase } from "../nucleo/importacao.js";
import { esc } from "./util.js";

const rotuloTipo = { texto: "texto", numero: "número", inteiro: "inteiro", data: "data" };

/**
 * @param {object} p
 * @param {object} p.tema, p.contrato  o molde (tema aberto)
 * @param {object} p.registro          para validar metricas.json e testar o cálculo
 * @param {(r:object)=>Promise<void>} p.aplicar  chamada com o resultado de prepararImportacao quando ok
 */
export function abrirImportacao({ tema, contrato, registro, aplicar }) {
  document.getElementById("dlg-importar")?.remove();
  const dlg = document.createElement("dialog");
  dlg.id = "dlg-importar";
  const molde = Object.values(contrato.tabelas).map((d) => `<tr><td><code>${esc(d.arquivo)}</code></td><td>${d.obrigatoria ? "obrigatório" : "opcional"}</td>
    <td>${Object.entries(d.colunas).map(([c, t]) => `<code>${esc(c)}</code> <span class="tipo">${rotuloTipo[t] || t}</span>`).join(", ")}</td></tr>`).join("");
  dlg.innerHTML = `
    <form method="dialog" class="imp">
      <h2>Importar dados</h2>
      <p>Escolha os <b>arquivos CSV</b> do molde deste tema (um por tabela, com os nomes abaixo). Se quiser, inclua também
      <code>metricas.json</code> (parâmetros da pontuação) e <code>gri_catalogo.json</code> (catálogo GRI).</p>
      <p class="sub">Os arquivos são lidos neste navegador: <b>nada é enviado nem salvo</b>. Ao recarregar a página, voltam os dados de demonstração.
      Aceitamos vírgula ou ponto e vírgula como separador, números como <code>1.234,5</code> e datas como <code>31/12/2024</code>.</p>
      <div class="zona" id="imp-zona">
        <p>Arraste os arquivos aqui ou</p>
        <label class="botao">Escolher arquivos<input type="file" id="imp-arquivos" multiple accept=".csv,.json,.txt" hidden></label>
        <label class="botao sec">Escolher uma pasta<input type="file" id="imp-pasta" webkitdirectory hidden></label>
        <button type="button" class="link" id="imp-limpar" hidden>Limpar seleção</button>
      </div>
      <details><summary>Molde de arquivos deste tema (${Object.keys(contrato.tabelas).length} tabelas)</summary>
        <div class="rolagem"><table class="molde"><thead><tr><th>Arquivo</th><th></th><th>Colunas</th></tr></thead><tbody>${molde}</tbody></table></div>
        <p class="sub">Célula vazia em coluna numérica significa <b>sem dado</b> (não é zero). Os dados de demonstração em <code>temas/${esc(tema.id || "…")}/dados/</code> servem de modelo.</p>
      </details>
      <div id="imp-relatorio" aria-live="polite"></div>
      <menu><button value="cancel" class="sec">Cancelar</button><button type="button" id="imp-aplicar" disabled>Usar estes dados</button></menu>
    </form>`;
  document.body.appendChild(dlg);

  const $ = (s) => dlg.querySelector(s);
  const selecionados = new Map();           // nome em minúsculas → {nome, texto}; uma nova escolha soma à anterior
  let resultado = null;

  async function adicionar(lista) {
    for (const f of lista) {
      const texto = decodificarTexto(new Uint8Array(await f.arrayBuffer()));
      selecionados.set(nomeBase(f.name), { nome: f.webkitRelativePath || f.name, texto });
    }
    atualizar();
  }

  function atualizar() {
    $("#imp-limpar").hidden = !selecionados.size;
    resultado = selecionados.size ? prepararImportacao({ tema, contrato, registro, arquivos: [...selecionados.values()] }) : null;
    $("#imp-aplicar").disabled = !resultado?.ok;
    if (!resultado) { $("#imp-relatorio").innerHTML = ""; return; }
    const { lidos, erros, avisos } = resultado.relatorio;
    const lista = (itens, cls) => (itens.length ? `<ul class="${cls}">${itens.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
    const linhas = lidos.reduce((s, l) => s + (l.linhas || 0), 0);
    $("#imp-relatorio").innerHTML = `
      <h3>${resultado.ok ? "Pronto para usar" : "Corrija antes de continuar"}</h3>
      ${lidos.length ? `<p class="sub">Lidos: ${lidos.map((l) => `<code>${esc(l.arquivo)}</code>${l.linhas != null ? ` (${l.linhas} linhas)` : ""}`).join(", ")}${linhas ? ` · ${linhas.toLocaleString("pt-BR")} linhas no total` : ""}</p>` : ""}
      ${erros.length ? `<p class="rot erro">Erros (${erros.length})</p>${lista(erros, "erros")}` : ""}
      ${avisos.length ? `<p class="rot aviso-i">Avisos (${avisos.length})</p>${lista(avisos, "avisos")}` : ""}
      ${resultado.ok ? `<p class="sub">${resultado.modelo ? "Os dados abaixo substituem a demonstração só nesta sessão." : "Só os parâmetros/catálogo serão trocados; os dados continuam os da demonstração."}</p>` : ""}`;
  }

  $("#imp-arquivos").addEventListener("change", (e) => { adicionar([...e.target.files]); e.target.value = ""; });
  $("#imp-pasta").addEventListener("change", (e) => { adicionar([...e.target.files].filter((f) => /\.(csv|json)$/i.test(f.name))); e.target.value = ""; });
  $("#imp-limpar").addEventListener("click", () => { selecionados.clear(); atualizar(); });
  const zona = $("#imp-zona");
  zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("sobre"); });
  zona.addEventListener("dragleave", () => zona.classList.remove("sobre"));
  zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("sobre"); adicionar([...e.dataTransfer.files]); });
  $("#imp-aplicar").addEventListener("click", async () => {
    if (!resultado?.ok) return;
    $("#imp-aplicar").disabled = true;
    try { await aplicar(resultado); dlg.close(); }
    catch (e) {   // ex.: catálogo GRI sem um código usado pelo registro
      console.error(e);
      $("#imp-relatorio").insertAdjacentHTML("afterbegin", `<p class="rot erro">Não foi possível aplicar</p><ul class="erros"><li>${esc(e.message)}</li></ul>`);
      $("#imp-aplicar").disabled = false;
    }
  });
  dlg.addEventListener("close", () => dlg.remove());
  dlg.showModal();
}
