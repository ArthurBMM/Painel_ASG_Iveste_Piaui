// =====================================================================================
// importacao.test.mjs — importação de CSV (e JSON) pelo usuário
//
// A ideia central: o MESMO dado, escrito do jeito do Excel em português (separador ";", vírgula
// decimal, datas DD/MM/AAAA, acentos em Windows-1252), tem de produzir o MESMO modelo que os CSV
// originais do T8. Se isso vale, o importador não altera os números.
// =====================================================================================
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { detectarSeparador, paraNumero, paraData, parseCSV } from "../src/js/nucleo/csv.js";
import { carregarTema } from "../src/js/nucleo/modelo.js";
import { carregarRegistro } from "../src/js/nucleo/registro.js";
import { decodificarTexto, nomeBase, prepararImportacao } from "../src/js/nucleo/importacao.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leitor = (c) => readFile(path.join(RAIZ, c), "utf-8");
const PASTA = "temas/t8-empregos-verdes";
const tema = JSON.parse(await leitor(`${PASTA}/tema.json`));
const contrato = JSON.parse(await leitor(`${PASTA}/${tema.contrato}`));
const registro = await carregarRegistro(leitor);
const original = await carregarTema(leitor, PASTA);
const csvs = Object.fromEntries(await Promise.all(Object.values(contrato.tabelas).map(async (d) => [d.arquivo, await leitor(`${PASTA}/${tema.pasta_dados}/${d.arquivo}`)])));
/** Texto → bytes Windows-1252 (o que o Excel em português grava). Latin1 não basta: "–" e "’" só existem em cp1252. */
const CP1252 = new Map(Array.from({ length: 256 }, (_, b) => [new TextDecoder("windows-1252").decode(Uint8Array.of(b)), b]));
const codificarCp1252 = (texto) => Uint8Array.from([...texto].map((ch) => { const b = CP1252.get(ch); assert.ok(b !== undefined, `caractere sem Windows-1252: ${ch}`); return b; }));
const arquivosOriginais = () => Object.entries(csvs).map(([nome, texto]) => ({ nome, texto }));

// ---------------------------------------------------------------- leitor de CSV: separador e números
test("separador: vírgula, ponto e vírgula e tab são detectados pelo cabeçalho; vírgula dentro de aspas não conta", () => {
  assert.equal(detectarSeparador("a,b,c\n1,2,3"), ",");
  assert.equal(detectarSeparador("a;b;c\n1,5;2,5;3"), ";");
  assert.equal(detectarSeparador("a\tb\n1\t2"), "\t");
  assert.equal(detectarSeparador('"a,b";c\n1;2'), ";");
  assert.equal(detectarSeparador("so_uma_coluna\n1"), ",");
  assert.deepEqual(parseCSV("n;t\n1,5;x\n"), [["n", "t"], ["1,5", "x"]]);
});

test("números: ponto (padrão), vírgula decimal e milhar com vírgula decimal; '1.234' sozinho NÃO vira 1234", () => {
  assert.equal(paraNumero("12.5"), 12.5);
  assert.equal(paraNumero("12,5"), 12.5);
  assert.equal(paraNumero("1.234,5"), 1234.5);
  assert.equal(paraNumero("-0,25"), -0.25);
  assert.equal(paraNumero("1.234"), 1.234);            // ambíguo: mantemos a leitura padrão (ponto decimal)
  assert.equal(paraNumero("  "), null);                 // vazio = sem dado, nunca zero
  assert.equal(paraNumero("0"), 0);
  assert.equal(paraNumero("n/d"), undefined);
  assert.equal(paraNumero("12 %"), undefined);
});

test("datas: AAAA-MM-DD e AAAA-MM passam; DD/MM/AAAA é normalizada; lixo é inválido", () => {
  assert.equal(paraData("2023-01-01"), "2023-01-01");
  assert.equal(paraData("2023-01"), "2023-01");
  assert.equal(paraData("5/3/2024"), "2024-03-05");
  assert.equal(paraData("31/12/2023"), "2023-12-31");
  assert.equal(paraData(""), null);
  assert.equal(paraData("32/01/2023"), undefined);
  assert.equal(paraData("13/13/2023"), undefined);
  assert.equal(paraData("janeiro"), undefined);
});

test("decodificação: UTF-8 normal e Windows-1252 (Excel em português)", () => {
  assert.equal(decodificarTexto(new TextEncoder().encode("Marcolândia")), "Marcolândia");
  assert.equal(decodificarTexto(Uint8Array.from(Buffer.from("Marcolândia, ação", "latin1"))), "Marcolândia, ação");
  assert.equal(nomeBase("C:\\dados\\Projetos.CSV"), "projetos.csv");
  assert.equal(nomeBase("pasta/sub/Empresas.csv"), "empresas.csv");
});

// ---------------------------------------------------------------- importação completa
test("importar os CSV originais produz exatamente o modelo da demonstração", () => {
  const r = prepararImportacao({ tema, contrato, arquivos: arquivosOriginais(), registro });
  assert.equal(r.ok, true, r.relatorio.erros.join(" | "));
  assert.deepEqual(r.modelo.tabelas, original.tabelas);
  assert.deepEqual(r.modelo.meses, original.meses);
  assert.equal(r.relatorio.lidos.length, Object.keys(contrato.tabelas).length);
});

test("importar o MESMO dado no estilo Excel pt-BR (';', vírgula decimal, DD/MM/AAAA, Windows-1252) dá o mesmo modelo", () => {
  const ptbr = Object.entries(csvs).map(([nome, texto]) => {
    const tabela = Object.entries(contrato.tabelas).find(([, d]) => d.arquivo === nome)[1];
    const linhas = parseCSV(texto);
    const cab = linhas.shift();
    const conv = linhas.map((l) => l.map((v, i) => {
      const tipo = tabela.colunas[cab[i]];
      if (tipo === "numero") return v.replace(".", ",");
      if (tipo === "data" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v.split("-").reverse().join("/");
      return v;
    }));
    const texto2 = [cab, ...conv].map((l) => l.map((c) => (/[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(";")).join("\r\n");
    return { nome, texto: decodificarTexto(codificarCp1252(texto2)) };
  });
  const r = prepararImportacao({ tema, contrato, arquivos: ptbr, registro });
  assert.equal(r.ok, true, r.relatorio.erros.join(" | "));
  assert.deepEqual(r.modelo.tabelas, original.tabelas);
});

test("nomes de arquivo em maiúsculas e caminhos de pasta são aceitos", () => {
  const r = prepararImportacao({ tema, contrato, registro, arquivos: arquivosOriginais().map((a) => ({ nome: `dados\\${a.nome.toUpperCase()}`, texto: a.texto })) });
  assert.equal(r.ok, true, r.relatorio.erros.join(" | "));
});

// ---------------------------------------------------------------- validação
test("falta tabela obrigatória → bloqueia, citando o arquivo; falta tabela opcional → só aviso", () => {
  const sem = (nome) => arquivosOriginais().filter((a) => a.nome !== nome);
  const r1 = prepararImportacao({ tema, contrato, arquivos: sem("ocupacoes.csv"), registro });
  assert.equal(r1.ok, false);
  assert.ok(r1.relatorio.erros.some((e) => e.includes("ocupacoes.csv")));
  assert.equal(r1.modelo, null);
  const r2 = prepararImportacao({ tema, contrato, arquivos: sem("seguranca.csv"), registro });
  assert.equal(r2.ok, true);
  assert.ok(r2.relatorio.avisos.some((e) => e.includes("seguranca.csv")));
});

test("coluna faltando é erro com o nome da coluna", () => {
  const arq = arquivosOriginais().map((a) => (a.nome === "projetos.csv" ? { ...a, texto: a.texto.replace("municipio", "cidade") } : a));
  const r = prepararImportacao({ tema, contrato, arquivos: arq, registro });
  assert.equal(r.ok, false);
  assert.ok(r.relatorio.erros.some((e) => e.includes("projetos.csv") && e.includes("municipio")));
});

test("número ou data inválidos bloqueiam, com coluna, exemplo e linha; célula vazia continua sendo 'sem dado'", () => {
  const troca = (nome, de, para) => arquivosOriginais().map((a) => (a.nome === nome ? { ...a, texto: a.texto.replace(de, para) } : a));
  const r1 = prepararImportacao({ tema, contrato, registro, arquivos: troca("projetos.csv", "P01,Parque Eólico Serra Azul,Eólica,Marcolândia,Semiárido,180.0,", "P01,Parque Eólico Serra Azul,Eólica,Marcolândia,Semiárido,n/d,") });
  assert.equal(r1.ok, false);
  assert.ok(r1.relatorio.erros.some((e) => e.includes("projetos.csv") && e.includes("mw_instalado") && e.includes("n/d") && e.includes("linha 2")));
  const vazio = prepararImportacao({ tema, contrato, registro, arquivos: troca("projetos.csv", "Semiárido,180.0,", "Semiárido,,") });
  assert.equal(vazio.ok, true, vazio.relatorio.erros.join(" | "));
  assert.equal(vazio.modelo.projetos.get("P01").mw_instalado, null);
  const r2 = prepararImportacao({ tema, contrato, registro, arquivos: troca("emprego_mensal.csv", "P01,O01,2023-01-01", "P01,O01,janeiro") });
  assert.equal(r2.ok, false);
  assert.ok(r2.relatorio.erros.some((e) => e.includes("emprego_mensal.csv") && e.includes("data inválida")));
});

test("mês vazio bloqueia (quebraria séries e filtros)", () => {
  const arq = arquivosOriginais().map((a) => (a.nome === "emprego_mensal.csv" ? { ...a, texto: a.texto.replace("P01,O01,2023-01-01", "P01,O01,") } : a));
  const r = prepararImportacao({ tema, contrato, arquivos: arq, registro });
  assert.equal(r.ok, false);
  assert.ok(r.relatorio.erros.some((e) => e.includes("mes está vazia")));
});

test("arquivo desconhecido é ignorado com aviso; nenhum arquivo reconhecido é erro", () => {
  const r = prepararImportacao({ tema, contrato, registro, arquivos: [...arquivosOriginais(), { nome: "anotacoes.csv", texto: "a,b\n1,2" }] });
  assert.equal(r.ok, true);
  assert.ok(r.relatorio.avisos.some((e) => e.includes("anotacoes.csv") && e.includes("ignorado")));
  const vazio = prepararImportacao({ tema, contrato, registro, arquivos: [{ nome: "foto.png", texto: "x" }] });
  assert.equal(vazio.ok, false);
  assert.ok(vazio.relatorio.erros[0].includes("Nenhum arquivo reconhecido"));
});

test("metricas.json próprio: válido passa; sem justificativa ou JSON quebrado bloqueia", async () => {
  const padrao = JSON.parse(await leitor("config/metricas.json"));
  const ok = prepararImportacao({ tema, contrato, registro, arquivos: [...arquivosOriginais(), { nome: "metricas.json", texto: JSON.stringify(padrao) }] });
  assert.equal(ok.ok, true, ok.relatorio.erros.join(" | "));
  assert.deepEqual(ok.metricas, padrao);
  const ruim = structuredClone(padrao); delete ruim.indicadores.EV1.justificativa;
  const r1 = prepararImportacao({ tema, contrato, registro, arquivos: [...arquivosOriginais(), { nome: "metricas.json", texto: JSON.stringify(ruim) }] });
  assert.equal(r1.ok, false);
  assert.ok(r1.relatorio.erros.some((e) => e.includes("EV1") && e.includes("justificativa")));
  const r2 = prepararImportacao({ tema, contrato, registro, arquivos: [{ nome: "metricas.json", texto: "{ quebrado" }] });
  assert.equal(r2.ok, false);
});

test("só metricas.json (sem CSV): é aceito e não troca os dados", async () => {
  const padrao = await leitor("config/metricas.json");
  const r = prepararImportacao({ tema, contrato, registro, arquivos: [{ nome: "metricas.json", texto: padrao }] });
  assert.equal(r.ok, true, r.relatorio.erros.join(" | "));
  assert.equal(r.modelo, null);
  assert.ok(r.metricas);
});

test("gri_catalogo.json sem a lista 'conteudos' é erro", () => {
  const r = prepararImportacao({ tema, contrato, registro, arquivos: [{ nome: "gri_catalogo.json", texto: '{"x":1}' }] });
  assert.equal(r.ok, false);
});

test("teste de fumaça: dado que estoura o cálculo é barrado na importação, não na tela", () => {
  // cabeçalho certo e dados legíveis, mas a tabela obrigatória de projetos fica sem linhas
  const arq = arquivosOriginais().map((a) => (a.nome === "projetos.csv" ? { ...a, texto: a.texto.split(/\r?\n/)[0] + "\n" } : a));
  const r = prepararImportacao({ tema, contrato, arquivos: arq, registro });
  assert.equal(r.ok, false);
});

test("chave duplicada (dois projetos com o mesmo id) bloqueia: as contas somariam em dobro", () => {
  const arq = arquivosOriginais().map((a) => (a.nome === "projetos.csv" ? { ...a, texto: a.texto.trimEnd() + "\n" + a.texto.split(/\r?\n/)[1] + "\n" } : a));
  const r = prepararImportacao({ tema, contrato, arquivos: arq, registro });
  assert.equal(r.ok, false);
  assert.ok(r.relatorio.erros.some((e) => e.includes("projetos.csv") && e.includes("repetida")));
});
