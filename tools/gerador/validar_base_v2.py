# -*- coding: utf-8 -*-
"""Validação da base v2 (FICTÍCIA): a história aparece? as relações esperadas existem?
Uso: python3 validar_base_v2.py   (rodar dentro da pasta com os csv_*.csv)"""
import pandas as pd, numpy as np
pd.set_option("display.width", 200)
def r(n):
    cols = pd.read_csv(f"csv_{n}.csv", nrows=1).columns
    return pd.read_csv(f"csv_{n}.csv", parse_dates=[c for c in cols if c in ("mes", "data_inicio")])
P, O, E, C, PR, EN, AM, CO = [r(n) for n in ["projetos","ocupacoes","emprego_mensal","capacitacao","programas","energia_emissoes","ambiental_mensal","comunidade"]]
E = E.merge(O[["ocupacao_id","classe"]], on="ocupacao_id").merge(P[["projeto_id","setor"]], on="projeto_id"); E["ano"] = E.mes.dt.year
H = E.groupby(["projeto_id","mes"]).empregados_fim_mes.sum().rename("H").reset_index()   # empregados por projeto/mês

print("== 1) % por classe (média anual) =="); tot = E.groupby("mes").empregados_fim_mes.sum()
sh = E.pivot_table(index="mes", columns="classe", values="empregados_fim_mes", aggfunc="sum").div(tot, axis=0)
print((sh.groupby(sh.index.year).mean()*100).round(1))
print("\n== 2) Empregados por setor ==")
print(E.pivot_table(index="mes", columns="setor", values="empregados_fim_mes", aggfunc="sum").loc[["2023-01-01","2023-12-01","2024-12-01","2025-01-01","2025-02-01","2025-12-01","2026-10-01"]])
print("\n== 3) Contratação e rotatividade anual (%) por classe =="); g = E.groupby(["ano","classe"]).agg(s=("desligamentos","sum"), c=("contratacoes","sum"), st=("empregados_fim_mes","sum"))
g["rot"] = (g.s/(g.st/12)*100).round(1); g["contr"] = (g.c/(g.st/12)*100).round(1); print(g[["contr","rot"]].unstack())
gt = E.groupby("ano").agg(s=("desligamentos","sum"), c=("contratacoes","sum"), st=("empregados_fim_mes","sum"))
print("portfólio  contratação %:", (gt.c/(gt.st/12)*100).round(1).tolist(), " rotatividade %:", (gt.s/(gt.st/12)*100).round(1).tolist())
print("\n== 4) Q1 horas/empregado/ano por classe ==")
C2 = C.merge(O[["ocupacao_id","classe"]], on="ocupacao_id"); C2["ano"] = C2.mes.dt.year
Estk = E.groupby(["ano","classe"]).empregados_fim_mes.sum()/12
print((C2.groupby(["ano","classe"]).horas_capacitacao.sum()/Estk).round(1).unstack())
print("Q3 % avaliados (portfólio) por ano:", (C2.groupby("ano").empregados_avaliados.sum()/(E.groupby("ano").empregados_fim_mes.sum())*100).round(1).tolist())
E2 = E.sort_values(["projeto_id","ocupacao_id","genero","faixa_etaria","mes"]); E2["ant"] = E2.groupby(["projeto_id","ocupacao_id","genero","faixa_etaria"]).empregados_fim_mes.shift(1)
ok = E2.dropna(subset=["ant"]); dif = (ok.ant + ok.contratacoes - ok.desligamentos - ok.empregados_fim_mes).abs()
print("\n== 5) identidade do estoque: células com erro =", int((dif>0).sum()), "de", len(ok))
print("\n== 6) Energia (ES1, ES2, ES4) ==")
EN["ano"] = EN.mes.dt.year; EN = EN.merge(H, on=["projeto_id","mes"]).merge(P[["projeto_id","setor"]], on="projeto_id")
ren = EN.groupby("ano").energia_renovavel_mwh.sum(); nre = EN.groupby("ano").energia_nao_renovavel_mwh.sum()
print("% renovável:", (ren/(ren+nre)*100).round(1).tolist())
EN["tot_mwh"] = EN.energia_renovavel_mwh + EN.energia_nao_renovavel_mwh
print("MWh/empregado/ano:", (EN.groupby("ano").tot_mwh.sum()/(E.groupby("ano").empregados_fim_mes.sum()/12)).round(1).tolist())
print("tCO2e/empregado/ano:", ((EN.groupby("ano").emissoes_escopo1_tco2e.sum()+EN.groupby("ano").emissoes_escopo2_tco2e.sum())/(E.groupby("ano").empregados_fim_mes.sum()/12)).round(1).tolist())
print("\n== 7) Resíduos, água, habitat (R1, R2, A1, H1) ==")
AM["ano"] = AM.mes.dt.year; AM = AM.merge(H, on=["projeto_id","mes"]).merge(P[["projeto_id","setor"]], on="projeto_id")
AM["gerado"] = AM.residuos_perigosos_ton + AM.residuos_nao_perigosos_ton
chk = (AM.residuos_recuperados_ton + AM.residuos_disposicao_final_ton - AM.gerado).abs().max()
print("recuperado + disposição = gerado? maior diferença (t):", round(chk, 3))
emp_ano = E.groupby("ano").empregados_fim_mes.sum()/12
a = AM.groupby("ano").agg(g=("gerado","sum"), p=("residuos_perigosos_ton","sum"), rec=("residuos_recuperados_ton","sum"), agua=("consumo_agua_megalitros","sum"), hab=("habitat_restaurado_ha","sum"))
print("R1 t/empregado/ano:", (a.g/emp_ano).round(1).tolist(), "| % perigoso:", (a.p/a.g*100).round(1).tolist())
print("R2 % recuperado:", (a.rec/a.g*100).round(1).tolist())
print("A1 ML/empregado/ano:", (a.agua/emp_ano).round(3).tolist(), "| H1 ha restaurados/ano:", a.hab.round(0).tolist())
s_ = AM.groupby("setor").agg(g=("gerado","sum"), rec=("residuos_recuperados_ton","sum"), ag=("consumo_agua_megalitros","sum"), H=("H","sum"))
print("por setor  R1 t/emp/mês:", (s_.g/s_.H).round(2).to_dict()); print("por setor  R2 %:", (s_.rec/s_.g*100).round(0).to_dict())
print("\n== 8) Comunidade: C3, N1, T1, M1 ==")
CO = CO.merge(P[["projeto_id","setor"]], on="projeto_id")
print("C3 % projetos com programa:", (CO.assign(v=CO.tem_programa_comunidade=="Sim").groupby("ano").v.mean()*100).round(0).tolist())
print("N1 prazo de aviso médio (semanas):", CO.groupby("ano").prazo_aviso_semanas.mean().round(1).tolist(), "| eólica:", CO[CO.setor=="Eólica"].groupby("ano").prazo_aviso_semanas.mean().round(1).tolist())
t1 = CO.groupby("ano").agg(t=("investimento_total_rs","sum"), r=("investimento_renovavel_rs","sum")); print("T1 % investimento renovável:", (t1.r/t1.t*100).round(1).tolist())
m = CO[CO.setor=="Mineração"]; print("M1 % minas com plano:", (m.assign(v=m.tem_plano_encerramento=="Sim").groupby("ano").v.mean()*100).round(0).tolist())
print("\n== 9) Programas e ponte mineração -> verde ==")
PR["ano"] = PR.data_inicio.dt.year; x = PR.groupby("tipo").agg(n=("programa_id","size"), vagas=("vagas","sum"), concl=("concluintes","sum"), verde=("contratados_verde","sum"))
x["% concl"] = (x.concl/x.vagas*100).round(0); x["% verde dos concl"] = (x.verde/x.concl*100).round(0); print(x)
rq = PR[PR.tipo.isin(["Requalificação","Transição de carreira"])]; print("Requalif.+Transição: concluintes", int(rq.concluintes.sum()), "-> contratados verde", int(rq.contratados_verde.sum()), f"({rq.contratados_verde.sum()/rq.concluintes.sum()*100:.0f}%)")
print("Total concluintes:", int(PR.concluintes.sum()), "| contratados verde:", int(PR.contratados_verde.sum()))
sai = E[E.classe=="Alto impacto"].groupby("ano").desligamentos.sum(); ent = E[E.classe=="Verde"].groupby("ano").contratacoes.sum()
print("desligamentos alto impacto por ano:", sai.tolist(), "| contratações verde por ano:", ent.tolist())
print("\n== 10) Correlações entre projetos ==")
ph = C.groupby("projeto_id").horas_capacitacao.sum()/E.groupby("projeto_id").empregados_fim_mes.sum(); pr = E.groupby("projeto_id").desligamentos.sum()/E.groupby("projeto_id").empregados_fim_mes.sum()
print("horas/empregado x rotatividade:", round(np.corrcoef(ph, pr)[0,1], 2))
pj = EN.groupby("projeto_id"); rr = pj.energia_renovavel_mwh.sum()/pj.tot_mwh.sum(); ee = (pj.emissoes_escopo1_tco2e.sum()+pj.emissoes_escopo2_tco2e.sum())/pj.H.sum()
print("% renovável x tCO2e/empregado:", round(np.corrcoef(rr, ee)[0,1], 2))
print("linhas de emprego_mensal com <=2 pessoas:", round((E.empregados_fim_mes<=2).mean()*100,1), "%")
