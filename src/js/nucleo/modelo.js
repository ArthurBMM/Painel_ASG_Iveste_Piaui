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
    const { linhas, cabecalho } = csvParaObjetos(texto, def.colunas);
    const faltando = Object.keys(def.colunas).filter((c) => !cabecalho.includes(c));
    if (faltando.length) {
      (def.obrigatoria ? problemas.erros : problemas.avisos).push(`${def.arquivo}: faltam as colunas ${faltando.join(", ")}`);
    }
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
  for (const t of Object.values(tabelas)) if (t.length && "mes" in t[0]) t.forEach((r) => mesesSet.add(r.mes.slice(0, 7)));

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
