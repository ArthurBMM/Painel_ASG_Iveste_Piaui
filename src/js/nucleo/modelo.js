// =====================================================================================
// modelo.js — carrega um TEMA (tema.json + contrato.json + CSVs) e monta o "modelo de dados"
//
// Conceitos:
//  - TEMA: uma "pasta" em temas/<id>/ com tema.json (o que mostrar), contrato.json (que tabelas e
//    colunas existem) e dados/*.csv. Trocar de tema = apontar para outra pasta.
//  - CONTRATO DE DADOS: a lista de tabelas/colunas esperadas e seus tipos. É ele que permite
//    VALIDAR um arquivo importado antes de calcular qualquer coisa.
//  - LEITOR: função async (caminho) => texto. No navegador é fetch(); no Node é fs.readFile; numa
//    importação feita pelo usuário é o conteúdo do arquivo escolhido. O resto do código não
//    precisa saber de onde o texto veio.
// =====================================================================================
import { csvParaObjetos } from "./csv.js";

/**
 * Transforma os valores que não deu para converter em mensagens claras: UMA por coluna, com exemplo e linha.
 * São ERROS (bloqueiam a importação): um "n/d" no lugar de número viraria "sem dado" calado e mudaria as
 * médias sem ninguém perceber. Melhor o usuário corrigir (deixar a célula vazia = sem dado, de propósito).
 */
function relatarInvalidos(arquivo, invalidos, problemas) {
  const porColuna = new Map();
  for (const x of invalidos) { if (!porColuna.has(x.coluna)) porColuna.set(x.coluna, []); porColuna.get(x.coluna).push(x); }
  for (const [coluna, lista] of porColuna) {
    const ex = lista[0], base = `${arquivo}, coluna ${coluna}: ${lista.length} valor(es)`;
    problemas.erros.push(ex.tipo === "data"
      ? `${base} com data inválida (ex.: "${ex.valor}" na linha ${ex.linha}). Use AAAA-MM-DD ou DD/MM/AAAA`
      : `${base} que não são número (ex.: "${ex.valor}" na linha ${ex.linha}). Corrija ou deixe a célula vazia para indicar "sem dado"`);
  }
}

/**
 * Monta o modelo a partir de textos já lidos.
 * @param {object} tema      conteúdo de tema.json
 * @param {object} contrato  conteúdo de contrato.json
 * @param {Object<string,string>} textos  { "emprego_mensal.csv": "<texto>", ... }
 */
export function montarModelo(tema, contrato, textos) {
  const tabelas = {};
  const camposDisponiveis = new Set(); // "tabela.coluna" que existem de fato nos arquivos
  const problemas = { erros: [], avisos: [] };

  for (const [nome, def] of Object.entries(contrato.tabelas)) {
    const texto = textos[def.arquivo];
    if (texto == null) {
      (def.obrigatoria ? problemas.erros : problemas.avisos).push(`Arquivo ausente: ${def.arquivo} (tabela ${nome})`);
      continue;
    }
    const { linhas, cabecalho, invalidos } = csvParaObjetos(texto, def.colunas);
    const faltando = Object.keys(def.colunas).filter((c) => !cabecalho.includes(c));
    if (faltando.length) {
      (def.obrigatoria ? problemas.erros : problemas.avisos).push(`${def.arquivo}: faltam as colunas ${faltando.join(", ")}`);
    }
    // valores que não são número/data válidos: erro com exemplo e linha do arquivo (ver relatarInvalidos)
    relatarInvalidos(def.arquivo, invalidos, problemas);
    // chave duplicada (ex.: dois projetos com o mesmo projeto_id) faria as contas somarem em dobro
    if (def.chave?.length && def.chave.every((c) => cabecalho.includes(c))) {
      const vistas = new Set(); let repetidas = 0;
      for (const l of linhas) { const k = def.chave.map((c) => l[c]).join("|"); if (vistas.has(k)) repetidas++; else vistas.add(k); }
      if (repetidas) problemas.erros.push(`${def.arquivo}: ${repetidas} linha(s) repetida(s) para a chave (${def.chave.join(", ")})`);
    }
    // a coluna "mes" é a base do calendário: linha sem mês quebraria séries e filtros, então é erro
    const semMes = cabecalho.includes("mes") && !invalidos.some((v) => v.coluna === "mes") ? linhas.findIndex((r) => !r.mes) : -1;   // data inválida já foi relatada acima
    if (semMes >= 0) problemas.erros.push(`${def.arquivo}: a coluna mes está vazia na linha ${semMes + 2}`);
    cabecalho.forEach((c) => camposDisponiveis.add(`${nome}.${c}`));
    tabelas[nome] = linhas;
  }

  // integridade referencial: toda chave estrangeira deve existir na tabela de destino
  for (const rel of contrato.relacoes || []) {
    const [tOrig, cOrig] = rel.de.split(".");
    const [tDest, cDest] = rel.para.split(".");
    if (!tabelas[tOrig] || !tabelas[tDest]) continue;
    const validos = new Set(tabelas[tDest].map((r) => r[cDest]));
    const orfaos = [...new Set(tabelas[tOrig].map((r) => r[cOrig]).filter((v) => v != null && !validos.has(v)))];
    if (orfaos.length) problemas.avisos.push(`${rel.de} tem valores sem correspondente em ${rel.para}: ${orfaos.slice(0, 5).join(", ")}`);
  }

  const indexar = (nome, chave) => new Map((tabelas[nome] || []).map((r) => [r[chave], r]));
  const mesesSet = new Set();
  for (const t of Object.values(tabelas)) if (t.length && "mes" in t[0]) t.forEach((r) => r.mes && mesesSet.add(r.mes.slice(0, 7)));

  return {
    tema, contrato, tabelas, camposDisponiveis, problemas,
    projetos: indexar("projetos", "projeto_id"),
    ocupacoes: indexar("ocupacoes", "ocupacao_id"),
    empresas: indexar("empresas", "empresa_id"),
    // o "calendário" é simplesmente a lista de meses que aparecem nos dados (formato AAAA-MM)
    meses: [...mesesSet].sort(),
  };
}

/**
 * Carrega um tema inteiro usando um leitor.
 * @param {(caminho:string)=>Promise<string>} leitor
 * @param {string} pasta  ex.: "temas/t8-empregos-verdes"
 */
export async function carregarTema(leitor, pasta) {
  const tema = JSON.parse(await leitor(`${pasta}/tema.json`));
  const contrato = JSON.parse(await leitor(`${pasta}/${tema.contrato}`));
  const textos = {};
  await Promise.all(Object.values(contrato.tabelas).map(async (def) => {
    try { textos[def.arquivo] = await leitor(`${pasta}/${tema.pasta_dados}/${def.arquivo}`); } catch { /* ausente: montarModelo avisa */ }
  }));
  return montarModelo(tema, contrato, textos);
}
