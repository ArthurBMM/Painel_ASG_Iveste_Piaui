// =====================================================================================
// main.js — ponto de entrada: lê o índice de temas, carrega o tema e o registro, inicia a app.
// Para abrir outro tema:  index.html?tema=<id>   (ids em temas/index.json)
// =====================================================================================
import { carregarTema } from "./nucleo/modelo.js";
import { carregarRegistro } from "./nucleo/registro.js";
import { carregarMetricas, validarMetricas } from "./nucleo/pontuacao.js";
import { iniciarApp } from "./ui/app.js";

import { leitorHttp as leitor } from "./nucleo/leitores.js";   // busca os arquivos por HTTP (exige servidor; ver README)

/**
 * Carrega um tema (dados + parâmetros da pontuação validados contra o registro).
 * Fica numa função porque a troca de tema no cabeçalho reusa este caminho SEM recarregar a página
 * (recarregar perderia o catálogo GRI desbloqueado, que vive só na memória).
 */
async function prepararTema(indice, idTema, registro) {
  const info = indice.temas.find((t) => t.id === idTema) || indice.temas[0];
  const modelo = await carregarTema(leitor, info.pasta);
  if (modelo.problemas.erros.length) console.warn("Problemas nos dados:", modelo.problemas);
  // Parâmetros da pontuação (config/metricas.json). Com ERROS de validação não calculamos nota nenhuma:
  // melhor mostrar só valores do que uma nota errada. A página "Indicadores e método" lista o que corrigir.
  const metricasBrutas = await carregarMetricas(leitor);
  const problemasMetricas = metricasBrutas ? validarMetricas(metricasBrutas, registro, modelo.tema.indicadores) : null;
  const metricas = metricasBrutas && !problemasMetricas.erros.length ? metricasBrutas : null;
  if (problemasMetricas?.erros.length) console.warn("config/metricas.json inválido:", problemasMetricas.erros);
  return { modelo, metricas, problemasMetricas };
}

try {
  const indice = JSON.parse(await leitor("temas/index.json"));
  const registro = await carregarRegistro(leitor);
  const pedido = new URLSearchParams(location.search).get("tema");
  const [tema, identidade, catalogoCifrado] = await Promise.all([
    prepararTema(indice, pedido, registro),
    // Identidade visual (config/identidade.json): opcional; sem ela valem os padrões de app.js
    leitor("config/identidade.json").then(JSON.parse).catch(() => null),
    // Catálogo GRI cifrado (público). Só interessa se o catálogo ABERTO (privado/, fora do Git) não existe.
    registro.catalogoDisponivel ? null : leitor("catalogo/gri_catalogo.cifrado.json").then(JSON.parse).catch(() => null),
  ]);
  iniciarApp({ ...tema, registro, indice, identidade, catalogoCifrado, abrirTema: (id, reg) => prepararTema(indice, id, reg) });
} catch (e) {
  console.error(e);
  document.getElementById("app").innerHTML = `<main style="padding:5vw;max-width:70ch"><h1>Não foi possível carregar</h1>
    <p>${String(e.message).replace(/[<>&]/g, "")}</p>
    <p>Se você abriu o arquivo com duplo clique (<code>file://</code>), o navegador bloqueia a leitura dos dados.
    Rode um servidor local na pasta do projeto: <code>npm run servir</code> (ou <code>python3 -m http.server 8080</code>)
    e abra <code>http://localhost:8080</code>.</p></main>`;
}
