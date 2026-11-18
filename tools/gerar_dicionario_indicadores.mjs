// =====================================================================================
// gerar_dicionario_indicadores.mjs — gera o DICIONÁRIO DE INDICADORES, FÓRMULAS E SCORE ASG
//     docs/dicionario-de-indicadores.md   (para ler no GitHub)
//     docs/dicionario-de-indicadores.csv  (para abrir no Excel: separador ";" e UTF-8 com BOM)
//
// Uso:  npm run dicionario   (gera este e o dicionário de dados)
//
// Nada aqui é escrito à mão: tudo vem do registro (catalogo/indicadores.json: fórmulas, pilar, GRI,
// "por que importa", "como calcula") e de config/metricas.json (pesos, pisos, tetos, faixas, justificativas).
// A fórmula de cada medida é TRADUZIDA da árvore de expressão que o motor executa (src/js/nucleo/avaliador.js),
// então o documento mostra exatamente a conta que o painel faz.
// =====================================================================================
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lerJson = async (c) => JSON.parse(await readFile(path.join(RAIZ, c), "utf-8"));
const cel = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const csvCel = (s) => { const t = String(s ?? ""); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const num = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 4 });
const NOME_PILAR = { A: "Ambiental", S: "Social", G: "Governança" };
const SENTIDO = { up: "↑ subir é bom", down: "↓ cair é bom" };

// ------------------------------------------------------------------ fórmula legível
/** Filtros fixos de uma operação: onde {classe: "Verde"} → "[classe = Verde]"; ano "ultimo" → "[último ano do período]". */
function filtros(e) {
  const f = Object.entries(e.onde || {}).map(([k, v]) => `${k} = ${v}`);
  if (e.ano === "ultimo") f.push("último ano do período");
  else if (e.ano) f.push(`ano = ${e.ano}`);
  if (e.ignorar?.length) f.push(`ignora o filtro de ${e.ignorar.join(", ")}`);
  return f.length ? ` [${f.join("; ")}]` : "";
}
const simples = (e) => ["const", "soma", "contagem", "media", "estoque_medio", "fator_anual"].includes(e.op);
const par = (e) => (simples(e) ? formula(e) : `(${formula(e)})`);

/** Traduz a árvore de expressão (a mesma que src/js/nucleo/avaliador.js executa) para texto. */
export function formula(e) {
  switch (e.op) {
    case "const": return num(e.valor);
    case "soma": return `Σ ${e.tabela}.${e.campo}${filtros(e)}`;
    case "media": return `média de ${e.tabela}.${e.campo}${filtros(e)}`;
    case "contagem": return e.distinto ? `nº de ${e.distinto} distintos em ${e.tabela}${filtros(e)}` : `nº de linhas de ${e.tabela}${filtros(e)}`;
    case "estoque_medio": return `média mensal de Σ ${e.tabela}.${e.campo}${filtros(e)}`;
    case "media_mensal_razao": return `média, mês a mês, de (Σ ${e.num.tabela}.${e.num.campo} ÷ Σ ${e.den.tabela}.${e.den.campo})`;
    case "fator_anual": return "(12 ÷ meses com dado)";
    case "razao": return `${par(e.num)} ÷ ${par(e.den)}`;
    case "mult": return e.args.map(par).join(" × ");
    case "soma_de": return e.args.map(par).join(" + ");
    default: throw new Error(`Operação sem tradução: ${e.op} (acrescente em formula())`);
  }
}

const rotuloGri = (g) => (g.setorial ? g.norma : `GRI ${g.id.split(":")[0]}${g.parte ? "-" + g.parte : ""}`);
const unidade = (f) => (f?.tipo === "percentual" ? "%" : (f?.unidade || "").trim());

/** Monta o texto do .md e do .csv sem gravar nada (usado pelo comando e pelo teste). */
export async function montarDicionarioIndicadores() {
  const reg = await lerJson("catalogo/indicadores.json");
  const met = await lerJson("config/metricas.json");
  const indice = await lerJson("temas/index.json");
  const temasDe = new Map();                       // id do indicador → [ids dos temas que o mostram]
  for (const info of indice.temas) {
    const t = await lerJson(`${info.pasta}/tema.json`);
    for (const id of t.indicadores) { if (!temasDe.has(id)) temasDe.set(id, []); temasDe.get(id).push(t.id); }
  }
  const F = met.faixas, P = met.pesos_pilares;

  const resumo = [], secoes = [];
  const csv = [["indicador", "titulo", "pilar", "gri", "temas", "medida", "titulo_medida", "unidade", "sentido", "formula", "medida_da_nota", "peso", "piso", "teto", "justificativa_parametros", "fonte_parametros", "fora_da_nota_motivo"]];
  for (const p of ["A", "S", "G"]) {
    const doPilar = reg.indicadores.filter((i) => i.pilar === p);
    secoes.push(`## ${NOME_PILAR[p]} (${doPilar.length} indicadores)`, "");
    for (const ind of doPilar) {
      const cfg = met.indicadores[ind.id];
      const principal = ind.medidas.find((m) => m.principal) || ind.medidas[0];
      const pontuada = cfg && cfg.pontuar !== false ? ind.medidas.find((m) => m.chave === (cfg.medida || principal.chave)) : null;
      const gri = ind.gri.map(rotuloGri).join(", ");
      const temas = (temasDe.get(ind.id) || []).join(", ") || "nenhum tema ativo";
      const n = cfg?.normalizacao;
      resumo.push(`| \`${ind.id}\` | ${cel(ind.titulo)} | ${NOME_PILAR[p]} | ${cel(gri)} | ${pontuada ? cel(pontuada.titulo) : "fora da nota"} | ${pontuada ? SENTIDO[pontuada.sentido] : "–"} | ${pontuada ? cfg.peso : "–"} | ${n ? num(n.piso) : "–"} | ${n ? num(n.teto) : "–"} | ${cel(temas)} |`);

      secoes.push(`### \`${ind.id}\` · ${ind.titulo}`, "",
        `**Pilar:** ${NOME_PILAR[p]} · **GRI:** ${gri} · **Cobertura do GRI:** ${ind.cobertura} · **Temas:** ${temas}`, "",
        `**Por que importa:** ${ind.por_que_asg}`, "", `**Como é calculado:** ${ind.como_calcula}`, "",
        "| Medida | O que mostra | Unidade | Sentido | Fórmula (como o motor calcula) |", "|---|---|---|---|---|");
      for (const m of ind.medidas) {
        const f = formula(m.expr);
        secoes.push(`| \`${ind.id}.${m.chave}\`${m.principal ? " (principal)" : ""} | ${cel(m.titulo)} | ${cel(unidade(m.formato))} | ${SENTIDO[m.sentido] || "–"} | ${cel(f)} |`);
        csv.push([ind.id, ind.titulo, NOME_PILAR[p], gri, temas, `${ind.id}.${m.chave}`, m.titulo, unidade(m.formato), SENTIDO[m.sentido] || "", f,
          pontuada && m.chave === pontuada.chave ? "sim" : "", pontuada && m.chave === pontuada.chave ? cfg.peso : "",
          pontuada && m.chave === pontuada.chave ? n.piso : "", pontuada && m.chave === pontuada.chave ? n.teto : "",
          pontuada && m.chave === pontuada.chave ? cfg.justificativa : "", pontuada && m.chave === pontuada.chave ? cfg.fonte : "",
          cfg?.pontuar === false && m === principal ? cfg.motivo : ""]);
      }
      secoes.push("");
      if (pontuada) {
        secoes.push(`**Na nota ASG:** pontua \`${ind.id}.${pontuada.chave}\` com **peso ${cfg.peso}**, **piso ${num(n.piso)}** (vale 0) e **teto ${num(n.teto)}** (vale 100)${n.piso > n.teto ? ", ou seja, menor é melhor" : ""}. Nota = (valor − ${num(n.piso)}) ÷ (${num(n.teto)} − ${num(n.piso)}) × 100, limitada a 0–100.`, "",
          `*Justificativa:* ${cfg.justificativa} *Fonte:* ${cfg.fonte}.`, "");
      } else if (cfg?.pontuar === false) secoes.push(`**Fora da nota ASG:** ${cfg.motivo}`, "");
      else secoes.push("**Fora da nota ASG:** sem parâmetros em `config/metricas.json`.", "");
    }
  }

  const md = [
    "# Dicionário de indicadores, fórmulas e SCORE ASG",
    "",
    "> **Arquivo gerado** por `npm run dicionario` (`tools/gerar_dicionario_indicadores.mjs`) a partir do registro de indicadores (`catalogo/indicadores.json`) e dos parâmetros da nota (`config/metricas.json`). Não edite à mão. As fórmulas abaixo são traduzidas automaticamente das expressões que o motor executa. Versão para Excel: `docs/dicionario-de-indicadores.csv`. As colunas citadas nas fórmulas estão descritas em `docs/dicionario-de-dados.md`.",
    "",
    "## 1. SCORE ASG (nota de 0 a 100)",
    "",
    "**Passo 1, cada indicador vira uma nota (normalização min-max com limites fixos):**",
    "",
    "```",
    "nota_indicador = limitar( (valor − piso) ÷ (teto − piso), 0, 1 ) × 100",
    "```",
    "",
    "- **Piso** = valor que vale 0 pontos; **teto** = valor que vale 100. Fora do intervalo, a nota trava em 0 ou 100.",
    "- Quando \"menor é melhor\" (ex.: emissões, acidentes), o piso é **maior** que o teto, e a mesma fórmula funciona.",
    "- Piso e teto são **fixos** (não saem dos dados): a nota de uma entidade não muda quando outra entra na carteira.",
    "",
    "**Passo 2, nota de cada pilar (A, S, G):**",
    "",
    "```",
    "nota_pilar = Σ (peso × nota_indicador) ÷ Σ peso        (só indicadores COM dado no recorte)",
    "cobertura  = Σ peso dos indicadores com dado ÷ Σ peso de todos os indicadores pontuáveis do pilar",
    "```",
    "",
    "Dado ausente **não vira zero**: sai da média e reduz a cobertura.",
    "",
    "**Passo 3, nota ASG geral:**",
    "",
    "```",
    `nota_ASG = (${P.A} × nota_A + ${P.S} × nota_S + ${P.G} × nota_G) ÷ ${P.A + P.S + P.G}        (pilares sem nota saem da conta)`,
    "```",
    "",
    "**Passo 4, faixa:**",
    "",
    "| Faixa | Regra |",
    "|---|---|",
    `| ${met.rotulos_faixas.alinhado} | nota ≥ ${F.alinhado} |`,
    `| ${met.rotulos_faixas.atencao} | ${F.atencao} ≤ nota < ${F.alinhado} |`,
    `| ${met.rotulos_faixas.critico} | nota < ${F.atencao} |`,
    `| ${met.rotulos_faixas.sem_dados} | cobertura < ${num(F.cobertura_minima * 100)}% |`,
    "",
    "**Todos os parâmetros (pesos, pisos, tetos, faixas) são hipóteses do grupo**, não metas oficiais, e cada um tem justificativa e fonte em `config/metricas.json`. Indicadores de **total absoluto** (que crescem com o tamanho da empresa) ficam fora da nota. A comparação com referências de mercado (EcoVadis, ISE B3, Sustainalytics) e as técnicas de normalização avaliadas estão em `contexto-ia/02-metricas-pesos-e-normalizacao.md`. O painel mostra a conta passo a passo na aba *Indicadores e método*.",
    "",
    "### Como ler as fórmulas",
    "",
    "- `Σ tabela.coluna`: soma da coluna nas linhas do recorte (filtros de ano, empresa, projeto, setor, município etc.).",
    "- `média mensal de Σ …`: soma por mês e depois a média entre os meses. É usada para **estoques** (empregados no fim do mês), que não se somam entre meses.",
    "- `(12 ÷ meses com dado)`: anualiza totais de períodos incompletos (ex.: 2026 tem 10 meses).",
    "- `[classe = Verde]`, `[último ano do período]`: filtro fixo da própria fórmula. `ignora o filtro de classe`: a parte da conta que não deve mudar quando o usuário filtra por classe (ex.: o denominador de um percentual).",
    "- Divisão por zero ou falta de dado resultam em **sem dado**, nunca em zero.",
    "- **Percentuais aparecem como fração** nos pisos e tetos: `0,6` = 60%.",
    "",
    "## 2. Resumo dos indicadores",
    "",
    "| Código | Indicador | Pilar | GRI | Medida da nota | Sentido | Peso | Piso | Teto | Temas |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...resumo,
    "",
    "## 3. Indicadores em detalhe",
    "",
    ...secoes,
  ].join("\n");
  return { md: md.trimEnd() + "\n", csv: "﻿" + csv.map((l) => l.map(csvCel).join(";")).join("\r\n") + "\r\n" };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { md, csv } = await montarDicionarioIndicadores();
  await writeFile(path.join(RAIZ, "docs/dicionario-de-indicadores.md"), md, "utf-8");
  await writeFile(path.join(RAIZ, "docs/dicionario-de-indicadores.csv"), csv, "utf-8");
  console.log("Gerados: docs/dicionario-de-indicadores.md e docs/dicionario-de-indicadores.csv");
}
