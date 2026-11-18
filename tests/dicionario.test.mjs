// =====================================================================================
// dicionario.test.mjs — o dicionário de dados acompanha os dados
//
// Se alguém criar uma tabela ou coluna nova num contrato sem descrevê-la, ou mudar os dados sem
// regenerar o documento, o teste falha com a instrução do que fazer. É isso que mantém o dicionário
// confiável quando entram novos temas.
// =====================================================================================
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { montarDicionario } from "../tools/gerar_dicionario.mjs";
import { montarDicionarioIndicadores, formula } from "../tools/gerar_dicionario_indicadores.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ler = (c) => readFile(path.join(RAIZ, c), "utf-8");
const semCR = (s) => s.replace(/\r\n/g, "\n");      // Windows pode trocar o fim de linha; o conteúdo é o que importa
const gerado = await montarDicionario();

test("toda tabela e coluna de todos os temas tem descrição", () => {
  assert.deepEqual(gerado.faltando, [], `Descreva em catalogo/dicionario-dados.json (ou temas/<id>/dicionario.json):\n${gerado.faltando.join("\n")}`);
});

test("o dicionário não descreve colunas que não existem em nenhum contrato (evita texto órfão)", async () => {
  const global = JSON.parse(await ler("catalogo/dicionario-dados.json"));
  const indice = JSON.parse(await ler("temas/index.json"));
  const existentes = new Set();
  for (const info of indice.temas) {
    const tema = JSON.parse(await ler(`${info.pasta}/tema.json`));
    const contrato = JSON.parse(await ler(`${info.pasta}/${tema.contrato}`));
    for (const [t, d] of Object.entries(contrato.tabelas)) for (const c of Object.keys(d.colunas)) existentes.add(`${t}.${c}`);
  }
  const orfas = Object.entries(global.tabelas).flatMap(([t, d]) => Object.keys(d.colunas).map((c) => `${t}.${c}`)).filter((k) => !existentes.has(k));
  assert.deepEqual(orfas, []);
});

test("docs/dicionario-de-dados.md e .csv estão atualizados (senão: npm run dicionario)", async () => {
  assert.equal(semCR(await ler("docs/dicionario-de-dados.md")), semCR(gerado.md), "rode: npm run dicionario");
  assert.equal(semCR(await ler("docs/dicionario-de-dados.csv")), semCR(gerado.csv), "rode: npm run dicionario");
});

test("o CSV abre certo no Excel em português (BOM, ';' e uma linha por coluna dos contratos)", () => {
  assert.ok(gerado.csv.startsWith("﻿"));
  const linhas = gerado.csv.trim().split(/\r?\n/);
  assert.ok(linhas[0].includes("tema;tabela;coluna;tipo"));
  assert.equal(linhas.length - 1, 84 + 63, "T8 tem 84 colunas e gestao-ambiental 63; se mudou de propósito, ajuste este número");
});

test("dicionário de indicadores: todo indicador e medida do registro aparece, e o arquivo está atualizado", async () => {
  const ind = await montarDicionarioIndicadores();
  const reg = JSON.parse(await ler("catalogo/indicadores.json"));
  for (const i of reg.indicadores) for (const m of i.medidas) assert.ok(ind.md.includes(`\`${i.id}.${m.chave}\``), `${i.id}.${m.chave} ausente`);
  assert.equal(semCR(await ler("docs/dicionario-de-indicadores.md")), semCR(ind.md), "rode: npm run dicionario");
  assert.equal(semCR(await ler("docs/dicionario-de-indicadores.csv")), semCR(ind.csv), "rode: npm run dicionario");
});

test("a tradução das fórmulas cobre os operadores do motor", () => {
  assert.equal(formula({ op: "razao", num: { op: "soma", tabela: "t", campo: "a" }, den: { op: "fator_anual" } }), "Σ t.a ÷ (12 ÷ meses com dado)");
  assert.equal(formula({ op: "mult", args: [{ op: "soma", tabela: "t", campo: "a", ano: "ultimo" }, { op: "const", valor: 1000000 }] }), "Σ t.a [último ano do período] × 1.000.000");
  assert.throws(() => formula({ op: "inexistente" }), /sem tradução/);
});
