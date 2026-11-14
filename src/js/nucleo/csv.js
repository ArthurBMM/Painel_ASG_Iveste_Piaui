// =====================================================================================
// csv.js — leitor de CSV sem dependências (funciona no navegador e no Node)
//
// Por que escrever o nosso? Um CSV "de verdade" pode ter vírgula DENTRO de um campo
// (ex.: "Rua A, 10") e aspas escapadas (""). Dividir por vírgula (split(',')) quebra nesses
// casos. Este leitor é uma pequena máquina de estados: andamos caractere a caractere e
// lembramos se estamos "dentro de aspas" ou não.
// =====================================================================================

/**
 * Converte o texto de um CSV em uma matriz de linhas (cada linha = array de strings).
 * @param {string} texto conteúdo bruto do arquivo
 * @returns {string[][]}
 */
export function parseCSV(texto) {
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1); // remove BOM (o Excel costuma colocar)
  const linhas = [];
  let campo = "";
  let linha = [];
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } // "" dentro de aspas = uma aspa literal
        else dentroDeAspas = false;                      // fecha as aspas
      } else campo += c;
    } else if (c === '"') {
      dentroDeAspas = true;
    } else if (c === ",") {
      linha.push(campo); campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;      // trata \r\n como uma quebra só
      linha.push(campo); campo = "";
      if (linha.length > 1 || linha[0] !== "") linhas.push(linha); // ignora linha vazia
      linha = [];
    } else campo += c;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); } // última linha sem \n
  return linhas;
}

/**
 * Lê o CSV e devolve objetos, convertendo cada coluna conforme o tipo do contrato de dados.
 * Tipos: "texto" | "numero" | "inteiro" | "data". Número vazio vira null (e não 0!), porque
 * "sem dado" é diferente de "zero" nas contas (ver avaliador.js).
 * @param {string} texto
 * @param {Object<string,string>} tipos  ex.: { projeto_id: "texto", vagas: "inteiro" }
 * @returns {{linhas: object[], cabecalho: string[]}}
 */
export function csvParaObjetos(texto, tipos = {}) {
  const matriz = parseCSV(texto);
  const cabecalho = (matriz.shift() || []).map((h) => h.trim());
  const conversores = cabecalho.map((nome) => {
    const t = tipos[nome] || "texto";
    if (t === "numero" || t === "inteiro") return (s) => (s.trim() === "" ? null : Number(s));
    return (s) => s; // texto e data ficam como string ("2023-01-01")
  });
  const linhas = matriz.map((r) => {
    const o = {};
    for (let i = 0; i < cabecalho.length; i++) o[cabecalho[i]] = conversores[i](r[i] ?? "");
    return o;
  });
  return { linhas, cabecalho };
}
