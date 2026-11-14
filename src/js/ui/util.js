// =====================================================================================
// util.js — utilidades de interface
// =====================================================================================

/**
 * Escapa texto antes de colocá-lo em HTML. SEMPRE use isto em qualquer texto que venha de
 * dados (nomes de projetos, empresas...): quando a ferramenta importar arquivos de terceiros,
 * um nome como "<img onerror=...>" não pode virar código executável (ataque XSS).
 */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
/** "2023-01" -> "jan/23" */
export const rotuloMes = (m) => `${MESES_ABREV[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;
