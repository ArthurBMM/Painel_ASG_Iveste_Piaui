# -*- coding: utf-8 -*-
"""
REFERÊNCIA INDEPENDENTE em pandas: recalcula todas as medidas do registro para os contextos de
tests/contextos.json e grava tests/referencia.json. O teste em Node compara o motor JS com este arquivo.

Por que ter duas implementações? Se o motor JS e a referência chegam ao mesmo número por caminhos
diferentes (aqui, pandas "na unha"), a chance de os dois estarem errados do MESMO jeito é pequena.
Regerar:  python3 tools/referencia_pandas.py
"""
import json, pathlib
import numpy as np, pandas as pd

RAIZ = pathlib.Path(__file__).resolve().parents[1]
DADOS = RAIZ / "temas/t8-empregos-verdes/dados"
L = lambda n: pd.read_csv(DADOS / f"{n}.csv")
P, EMPR, O, E, C, PR, EN, AM, CO, CF = (L(n) for n in ["projetos", "empresas", "ocupacoes", "emprego_mensal", "capacitacao",
                                                        "programas", "energia_emissoes", "ambiental_mensal", "comunidade", "conformidade"])
P = P.merge(EMPR, on="empresa_id")
E = E.merge(O[["ocupacao_id", "classe"]], on="ocupacao_id"); C = C.merge(O[["ocupacao_id", "classe"]], on="ocupacao_id")
for d in (E, C, EN, AM): d["m"] = d.mes.str[:7]
PR["m"] = PR.data_inicio.str[:7]
MESES = sorted(E.m.unique())

def calcular(f):
    # ---------- contexto ----------
    p = P
    if f.get("setores"): p = p[p.setor.isin(f["setores"])]
    if f.get("municipios"): p = p[p.municipio.isin(f["municipios"])]
    if f.get("empresas"): p = p[p.empresa_id.isin(f["empresas"])]
    if f.get("origens"): p = p[p.origem.isin(f["origens"])]
    ids = set(p.projeto_id)
    de, ate = f.get("periodo", {}).get("de", "0000-00"), f.get("periodo", {}).get("ate", "9999-99")
    meses = [m for m in MESES if de <= m <= ate]; anos = {int(m[:4]) for m in meses}
    classes, generos, faixas = f.get("classes"), f.get("generos"), f.get("faixas")
    recorte = bool(classes or generos or faixas)

    def pessoas(df, ign=()):
        d = df[df.projeto_id.isin(ids) & df.m.isin(meses)]
        if classes and "classe" not in ign: d = d[d.classe.isin(classes)]
        if generos and "genero" not in ign: d = d[d.genero.isin(generos)]
        if faixas and "faixa_etaria" in d and "faixa_etaria" not in ign: d = d[d.faixa_etaria.isin(faixas)]
        return d
    estoque = lambda d: d.groupby("m").empregados_fim_mes.sum().mean() if len(d) else np.nan
    soma = lambda s: s.sum() if len(s) else np.nan
    div = lambda a, b: np.nan if (pd.isna(a) or pd.isna(b) or b == 0) else a / b
    mul = lambda a, b: np.nan if (pd.isna(a) or pd.isna(b)) else a * b

    emp = pessoas(E); est = estoque(emp)
    nm = emp.m.nunique(); fator = 12 / nm if nm else np.nan
    per = lambda d: d[d.projeto_id.isin(ids) & d.m.isin(meses)]
    en, am = per(EN), per(AM)
    co = CO[CO.projeto_id.isin(ids) & CO.ano.isin(anos)]
    cf = CF[CF.projeto_id.isin(ids) & CF.ano.isin(anos)]
    ult = max(anos) if anos else None
    pr = PR[PR.projeto_id.isin(ids) & PR.m.isin(meses)]

    r = {}
    # ---------- EV (ocupacionais: valem com recorte de pessoas) ----------
    den_cls = estoque(pessoas(E, ("classe",)))
    for chave, cls in (("verde", "Verde"), ("alto_impacto", "Alto impacto"), ("neutra", "Neutra")):
        r[f"EV1.{chave}"] = div(estoque(pessoas(E, ("classe",)).query("classe == @cls")), den_cls)
    r["EV1.empregados"] = est
    r["EV2.taxa"] = div(mul(soma(emp.contratacoes), fator), est); r["EV2.contratacoes"] = soma(emp.contratacoes)
    r["EV3.taxa"] = div(mul(soma(emp.desligamentos), fator), est); r["EV3.desligamentos"] = soma(emp.desligamentos)
    eg = pessoas(E, ("genero",))
    r["EV4.mulheres"] = div(estoque(eg[eg.genero == "F"]), estoque(eg))
    cap = pessoas(C)
    r["Q1.horas_por_empregado"] = div(mul(soma(cap.horas_capacitacao), fator), est)
    r["Q1.horas_total"] = soma(cap.horas_capacitacao)
    # Q3: média mensal de (avaliados ÷ empregados)
    a = cap.groupby("m").empregados_avaliados.sum(); b = emp.groupby("m").empregados_fim_mes.sum()
    rz = [a[m] / b[m] for m in b.index if m in a.index and b[m] > 0]
    r["Q3.pct_avaliados"] = float(np.mean(rz)) if rz else np.nan
    if faixas:
        for k in ("Q1.horas_por_empregado", "Q1.horas_total", "Q3.pct_avaliados"): r[k] = np.nan
    # ---------- não ocupacionais ----------
    nao = {}
    nao["Q2.recolocados_verde"] = div(soma(pr.contratados_verde), soma(pr.concluintes))
    nao["Q2.taxa_conclusao"] = div(soma(pr.concluintes), soma(pr.vagas))
    nao["Q2.programas"] = float(pr.programa_id.nunique()); nao["Q2.concluintes"] = soma(pr.concluintes)
    nao["N1.prazo_aviso"] = co[co.ano == ult].prazo_aviso_semanas.mean() if len(co[co.ano == ult]) else np.nan
    ren, nren = soma(en.energia_renovavel_mwh), soma(en.energia_nao_renovavel_mwh)
    tot_en = np.nansum([ren, nren]) if not (pd.isna(ren) and pd.isna(nren)) else np.nan
    nao["ES1.pct_renovavel"] = div(ren, tot_en); nao["ES1.renovavel"] = ren
    nao["ES2.mwh_por_empregado"] = div(mul(tot_en, fator), est)
    nao["ES3.pct_reducao"] = div(soma(en.reducao_consumo_mwh), tot_en)
    e1, e2 = soma(en.emissoes_escopo1_tco2e), soma(en.emissoes_escopo2_tco2e)
    emis = np.nansum([e1, e2]) if not (pd.isna(e1) and pd.isna(e2)) else np.nan
    nao["ES4.tco2e_por_empregado"] = div(mul(emis, fator), est); nao["ES4.total"] = emis
    nao["ES6.reducao_ano"] = mul(soma(en.reducao_emissoes_tco2e), fator)
    pe, npe = soma(am.residuos_perigosos_ton), soma(am.residuos_nao_perigosos_ton)
    ger = np.nansum([pe, npe]) if not (pd.isna(pe) and pd.isna(npe)) else np.nan
    nao["R1.por_empregado"] = div(mul(ger, fator), est); nao["R1.gerados"] = ger
    nao["R2.pct_recuperados"] = div(soma(am.residuos_recuperados_ton), ger)
    nao["A1.agua_por_empregado"] = div(mul(soma(am.consumo_agua_megalitros), fator), est)
    nao["H1.ha_ano"] = mul(soma(am.habitat_restaurado_ha), fator)
    nao["C1.investimento"] = soma(co.investimento_infraestrutura_rs)
    nao["C3.pct_com_programa"] = div(float((co.tem_programa_comunidade == "Sim").sum()), float(len(co))) if len(co) else np.nan
    nao["T1.pct_renovavel"] = div(soma(co.investimento_renovavel_rs), soma(co.investimento_total_rs))
    u = co[co.ano == ult]; base = u[u.tem_plano_encerramento != "Não se aplica"]
    nao["M1.pct_com_plano"] = div(float((base.tem_plano_encerramento == "Sim").sum()), float(len(base))) if len(base) else np.nan
    # CL1 (GRI 2-27): % de projetos com multa no último ano do período; total de multas no período
    cu = cf[cf.ano == ult]
    nao["CL1.pct_com_multa"] = div(float((cu.teve_multa == "Sim").sum()), float(len(cu))) if len(cu) else np.nan
    nao["CL1.multas_total"] = soma(cf.multas_qtd)
    for k, v in nao.items(): r[k] = np.nan if recorte else v     # bloqueio: sem sentido com recorte de pessoas
    return {k: (None if pd.isna(v) else float(v)) for k, v in r.items()}

ctxs = json.load(open(RAIZ / "tests/contextos.json", encoding="utf-8"))
saida = [{"nome": c["nome"], "valores": calcular(c["filtros"])} for c in ctxs]
(RAIZ / "tests/referencia.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(saida), "contextos ×", len(saida[0]["valores"]), "medidas ->", RAIZ / "tests/referencia.json")
