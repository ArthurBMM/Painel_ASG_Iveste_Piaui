// =====================================================================================
// formato.js — como mostrar números (pt-BR) e variações. Funções puras: sem DOM.
// =====================================================================================

const nf = (v, casas) => v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const valido = (v) => v != null && Number.isFinite(v);

/** formato: { tipo: "percentual" | "numero" | "moeda_milhoes", casas, unidade } */
export function formatarValor(v, formato) {
  if (!valido(v)) return "–";
  const casas = formato.casas ?? 0;
  switch (formato.tipo) {
    case "percentual": return nf(v * 100, casas) + "%";
    case "moeda_milhoes": return "R$ " + nf(v / 1e6, casas) + " mi";
    default: return nf(v, casas) + (formato.unidade || "");
  }
}

/** Texto da variação, ex.: "▲ +1,3 pp" (percentual) ou "▼ −2,1 tCO2e" (número). */
export function formatarDelta(d, formato) {
  if (!valido(d)) return "–";
  const sinal = d > 0 ? "▲ +" : d < 0 ? "▼ −" : "● ";
  const a = Math.abs(d), casas = formato.casas ?? 0;
  if (formato.tipo === "percentual") return sinal + nf(a * 100, 1) + " pp";
  if (formato.tipo === "moeda_milhoes") return sinal + "R$ " + nf(a / 1e6, casas) + " mi";
  return sinal + nf(a, casas) + (formato.unidade || "");
}

/**
 * A COR de uma variação depende do SENTIDO DESEJÁVEL, não do sinal:
 * para um indicador "↑ é bom", subir é bom; para "↓ é bom", subir é ruim.
 * Retorna "bom" | "ruim" | "neutro" (o CSS pinta cada um).
 */
export function classeDaVariacao(d, sentido) {
  if (!valido(d) || d === 0 || sentido === "neutro") return "neutro";
  return (d > 0) === (sentido === "up") ? "bom" : "ruim";
}
