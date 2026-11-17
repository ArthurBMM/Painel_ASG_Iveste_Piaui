// =====================================================================================
// importacao.js — prepara e VALIDA arquivos escolhidos pelo usuário (CSV e JSON) antes de calcular
//
// Fluxo (nada é gravado em lugar nenhum; recarregar a página volta à demonstração):
//   arquivos escolhidos → prepararImportacao() → relatório (erros, avisos, o que foi lido)
//                       → se não há erros, a tela troca o modelo de dados pelo importado.
//
// O "molde" é o contrato do tema aberto (contrato.json): quais tabelas existem, o nome de cada
// arquivo (ex.: projetos.csv), quais colunas e de que tipo. Arquivos extras são ignorados com aviso.
// Este módulo não usa HTML nem fetch: roda no navegador e no Node (por isso é testável).
// =====================================================================================
import { montarModelo } from "./modelo.js";
import { criarContexto } from "./contexto.js";
import { valorDe } from "./registro.js";
import { validarMetricas } from "./pontuacao.js";

/**
 * Bytes → texto. Tenta UTF-8 "estrito"; se houver byte inválido, assume Windows-1252, que é o que o
 * Excel em português costuma gravar em CSV (sem isso "Marcolândia" viraria "Marcol�ndia").
 */
export function decodificarTexto(bytes) {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return new TextDecoder("windows-1252").decode(bytes); }
}

/** "C:\\pasta\\Projetos.CSV" → "projetos.csv" (só o nome, minúsculo: o usuário pode escolher uma pasta inteira). */
export const nomeBase = (caminho) => String(caminho).split(/[\\/]/).pop().trim().toLowerCase();

/**
 * @param {object}   p
 * @param {object}   p.tema       tema.json do tema aberto
 * @param {object}   p.contrato   contrato.json do tema aberto (o molde)
 * @param {Array<{nome:string, texto:string}>} p.arquivos  arquivos já lidos como texto
 * @param {object}  [p.registro]  registro de indicadores: habilita validar metricas.json e testar o cálculo
 * @returns {{ok:boolean, modelo:object|null, metricas:object|null, catalogoTexto:string|null, relatorio:object}}
 */
export function prepararImportacao({ tema, contrato, arquivos, registro = null }) {
  const erros = [], avisos = [], lidos = [];
  const porNome = new Map();
  for (const a of arquivos) {
    const n = nomeBase(a.nome);
    if (porNome.has(n)) avisos.push(`${n} apareceu mais de uma vez; vale o último`);
    porNome.set(n, a.texto);
  }

  // 1) tabelas CSV: cada arquivo do contrato que o usuário trouxe
  const textos = {}, usados = new Set();
  for (const [tabela, def] of Object.entries(contrato.tabelas)) {
    const chave = def.arquivo.toLowerCase();
    if (porNome.has(chave)) { textos[def.arquivo] = porNome.get(chave); usados.add(chave); }
  }

  // 2) arquivos opcionais em JSON
  let metricas = null, catalogoTexto = null;
  if (porNome.has("metricas.json")) {
    usados.add("metricas.json");
    try { metricas = JSON.parse(porNome.get("metricas.json")); } catch (e) { erros.push(`metricas.json não é um JSON válido (${e.message})`); }
  }
  if (porNome.has("gri_catalogo.json")) {
    usados.add("gri_catalogo.json");
    try {
      const cat = JSON.parse(porNome.get("gri_catalogo.json"));
      if (!Array.isArray(cat.conteudos)) erros.push("gri_catalogo.json: falta a lista \"conteudos\"");
      else catalogoTexto = porNome.get("gri_catalogo.json");
    } catch (e) { erros.push(`gri_catalogo.json não é um JSON válido (${e.message})`); }
  }
  for (const n of porNome.keys()) if (!usados.has(n)) avisos.push(`${n}: ignorado (não faz parte do molde deste tema)`);
  if (!Object.keys(textos).length && !metricas && !catalogoTexto) erros.push("Nenhum arquivo reconhecido. Escolha os CSV com os nomes do molde (ex.: projetos.csv)");

  // 3) monta o modelo. Tabela ausente? Se ela é obrigatória, montarModelo registra o erro.
  //    Importação PARCIAL não é aceita: se o usuário trouxe só alguns CSV, o resto dos dados seria o da
  //    demonstração misturado com os dele, o que é perigoso. Exigimos o conjunto completo das obrigatórias.
  let modelo = null;
  if (Object.keys(textos).length) {
    modelo = montarModelo(tema, contrato, textos);
    erros.push(...modelo.problemas.erros);
    avisos.push(...modelo.problemas.avisos);
    for (const [tabela, def] of Object.entries(contrato.tabelas)) {
      if (def.arquivo in textos) lidos.push({ arquivo: def.arquivo, papel: `tabela ${tabela}`, linhas: modelo.tabelas[tabela]?.length ?? 0 });
    }
    if (!erros.length && !modelo.meses.length) erros.push("Nenhum mês encontrado nos dados (coluna mes)");
    if (!erros.length && !modelo.projetos.size) erros.push("projetos.csv não tem nenhuma linha");
  }
  if (metricas) lidos.push({ arquivo: "metricas.json", papel: "parâmetros da pontuação" });
  if (catalogoTexto) lidos.push({ arquivo: "gri_catalogo.json", papel: "catálogo GRI" });

  // 4) metricas.json próprio: mesma validação do arquivo padrão (justificativa e fonte obrigatórias etc.)
  if (metricas && registro) {
    const v = validarMetricas(metricas, registro, tema.indicadores);
    erros.push(...v.erros.map((e) => `metricas.json: ${e}`));
    avisos.push(...v.avisos.map((a) => `metricas.json: ${a}`));
  }

  // 5) teste de fumaça: calcula todos os indicadores do tema uma vez. Se algo estoura (coluna com
  //    conteúdo inesperado, por exemplo), avisamos AQUI, com o indicador, e não com a tela quebrada.
  if (modelo && registro && !erros.length) {
    try {
      const ctx = criarContexto(modelo, {});
      for (const id of tema.indicadores) { const ind = registro.porId.get(id); if (ind) for (const m of ind.medidas) valorDe(registro, `${id}.${m.chave}`, ctx); }
    } catch (e) { erros.push(`Os arquivos foram lidos, mas o cálculo falhou: ${e.message}`); }
  }

  return { ok: !erros.length, modelo: erros.length ? null : modelo, metricas: erros.length ? null : metricas, catalogoTexto: erros.length ? null : catalogoTexto,
           relatorio: { lidos, erros, avisos } };
}
