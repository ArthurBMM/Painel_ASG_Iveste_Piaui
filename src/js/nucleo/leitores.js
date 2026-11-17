// =====================================================================================
// leitores.js — "de onde vem o texto dos arquivos?"
//
// O motor não sabe se um arquivo veio do servidor ou do computador do usuário: ele só chama
// leitor(caminho) e recebe texto. Aqui moram os dois leitores usados no navegador.
// =====================================================================================

/** Leitor padrão: busca o arquivo por HTTP (por isso a ferramenta precisa de um servidor local; ver README). */
export const leitorHttp = async (caminho) => {
  const r = await fetch(caminho);
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
  return r.text();
};

/**
 * Leitor "por cima" de outro: devolve o texto em memória quando o caminho está no mapa e, nos demais
 * casos, delega ao leitor de baixo. Serve para trocar UM arquivo (ex.: o catálogo GRI importado)
 * sem mexer no resto.
 * @param {Object<string,string>} mapa  { caminho: texto }
 */
export const leitorComSubstitutos = (mapa, base) => async (caminho) => (caminho in mapa ? mapa[caminho] : base(caminho));
