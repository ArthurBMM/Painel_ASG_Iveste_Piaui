// =====================================================================================
// main.js — ponto de entrada: lê o índice de temas, carrega o tema e o registro, inicia a app.
// Para abrir outro tema:  index.html?tema=<id>   (ids em temas/index.json)
// =====================================================================================
import { carregarTema } from "./nucleo/modelo.js";
import { carregarRegistro } from "./nucleo/registro.js";
import { iniciarApp } from "./ui/app.js";

/** Leitor do navegador: busca o arquivo por HTTP (exige servidor; ver README). */
const leitor = async (caminho) => {
  const r = await fetch(caminho);
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
  return r.text();
};

try {
  const indice = JSON.parse(await leitor("temas/index.json"));
  const pedido = new URLSearchParams(location.search).get("tema");
  const info = indice.temas.find((t) => t.id === pedido) || indice.temas[0];
  const [modelo, registro] = await Promise.all([carregarTema(leitor, info.pasta), carregarRegistro(leitor)]);
  if (modelo.problemas.erros.length) console.warn("Problemas nos dados:", modelo.problemas);
  iniciarApp({ modelo, registro, indice });
} catch (e) {
  console.error(e);
  document.getElementById("app").innerHTML = `<main style="padding:5vw;max-width:70ch"><h1>Não foi possível carregar</h1>
    <p>${String(e.message).replace(/[<>&]/g, "")}</p>
    <p>Se você abriu o arquivo com duplo clique (<code>file://</code>), o navegador bloqueia a leitura dos dados.
    Rode um servidor local na pasta do projeto: <code>npm run servir</code> (ou <code>python3 -m http.server 8080</code>)
    e abra <code>http://localhost:8080</code>.</p></main>`;
}
