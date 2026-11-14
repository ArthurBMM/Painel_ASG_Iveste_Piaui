// =====================================================================================
// pontuacao.test.mjs — testes da pontuação (notas 0-100)
//   1) a CONTA, com números pequenos que dá para fazer de cabeça;
//   2) o arquivo config/metricas.json é válido e cada regra de validação realmente pega o erro;
//   3) o motor JS bate com a referência independente (tools/referencia_pontuacao.py) em 13 contextos.
// =====================================================================================
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { carregarTema } from "../src/js/nucleo/modelo.js";
import { carregarRegistro } from "../src/js/nucleo/registro.js";
import { criarContexto } from "../src/js/nucleo/contexto.js";
import { carregarMetricas, normalizar, detalharNormalizacao, classificar, agregarPilar, agregarASG, pontuarASG, sensibilidadePesos, validarMetricas } from "../src/js/nucleo/pontuacao.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leitor = (c) => readFile(path.join(RAIZ, c), "utf-8");
const modelo = await carregarTema(leitor, "temas/t8-empregos-verdes");
const registro = await carregarRegistro(leitor);
const metricas = await carregarMetricas(leitor);
const contextos = JSON.parse(await leitor("tests/contextos.json"));
const refs = JSON.parse(await leitor("tests/referencia_pontuacao.json"));
const perto = (a, b, tol = 1e-9) => (a === null || b === null ? a === b : Math.abs(a - b) <= tol);
const FAIXAS = { alinhado: 70, atencao: 40, cobertura_minima: 0.5 };

// ------------------------------------------------------------ 1) a conta
test("normalizar: maior é melhor (piso < teto)", () => {
  const n = { piso: 10, teto: 60 };
  assert.equal(normalizar(10, n), 0);
  assert.equal(normalizar(35, n), 50);
  assert.equal(normalizar(60, n), 100);
});

test("normalizar: menor é melhor (piso > teto) usa a mesma fórmula", () => {
  const n = { piso: 40, teto: 10 };
  assert.equal(normalizar(40, n), 0);
  assert.equal(normalizar(25, n), 50);
  assert.equal(normalizar(10, n), 100);
});

test("normalizar: trava em 0 e 100 fora do intervalo; sem valor devolve null (não zero)", () => {
  assert.equal(normalizar(-5, { piso: 0, teto: 10 }), 0);
  assert.equal(normalizar(99, { piso: 0, teto: 10 }), 100);
  assert.equal(normalizar(99, { piso: 120, teto: 20 }), 100 * (99 - 120) / (20 - 120));
  assert.equal(normalizar(null, { piso: 0, teto: 10 }), null);
  assert.equal(normalizar(NaN, { piso: 0, teto: 10 }), null);
  assert.throws(() => normalizar(1, { piso: 5, teto: 5 }), /inválidos/);
});

test("detalharNormalizacao mostra os mesmos números da conta (para a tela)", () => {
  const d = detalharNormalizacao(0.35, { piso: 0.1, teto: 0.6 });
  assert.ok(perto(d.numerador, 0.25) && perto(d.denominador, 0.5) && perto(d.bruto, 0.5) && perto(d.nota, 50));
  assert.equal(detalharNormalizacao(0.7, { piso: 0.1, teto: 0.6 }).travou, "teto");
  assert.equal(detalharNormalizacao(0, { piso: 0.1, teto: 0.6 }).travou, "piso");
});

test("agregarPilar: média ponderada, cobertura e dado ausente fora da média", () => {
  const r = agregarPilar([{ id: "a", peso: 3, nota: 100 }, { id: "b", peso: 1, nota: 0 }], FAIXAS);
  assert.equal(r.nota, 75);                       // (3×100 + 1×0) / 4
  assert.equal(r.cobertura, 1);
  assert.equal(r.faixa, "alinhado");

  const s = agregarPilar([{ id: "a", peso: 3, nota: 80 }, { id: "b", peso: 1, nota: null }], FAIXAS);
  assert.equal(s.nota, 80);                       // b NÃO vira zero: sai da média
  assert.equal(s.cobertura, 0.75);                // 3 de 4 de peso tem dado
  assert.equal(s.avaliados, 1);

  const vazio = agregarPilar([{ id: "a", peso: 1, nota: null }], FAIXAS);
  assert.equal(vazio.nota, null);
  assert.equal(vazio.faixa, "sem_dados");
});

test("classificar: cortes 70/40, limites inclusivos, cobertura mínima", () => {
  assert.equal(classificar(70, 1, FAIXAS), "alinhado");
  assert.equal(classificar(69.99, 1, FAIXAS), "atencao");
  assert.equal(classificar(40, 1, FAIXAS), "atencao");
  assert.equal(classificar(39.99, 1, FAIXAS), "critico");
  assert.equal(classificar(90, 0.49, FAIXAS), "sem_dados");     // nota alta com pouca cobertura não ganha rótulo
  assert.equal(classificar(null, 1, FAIXAS), "sem_dados");
});

test("agregarASG: pesos dos pilares; pilar sem nota sai da média e baixa a cobertura", () => {
  const p = (nota, cobertura) => ({ nota, cobertura });
  const g = agregarASG({ A: p(100, 1), S: p(50, 1), G: p(0, 1) }, { A: 1, S: 1, G: 1 }, FAIXAS);
  assert.equal(g.nota, 50);
  const dobro = agregarASG({ A: p(100, 1), S: p(50, 1), G: p(0, 1) }, { A: 2, S: 1, G: 1 }, FAIXAS);
  assert.equal(dobro.nota, (200 + 50 + 0) / 4);
  const sem = agregarASG({ A: p(80, 1), S: p(60, 1), G: p(null, 0) }, { A: 1, S: 1, G: 1 }, FAIXAS);
  assert.equal(sem.nota, 70);                      // G sem dado não vira zero
  assert.ok(perto(sem.cobertura, 2 / 3));          // mas a cobertura geral cai
  const semIndicadores = agregarASG({ A: p(80, 1), S: p(60, 1), G: p(null, null) }, { A: 1, S: 1, G: 1 }, FAIXAS);
  assert.equal(semIndicadores.cobertura, 1);       // pilar sem NENHUM indicador pontuável nem entra na conta
});

test("sensibilidadePesos: detecta quando o ranking muda e quando é estável", () => {
  const estavel = sensibilidadePesos([{ nome: "x", nota: 90, notaIguais: 88 }, { nome: "y", nota: 70, notaIguais: 71 }, { nome: "z", nota: 40, notaIguais: 39 }]);
  assert.equal(estavel.mudaram, 0); assert.equal(estavel.estavel, true);
  const frágil = sensibilidadePesos([{ nome: "x", nota: 90, notaIguais: 50 }, { nome: "y", nota: 70, notaIguais: 60 }, { nome: "z", nota: 40, notaIguais: 80 }]);
  assert.equal(frágil.maiorMudanca, 2);            // z sobe da 3ª para a 1ª posição
  assert.equal(frágil.estavel, false);
  assert.equal(sensibilidadePesos([{ nome: "x", nota: null, notaIguais: null }]).n, 0);
});

// ------------------------------------------------------------ 2) o arquivo de parâmetros
test("config/metricas.json: válido contra o registro e todo indicador pontuado tem justificativa e fonte", () => {
  assert.ok(metricas, "config/metricas.json não encontrado");
  const v = validarMetricas(metricas, registro, modelo.tema.indicadores);
  assert.deepEqual(v.erros, []);
  assert.deepEqual(v.avisos, []);                  // todos os 25 do tema têm entrada (pontuados ou com motivo)
  for (const [id, c] of Object.entries(metricas.indicadores)) {
    if (c.pontuar === false) assert.ok(c.motivo.length > 20, `${id}: motivo curto demais`);
    else assert.ok(c.justificativa.length > 30 && c.fonte, `${id}: justificativa/fonte`);
  }
});

test("validarMetricas: cada regra pega o erro correspondente", () => {
  const clone = () => JSON.parse(JSON.stringify(metricas));
  const erros = (m) => validarMetricas(m, registro).erros.join(" | ");

  let m = clone(); delete m.indicadores.EV1.justificativa; assert.match(erros(m), /EV1: falta "justificativa"/);
  m = clone(); delete m.indicadores.EV1.fonte; assert.match(erros(m), /EV1: falta "fonte"/);
  m = clone(); m.indicadores.EV1.peso = 0; assert.match(erros(m), /EV1\.peso/);
  m = clone(); m.indicadores.EV1.normalizacao.teto = m.indicadores.EV1.normalizacao.piso; assert.match(erros(m), /piso e teto não podem ser iguais/);
  m = clone(); [m.indicadores.EV1.normalizacao.piso, m.indicadores.EV1.normalizacao.teto] = [0.6, 0.1]; assert.match(erros(m), /maior é melhor/);   // EV1 sobe=bom, limites invertidos
  m = clone(); [m.indicadores.EV3.normalizacao.piso, m.indicadores.EV3.normalizacao.teto] = [0.1, 0.4]; assert.match(erros(m), /menor é melhor/);   // EV3 cai=bom, limites invertidos
  m = clone(); m.indicadores.XX = m.indicadores.EV1; assert.match(erros(m), /XX: indicador não existe/);
  m = clone(); delete m.indicadores.C1.motivo; assert.match(erros(m), /C1: pontuar:false exige/);
  m = clone(); m.faixas.alinhado = 30; assert.match(erros(m), /faixas/);
  m = clone(); m.pesos_pilares.G = -1; assert.match(erros(m), /pesos_pilares\.G/);
  m = clone(); delete m.indicadores.M1; assert.match(validarMetricas(m, registro, modelo.tema.indicadores).avisos.join(), /M1: sem parâmetros/);
});

test("indicadores de total absoluto ficam fora da nota (não comparáveis entre entidades de tamanhos diferentes)", () => {
  for (const id of ["C1", "ES6", "H1"]) assert.equal(metricas.indicadores[id].pontuar, false, id);
  const ctx = criarContexto(modelo, {});
  const a = pontuarASG(registro, metricas, ctx, modelo.tema.indicadores);
  assert.deepEqual(a.A.foraDaNota.map((x) => x.id).sort(), ["ES6", "H1"]);
  assert.deepEqual(a.S.foraDaNota.map((x) => x.id), ["C1"]);
  assert.equal(a.A.total, 7); assert.equal(a.S.total, 8); assert.equal(a.G.total, 7);           // Q3, T1, M1, CL1, AC1, AC2 e PO1
});

// ------------------------------------------------------------ 3) motor JS × referência independente
for (const [i, c] of contextos.entries()) {
  test(`pontuação × referência Python: ${c.nome}`, () => {
    const ctx = criarContexto(modelo, c.filtros);
    for (const [chave, opcoes] of [["normal", {}], ["pesos_iguais", { pesosIguais: true }]]) {
      const obtido = pontuarASG(registro, metricas, ctx, modelo.tema.indicadores, opcoes);
      const esperado = refs[i][chave];
      for (const p of ["A", "S", "G"]) {
        assert.ok(perto(obtido[p].nota, esperado[p].nota, 1e-9), `${chave} ${p}.nota: ${obtido[p].nota} × ${esperado[p].nota}`);
        assert.ok(perto(obtido[p].cobertura, esperado[p].cobertura, 1e-12), `${chave} ${p}.cobertura`);
        assert.equal(obtido[p].faixa, esperado[p].faixa, `${chave} ${p}.faixa`);
        assert.equal(obtido[p].avaliados, esperado[p].avaliados, `${chave} ${p}.avaliados`);
      }
      assert.ok(perto(obtido.geral.nota, esperado.geral.nota, 1e-9), `${chave} geral.nota: ${obtido.geral.nota} × ${esperado.geral.nota}`);
      assert.ok(perto(obtido.geral.cobertura, esperado.geral.cobertura, 1e-12), `${chave} geral.cobertura`);
      assert.equal(obtido.geral.faixa, esperado.geral.faixa, `${chave} geral.faixa`);
    }
  });
}

test("a nota respeita o recorte: com filtro de classe, pilares sem dado aparecem como 'sem dados' (não como zero)", () => {
  const ctx = criarContexto(modelo, { classes: ["Verde"] });          // só indicadores ocupacionais têm dado
  const a = pontuarASG(registro, metricas, ctx, modelo.tema.indicadores);
  assert.equal(a.A.nota, null); assert.equal(a.A.faixa, "sem_dados");
  assert.ok(a.S.nota !== null && a.S.cobertura < 1);
});
