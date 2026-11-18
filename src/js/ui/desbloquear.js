// =====================================================================================
// desbloquear.js — janela "Desbloquear catálogo GRI": a pessoa digita a senha e o navegador decifra
// catalogo/gri_catalogo.cifrado.json NA MEMÓRIA (a conta mora em nucleo/cifra.js).
//
// Nada é enviado nem guardado: nem a senha, nem o catálogo aberto. Fechou a aba, acabou.
// =====================================================================================
import { decifrarTexto, SenhaIncorreta } from "../nucleo/cifra.js";

/**
 * @param {object} p
 * @param {object} p.envelope   conteúdo de catalogo/gri_catalogo.cifrado.json
 * @param {(texto:string)=>Promise<void>} p.aoAbrir  recebe o catálogo decifrado (texto JSON)
 */
export function abrirDesbloqueio({ envelope, aoAbrir }) {
  document.getElementById("dlg-gri")?.remove();
  const dlg = document.createElement("dialog");
  dlg.id = "dlg-gri";
  dlg.innerHTML = `
    <form class="imp gri" id="form-gri">
      <h2>Desbloquear catálogo GRI</h2>
      <p>O catálogo das Normas GRI (títulos e páginas) é publicado <b>cifrado</b>. Digite a senha recebida do grupo.</p>
      <p class="sub">A senha e o catálogo ficam só nesta aba do navegador: nada é enviado nem salvo. Sem a senha, o painel funciona normalmente, com os códigos GRI.</p>
      <label class="campo-senha">Senha <input type="password" id="gri-senha" autocomplete="off" spellcheck="false" required></label>
      <p id="gri-msg" class="gri-msg" role="alert"></p>
      <menu><button type="button" class="sec" id="gri-cancelar">Cancelar</button><button type="submit" id="gri-ok">Desbloquear</button></menu>
    </form>`;
  document.body.appendChild(dlg);
  const $ = (s) => dlg.querySelector(s);
  const msg = (t, erro = false) => { $("#gri-msg").textContent = t; $("#gri-msg").classList.toggle("erro", erro); };

  $("#gri-cancelar").addEventListener("click", () => dlg.close());
  $("#form-gri").addEventListener("submit", async (e) => {
    e.preventDefault();                           // não deixa o formulário recarregar a página
    const senha = $("#gri-senha").value;
    $("#gri-ok").disabled = true;
    msg("Desbloqueando…");                        // a derivação da chave é lenta de propósito (~0,5 s)
    try {
      const texto = await decifrarTexto(envelope, senha);
      await aoAbrir(texto);
      dlg.close();
    } catch (err) {
      if (!(err instanceof SenhaIncorreta)) console.error(err);     // senha errada é esperado: não suja o console
      msg(err instanceof SenhaIncorreta ? "Senha incorreta. Confira maiúsculas, espaços e acentos." : err.message, true);
      $("#gri-ok").disabled = false;
      $("#gri-senha").select();
    }
  });
  dlg.addEventListener("close", () => dlg.remove());
  dlg.showModal();
  $("#gri-senha").focus();
}
