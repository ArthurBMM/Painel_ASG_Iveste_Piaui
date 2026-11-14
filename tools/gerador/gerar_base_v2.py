# -*- coding: utf-8 -*-
"""
T8 - Empregos verdes e qualificação para a transição energética
Gerador da BASE FICTÍCIA v2 (8 tabelas) -> base_asg_t8.xlsx

O QUE MUDOU NA v2 (história reformulada pelo grupo):
  - A mineração (alto impacto) ENCOLHE ao longo do tempo e os empregos verdes CRESCEM:
    o emprego verde que "entra" tem de vir de algum lugar (conservação de empregos).
  - Parte de quem sai da mineração passa pelos programas de requalificação e é recontratada em
    função verde (coluna nova programas.contratados_verde). A transição é INCOMPLETA: a eólica ainda
    demite em fev/2025 e só uma parte dos ex-mineiros é recolocada.
  - Tabela remuneracao saiu (EV5/EV6 foram removidos). Entrou ambiental_mensal (R1, R2, A1, H1).
  - comunidade ganhou colunas para N1, T1 e M1.

IDEIA GERAL (leia isto primeiro):
  1) Definimos as tabelas pequenas (projetos e ocupações).
  2) Para cada projeto, criamos uma "trajetória" de quantos empregados existem mês a mês.
     É AQUI que mora a história do trabalho (eólica cai em 2025, mineração cresce etc.).
  3) Dividimos essa trajetória por ocupação, gênero e faixa etária (tabela emprego_mensal).
  4) As demais tabelas (salário, capacitação, energia...) são calculadas a partir
     dos empregados, para os números serem COERENTES entre si.
  5) Tudo usa uma semente fixa: rodar de novo gera exatamente os mesmos dados.

TODOS OS DADOS SÃO FICTÍCIOS (inspirados em tendências reais do setor).
"""
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)          # semente fixa = resultado reproduzível
MESES = pd.date_range("2023-01-01", "2026-10-01", freq="MS")   # 46 meses
T = len(MESES)
t = np.arange(T)                          # 0 = jan/2023 ... 45 = out/2026
T_QUEDA_EOLICA = 25                       # fev/2025: onda de desligamentos na eólica


def sigmoide(x):
    """Curva em 'S': sobe devagar, acelera, e estabiliza (modela crescimento que satura)."""
    return 1 / (1 + np.exp(-x))


# ---------------------------------------------------------------- TABELA 1: projetos
projetos = pd.DataFrame([
    # id,   nome,                              setor,                 município,                  região,      MW,   início
    ("P01", "Parque Eólico Serra Azul",        "Eólica",              "Marcolândia",              "Semiárido", 180, "2022-06-01"),
    ("P02", "Complexo Ventos do Sertão",       "Eólica",              "Simões",                   "Semiárido", 250, "2022-03-01"),
    ("P03", "Parque Eólico Costa Branca",      "Eólica",              "Parnaíba",                 "Litoral",   120, "2022-09-01"),
    ("P04", "Usina Solar Sol do Sertão",       "Solar",               "São João do Piauí",        "Semiárido", 300, "2022-11-01"),
    ("P05", "Usina Solar Caldeirão",           "Solar",               "Caldeirão Grande do Piauí", "Semiárido", 200, "2023-01-01"),
    ("P06", "Usina Solar Picos",               "Solar",               "Picos",                    "Centro",    150, "2023-03-01"),
    ("P07", "PCH Rio Parnaíba",                "Hidrelétrica",        "Floriano",                 "Centro",     60, "2021-05-01"),
    ("P08", "Obras Verdes Teresina",           "Obras sustentáveis",  "Teresina",                 "Centro",   None, "2023-01-01"),
    ("P09", "Restauração e Obras Vale do Sul", "Obras sustentáveis",  "Corrente",                 "Sul",      None, "2024-06-01"),
    ("P10", "Mineradora Pedra Norte",          "Mineração",           "Pedro II",                 "Norte",    None, "2020-01-01"),
    ("P11", "Mineração Serra Cinza",           "Mineração",           "Paulistana",               "Semiárido", None, "2021-08-01"),
    ("P12", "Lavra Vale do Sul",               "Mineração",           "Bom Jesus",                "Sul",      None, "2022-02-01"),
], columns=["projeto_id", "nome_projeto", "setor", "municipio", "regiao", "mw_instalado", "data_inicio"])
projetos["data_inicio"] = pd.to_datetime(projetos["data_inicio"])
SETOR = dict(zip(projetos.projeto_id, projetos.setor))

# ---------------------------------------------------------------- TABELA 2: ocupacoes
# A CLASSE fica presa à ocupação. Por isso "Engenheiro civil" aparece 2 vezes (verde e neutra).
ocupacoes = pd.DataFrame([
    ("O01", "Engenheiro eólico",                              "Engenharia",     "Verde",        "Projeta e opera parques de energia renovável"),
    ("O02", "Engenheiro de usina solar ou hidrelétrica",      "Engenharia",     "Verde",        "Projeta e opera geração renovável"),
    ("O03", "Engenheiro civil (obras sustentáveis)",          "Engenharia",     "Verde",        "Obras de baixo impacto ambiental"),
    ("O04", "Arquiteto (projetos sustentáveis)",              "Engenharia",     "Verde",        "Projetos de arquitetura de baixo impacto"),
    ("O05", "Técnico de manutenção de aerogerador",           "Técnico",        "Verde",        "Mantém turbinas de geração eólica"),
    ("O06", "Instalador de painéis solares",                  "Operacional",    "Verde",        "Instala sistemas de geração solar"),
    ("O07", "Operador de usina de energia renovável",         "Operacional",    "Verde",        "Opera usinas solares, eólicas e hidrelétricas"),
    ("O08", "Eletricista de energia renovável",               "Operacional",    "Verde",        "Instalação e manutenção elétrica em usinas renováveis"),
    ("O09", "Técnico de recuperação de áreas degradadas",     "Técnico",        "Verde",        "Restaura ecossistemas e áreas afetadas"),
    ("O10", "Assistente administrativo",                      "Administrativo", "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O11", "Analista financeiro ou contábil",                "Administrativo", "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O12", "Motorista",                                      "Operacional",    "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O13", "Segurança patrimonial",                          "Operacional",    "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O14", "Gerente de projeto",                             "Gestão",         "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O15", "Engenheiro civil (obras gerais)",                "Engenharia",     "Neutra",       "Obras sem critério ambiental específico"),
    ("O16", "Operador de mina ou lavra",                      "Operacional",    "Alto impacto", "Extração mineral: emissões e degradação do solo"),
    ("O17", "Operador de máquinas pesadas na mineração",      "Operacional",    "Alto impacto", "Frota a diesel: alta emissão de GEE"),
    ("O18", "Operador de britagem e beneficiamento",          "Operacional",    "Alto impacto", "Processamento mineral: poeira, energia e resíduos"),
], columns=["ocupacao_id", "ocupacao", "categoria_funcional", "classe", "justificativa_classe"])
CLASSE = dict(zip(ocupacoes.ocupacao_id, ocupacoes.classe))
CATEG = dict(zip(ocupacoes.ocupacao_id, ocupacoes.categoria_funcional))

# Quem trabalha em cada tipo de projeto (pesos; são normalizados depois)
COMPOSICAO = {
    "Eólica":             {"O01": .04, "O05": .30, "O07": .14, "O08": .12, "O09": .03, "O10": .09, "O11": .04, "O12": .06, "O13": .10, "O14": .04},
    "Solar":              {"O02": .04, "O06": .34, "O07": .16, "O08": .12, "O09": .03, "O10": .08, "O11": .04, "O12": .06, "O13": .09, "O14": .04},
    "Hidrelétrica":       {"O02": .08, "O07": .24, "O08": .14, "O09": .08, "O10": .10, "O11": .05, "O12": .07, "O13": .12, "O14": .05, "O15": .07},
    "Obras sustentáveis": {"O03": .12, "O04": .08, "O06": .20, "O08": .10, "O09": .10, "O10": .08, "O11": .04, "O12": .08, "O13": .08, "O14": .06, "O15": .06},
    "Mineração":          {"O16": .30, "O17": .24, "O18": .16, "O15": .03, "O09": .02, "O10": .06, "O11": .03, "O12": .06, "O13": .06, "O14": .04},
}
# Participação feminina por ocupação (realista: poucas mulheres em campo, mais no administrativo)
FEM = {"O01": .28, "O02": .28, "O03": .30, "O04": .55, "O05": .08, "O06": .12, "O07": .15, "O08": .06, "O09": .35,
       "O10": .65, "O11": .55, "O12": .06, "O13": .10, "O14": .30, "O15": .25, "O16": .05, "O17": .04, "O18": .08}
FAIXAS = ["Abaixo de 30", "De 30 a 50", "Acima de 50"]
PERFIL_IDADE = {"Verde": [.35, .50, .15], "Neutra": [.25, .50, .25], "Alto impacto": [.25, .48, .27]}

# ---------------------------------------------------------------- A HISTÓRIA: trajetória de empregados
PICO = {"P01": 220, "P02": 300, "P03": 150, "P04": 260, "P05": 200, "P06": 150, "P07": 90,
        "P08": 120, "P09": 80, "P10": 450, "P11": 480, "P12": 330}
QUEDA_EOLICA = {"P01": .25, "P02": .28, "P03": .12}      # tamanho do corte em fev/2025


def trajetoria(pid):
    """Número de empregados do projeto mês a mês (curva de 46 pontos)."""
    s = SETOR[pid]
    if s == "Eólica":        # sobe em 2023, estável em 2024, CAI em fev/2025, recuperação fraca em 2026
        h = 0.62 + 0.38 * sigmoide((t - 8) / 3)
        recup = 0.55 * np.clip((t - T_QUEDA_EOLICA - 2) / 18, 0, 1)   # recupera ~55% do corte até out/2026
        h = h * (1 - QUEDA_EOLICA[pid] * (t >= T_QUEDA_EOLICA) * (1 - recup))
    elif s == "Solar":       # cresce até 2024, desacelera em 2025, volta a crescer devagar
        h = 0.60 + 0.40 * sigmoide((t - 14) / 5)
        h = h * (1 - 0.03 * (t >= 30)) + 0.0075 * np.clip(t - 30, 0, None)   # volta a crescer com a recolocação
    elif s == "Hidrelétrica":
        h = 0.97 + 0.0008 * t
    elif s == "Obras sustentáveis":
        centro = 8 if pid == "P08" else 22
        h = 0.35 + 0.65 * sigmoide((t - centro) / 4) + 0.004 * t
    else:                    # Mineração (v2): ENCOLHE devagar (saídas naturais + cortes), com sazonalidade
        h = (0.84 - 0.30 * (t / 45) ** 1.3) * (1 + 0.03 * np.sin(2 * np.pi * ((t % 12) - 4) / 12))
    # (sem ruído aqui: ruído em células pequenas geraria rotatividade falsa)
    return PICO[pid] * h


# Fator de "investimento em qualificação" por projeto: projetos que qualificam mais têm MENOS rotatividade
Q = {pid: (rng.uniform(.55, .80) if SETOR[pid] == "Mineração" else rng.uniform(.85, 1.30)) for pid in PICO}
TAXA_SAIDA = {"Verde": .010, "Neutra": .012, "Alto impacto": .020}   # saídas/mês (≈12%, 14%, 26% ao ano)

# ---------------------------------------------------------------- TABELA 3: emprego_mensal
linhas = []
for pid in projetos.projeto_id:
    H = trajetoria(pid)
    comp = COMPOSICAO[SETOR[pid]]
    soma = sum(comp.values())
    for oid, peso in comp.items():
        cl = CLASSE[oid]
        for g, pf in (("F", FEM[oid]), ("M", 1 - FEM[oid])):
            for faixa, pi in zip(FAIXAS, PERFIL_IDADE[cl]):
                alvo = H * (peso / soma) * pf * pi                      # quantos "deveriam" existir
                estoque = np.maximum(0, np.round(alvo)).astype(int)
                ant = np.concatenate([[estoque[0]], estoque[:-1]])
                taxa = TAXA_SAIDA[cl] * (1.3 - 0.4 * Q[pid])            # mais qualificação -> menos saídas
                saidas_base = np.minimum(rng.poisson(taxa * ant), ant)
                saidas = saidas_base + np.maximum(0, ant - estoque)     # queda de estoque = desligamentos
                contrat = estoque - ant + saidas                        # fecha a conta: estoque = anterior + entradas - saídas
                df = pd.DataFrame({"projeto_id": pid, "ocupacao_id": oid, "mes": MESES, "genero": g,
                                   "faixa_etaria": faixa, "empregados_fim_mes": estoque,
                                   "contratacoes": contrat, "desligamentos": saidas})
                linhas.append(df)
emprego = pd.concat(linhas, ignore_index=True)
emprego = emprego[(emprego.empregados_fim_mes > 0) | (emprego.contratacoes > 0) | (emprego.desligamentos > 0)].reset_index(drop=True)
assert (emprego[["empregados_fim_mes", "contratacoes", "desligamentos"]] >= 0).all().all()

# Agregado por projeto x ocupação x mês x gênero (somando as faixas etárias): base das tabelas 4 e 5
ag = (emprego.groupby(["projeto_id", "ocupacao_id", "mes", "genero"], as_index=False)
      [["empregados_fim_mes", "contratacoes", "desligamentos"]].sum())
ag = ag[ag.empregados_fim_mes > 0].sort_values(["projeto_id", "ocupacao_id", "genero", "mes"]).reset_index(drop=True)
ag["classe"] = ag.ocupacao_id.map(CLASSE)
ag["categoria"] = ag.ocupacao_id.map(CATEG)
ag["ti"] = ((ag.mes.dt.year - 2023) * 12 + ag.mes.dt.month - 1).astype(int)    # índice de tempo 0..45
ag["ano"] = ag.mes.dt.year
ag["contrat_mes_ant"] = ag.groupby(["projeto_id", "ocupacao_id", "genero"]).contratacoes.shift(1).fillna(0)

# ---------------------------------------------------------------- TABELA 4: capacitacao
CAT_FATOR = {"Engenharia": 1.2, "Técnico": 1.1, "Gestão": 1.0, "Administrativo": .9, "Operacional": .9}
H_POR_CONTRAT = {"Verde": 10, "Neutra": 5, "Alto impacto": 3}              # horas de integração por contratação


def horas_ano(classe, ti):
    """Horas de capacitação por empregado por ANO. Verde sobe até 2024 e estabiliza; alto impacto cai."""
    if classe == "Verde":
        return 15 + 10 * sigmoide((ti - 12) / 4) - 1.5 * (ti >= 30)
    if classe == "Neutra":
        return 14.0 + 0 * ti
    return 11 - 3 * (ti / 45)


def prob_avaliacao(classe, ti):
    if classe == "Verde":
        return .72 + .08 * (ti / 45)
    if classe == "Neutra":
        return .62 + 0 * ti
    return .38 - .05 * (ti / 45)


cap = ag.copy()
h_ano = np.where(cap.classe == "Verde", horas_ano("Verde", cap.ti),
                 np.where(cap.classe == "Neutra", horas_ano("Neutra", cap.ti), horas_ano("Alto impacto", cap.ti)))
base_h = cap.empregados_fim_mes * h_ano / 12 * cap.projeto_id.map(Q) * cap.categoria.map(CAT_FATOR)
extra = cap.contrat_mes_ant * cap.classe.map(H_POR_CONTRAT)               # defasagem: integração aparece no mês seguinte
cap["horas_capacitacao"] = np.round((base_h + extra) * rng.lognormal(0, .15, len(cap))).astype(int)
p_av = np.where(cap.classe == "Verde", prob_avaliacao("Verde", cap.ti),
                np.where(cap.classe == "Neutra", prob_avaliacao("Neutra", cap.ti), prob_avaliacao("Alto impacto", cap.ti)))
cap["empregados_avaliados"] = rng.binomial(cap.empregados_fim_mes, p_av)
capacitacao = cap[["projeto_id", "ocupacao_id", "mes", "genero", "horas_capacitacao", "empregados_avaliados"]]

# ---------------------------------------------------------------- TABELA 5: programas
modelos = [  # nome, tipo, público-alvo, setores onde faz sentido
    ("Operador de usina solar", "Curso interno", "Novos contratados", ["Solar"]),
    ("Técnico de manutenção de aerogerador", "Curso interno", "Técnicos", ["Eólica"]),
    ("Segurança em altura (NR-35)", "Curso interno", "Todos os operacionais", ["Eólica", "Solar", "Obras sustentáveis"]),
    ("Requalificação para energia renovável", "Requalificação", "Ex-operadores de mina", ["Solar", "Eólica", "Mineração"]),
    ("Apoio a graduação em engenharia", "Apoio a curso externo", "Técnicos e administrativos", ["Eólica", "Solar", "Hidrelétrica"]),
    ("Transição de carreira (desligados da eólica)", "Transição de carreira", "Desligados em 2025", ["Eólica"]),
    ("Recuperação de áreas degradadas", "Curso interno", "Operacionais de mineração", ["Mineração", "Obras sustentáveis"]),
    ("Obras de baixo impacto", "Curso interno", "Engenharia e arquitetura", ["Obras sustentáveis"]),
]
prog = []
n = 0
for pid in projetos.projeto_id:
    for nome, tipo, pub, setores in modelos:
        if SETOR[pid] in setores and rng.random() < .6:
            n += 1
            if tipo == "Transição de carreira":
                inicio = pd.Timestamp("2025-05-01") + pd.DateOffset(months=int(rng.integers(0, 6)))
            else:
                ano = rng.choice([2023, 2024, 2024, 2025, 2026], p=[.2, .3, .15, .15, .2])   # menos programas em 2025
                mes_ini = int(rng.integers(1, 7 if ano == 2026 else 13))
                inicio = pd.Timestamp(year=int(ano), month=mes_ini, day=1)
            vagas = int(rng.integers(20, 61))
            prog.append((f"PR{n:02d}", pid, nome, tipo, pub, inicio, vagas, int(round(vagas * rng.uniform(.70, .95)))))
# v2: cada mina oferece 3 coortes de requalificação (2024, 2025, 2026): é a "ponte" mineração -> emprego verde
for pid in projetos.projeto_id[projetos.setor == "Mineração"]:
    for ano, mes_ini in ((2024, 3), (2025, 6), (2026, 2)):
        n += 1
        vagas = int(rng.integers(35, 80))
        prog.append((f"PR{n:02d}", pid, "Requalificação para energia renovável", "Requalificação",
                     "Ex-operadores de mina", pd.Timestamp(year=ano, month=mes_ini, day=1), vagas,
                     int(round(vagas * rng.uniform(.70, .92)))))
programas = pd.DataFrame(prog, columns=["programa_id", "projeto_id", "nome_programa", "tipo", "publico_alvo",
                                        "data_inicio", "vagas", "concluintes"])
# v2: quantos concluintes foram contratados/recolocados em função VERDE (só faz sentido nos programas de mudança de carreira).
# Taxa < 100% de propósito: a transição é incompleta (nem todo mundo é recolocado).
TAXA_VERDE = {"Requalificação": (.30, .48), "Transição de carreira": (.40, .55), "Curso interno": (0, 0),
              "Apoio a curso externo": (0, 0)}
def _tv(row):
    lo, hi = TAXA_VERDE.get(row.tipo, (0, 0))
    if row.nome_programa == "Recuperação de áreas degradadas":
        lo, hi = .25, .40
    return int(round(row.concluintes * rng.uniform(lo, hi))) if hi > 0 else 0
programas["contratados_verde"] = programas.apply(_tv, axis=1)

# ---------------------------------------------------------------- TABELA 6: energia_emissoes
emp_proj = emprego.groupby(["projeto_id", "mes"], as_index=False).empregados_fim_mes.sum().rename(columns={"empregados_fim_mes": "H"})
MWH_EMP = {"Eólica": 3.5, "Solar": 3.0, "Hidrelétrica": 4.0, "Obras sustentáveis": 5.0, "Mineração": 8.0}   # MWh por empregado/mês
S0 = {"Eólica": .80, "Solar": .85, "Hidrelétrica": .88, "Obras sustentáveis": .55, "Mineração": .08}         # % renovável inicial
GANHO = {"Eólica": .08, "Solar": .08, "Hidrelétrica": .06, "Obras sustentáveis": .15, "Mineração": .10}
E1_EMP = {"Eólica": .06, "Solar": .05, "Hidrelétrica": .05, "Obras sustentáveis": .35, "Mineração": 2.2}      # tCO2e/empregado/mês (escopo 1)
FATOR_REDE = .06                                                                                              # tCO2e por MWh da rede
en = emp_proj.copy()
en["setor"] = en.projeto_id.map(SETOR)
en["ti"] = ((en.mes.dt.year - 2023) * 12 + en.mes.dt.month - 1).astype(int)
cons = en.H * en.setor.map(MWH_EMP) * rng.normal(1, .04, len(en))
# % renovável por setor: sobe até ~2024, faz PLATÔ em 2025 e retoma devagar em 2026 (v2).
# (No portfólio o % renovável sobe mais, porque a mineração -- quase 100% fóssil -- pesa menos a cada ano.)
retomada = 0.025 * np.clip((en.ti - 30) / 15, 0, 1) * (en.setor != "Mineração")
s = en.setor.map(S0) + en.setor.map(GANHO) * sigmoide((en.ti - 8) / 4) + retomada + rng.normal(0, .008, len(en))
s = np.clip(s, 0, .98)
en["energia_renovavel_mwh"] = (cons * s).round(1)
en["energia_nao_renovavel_mwh"] = (cons * (1 - s)).round(1)
fator_red = np.where(en.ti.between(12, 23), 1.3, np.where(en.ti >= 24, .8, 1.0))
en["reducao_consumo_mwh"] = (cons * rng.uniform(.004, .015, len(en)) * fator_red).round(1)
en["emissoes_escopo1_tco2e"] = (en.H * en.setor.map(E1_EMP) * rng.normal(1, .06, len(en))).round(1)
en["emissoes_escopo2_tco2e"] = (en.energia_nao_renovavel_mwh * FATOR_REDE * rng.normal(1, .05, len(en))).round(1)
tot_em = en.emissoes_escopo1_tco2e + en.emissoes_escopo2_tco2e
en["reducao_emissoes_tco2e"] = (tot_em * np.where(en.setor == "Mineração", rng.uniform(.003, .012, len(en)),
                                                  rng.uniform(.01, .04, len(en)))).round(1)
energia_emissoes = en[["projeto_id", "mes", "energia_renovavel_mwh", "energia_nao_renovavel_mwh", "reducao_consumo_mwh",
                       "emissoes_escopo1_tco2e", "emissoes_escopo2_tco2e", "reducao_emissoes_tco2e"]]

# ---------------------------------------------------------------- TABELA 7: ambiental_mensal (NOVA na v2)
# Alimenta R1 (resíduos, GRI 306-3), R2 (recuperados, 306-4), A1 (água, 303-5) e H1 (habitats, 304-3).
# Usa um gerador aleatório SEPARADO (semente 7): mexer aqui não altera as outras tabelas.
rng2 = np.random.default_rng(7)
RES_EMP = {"Eólica": .10, "Solar": .12, "Hidrelétrica": .15, "Obras sustentáveis": .60, "Mineração": 1.8}     # t de resíduo por empregado/mês
FRAC_PERIG = {"Eólica": .10, "Solar": .06, "Hidrelétrica": .08, "Obras sustentáveis": .08, "Mineração": .22}   # fração perigosa
REC0 = {"Eólica": .45, "Solar": .50, "Hidrelétrica": .40, "Obras sustentáveis": .55, "Mineração": .15}          # fração recuperada (início)
REC_GANHO = {"Eólica": .12, "Solar": .12, "Hidrelétrica": .10, "Obras sustentáveis": .12, "Mineração": .04}     # melhora até o fim
AGUA_EMP = {"Eólica": .004, "Solar": .010, "Hidrelétrica": .003, "Obras sustentáveis": .025, "Mineração": .12}  # ML por empregado/mês
HAB_MES = {"Eólica": .8, "Solar": .6, "Hidrelétrica": 1.0, "Obras sustentáveis": 1.5, "Mineração": .6}          # ha restaurados/mês (média)
am = emp_proj.copy()
am["setor"] = am.projeto_id.map(SETOR)
am["ti"] = ((am.mes.dt.year - 2023) * 12 + am.mes.dt.month - 1).astype(int)
tot_res = am.H * am.setor.map(RES_EMP) * (1 - 0.10 * am.ti / 45) * rng2.lognormal(0, .06, len(am))   # leve melhora de eficiência
perig = tot_res * am.setor.map(FRAC_PERIG) * rng2.normal(1, .05, len(am))
nperig = tot_res - perig
rec_frac = np.clip(am.setor.map(REC0) + am.setor.map(REC_GANHO) * sigmoide((am.ti - 14) / 8) + rng2.normal(0, .015, len(am)), 0, .9)
recup = tot_res * rec_frac                                       # reuso/reciclagem (desviado de disposição final)
am["residuos_perigosos_ton"] = perig.round(2)
am["residuos_nao_perigosos_ton"] = nperig.round(2)
am["residuos_recuperados_ton"] = recup.round(2)
am["residuos_disposicao_final_ton"] = (tot_res - recup).round(2)   # fecha a conta: recuperado + disposição = gerado
am["consumo_agua_megalitros"] = (am.H * am.setor.map(AGUA_EMP) * (1 - 0.12 * am.ti / 45) * rng2.lognormal(0, .05, len(am))).round(4)
# habitat restaurado: cresce com o tempo; na mineração só ganha força depois dos planos de reabilitação (2025+)
fator_hab = np.where(am.setor == "Mineração", .5 + 1.5 * np.clip((am.ti - 24) / 21, 0, 1), 1 + .5 * am.ti / 45)
am["habitat_restaurado_ha"] = am.setor.map(HAB_MES) * fator_hab * rng2.gamma(4, .25, len(am))
am["habitat_restaurado_ha"] = am["habitat_restaurado_ha"].round(2)
ambiental_mensal = am[["projeto_id", "mes", "residuos_perigosos_ton", "residuos_nao_perigosos_ton", "residuos_recuperados_ton",
                       "residuos_disposicao_final_ton", "consumo_agua_megalitros", "habitat_restaurado_ha"]]

# ---------------------------------------------------------------- TABELA 8: comunidade
TIPOS = ["Estrada de acesso", "Escola técnica", "Saneamento", "Energia comunitária", "Posto de saúde"]
com = []
rng3 = np.random.default_rng(11)          # gerador separado para as colunas novas (N1, T1, M1)
MW = dict(zip(projetos.projeto_id, projetos.mw_instalado))
PLANO_DESDE = {"P10": 2025, "P11": 2024}  # M1: P12 nunca aprova o plano -> 0%, 33%, 67%, 67% das unidades (incompleto)
for pid in projetos.projeto_id:
    mineracao = SETOR[pid] == "Mineração"
    base_inv = rng.uniform(.25e6, .7e6) if mineracao else rng.uniform(.9e6, 2.6e6)
    programa_fixo = (not mineracao) and rng.random() < .85
    for ano in (2023, 2024, 2025, 2026):
        inv = base_inv * (1.0, 1.1, .85, .9)[ano - 2023] * rng.uniform(.9, 1.1)
        if mineracao:
            tem = (pid == "P11" and ano >= 2025)
        else:
            tem = programa_fixo or ano >= 2024
        # --- N1: prazo mínimo de aviso (semanas) antes de mudanças operacionais (GRI 402-1)
        if SETOR[pid] == "Mineração":
            aviso = {2023: 2, 2024: 3, 2025: 4, 2026: 6}[ano]                      # melhora com a pressão da transição
        elif SETOR[pid] == "Eólica":
            aviso = {2023: 6, 2024: 6, 2025: 2, 2026: 5}[ano]                      # 2025: demissões com pouco aviso; depois corrige
        else:
            aviso = 4 + (ano >= 2025)
        aviso = int(aviso)
        # --- T1: investimento total x parcela em energia renovável (GRI 201-2, recomendação setorial)
        if SETOR[pid] == "Mineração":
            inv_tot = rng3.uniform(30e6, 70e6) * (1.0, 1.0, .9, .85)[ano - 2023]
            share_ren = {2023: .04, 2024: .08, 2025: .14, 2026: .20}[ano]          # minas começam a investir em renovável
        elif SETOR[pid] == "Obras sustentáveis":
            inv_tot = rng3.uniform(10e6, 20e6) * (1.0, 1.1, 1.1, 1.2)[ano - 2023]
            share_ren = .55
        elif SETOR[pid] == "Hidrelétrica":
            inv_tot = rng3.uniform(6e6, 10e6)
            share_ren = .95
        else:                                                                      # eólica e solar: capex proporcional ao MW
            inv_tot = MW[pid] * 0.12e6 * rng3.uniform(.9, 1.1)
            inv_tot *= (.70 if (SETOR[pid] == "Eólica" and ano == 2025) else 1.0)  # eólica investe menos em 2025
            share_ren = .94
        inv_ren = inv_tot * share_ren * rng3.uniform(.97, 1.0)
        # --- M1: plano de encerramento e reabilitação (GRI 14, tema 14.8) -- só se aplica à mineração
        if SETOR[pid] == "Mineração":
            plano = "Sim" if (pid in PLANO_DESDE and ano >= PLANO_DESDE[pid]) else "Não"
        else:
            plano = "Não se aplica"
        com.append((pid, ano, round(inv, -3), rng.choice(TIPOS), "Sim" if tem else "Não",
                    aviso, round(inv_tot, -3), round(inv_ren, -3), plano))
comunidade = pd.DataFrame(com, columns=["projeto_id", "ano", "investimento_infraestrutura_rs", "tipo_investimento",
                                        "tem_programa_comunidade", "prazo_aviso_semanas", "investimento_total_rs",
                                        "investimento_renovavel_rs", "tem_plano_encerramento"])

# ---------------------------------------------------------------- SALVAR
projetos_out = projetos.copy()
projetos_out["data_inicio"] = projetos_out.data_inicio.dt.date
programas_out = programas.copy()
programas_out["data_inicio"] = programas_out.data_inicio.dt.date
abas = {"projetos": projetos_out, "ocupacoes": ocupacoes, "emprego_mensal": emprego,
        "capacitacao": capacitacao, "programas": programas_out, "energia_emissoes": energia_emissoes,
        "ambiental_mensal": ambiental_mensal, "comunidade": comunidade}
for nome, df in abas.items():
    if "mes" in df.columns:
        df["mes"] = df["mes"].dt.date
with pd.ExcelWriter("base_asg_t8.xlsx", engine="openpyxl") as w:
    for nome, df in abas.items():
        df.to_excel(w, sheet_name=nome, index=False)
for nome, df in abas.items():
    df.to_csv(f"csv_{nome}.csv", index=False)
print({k: len(v) for k, v in abas.items()})
