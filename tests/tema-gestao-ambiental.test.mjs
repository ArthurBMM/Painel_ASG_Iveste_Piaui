// =====================================================================================
// tema-gestao-ambiental.test.mjs — testes do SEGUNDO TEMA (prova de escalabilidade, requisito R1)
//
// O que estes testes garantem:
//  1) O tema é só uma pasta: carrega pelo MESMO motor, sem erros, e está registrado no índice.
//  2) Todo indicador que o tema lista tem dados para ser calculado (nada aparece como "faltam: …").
//  3) A ESCALA dos dados cabe nos pisos/tetos globais de config/metricas.json. Se alguém regenerar
//     os dados com outra escala, as notas travariam em 0 ou 100 e o tema pareceria quebrado.
//  4) Cada afirmação da "história" (tema.json) continua VERDADEIRA nos números. Se alguém mudar o
//     gerador e a história deixar de valer, o teste falha em vez de a apresentação mentir.
//  5) Integridade dos dados: a conta de estoque fecha e resíduos recuperados + disposição = gerados.
//
// Não há referência pandas aqui: o motor e as fórmulas já são validados pelos testes do T8
// (regressao.test.mjs); este arquivo só prova que um tema NOVO encaixa neles.
// =====================================================================================
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { carregarTema } from "../src/js/nucleo/modelo.js";
import { criarContexto } from "../src/js/nucleo/contexto.js";
import { carregarRegistro, valorDe, resolverRef, statusDoIndicador } from "../src/js/nucleo/registro.js";
import { carregarMetricas, validarMetricas, pontuarASG } from "../src/js/nucleo/pontuacao.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leitor = (c) => readFile(path.join(RAIZ, c), "utf-8");
const PASTA = "temas/gestao-ambiental";

const modelo = await carregarTema(leitor, PASTA);
const registro = await carregarRegistro(leitor);
const metricas = await carregarMetricas(leitor);
const tema = modelo.tema;

/** Valor de uma medida em um ano civil inteiro, com filtros opcionais (ex.: { setores: ["Agroindústria"] }). */
const noAno = (ref, ano, filtros = {}) => valorDe(registro, ref, criarContexto(modelo, { ...filtros, periodo: { de: `${ano}-01`, ate: `${ano}-12` } }));

// ---------------------------------------------------------------- 1) o tema é só uma pasta
test("tema: carrega sem erros nem avisos de contrato e está no índice de temas", async () => {
  assert.deepEqual(modelo.problemas.erros, []);
  assert.deepEqual(modelo.problemas.avisos, []);
  const indice = JSON.parse(await leitor("temas/index.json"));
  const entrada = indice.temas.find((t) => t.id === tema.id);
  assert.ok(entrada, "o tema precisa estar em temas/index.json");
  assert.equal(entrada.pasta, PASTA);
  assert.equal(modelo.meses.length, 46); // mesmo calendário do T8 (jan/2023 a out/2026)
});

// ---------------------------------------------------------------- 2) indicadores com dados
test("tema: todos os indicadores listados existem no registro e têm dados para calcular", () => {
  for (const id of tema.indicadores) {
    const ind = registro.porId.get(id);
    assert.ok(ind, `${id} não existe em catalogo/indicadores.json`);
    const st = statusDoIndicador(ind, modelo);
    assert.ok(st.ativo, `${id} está inativo: faltam ${st.faltando.join(", ")}`);
  }
  for (const p of ["A", "S", "G"]) assert.ok(tema.indicadores.some((id) => registro.porId.get(id).pilar === p), `pilar ${p} sem indicadores`);
});

test("tema: toda referência de destaque, cartão do topo e gráfico resolve para uma medida do registro", () => {
  const refs = [...tema.cartoes_topo, ...Object.values(tema.destaques).flat(),
    ...Object.values(tema.graficos).flat().flatMap((g) => g.refs || [])];
  assert.ok(refs.length > 10);
  for (const r of refs) assert.doesNotThrow(() => resolverRef(registro, r), `referência inválida: ${r}`);
  for (const mk of tema.marcas) assert.ok(modelo.meses.includes(mk.mes), `a marca ${mk.mes} não é um mês dos dados`);
});

// ---------------------------------------------------------------- 3) escala x pisos/tetos globais
test("pontuação: os parâmetros globais valem para o tema (sem erros nem indicadores sem parâmetro)", () => {
  const v = validarMetricas(metricas, registro, tema.indicadores);
  assert.deepEqual(v.erros, []);
  assert.deepEqual(v.avisos, []);
});

test("pontuação: os dados caem DENTRO de piso e teto (nenhuma nota travada) em todos os anos", () => {
  // Estes 6 indicadores têm piso/teto calibrados na escala do T8; o gerador deste tema foi desenhado para caber neles.
  for (const id of ["ES1", "ES2", "ES4", "R1", "R2", "A1"]) {
    const { piso, teto } = metricas.indicadores[id].normalizacao;
    const [lo, hi] = [Math.min(piso, teto), Math.max(piso, teto)];
    for (const ano of [2023, 2024, 2025, 2026]) {
      const x = noAno(id, ano);
      assert.ok(x > lo && x < hi, `${id} em ${ano} = ${x} saiu da faixa (${lo}, ${hi}): a nota travaria`);
    }
  }
});

test("pontuação: notas ASG existem e ficam entre 0 e 100, com cobertura completa", () => {
  for (const ano of [2023, 2024, 2025, 2026]) {
    const asg = pontuarASG(registro, metricas, criarContexto(modelo, { periodo: { de: `${ano}-01`, ate: `${ano}-12` } }), tema.indicadores);
    for (const k of ["geral", "A", "S", "G"]) {
      assert.ok(asg[k].nota > 0 && asg[k].nota < 100, `${k} em ${ano}: ${asg[k].nota}`);
      assert.equal(asg[k].cobertura, 1, `${k} em ${ano} com cobertura < 100%`);
    }
  }
});

// ---------------------------------------------------------------- 4) a história é verdadeira
test("história: energia renovável sobe e emissões por empregado caem, na carteira e em todos os setores", () => {
  const setores = [...new Set([...modelo.projetos.values()].map((p) => p.setor))];
  assert.ok(noAno("ES1", 2025) > noAno("ES1", 2023) && noAno("ES4", 2025) < noAno("ES4", 2023));
  for (const s of setores) {
    assert.ok(noAno("ES1", 2025, { setores: [s] }) > noAno("ES1", 2023, { setores: [s] }), `ES1 não subiu em ${s}`);
    assert.ok(noAno("ES4", 2025, { setores: [s] }) < noAno("ES4", 2023, { setores: [s] }), `ES4 não caiu em ${s}`);
  }
});

test("história: recuperação de resíduos passa de ~1/3 para ~1/2 e a água por empregado cai", () => {
  assert.ok(noAno("R2", 2023) > 0.28 && noAno("R2", 2023) < 0.40);
  assert.ok(noAno("R2", 2026) > 0.45 && noAno("R2", 2026) < 0.60);
  assert.ok(noAno("A1", 2025) < noAno("A1", 2024) && noAno("A1", 2026) < noAno("A1", 2023));
});

test("história: o resíduo gerado por empregado mal se move (menos de 10% em 3 anos)", () => {
  const var3anos = Math.abs(noAno("R1", 2026) / noAno("R1", 2023) - 1);
  assert.ok(var3anos < 0.10, `R1 variou ${(var3anos * 100).toFixed(1)}%`);
});

test("história: rotatividade sobe na carteira e se concentra nas agroindústrias (≥ 2x as demais)", () => {
  assert.ok(noAno("EV3", 2025) > noAno("EV3", 2023));
  const outros = [...new Set([...modelo.projetos.values()].map((p) => p.setor))].filter((s) => s !== "Agroindústria");
  const agro = noAno("EV3", 2025, { setores: ["Agroindústria"] });
  for (const s of outros) assert.ok(agro >= 2 * noAno("EV3", 2025, { setores: [s] }), `agroindústria não é ≥ 2x ${s}`);
});

test("história: Governança tem a menor nota dos três pilares em todos os anos", () => {
  for (const ano of [2023, 2024, 2025, 2026]) {
    const asg = pontuarASG(registro, metricas, criarContexto(modelo, { periodo: { de: `${ano}-01`, ate: `${ano}-12` } }), tema.indicadores);
    assert.ok(asg.G.nota < asg.A.nota && asg.G.nota < asg.S.nota, `em ${ano} G não é a menor nota`);
  }
});

test("história: a central de triagem abre em mar/2024 e o programa próprio em jun/2023 (dados só a partir daí)", () => {
  const primeiroMes = (pid) => modelo.tabelas.emprego_mensal.filter((r) => r.projeto_id === pid).map((r) => r.mes.slice(0, 7)).sort()[0];
  assert.equal(primeiroMes("P06"), "2024-03");
  assert.equal(primeiroMes("P09"), "2023-06");
});

// ---------------------------------------------------------------- 5) integridade dos dados
test("dados: a conta de estoque fecha (estoque = anterior + contratações − desligamentos) em cada célula", () => {
  const por = new Map();
  for (const r of modelo.tabelas.emprego_mensal) {
    const k = [r.projeto_id, r.ocupacao_id, r.genero, r.faixa_etaria].join("|");
    if (!por.has(k)) por.set(k, []);
    por.get(k).push(r);
  }
  for (const [k, linhas] of por) {
    linhas.sort((a, b) => (a.mes < b.mes ? -1 : 1));
    for (let i = 1; i < linhas.length; i++) {
      // só confere meses consecutivos presentes nos dois lados (linhas zeradas são omitidas do CSV)
      const mesesEntre = (Number(linhas[i].mes.slice(0, 4)) - Number(linhas[i - 1].mes.slice(0, 4))) * 12 + Number(linhas[i].mes.slice(5, 7)) - Number(linhas[i - 1].mes.slice(5, 7));
      if (mesesEntre !== 1) continue;
      const esperado = linhas[i - 1].empregados_fim_mes + linhas[i].contratacoes - linhas[i].desligamentos;
      assert.equal(linhas[i].empregados_fim_mes, esperado, `${k} em ${linhas[i].mes}`);
    }
  }
});

test("dados: resíduos recuperados + disposição final = gerados (tolerância de arredondamento)", () => {
  for (const r of modelo.tabelas.ambiental_mensal) {
    const gerados = r.residuos_perigosos_ton + r.residuos_nao_perigosos_ton;
    assert.ok(Math.abs(r.residuos_recuperados_ton + r.residuos_disposicao_final_ton - gerados) < 0.03, `${r.projeto_id} ${r.mes}`);
  }
});

test("dados: nenhum número negativo e todo mês de energia/ambiental tem empregados no mesmo projeto e mês", () => {
  const emp = new Set(modelo.tabelas.emprego_mensal.map((r) => `${r.projeto_id}|${r.mes}`));
  for (const nome of ["energia_emissoes", "ambiental_mensal"]) {
    for (const r of modelo.tabelas[nome]) {
      assert.ok(emp.has(`${r.projeto_id}|${r.mes}`), `${nome}: ${r.projeto_id} ${r.mes} sem empregados`);
      for (const [c, v] of Object.entries(r)) if (typeof v === "number") assert.ok(v >= 0, `${nome}.${c} negativo`);
    }
  }
});
