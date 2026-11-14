// =====================================================================================
// empresas.js — "Empresas e projetos": a mesma lente ASG aplicada a cada entidade da carteira
//
// A Investe Piauí atua com empresas parceiras, instituições parceiras e iniciativas próprias.
// Esta página responde: "como cada entidade (e cada projeto dela) está em A, S e G?".
// NÃO há nota nem aprovado/reprovado. Mostramos (1) alguns números-chave e (2) o BALANÇO:
// quantos indicadores de cada pilar melhoraram ou pioraram no ano. Metas (limites do que é
// "obedecer") podem ser adicionadas ao registro quando a Investe Piauí definir critérios.
// =====================================================================================
import { valorDe } from "../../nucleo/registro.js";
import { balancoPilar } from "../../nucleo/registro.js";
import { formatarValor } from "../../nucleo/formato.js";
import { contextoDoBalanco } from "../componentes/balanco.js";
import { esc } from "../util.js";

const PCT = { tipo: "percentual", casas: 1 }, NUM0 = { tipo: "numero", casas: 0 }, NUM1 = { tipo: "numero", casas: 1 };

/** Uma linha (entidade ou projeto) com os números-chave e o balanço A/S/G. */
function linha(registro, ctxLinha, rotulo, sub, setores, nProj, tema, extraClasse = "") {
  const { ctx: cBal } = contextoDoBalanco(ctxLinha);
  const bal = ["A", "S", "G"].map((p) => {
    const ids = tema.indicadores.filter((id) => registro.porId.get(id)?.pilar === p);
    const b = balancoPilar(registro, cBal, p, ids);
    return `<span class="${p}" title="${p}: ${b.melhoraram} melhoraram, ${b.pioraram} pioraram, ${b.semDado} sem dado">${p} ▲${b.melhoraram} ▼${b.pioraram}</span>`;
  }).join("");
  const barra = (v) => `<div class="barra"><i style="width:${v == null ? 0 : Math.min(100, v * 100)}%"></i><span>${esc(formatarValor(v, PCT))}</span></div>`;
  return `<div class="linha ${extraClasse}">
    <div class="nome">${esc(rotulo)}<small>${esc(sub)}</small></div>
    <div>${esc(setores)}</div><div>${nProj}</div>
    <div>${esc(formatarValor(valorDe(registro, "EV1.empregados", ctxLinha), NUM0))}</div>
    ${barra(valorDe(registro, "EV1", ctxLinha))}${barra(valorDe(registro, "ES1", ctxLinha))}
    <div>${esc(formatarValor(valorDe(registro, "ES4", ctxLinha), NUM1))}</div>
    <div>${esc(formatarValor(valorDe(registro, "Q1", ctxLinha), NUM1))}</div>
    <div class="sel-bal">${bal}</div>
  </div>`;
}

export function render({ modelo, registro, ctx, tema }) {
  const { ano } = contextoDoBalanco(ctx);
  const projetos = [...modelo.projetos.values()].filter((p) => ctx.idsProjeto.has(p.projeto_id));

  // resumo da carteira: projetos por setor
  const porSetor = new Map();
  projetos.forEach((p) => porSetor.set(p.setor, (porSetor.get(p.setor) || 0) + 1));
  const resumo = `<div class="resumo"><span class="chip">${projetos.length} projetos</span>${[...porSetor].map(([s, n]) => `<span class="chip">${esc(s)}: ${n}</span>`).join("")}</div>`;

  // agrupa por empresa (a entidade que responde pelo projeto)
  const porEmpresa = new Map();
  projetos.forEach((p) => porEmpresa.set(p.empresa_id, [...(porEmpresa.get(p.empresa_id) || []), p]));
  const entidades = [...porEmpresa].map(([id, ps]) => ({ emp: modelo.empresas.get(id), ps }))
    .sort((a, b) => a.emp.origem.localeCompare(b.emp.origem) || a.emp.nome_empresa.localeCompare(b.emp.nome_empresa));

  const cab = `<div class="linha cabeca"><div>Empresa / instituição</div><div>Setor</div><div>Projetos</div><div>Empregados</div><div>% verde</div><div>% renovável</div><div>tCO2e / empregado</div><div>Horas / empregado</div><div>Balanço ${ano} vs ${ano - 1}</div></div>`;
  const total = linha(registro, ctx, "Carteira (filtros atuais)", `${porEmpresa.size} entidades`, "", projetos.length, tema, "total");
  const corpo = entidades.map(({ emp, ps }) => {
    const cEmp = ctx.derivar({ empresas: [emp.empresa_id] });
    const setores = [...new Set(ps.map((p) => p.setor))].join(", ");
    const sub = ps.map((p) => {
      const cP = ctx.derivar({ projetos: [p.projeto_id] });
      return linha(registro, cP, p.nome_projeto, p.municipio, p.setor, 1, tema, "sub-linha");
    }).join("");
    return `<details><summary>${linha(registro, cEmp, emp.nome_empresa, emp.origem, setores, ps.length, tema)}</summary><div class="subtabela">${sub}</div></details>`;
  }).join("");

  return `<h2 class="titulo-pagina">Empresas e projetos</h2>
    <p class="sub-pagina">A mesma lente ASG aplicada a cada entidade da carteira da Investe Piauí. Clique numa linha para ver os projetos. O balanço conta quantos indicadores de cada pilar melhoraram (▲) ou pioraram (▼) no ano; não é nota nem aprovação.</p>
    ${resumo}
    <div class="tabela-emp">${cab}${total}${corpo}</div>
    <p class="rodape">Use o filtro <b>Origem</b> para ver só as empresas parceiras, as instituições parceiras ou as iniciativas próprias da Investe Piauí.</p>`;
}
