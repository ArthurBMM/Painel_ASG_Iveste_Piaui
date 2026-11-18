// =====================================================================================
// gerar_dicionario.mjs — gera o DICIONÁRIO DE DADOS de todos os temas
//     docs/dicionario-de-dados.md   (para ler no GitHub)
//     docs/dicionario-de-dados.csv  (para abrir no Excel: separador ";" e UTF-8 com BOM)
//
// Uso:  npm run dicionario
//
// De onde vem cada informação (só a DESCRIÇÃO é escrita à mão; o resto é lido, então não desatualiza):
//   descrição e unidade  → catalogo/dicionario-dados.json (+ temas/<id>/dicionario.json, se o tema mudar algo)
//   tipo, chave, ligações, obrigatória → temas/<id>/contrato.json
//   linhas, vazios, mínimo/máximo, exemplos → os próprios CSV em temas/<id>/dados/
//   "usada por" (indicadores)            → fórmulas do registro (catalogo/indicadores.json)
// O teste tests/dicionario.test.mjs falha se uma coluna nova não tiver descrição ou se os arquivos
// gerados estiverem desatualizados (aí é só rodar npm run dicionario de novo).
// =====================================================================================
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { csvParaObjetos } from "../src/js/nucleo/csv.js";
import { carregarRegistro } from "../src/js/nucleo/registro.js";
import { camposUsados } from "../src/js/nucleo/avaliador.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ler = (c) => readFile(path.join(RAIZ, c), "utf-8");
const lerJson = async (c) => JSON.parse(await ler(c));
const lerJsonOpcional = (c) => lerJson(c).catch(() => null);

// formatação estável (o arquivo gerado não pode mudar de uma execução para outra sem o dado mudar)
const fmtNum = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const pct = (x) => `${Math.round(x * 100)}%`;
const cel = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");           // célula de tabela Markdown
/** No CSV para o Excel em português, número usa vírgula decimal (0,58) senão vira texto ou data. */
const paraExcel = (v) => (typeof v === "number" ? String(v).replace(".", ",") : v ?? "");
const csvCel = (s) => { const t = String(s ?? ""); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };

/** Junta a descrição global com a do tema (a do tema vence, coluna a coluna). */
function descricoes(global, doTema) {
  const out = structuredClone(global.tabelas);
  for (const [t, def] of Object.entries(doTema?.tabelas || {})) {
    out[t] ??= { colunas: {} };
    for (const k of ["descricao", "linha"]) if (def[k]) out[t][k] = def[k];
    for (const [c, d] of Object.entries(def.colunas || {})) out[t].colunas[c] = { ...(out[t].colunas?.[c] || {}), ...d };
  }
  return out;
}

/** Estatísticas de uma coluna a partir dos valores já convertidos pelo leitor de CSV do motor. */
function estatisticas(valores, tipo) {
  const presentes = valores.filter((v) => v !== null && v !== "");
  const vazios = valores.length ? 1 - presentes.length / valores.length : 0;
  if (!presentes.length) return { vazios, faixa: "–" };
  if (tipo === "numero" || tipo === "inteiro") {
    let min = Infinity, max = -Infinity;
    for (const v of presentes) { if (v < min) min = v; if (v > max) max = v; }
    return { vazios, minimo: min, maximo: max, faixa: min === max ? fmtNum(min) : `${fmtNum(min)} a ${fmtNum(max)}` };
  }
  if (tipo === "data") {
    const ord = [...presentes].sort();
    return { vazios, minimo: ord[0], maximo: ord.at(-1), faixa: ord[0] === ord.at(-1) ? ord[0] : `${ord[0]} a ${ord.at(-1)}` };
  }
  const distintos = [...new Set(presentes)];
  const exemplos = distintos.slice(0, 4).join(", ");
  return { vazios, exemplos, faixa: `${distintos.length} valor(es): ${exemplos}${distintos.length > 4 ? ", …" : ""}` };
}

/** Monta o dicionário (texto do .md e do .csv) sem gravar nada: usado pelo comando e pelo teste. */
export async function montarDicionario() {
  const indice = await lerJson("temas/index.json");
  const global = await lerJson("catalogo/dicionario-dados.json");
  const registro = await carregarRegistro(ler);
  // quem usa cada coluna: "tabela.coluna" → [ids de indicadores]
  const uso = new Map();
  for (const ind of registro.indicadores) for (const m of ind.medidas) for (const c of camposUsados(m.expr)) {
    if (!uso.has(c)) uso.set(c, new Set());
    uso.get(c).add(ind.id);
  }

  const linhasCsv = [["tema", "tabela", "coluna", "tipo", "unidade", "descricao", "chave", "liga_com", "tabela_obrigatoria", "linhas_tabela", "vazios", "minimo", "maximo", "exemplos", "usada_por_indicadores"]];
  const visao = [], secoes = [], faltando = [];

  for (const info of indice.temas) {
    const tema = await lerJson(`${info.pasta}/tema.json`);
    const contrato = await lerJson(`${info.pasta}/${tema.contrato}`);
    const desc = descricoes(global, await lerJsonOpcional(`${info.pasta}/dicionario.json`));
    const ligaCom = new Map((contrato.relacoes || []).map((r) => [r.de, r.para]));
    const partes = [`## Tema: ${tema.titulo} (\`${tema.id}\`)`, "", `Pasta dos dados: \`${info.pasta}/${tema.pasta_dados}/\` · contrato: \`${info.pasta}/${tema.contrato}\``, ""];

    for (const [nome, def] of Object.entries(contrato.tabelas)) {
      let linhas = [];
      try { linhas = csvParaObjetos(await ler(`${info.pasta}/${tema.pasta_dados}/${def.arquivo}`), def.colunas).linhas; } catch { /* tabela opcional ausente */ }
      const d = desc[nome] || { colunas: {} };
      if (!d.descricao) faltando.push(`${tema.id}: tabela ${nome} sem descrição`);
      visao.push(`| ${cel(tema.id)} | \`${nome}\` | ${cel(d.linha || "–")} | ${fmtNum(linhas.length)} | ${def.obrigatoria ? "sim" : "não"} | ${cel(d.descricao || "")} |`);
      partes.push(`### \`${nome}\``, "", `${d.descricao || "_(sem descrição)_"}`, "",
        `Arquivo \`${def.arquivo}\` · **uma linha = ${d.linha || "?"}** · ${fmtNum(linhas.length)} linhas · ${def.obrigatoria ? "obrigatória" : "opcional"} · chave: ${(def.chave || []).map((c) => `\`${c}\``).join(" + ") || "–"}`, "",
        "| Coluna | Tipo | Unidade | Descrição | Valores no dado | Vazios | Usada por |", "|---|---|---|---|---|---|---|");
      for (const [col, tipo] of Object.entries(def.colunas)) {
        const dc = d.colunas?.[col] || {};
        if (!dc.descricao) faltando.push(`${tema.id}: ${nome}.${col} sem descrição`);
        const est = estatisticas(linhas.map((r) => r[col]), tipo);
        const chave = (def.chave || []).includes(col);
        const liga = ligaCom.get(`${nome}.${col}`);
        const usadoPor = [...(uso.get(`${nome}.${col}`) || [])].sort();
        const papel = [chave ? "chave" : "", liga ? `liga com \`${liga}\`` : "", usadoPor.join(", ")].filter(Boolean).join(" · ") || "documentação";
        partes.push(`| \`${col}\` | ${tipo} | ${cel(dc.unidade || "")} | ${cel(dc.descricao || "")} | ${cel(est.faixa)} | ${pct(est.vazios)} | ${papel} |`);
        linhasCsv.push([tema.id, nome, col, tipo, dc.unidade || "", dc.descricao || "", chave ? "sim" : "", liga || "", def.obrigatoria ? "sim" : "não",
          linhas.length, pct(est.vazios), paraExcel(est.minimo), paraExcel(est.maximo), est.exemplos ?? "", usadoPor.join(", ")]);
      }
      partes.push("");
    }
    secoes.push(partes.join("\n"));
  }

  const md = [
    "# Dicionário de dados",
    "",
    "> **Arquivo gerado** por `npm run dicionario` (`tools/gerar_dicionario.mjs`). Não edite à mão: as descrições ficam em `catalogo/dicionario-dados.json` (e, se um tema mudar o significado de algo, em `temas/<id>/dicionario.json`); tipos, chaves e ligações vêm do `contrato.json` de cada tema; contagens, faixas e exemplos são lidos dos próprios CSV. Versão para Excel: `docs/dicionario-de-dados.csv`.",
    "",
    "**Todos os dados são fictícios**, gerados pelos scripts de `tools/gerador/` (semente fixa: rodar de novo produz os mesmos números).",
    "",
    "## Convenções",
    "",
    "- **Tipos:** `texto`, `numero` (decimal com ponto), `inteiro`, `data` (`AAAA-MM-DD`; meses sempre no dia 1).",
    "- **Célula vazia em coluna numérica = sem dado** (não é zero). O painel tira esse valor da conta em vez de somar zero.",
    "- **Estoque × fluxo:** `empregados_fim_mes` é estoque (foto do fim do mês) e não se soma entre meses; contratações, desligamentos, horas, energia, emissões e resíduos são fluxos do período e se somam.",
    "- **Usada por:** indicadores do registro cuja fórmula lê a coluna. \"documentação\" = a coluna é guardada para contexto ou conferência, mas nenhuma fórmula atual a usa.",
    "- **Chave:** colunas que identificam uma linha (não se repetem juntas). **Liga com:** coluna de outra tabela que ela referencia.",
    "",
    "## Visão geral das tabelas",
    "",
    "| Tema | Tabela | Uma linha = | Linhas | Obrigatória | O que é |",
    "|---|---|---|---|---|---|",
    ...visao,
    "",
    ...secoes,
  ].join("\n");
  const csv = "\uFEFF" + linhasCsv.map((l) => l.map(csvCel).join(";")).join("\r\n") + "\r\n";
  return { md: md.trimEnd() + "\n", csv, faltando };
}

// executado como comando (não quando importado pelo teste)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { md, csv, faltando } = await montarDicionario();
  await writeFile(path.join(RAIZ, "docs/dicionario-de-dados.md"), md, "utf-8");
  await writeFile(path.join(RAIZ, "docs/dicionario-de-dados.csv"), csv, "utf-8");
  console.log("Gerados: docs/dicionario-de-dados.md e docs/dicionario-de-dados.csv");
  if (faltando.length) { console.warn(`Atenção: ${faltando.length} item(ns) sem descrição:\n  ${faltando.join("\n  ")}`); process.exitCode = 1; }
}
