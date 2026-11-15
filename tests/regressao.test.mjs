// =====================================================================================
// regressao.test.mjs — testes do motor (rodar com:  npm test   ou   node --test tests/)
//
// Três camadas de teste:
//  1) NÚMEROS ÂNCORA: os valores que o grupo validou no Power BI (2.256 empregados, 40,5% verde...).
//     Se algum mudar, algo quebrou na regra de cálculo ou nos dados.
//  2) REFERÊNCIA INDEPENDENTE: 14 contextos de filtro × 42 medidas comparados com o pandas
//     (tools/referencia_pandas.py). Pega erros de filtro, anualização e bloqueios.
//  3) INTEGRIDADE: registro ↔ catálogo GRI ↔ contrato de dados sem referências quebradas;
//     leitor de CSV; validação de arquivo importado.
// =====================================================================================
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { parseCSV, csvParaObjetos } from "../src/js/nucleo/csv.js";
import { carregarTema, montarModelo } from "../src/js/nucleo/modelo.js";
import { criarContexto, anoSelecionado } from "../src/js/nucleo/contexto.js";
import { carregarRegistro, valorDe, variacao, balancoPilar, statusDoIndicador, niveisDoCatalogo } from "../src/js/nucleo/registro.js";
import { camposUsados } from "../src/js/nucleo/avaliador.js";
import { formatarValor, formatarDelta, classeDaVariacao } from "../src/js/nucleo/formato.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leitor = (c) => readFile(path.join(RAIZ, c), "utf-8");
const TEMA = "temas/t8-empregos-verdes";

const modelo = await carregarTema(leitor, TEMA);
const registro = await carregarRegistro(leitor);
// O catálogo GRI é PRIVADO (privado/gri_catalogo.json, fora do Git). Sem ele os testes que dependem
// de títulos/páginas são PULADOS (não falham), assim quem ainda não recebeu o arquivo consegue rodar tudo o mais.
const SEM_CATALOGO = registro.catalogoDisponivel ? false : "catálogo GRI privado ausente (privado/gri_catalogo.json)";
const refs = JSON.parse(await leitor("tests/referencia.json"));
const contextos = JSON.parse(await leitor("tests/contextos.json"));

// ---------------------------------------------------------------- 1) números âncora
test("âncora: números validados no Power BI (sem filtro)", () => {
  const ctx = criarContexto(modelo, {});
  const v = (ref) => valorDe(registro, ref, ctx);
  assert.equal(Math.round(v("EV1.empregados")), 2256);
  assert.equal(formatarValor(v("EV1"), { tipo: "percentual", casas: 1 }), "40,5%");
  assert.equal(formatarValor(v("EV1.alto_impacto"), { tipo: "percentual", casas: 1 }), "27,8%");
  assert.equal(formatarValor(v("ES1"), { tipo: "percentual", casas: 1 }), "44,0%");
  assert.equal(v("ES4").toFixed(2), "13.22");
  assert.equal(v("Q1").toFixed(1), "17.3");
});

test("âncora: as três classes somam 100%", () => {
  const ctx = criarContexto(modelo, { periodo: { de: "2025-01", ate: "2025-12" } });
  const s = ["EV1", "EV1.alto_impacto", "EV1.neutra"].reduce((a, r) => a + valorDe(registro, r, ctx), 0);
  assert.ok(Math.abs(s - 1) < 1e-12);
});

// ---------------------------------------------------------------- 2) referência independente
for (const [i, c] of contextos.entries()) {
  test(`referência pandas: ${c.nome}`, () => {
    const ctx = criarContexto(modelo, c.filtros);
    const esperado = refs[i].valores;
    const erros = [];
    for (const ind of registro.indicadores) for (const m of ind.medidas) {
      const chave = `${ind.id}.${m.chave}`;
      const obtido = valorDe(registro, chave, ctx), ref = esperado[chave];
      if (ref === undefined) { erros.push(`${chave}: sem referência`); continue; }
      const ok = obtido === null || ref === null ? obtido === ref : Math.abs(obtido - ref) <= 1e-9 * Math.max(1, Math.abs(ref));
      if (!ok) erros.push(`${chave}: motor=${obtido} pandas=${ref}`);
    }
    assert.deepEqual(erros, []);
  });
}

test("bloqueio: com filtro de classe, energia/resíduos/comunidade devolvem null (como o BLANK do DAX)", () => {
  const ctx = criarContexto(modelo, { classes: ["Verde"] });
  for (const ref of ["ES1", "ES4", "R1", "R2", "A1", "H1", "C1", "C3", "T1", "M1", "N1", "Q2"]) assert.equal(valorDe(registro, ref, ctx), null, ref);
  assert.notEqual(valorDe(registro, "EV2", ctx), null);
});

test("bloqueio: filtro de faixa etária zera Q1 e Q3 (capacitação não tem faixa)", () => {
  const ctx = criarContexto(modelo, { faixas: ["De 30 a 50"] });
  assert.equal(valorDe(registro, "Q1", ctx), null);
  assert.equal(valorDe(registro, "Q3", ctx), null);
  assert.notEqual(valorDe(registro, "EV4", ctx), null);
});

// ---------------------------------------------------------------- variação vs ano anterior
test("variação: só existe quando o período é um ano; usa o ano anterior INTEIRO", () => {
  const todo = criarContexto(modelo, {});
  assert.equal(anoSelecionado(todo), null);
  assert.equal(variacao(registro.porId.get("EV1"), registro.porId.get("EV1").principal, todo).delta, null);

  const c25 = criarContexto(modelo, { periodo: { de: "2025-01", ate: "2025-12" } });
  const c24 = criarContexto(modelo, { periodo: { de: "2024-01", ate: "2024-12" } });
  const ind = registro.porId.get("EV1"), m = ind.principal;
  const v = variacao(ind, m, c25);
  assert.equal(v.anterior, valorDe(registro, "EV1", c24));
  assert.ok(v.delta > 0, "o % verde deve subir de 2024 para 2025 (história do T8)");
  assert.equal(v.classe, "bom");
});

test("variação: 2026 (10 meses) compara com 2025 inteiro", () => {
  const c26 = criarContexto(modelo, { periodo: { de: "2026-01", ate: "2026-10" } });
  assert.equal(anoSelecionado(c26), 2026);
  const ind = registro.porId.get("ES4"); // anualizado: comparável apesar dos 10 meses
  assert.notEqual(variacao(ind, ind.principal, c26).delta, null);
});

test("variação: totais sem anualização não são comparados em ano parcial (2026 tem 10 meses)", () => {
  const ind = registro.porId.get("EV2"), total = ind.medidas.find((m) => m.chave === "contratacoes"), taxa = ind.principal;
  const c26 = criarContexto(modelo, { periodo: { de: "2026-01", ate: "2026-10" } });
  const c25 = criarContexto(modelo, { periodo: { de: "2025-01", ate: "2025-12" } });
  assert.equal(variacao(ind, total, c26).delta, null, "total parcial vs ano inteiro enganaria");
  assert.notEqual(variacao(ind, taxa, c26).delta, null, "a taxa é anualizada: pode comparar");
  assert.notEqual(variacao(ind, total, c25).delta, null, "2025 tem 12 meses: pode comparar");
});

test("cor da variação depende do SENTIDO, não do sinal", () => {
  assert.equal(classeDaVariacao(+1, "up"), "bom");
  assert.equal(classeDaVariacao(+1, "down"), "ruim");
  assert.equal(classeDaVariacao(-1, "down"), "bom");
  assert.equal(classeDaVariacao(0, "up"), "neutro");
  assert.equal(classeDaVariacao(5, "neutro"), "neutro");
  assert.equal(classeDaVariacao(null, "up"), "neutro");
});

test("formatação pt-BR de valores e variações", () => {
  assert.equal(formatarValor(0.4051, { tipo: "percentual", casas: 1 }), "40,5%");
  assert.equal(formatarValor(2255.7, { tipo: "numero", casas: 0 }), "2.256");
  assert.equal(formatarValor(null, { tipo: "numero" }), "–");
  assert.equal(formatarValor(15360000, { tipo: "moeda_milhoes", casas: 1 }), "R$ 15,4 mi");
  assert.equal(formatarDelta(0.0123, { tipo: "percentual" }), "▲ +1,2 pp");
  assert.equal(formatarDelta(-2.14, { tipo: "numero", casas: 1, unidade: " tCO2e" }), "▼ −2,1 tCO2e");
});

test("balanço do pilar: contagens fecham com o total", () => {
  const ctx = criarContexto(modelo, { periodo: { de: "2025-01", ate: "2025-12" } });
  for (const p of ["A", "S", "G"]) {
    const b = balancoPilar(registro, ctx, p);
    assert.equal(b.melhoraram + b.pioraram + b.estaveis + b.semDado, b.total, p);
    assert.ok(b.total > 0);
  }
});

// ---------------------------------------------------------------- 3) integridade
test("integridade: dados do T8 carregam sem erros nem avisos; 46 meses", () => {
  assert.deepEqual(modelo.problemas, { erros: [], avisos: [] });
  assert.equal(modelo.meses.length, 46);
  assert.equal(modelo.projetos.size, 12);
  assert.equal(modelo.empresas.size, 9);
});

test("integridade: todo campo lido pelas fórmulas existe no contrato de dados", () => {
  const colunas = new Set();
  for (const [t, def] of Object.entries(modelo.contrato.tabelas)) for (const c of Object.keys(def.colunas)) colunas.add(`${t}.${c}`);
  const faltando = [];
  for (const ind of registro.indicadores) for (const m of ind.medidas) for (const c of camposUsados(m.expr)) if (!colunas.has(c)) faltando.push(`${ind.id}.${m.chave} → ${c}`);
  assert.deepEqual(faltando, []);
});

test("integridade: os 26 indicadores do tema existem no registro, estão ativos e têm GRI com página", () => {
  assert.equal(modelo.tema.indicadores.length, 26);
  for (const id of modelo.tema.indicadores) {
    const ind = registro.porId.get(id);
    assert.ok(ind, `indicador ${id} não está no registro`);
    assert.ok(statusDoIndicador(ind, modelo).ativo, `${id} sem dados`);
    assert.ok(ind.referencias.length > 0, `${id}: indicador sem referência GRI`);
    if (registro.catalogoDisponivel) assert.ok(ind.referencias.every((r) => Number.isInteger(r.pagina)), `${id}: referência GRI sem página`);
    assert.ok(["A", "S", "G"].includes(ind.pilar));
  }
});

test("integridade: páginas GRI conferidas contra o texto das Normas", { skip: SEM_CATALOGO }, () => {
  const pagina = (id) => registro.porId.get(id).referencias.map((r) => r.pagina);
  assert.deepEqual(pagina("EV1"), [52]); assert.deepEqual(pagina("EV2"), [788]); assert.deepEqual(pagina("EV4"), [860]);
  assert.deepEqual(pagina("R1"), [741]); assert.deepEqual(pagina("R2"), [742]); assert.deepEqual(pagina("A1"), [684]);
  assert.deepEqual(pagina("H1"), [703]); assert.deepEqual(pagina("N1"), [802]); assert.deepEqual(pagina("ES4"), [714, 716]);
  assert.deepEqual(pagina("M1"), [437]);
});

test("catálogo GRI: níveis de maturidade fazem sentido", { skip: SEM_CATALOGO }, () => {
  const n = niveisDoCatalogo(registro, modelo);
  const por = (nivel) => n.filter((x) => x.nivel === nivel).length;
  assert.ok(registro.catalogo.length >= 125);
  assert.ok(por("em_painel") >= 19, "os conteúdos usados no tema devem estar em_painel");
  assert.ok(por("catalogado") > 90, "a maior parte do catálogo ainda é só catalogada");
  assert.equal(n.find((x) => x.id === "401-1:2016").nivel, "em_painel");
  assert.equal(n.find((x) => x.id === "2-9:2021").nivel, "catalogado");
});

test("csv: aspas, vírgula dentro do campo, \\r\\n, BOM e número vazio = null", () => {
  const m = parseCSV('﻿a,b\r\n"x, y","z ""q"""\r\n1,\r\n');
  assert.deepEqual(m, [["a", "b"], ["x, y", 'z "q"'], ["1", ""]]);
  const { linhas } = csvParaObjetos("n,t\n,abc\n3,d\n", { n: "numero" });
  assert.deepEqual(linhas, [{ n: null, t: "abc" }, { n: 3, t: "d" }]);
});

test("importação: arquivo sem coluna obrigatória gera ERRO claro; arquivo opcional ausente gera AVISO", async () => {
  const textos = {};
  for (const def of Object.values(modelo.contrato.tabelas)) {
    try { textos[def.arquivo] = await leitor(`${TEMA}/dados/${def.arquivo}`); } catch { /* ignora */ }
  }
  textos["ocupacoes.csv"] = "ocupacao_id,ocupacao\nO01,x\n";   // faltam classe etc.
  delete textos["comunidade.csv"];                              // opcional
  const m = montarModelo(modelo.tema, modelo.contrato, textos);
  assert.ok(m.problemas.erros.some((e) => e.includes("ocupacoes.csv") && e.includes("classe")));
  assert.ok(m.problemas.avisos.some((e) => e.includes("comunidade.csv")));
  const sem = statusDoIndicador(registro.porId.get("C3"), m);
  assert.equal(sem.ativo, false);
  assert.ok(sem.faltando.includes("comunidade.tem_programa_comunidade"));
});

test("sem o catálogo privado: referências GRI continuam identificadas pelo código", () => {
  // as referências do registro PÚBLICO têm de bastar para mostrar "GRI 305-1" mesmo sem título/página
  for (const ind of registro.indicadores) {
    assert.ok(ind.referencias.length > 0, `${ind.id} sem referência`);
    assert.ok(ind.referencias.every((r) => /^GRI \d/.test(r.rotulo)), `${ind.id}: rótulo GRI inesperado`);
  }
});

// ---------------------------------------------------------------- CL1 (GRI 2-27, Governança)
test("CL1: % de projetos com multa no último ano e total de multas (conta feita à mão sobre conformidade.csv)", () => {
  const linhas = modelo.tabelas.conformidade;
  // período 2025: 12 projetos, quantos tiveram multa em 2025?
  const ctx = criarContexto(modelo, { periodo: { de: "2025-01", ate: "2025-12" } });
  const do2025 = linhas.filter((r) => r.ano === 2025);
  const comMulta = do2025.filter((r) => r.multas_qtd > 0).length;
  assert.ok(Math.abs(valorDe(registro, "CL1", ctx) - comMulta / do2025.length) < 1e-12);
  // sem filtro de período, o total soma os 4 anos e o % usa só o último (2026)
  const todos = criarContexto(modelo, {});
  assert.equal(valorDe(registro, "CL1.multas_total", todos), linhas.reduce((a, r) => a + r.multas_qtd, 0));
  // coerência da coluna auxiliar: teve_multa == "Sim" exatamente quando multas_qtd > 0
  assert.ok(linhas.every((r) => (r.teve_multa === "Sim") === (r.multas_qtd > 0)));
});

// ---------------------------------------------------------------- AC1, AC2, PO1 (Governança: tabela integridade)
test("AC1, AC2 e PO1: contas à mão sobre integridade.csv (último ano = 2025 no período de 2025)", () => {
  const linhas = modelo.tabelas.integridade.filter((r) => r.ano === 2025);
  const ctx = criarContexto(modelo, { periodo: { de: "2025-01", ate: "2025-12" } });
  const perto = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
  perto(valorDe(registro, "AC1", ctx), linhas.filter((r) => r.casos_corrupcao > 0).length / linhas.length);
  perto(valorDe(registro, "AC2", ctx), linhas.reduce((a, r) => a + r.gestores_capacitados_anticorrupcao, 0) / linhas.reduce((a, r) => a + r.gestores_total, 0));
  const sim = linhas.reduce((a, r) => a + [r.politica_ambiental, r.politica_direitos_humanos, r.politica_anticorrupcao].filter((x) => x === "Sim").length, 0);
  perto(valorDe(registro, "PO1", ctx), sim / (3 * linhas.length));
});

test("integridade.csv: colunas auxiliares coerentes e capacitados nunca passam do total de gestores", () => {
  const linhas = modelo.tabelas.integridade;
  assert.ok(linhas.every((r) => (r.teve_caso_corrupcao === "Sim") === (r.casos_corrupcao > 0)));
  assert.ok(linhas.every((r) => r.gestores_capacitados_anticorrupcao <= r.gestores_total));
  assert.ok(linhas.every((r) => r.politicas_adotadas_qtd === [r.politica_ambiental, r.politica_direitos_humanos, r.politica_anticorrupcao].filter((x) => x === "Sim").length));
});
