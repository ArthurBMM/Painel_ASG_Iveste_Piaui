// =====================================================================================
// pontuacao.js — transforma valores de indicadores (em unidades diferentes) em NOTAS de 0 a 100
//
// POR QUE EXISTE? A Investe Piauí quer saber se uma entidade "está de acordo" com os critérios
// A, S e G. Para comparar % com tCO2e e horas, precisamos de uma escala comum. Toda escolha aqui
// (piso, teto, peso) é uma HIPÓTESE do grupo, sem dado oficial por trás. Por isso:
//   1) todos os parâmetros ficam em UM arquivo editável (config/metricas.json), com justificativa;
//   2) este arquivo só tem a CONTA (funções puras, sem números mágicos);
//   3) a tela mostra a conta passo a passo (página "Indicadores e método").
//
// A CONTA, em três degraus:
//   indicador → nota = (valor − piso) / (teto − piso), limitada a [0, 100]
//   pilar     → média ponderada das notas dos indicadores COM DADO (pesos renormalizados)
//   ASG geral → média ponderada das notas dos três pilares
// Além da nota, calculamos a COBERTURA: que fração do peso tem dado. Uma nota de pilar baseada
// em 1 de 3 indicadores não pode parecer tão confiável quanto uma baseada em 3 de 3.
//
// DADO AUSENTE NUNCA VIRA ZERO: o indicador sai da média (e reduz a cobertura).
// =====================================================================================
import { valorDe } from "./registro.js";

const limitar = (x, a, b) => Math.min(b, Math.max(a, x));
const ehNumero = (x) => typeof x === "number" && Number.isFinite(x);

/** Lê config/metricas.json. Devolve null se o arquivo não existir (a ferramenta funciona sem notas). */
export async function carregarMetricas(leitor, rota = "config/metricas.json") {
  try { return JSON.parse(await leitor(rota)); } catch { return null; }
}

// ------------------------------------------------------------------ 1) normalização
/**
 * Nota 0–100 de um valor. Funciona nos dois sentidos com UMA fórmula:
 *   - maior é melhor: piso < teto  →  (valor − piso) / (teto − piso)
 *   - menor é melhor: piso > teto  →  (valor − piso) / (teto − piso)  (os sinais se cancelam)
 * Piso = valor que vale 0 pontos; teto = valor que vale 100. Fora do intervalo, trava em 0 ou 100.
 * @returns {number|null} null quando não há valor (dado ausente ≠ zero)
 */
export function normalizar(valor, { piso, teto }) {
  if (!ehNumero(valor)) return null;
  if (!ehNumero(piso) || !ehNumero(teto) || piso === teto) throw new Error(`Piso e teto inválidos (${piso}, ${teto})`);
  return limitar((valor - piso) / (teto - piso), 0, 1) * 100;
}

/** Os números da conta de um indicador, para a tela mostrar "passo a passo" (não recalcula nada diferente). */
export function detalharNormalizacao(valor, { piso, teto }) {
  if (!ehNumero(valor)) return null;
  const bruto = (valor - piso) / (teto - piso);
  return { valor, piso, teto, numerador: valor - piso, denominador: teto - piso, bruto, nota: limitar(bruto, 0, 1) * 100, travou: bruto < 0 ? "piso" : bruto > 1 ? "teto" : null };
}

// ------------------------------------------------------------------ 2) faixas
/** "alinhado" | "atencao" | "critico" | "sem_dados". Cobertura baixa → "sem_dados" (não arriscamos um rótulo). */
export function classificar(nota, cobertura, faixas) {
  if (!ehNumero(nota) || !ehNumero(cobertura) || cobertura < faixas.cobertura_minima) return "sem_dados";
  return nota >= faixas.alinhado ? "alinhado" : nota >= faixas.atencao ? "atencao" : "critico";
}

// ------------------------------------------------------------------ 3) agregação (funções PURAS)
/**
 * Nota de um pilar a partir dos itens já normalizados.
 * @param itens  [{ id, peso, nota }]  nota = null quando o indicador não tem dado
 */
export function agregarPilar(itens, faixas) {
  const pesoTotal = itens.reduce((s, i) => s + i.peso, 0);
  const comDado = itens.filter((i) => ehNumero(i.nota));
  const pesoComDado = comDado.reduce((s, i) => s + i.peso, 0);
  const nota = pesoComDado > 0 ? comDado.reduce((s, i) => s + i.peso * i.nota, 0) / pesoComDado : null;
  const cobertura = pesoTotal > 0 ? pesoComDado / pesoTotal : null;
  return { nota, cobertura, faixa: classificar(nota, cobertura, faixas), avaliados: comDado.length, total: itens.length, itens };
}

/** Nota ASG geral a partir das três notas de pilar. Pilar sem nenhum indicador pontuável sai da conta. */
export function agregarASG(pilares, pesosPilares, faixas) {
  const lista = Object.entries(pilares).filter(([, p]) => p.cobertura !== null);        // pilares que têm indicadores pontuáveis
  const comNota = lista.filter(([, p]) => ehNumero(p.nota));
  const pesoNota = comNota.reduce((s, [k]) => s + pesosPilares[k], 0);
  const pesoTodos = lista.reduce((s, [k]) => s + pesosPilares[k], 0);
  const nota = pesoNota > 0 ? comNota.reduce((s, [k, p]) => s + pesosPilares[k] * p.nota, 0) / pesoNota : null;
  // cobertura geral: média ponderada da cobertura de cada pilar (um pilar sem dado puxa a cobertura para baixo)
  const cobertura = pesoTodos > 0 ? lista.reduce((s, [k, p]) => s + pesosPilares[k] * p.cobertura, 0) / pesoTodos : null;
  return { nota, cobertura, faixa: classificar(nota, cobertura, faixas) };
}

// ------------------------------------------------------------------ 4) pontuar com dados reais do modelo
/** Indicadores do pilar que entram na nota: têm parâmetros e não foram marcados com pontuar:false. */
function itensPontuaveis(registro, metricas, pilar, ids) {
  return registro.indicadores.filter((i) => i.pilar === pilar && (!ids || ids.includes(i.id)) && metricas.indicadores[i.id] && metricas.indicadores[i.id].pontuar !== false);
}

/** Nota de UM indicador no contexto atual. */
export function pontuarIndicador(registro, metricas, id, ctx, { pesosIguais = false } = {}) {
  const cfg = metricas.indicadores[id];
  const ref = cfg.medida ? `${id}.${cfg.medida}` : id;           // por padrão pontua a medida principal
  const valor = valorDe(registro, ref, ctx);
  return { id, valor, nota: normalizar(valor, cfg.normalizacao), peso: pesosIguais ? 1 : cfg.peso };
}

/** Nota de um pilar (A, S ou G) no contexto atual. `ids` restringe aos indicadores do tema aberto. */
export function pontuarPilar(registro, metricas, ctx, pilar, ids = null, opcoes = {}) {
  const itens = itensPontuaveis(registro, metricas, pilar, ids).map((i) => pontuarIndicador(registro, metricas, i.id, ctx, opcoes));
  const foraDaNota = registro.indicadores.filter((i) => i.pilar === pilar && (!ids || ids.includes(i.id)) && metricas.indicadores[i.id]?.pontuar === false)
    .map((i) => ({ id: i.id, motivo: metricas.indicadores[i.id].motivo }));
  return { ...agregarPilar(itens, metricas.faixas), foraDaNota };
}

/** As três notas de pilar + a nota ASG geral. */
export function pontuarASG(registro, metricas, ctx, ids = null, { pesosIguais = false } = {}) {
  const pilares = {};
  for (const p of ["A", "S", "G"]) pilares[p] = pontuarPilar(registro, metricas, ctx, p, ids, { pesosIguais });
  const pesos = pesosIguais ? { A: 1, S: 1, G: 1 } : metricas.pesos_pilares;
  return { ...pilares, geral: agregarASG(pilares, pesos, metricas.faixas) };
}

// ------------------------------------------------------------------ 5) sensibilidade aos pesos
/**
 * Quanto o RANKING das entidades depende dos pesos? Compara a ordem pela nota com os pesos do arquivo
 * contra a ordem com pesos iguais. Se muita gente muda de posição, a conclusão "A é melhor que B" é frágil
 * e a tela avisa. Entidades sem nota ficam de fora.
 * @param entidades [{ nome, nota, notaIguais }]
 */
export function sensibilidadePesos(entidades) {
  const validas = entidades.filter((e) => ehNumero(e.nota) && ehNumero(e.notaIguais));
  const posicoes = (campo) => new Map([...validas].sort((a, b) => b[campo] - a[campo]).map((e, i) => [e.nome, i + 1]));
  const a = posicoes("nota"), b = posicoes("notaIguais");
  const deslocamentos = validas.map((e) => ({ nome: e.nome, de: a.get(e.nome), para: b.get(e.nome), mudanca: Math.abs(a.get(e.nome) - b.get(e.nome)) }));
  const mudaram = deslocamentos.filter((d) => d.mudanca > 0).length;
  const maior = deslocamentos.reduce((m, d) => Math.max(m, d.mudanca), 0);
  return { n: validas.length, mudaram, maiorMudanca: maior, deslocamentos, estavel: maior <= 1 };
}

// ------------------------------------------------------------------ 6) validação do arquivo de parâmetros
/**
 * Confere config/metricas.json contra o registro. Devolve { erros, avisos } em português, com o caminho
 * do que corrigir. Erros impedem a nota; avisos só informam.
 * Regras: todo indicador pontuado precisa de justificativa e fonte (é o que a professora pediu).
 */
export function validarMetricas(metricas, registro, idsDoTema = null) {
  const erros = [], avisos = [];
  const f = metricas.faixas || {};
  if (!(f.atencao >= 0 && f.alinhado <= 100 && f.atencao < f.alinhado)) erros.push("faixas: é preciso 0 ≤ atencao < alinhado ≤ 100");
  if (!(f.cobertura_minima >= 0 && f.cobertura_minima <= 1)) erros.push("faixas.cobertura_minima deve estar entre 0 e 1");
  for (const p of ["A", "S", "G"]) if (!(metricas.pesos_pilares?.[p] > 0)) erros.push(`pesos_pilares.${p} deve ser um número maior que 0`);

  for (const [id, cfg] of Object.entries(metricas.indicadores || {})) {
    const onde = `indicadores.${id}`;
    const ind = registro.porId.get(id);
    if (!ind) { erros.push(`${onde}: indicador não existe no registro`); continue; }
    if (cfg.pontuar === false) { if (!cfg.motivo) erros.push(`${onde}: pontuar:false exige "motivo"`); continue; }
    if (!cfg.justificativa) erros.push(`${onde}: falta "justificativa"`);
    if (!cfg.fonte) erros.push(`${onde}: falta "fonte"`);
    if (!(cfg.peso > 0)) erros.push(`${onde}.peso deve ser maior que 0`);
    const n = cfg.normalizacao;
    if (!n || n.tipo !== "linear" || !ehNumero(n.piso) || !ehNumero(n.teto)) { erros.push(`${onde}.normalizacao: use { "tipo": "linear", "piso": número, "teto": número }`); continue; }
    if (n.piso === n.teto) erros.push(`${onde}: piso e teto não podem ser iguais`);
    const medida = cfg.medida ? ind.medidas.find((m) => m.chave === cfg.medida) : ind.principal;
    if (!medida) { erros.push(`${onde}.medida "${cfg.medida}" não existe`); continue; }
    // coerência com o sentido do registro: "up" pede teto > piso; "down" pede teto < piso
    if (medida.sentido === "up" && !(n.teto > n.piso)) erros.push(`${onde}: o indicador é "maior é melhor", então o teto deve ser maior que o piso`);
    if (medida.sentido === "down" && !(n.teto < n.piso)) erros.push(`${onde}: o indicador é "menor é melhor", então o teto deve ser menor que o piso`);
  }
  for (const id of idsDoTema || []) if (!metricas.indicadores?.[id]) avisos.push(`${id}: sem parâmetros em config/metricas.json; aparece como valor, mas não entra na nota`);
  return { erros, avisos };
}
