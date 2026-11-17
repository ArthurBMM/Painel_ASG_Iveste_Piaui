// =====================================================================================
// csv.js — leitor de CSV sem dependências (funciona no navegador e no Node)
//
// Por que escrever o nosso? Um CSV "de verdade" pode ter vírgula DENTRO de um campo
// (ex.: "Rua A, 10") e aspas escapadas (""). Dividir por vírgula (split(',')) quebra nesses
// casos. Este leitor é uma pequena máquina de estados: andamos caractere a caractere e
// lembramos se estamos "dentro de aspas" ou não.
// =====================================================================================

/**
 * Descobre o separador de colunas olhando só a PRIMEIRA linha (o cabeçalho), fora de aspas.
 * Por quê? O Excel em português salva CSV com ponto e vírgula (";"), porque a vírgula é o separador
 * decimal por lá. Se o leitor só aceitasse ",", o primeiro arquivo real do usuário falharia.
 * Empate ou nenhum candidato → "," (o padrão do CSV).
 */
export function detectarSeparador(texto) {
  const primeira = (texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto).split(/\r?\n/, 1)[0];
  const cont = { ",": 0, ";": 0, "\t": 0 };
  let aspas = false;
  for (const c of primeira) { if (c === '"') aspas = !aspas; else if (!aspas && c in cont) cont[c]++; }
  const [sep, n] = Object.entries(cont).sort((a, b) => b[1] - a[1])[0];   // sort é estável: empate fica com a vírgula
  return n > 0 ? sep : ",";
}

/**
 * Converte o texto de um CSV em uma matriz de linhas (cada linha = array de strings).
 * @param {string} texto conteúdo bruto do arquivo
 * @param {string} [separador] "," ";" ou "\t"; se omitido, é detectado pelo cabeçalho
 * @returns {string[][]}
 */
export function parseCSV(texto, separador) {
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1); // remove BOM (o Excel costuma colocar)
  const sep = separador || detectarSeparador(texto);
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
    } else if (c === sep) {
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
 * Converte texto em número aceitando os dois jeitos de escrever:
 *   "1234.5" (padrão do nosso contrato)   "1234,5" e "1.234,5" (Excel em português)
 * Vazio → null (sem dado). Texto que não é número → undefined (o chamador registra o problema).
 * Por que não aceitar "1.234" como 1234? É ambíguo (mil duzentos e trinta e quatro ou 1,234?). Só tratamos
 * o ponto como milhar quando a vírgula decimal também aparece.
 */
export function paraNumero(s) {
  const x = String(s).trim();
  if (x === "") return null;
  if (/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(x)) return Number(x);
  if (/^[-+]?\d+,\d+$/.test(x)) return Number(x.replace(",", "."));
  if (/^[-+]?\d{1,3}(\.\d{3})+,\d+$/.test(x)) return Number(x.replace(/\./g, "").replace(",", "."));
  return undefined;
}

/** Data no formato do contrato (AAAA-MM-DD, ou AAAA-MM). Aceita também DD/MM/AAAA e normaliza. Vazio → null; inválida → undefined. */
export function paraData(s) {
  const x = String(s).trim();
  if (x === "") return null;
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(x)) return x;
  const m = x.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return undefined;
}

/**
 * Lê o CSV e devolve objetos, convertendo cada coluna conforme o tipo do contrato de dados.
 * Tipos: "texto" | "numero" | "inteiro" | "data". Número vazio vira null (e não 0!), porque
 * "sem dado" é diferente de "zero" nas contas (ver avaliador.js).
 * Valor que não dá para converter vira null e entra em `invalidos` ({coluna, tipo, linha, valor}),
 * para a importação poder avisar o usuário em vez de calcular com NaN.
 * @param {string} texto
 * @param {Object<string,string>} tipos  ex.: { projeto_id: "texto", vagas: "inteiro" }
 * @returns {{linhas: object[], cabecalho: string[], invalidos: object[]}}
 */
export function csvParaObjetos(texto, tipos = {}) {
  const matriz = parseCSV(texto);
  const cabecalho = (matriz.shift() || []).map((h) => h.trim());
  const invalidos = [];
  const conversores = cabecalho.map((nome) => {
    const t = tipos[nome] || "texto";
    const conv = t === "numero" || t === "inteiro" ? paraNumero : t === "data" ? paraData : null;
    if (!conv) return (s) => s; // texto fica como veio
    return (s, linha) => {
      const v = conv(s);
      if (v === undefined) { invalidos.push({ coluna: nome, tipo: t, linha, valor: String(s).trim() }); return null; }
      return v;
    };
  });
  const linhas = matriz.map((r, k) => {
    const o = {};
    for (let i = 0; i < cabecalho.length; i++) o[cabecalho[i]] = conversores[i](r[i] ?? "", k + 2); // +2: linha 1 é o cabeçalho
    return o;
  });
  return { linhas, cabecalho, invalidos };
}
