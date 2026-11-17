# -*- coding: utf-8 -*-
"""
Tema 2 (demonstração) - Gestão ambiental na operação: energia, água e resíduos
Gerador da BASE FICTÍCIA -> temas/gestao-ambiental/dados/*.csv

POR QUE ESTE TEMA EXISTE
  Provar a escalabilidade (requisito R1): um tema novo é uma PASTA, sem mexer em src/.
  Por isso a carteira é outra (cerâmica, agroindústria, laticínios, resíduos, saneamento) e a
  história também, mas as tabelas e colunas são as mesmas que as fórmulas do registro
  (catalogo/indicadores.json) já sabem ler.

COMO RODAR (precisa de numpy e pandas; a semente é fixa, então sempre sai o mesmo resultado)
  python3 tools/gerador/gerar_gestao_ambiental.py

ESCALA DOS NÚMEROS (importante)
  config/metricas.json é GLOBAL (pisos e tetos foram pensados na escala do T8). Se este tema
  tivesse, por exemplo, 200 tCO2e por empregado, toda nota travaria em 0 e o tema pareceria
  quebrado. Então os consumos por empregado abaixo foram escolhidos para ficar DENTRO das
  faixas de piso/teto já definidas (ES2 20-120 MWh, ES4 1-40 tCO2e, R1 1-25 t, A1 0,05-1,5 ML).
  Num caso real, cada tema teria os seus próprios limites.

IDEIA GERAL (mesma do gerador do T8)
  1) Definimos as tabelas pequenas (empresas, projetos, ocupações).
  2) Para cada projeto criamos a trajetória de empregados mês a mês: é aqui que mora a história.
  3) Energia, emissões, resíduos, água e capacitação são calculados A PARTIR dos empregados,
     para os números serem coerentes entre si.

TODOS OS DADOS SÃO FICTÍCIOS. Nomes de empresas e projetos são inventados.
"""
import os

import numpy as np
import pandas as pd

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SAIDA = os.path.join(RAIZ, "temas", "gestao-ambiental", "dados")

rng = np.random.default_rng(2026)         # semente fixa = resultado reproduzível
MESES = pd.date_range("2023-01-01", "2026-10-01", freq="MS")   # mesmo calendário do T8 (46 meses)
T = len(MESES)
t = np.arange(T)                          # 0 = jan/2023 ... 45 = out/2026
T_CENTRAL = 14                            # mar/2024: central de triagem consorciada entra em operação
T_REUSO = 24                              # jan/2025: reúso de água nas agroindústrias


def sig(x):
    """Curva em 'S': sobe devagar, acelera e estabiliza (modela mudanças que 'pegam' aos poucos)."""
    return 1 / (1 + np.exp(-x))


def safra(tt):
    """Sazonalidade da safra do caju (0 a 1): pico entre out e nov, vale em abr. Só afeta a agroindústria."""
    m = (tt % 12) + 1
    return 0.5 * (1 + np.cos(2 * np.pi * (m - 10.5) / 12))


# ---------------------------------------------------------------- TABELA 1: empresas
empresas = pd.DataFrame([
    ("E01", "Cerâmica Barro Vivo Ltda.",                          "Empresa parceira"),
    ("E02", "Agroindustrial Caju Dourado S.A.",                   "Empresa parceira"),
    ("E03", "Laticínios Serra Branca Ltda.",                      "Empresa parceira"),
    ("E04", "Consórcio Intermunicipal Ambiental do Sul",          "Instituição parceira"),
    ("E05", "Autarquia de Saneamento do Médio Parnaíba",          "Instituição parceira"),
    ("E06", "Investe Piauí – iniciativas próprias",               "Iniciativa própria"),
], columns=["empresa_id", "nome_empresa", "origem"])

# ---------------------------------------------------------------- TABELA 2: projetos
projetos = pd.DataFrame([
    # id,   nome,                                        setor,               município,                 região,      início,       empresa
    ("P01", "Cerâmica Barro Vivo – Unidade Teresina",     "Cerâmica",          "Teresina",               "Centro",    "2021-03-01", "E01"),
    ("P02", "Cerâmica Barro Vivo – Unidade Altos",        "Cerâmica",          "Altos",                  "Centro",    "2022-08-01", "E01"),
    ("P03", "Beneficiamento de Castanha de Caju",         "Agroindústria",     "Parnaíba",               "Litoral",   "2020-11-01", "E02"),
    ("P04", "Polpa e Sucos Piripiri",                     "Agroindústria",     "Piripiri",               "Norte",     "2022-02-01", "E02"),
    ("P05", "Laticínio Serra Branca",                     "Laticínios",        "São Raimundo Nonato",    "Semiárido", "2021-06-01", "E03"),
    ("P06", "Central de Triagem e Compostagem do Sul",    "Resíduos sólidos",  "Bom Jesus",              "Sul",       "2024-03-01", "E04"),
    ("P07", "Aterro Sanitário Consorciado",               "Resíduos sólidos",  "Corrente",               "Sul",       "2022-10-01", "E04"),
    ("P08", "Estação de Tratamento de Esgoto Teresina Sul", "Saneamento",      "Teresina",               "Centro",    "2019-05-01", "E05"),
    ("P09", "Programa de Eficiência nos Distritos Industriais", "Eficiência industrial", "Teresina",     "Centro",    "2023-06-01", "E06"),
], columns=["projeto_id", "nome_projeto", "setor", "municipio", "regiao", "data_inicio", "empresa_id"])
SETOR = dict(zip(projetos.projeto_id, projetos.setor))
# mês (índice 0..45) em que o projeto entra na série; quem começou antes de 2023 entra no mês 0
INICIO = {p: max(0, (pd.Timestamp(d).year - 2023) * 12 + pd.Timestamp(d).month - 1)
          for p, d in zip(projetos.projeto_id, projetos.data_inicio)}

# ---------------------------------------------------------------- TABELA 3: ocupacoes
# A CLASSE fica presa à ocupação e é CRITÉRIO DO GRUPO (o GRI não define "emprego verde").
# Neste tema: Verde = função cujo trabalho principal é ambiental; Alto impacto = operação intensiva
# em combustível (forno, caldeira, frota a diesel); Neutra = o resto.
ocupacoes = pd.DataFrame([
    ("O01", "Técnico de tratamento de efluentes",       "Técnico",        "Verde",        "Opera estações de tratamento e sistemas de reúso de água"),
    ("O02", "Analista de gestão ambiental",             "Gestão",         "Verde",        "Licenciamento, monitoramento e relatórios ambientais"),
    ("O03", "Operador de triagem e reciclagem",         "Operacional",    "Verde",        "Separa e encaminha materiais recicláveis"),
    ("O04", "Técnico em eficiência energética",         "Técnico",        "Verde",        "Reduz o consumo de energia e troca fontes por renováveis"),
    ("O05", "Operador de compostagem",                  "Operacional",    "Verde",        "Transforma resíduos orgânicos em composto"),
    ("O06", "Técnico de recuperação de áreas degradadas", "Técnico",      "Verde",        "Restaura matas ciliares e áreas afetadas"),
    ("O07", "Assistente administrativo",                "Administrativo", "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O08", "Analista financeiro ou contábil",          "Administrativo", "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O09", "Motorista (frota leve)",                   "Operacional",    "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O10", "Segurança patrimonial",                    "Operacional",    "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O11", "Gerente de operações",                     "Gestão",         "Neutra",       "Não contribui nem agrava de forma relevante"),
    ("O12", "Operador de produção (processos gerais)",  "Operacional",    "Neutra",       "Produção sem critério ambiental específico"),
    ("O13", "Operador de forno e secador",              "Operacional",    "Alto impacto", "Queima de combustível: emissões e alto consumo de energia"),
    ("O14", "Operador de caldeira",                     "Operacional",    "Alto impacto", "Caldeira a lenha ou óleo: emissões de GEE e material particulado"),
    ("O15", "Motorista de caminhão a diesel",           "Operacional",    "Alto impacto", "Frota pesada a diesel: alta emissão de GEE"),
], columns=["ocupacao_id", "ocupacao", "categoria_funcional", "classe", "justificativa_classe"])
CLASSE = dict(zip(ocupacoes.ocupacao_id, ocupacoes.classe))
CATEG = dict(zip(ocupacoes.ocupacao_id, ocupacoes.categoria_funcional))

# Quem trabalha em cada tipo de projeto (pesos; são normalizados depois)
COMPOSICAO = {
    "Cerâmica":              {"O13": .22, "O12": .24, "O15": .08, "O04": .03, "O02": .03, "O01": .02, "O07": .08, "O08": .04, "O09": .04, "O10": .08, "O11": .04},
    "Agroindústria":         {"O12": .38, "O14": .10, "O15": .08, "O01": .04, "O02": .03, "O04": .02, "O07": .08, "O08": .04, "O09": .05, "O10": .07, "O11": .04},
    "Laticínios":            {"O12": .34, "O14": .12, "O15": .08, "O01": .05, "O02": .03, "O04": .03, "O07": .08, "O08": .04, "O09": .06, "O10": .06, "O11": .05},
    "Resíduos sólidos":      {"O03": .38, "O05": .10, "O06": .04, "O02": .03, "O15": .12, "O12": .10, "O07": .06, "O08": .03, "O09": .04, "O10": .06, "O11": .04},
    "Saneamento":            {"O01": .30, "O02": .06, "O04": .05, "O06": .03, "O15": .06, "O12": .15, "O07": .08, "O08": .04, "O09": .08, "O10": .08, "O11": .05},
    "Eficiência industrial": {"O04": .45, "O02": .20, "O07": .10, "O08": .05, "O11": .20},
}
# Participação feminina por ocupação (poucas mulheres em campo e frota, mais no administrativo e na triagem)
FEM = {"O01": .35, "O02": .55, "O03": .45, "O04": .20, "O05": .40, "O06": .30, "O07": .65, "O08": .55,
       "O09": .06, "O10": .10, "O11": .30, "O12": .38, "O13": .04, "O14": .05, "O15": .03}
FAIXAS = ["Abaixo de 30", "De 30 a 50", "Acima de 50"]
PERFIL_IDADE = {"Verde": [.35, .50, .15], "Neutra": [.25, .50, .25], "Alto impacto": [.25, .48, .27]}

# ---------------------------------------------------------------- A HISTÓRIA: trajetória de empregados
PICO = {"P01": 120, "P02": 90, "P03": 210, "P04": 160, "P05": 70, "P06": 60, "P07": 35, "P08": 55, "P09": 14}


def trajetoria(pid):
    """Número de empregados do projeto mês a mês (46 pontos); zero antes de o projeto entrar na série."""
    s, i0 = SETOR[pid], INICIO[pid]
    if s == "Cerâmica":
        h = .90 + .10 * sig((t - 10) / 6)
    elif s == "Agroindústria":      # contrata na safra (ago-jan) e dispensa depois: rotatividade sazonal REAL
        h = (.65 + .10 * sig((t - 14) / 5)) * (1 + .35 * safra(t))
    elif s == "Laticínios":
        h = .93 + .07 * sig((t - 12) / 5)
    elif s == "Resíduos sólidos":
        # a central abre com 25% da equipe e cresce; o aterro é estável
        h = .25 + .75 * sig((t - (i0 + 6)) / 4) if pid == "P06" else .95 + .0006 * t
    elif s == "Saneamento":
        h = .96 + .0008 * t
    else:                           # equipe técnica do programa de eficiência
        h = .75 + .25 * sig((t - (i0 + 10)) / 5)
    return PICO[pid] * h * (t >= i0)


# "Investimento em qualificação" por projeto: quem qualifica mais tem MENOS rotatividade
Q = {pid: rng.uniform(.85, 1.25) for pid in PICO}
TAXA_SAIDA = {"Verde": .010, "Neutra": .012, "Alto impacto": .020}   # saídas/mês (≈12%, 14%, 26% ao ano)

# ---------------------------------------------------------------- TABELA 4: emprego_mensal
linhas = []
for pid in projetos.projeto_id:
    H = trajetoria(pid)
    comp = COMPOSICAO[SETOR[pid]]
    soma = sum(comp.values())
    celulas, shares = [], []
    for oid, peso in comp.items():
        for g, pf in (("F", FEM[oid]), ("M", 1 - FEM[oid])):
            for faixa, pi in zip(FAIXAS, PERFIL_IDADE[CLASSE[oid]]):
                celulas.append((oid, g, faixa))
                shares.append(peso / soma * pf * pi)
    # ARREDONDAMENTO COM DESLOCAMENTO FIXO POR CÉLULA: estoque = floor(alvo + u), com u sorteado UMA vez por célula.
    # Por que não round() simples? Em equipes pequenas (14 pessoas divididas em dezenas de grupos) cada célula
    # vale menos de 1 pessoa e round() zera quase todas: o projeto sumiria. Com u fixo, a célula entra e sai
    # no momento certo e a soma fica sem viés (em média, floor(x + u) = x).
    # Por que não arredondar a soma corrida das células? Testamos: quando o total muda 1 pessoa, dezenas de
    # células trocam uma unidade entre si e criam contratações/desligamentos FALSOS (rotatividade de 100%+).
    # Aqui uma célula só muda quando o seu próprio alvo cruza um inteiro, então a rotatividade vem só da
    # taxa de saída (Poisson) e da sazonalidade da trajetória, nunca do arredondamento.
    alvo = np.outer(np.array(shares), H)
    u = rng.uniform(0, 1, len(celulas))
    estoque_todas = np.floor(alvo + u[:, None]).astype(int)
    for k, (oid, g, faixa) in enumerate(celulas):
        estoque = estoque_todas[k]
        ant = np.concatenate([[estoque[0]], estoque[:-1]])
        taxa = TAXA_SAIDA[CLASSE[oid]] * (1.3 - .4 * Q[pid])      # mais qualificação -> menos saídas
        saidas = np.minimum(rng.poisson(taxa * ant), ant) + np.maximum(0, ant - estoque)  # queda de estoque = desligamentos
        contrat = estoque - ant + saidas                           # fecha a conta: estoque = anterior + entradas - saídas
        linhas.append(pd.DataFrame({"projeto_id": pid, "ocupacao_id": oid, "mes": MESES, "genero": g, "faixa_etaria": faixa,
                                    "empregados_fim_mes": estoque, "contratacoes": contrat, "desligamentos": saidas}))
emprego = pd.concat(linhas, ignore_index=True)
emprego = emprego[(emprego.empregados_fim_mes > 0) | (emprego.contratacoes > 0) | (emprego.desligamentos > 0)].reset_index(drop=True)
assert (emprego[["empregados_fim_mes", "contratacoes", "desligamentos"]] >= 0).all().all()

# Agregado por projeto x ocupação x mês x gênero (somando as faixas): base da capacitação
ag = (emprego.groupby(["projeto_id", "ocupacao_id", "mes", "genero"], as_index=False)
      [["empregados_fim_mes", "contratacoes", "desligamentos"]].sum())
ag = ag[ag.empregados_fim_mes > 0].sort_values(["projeto_id", "ocupacao_id", "genero", "mes"]).reset_index(drop=True)
ag["classe"] = ag.ocupacao_id.map(CLASSE)
ag["categoria"] = ag.ocupacao_id.map(CATEG)
ag["ti"] = ((ag.mes.dt.year - 2023) * 12 + ag.mes.dt.month - 1).astype(int)
ag["contrat_mes_ant"] = ag.groupby(["projeto_id", "ocupacao_id", "genero"]).contratacoes.shift(1).fillna(0)

# ---------------------------------------------------------------- TABELA 5: capacitacao
CAT_FATOR = {"Técnico": 1.15, "Gestão": 1.0, "Administrativo": .9, "Operacional": .9}
H_POR_CONTRAT = {"Verde": 10, "Neutra": 5, "Alto impacto": 3}      # horas de integração por contratação


def horas_ano(classe, ti):
    """Horas de capacitação por empregado por ANO. Alto impacto ganha treino de operação segura e eficiente a partir de 2024."""
    if classe == "Verde":
        return 18 + 8 * sig((ti - 12) / 4)
    if classe == "Neutra":
        return 12.0 + 0 * ti
    return 8 + 5 * sig((ti - 20) / 4)


def prob_avaliacao(classe, ti):
    if classe == "Verde":
        return .70 + .10 * (ti / 45)
    if classe == "Neutra":
        return .60 + 0 * ti
    return .42 + .13 * (ti / 45)


cap = ag.copy()
h_ano = np.select([cap.classe == "Verde", cap.classe == "Neutra"],
                  [horas_ano("Verde", cap.ti), horas_ano("Neutra", cap.ti)], default=horas_ano("Alto impacto", cap.ti))
base_h = cap.empregados_fim_mes * h_ano / 12 * cap.projeto_id.map(Q) * cap.categoria.map(CAT_FATOR)
extra = cap.contrat_mes_ant * cap.classe.map(H_POR_CONTRAT)         # a integração aparece no mês seguinte à contratação
cap["horas_capacitacao"] = np.round((base_h + extra) * rng.lognormal(0, .15, len(cap))).astype(int)
p_av = np.select([cap.classe == "Verde", cap.classe == "Neutra"],
                 [prob_avaliacao("Verde", cap.ti), prob_avaliacao("Neutra", cap.ti)], default=prob_avaliacao("Alto impacto", cap.ti))
cap["empregados_avaliados"] = rng.binomial(cap.empregados_fim_mes, p_av)
capacitacao = cap[["projeto_id", "ocupacao_id", "mes", "genero", "horas_capacitacao", "empregados_avaliados"]]

# ---------------------------------------------------------------- TABELA 6: programas
# (nome, tipo, público-alvo, projetos, coortes (ano, mês), faixa de contratados em vaga verde)
# Só "Requalificação" e "Transição de carreira" recolocam gente em vaga verde (Q2); cursos internos não.
modelos = [
    ("Operador de ETE e reúso de água",                "Curso interno",         "Operacionais",                          ["P03", "P04", "P05", "P08"], [(2023, 9), (2025, 2)],            (0, 0)),
    ("Técnico em eficiência energética",               "Curso interno",         "Técnicos",                              ["P01", "P02", "P05", "P09"], [(2024, 5)],                       (0, 0)),
    ("Operação segura e eficiente de fornos e caldeiras", "Curso interno",      "Operadores de forno e caldeira",        ["P01", "P02", "P03", "P05"], [(2024, 8), (2026, 3)],            (0, 0)),
    ("Inclusão produtiva de catadores",                "Transição de carreira", "Catadores e ex-trabalhadores de lixão", ["P06", "P07"],               [(2024, 4), (2025, 2), (2026, 3)], (.45, .60)),
    ("Requalificação para gestão ambiental",           "Requalificação",        "Trabalhadores sazonais da safra",       ["P03", "P04"],               [(2025, 3), (2026, 3)],            (.30, .48)),
    ("Gestão de resíduos orgânicos e compostagem",     "Curso interno",         "Operacionais",                          ["P04", "P06"],               [(2024, 10)],                      (0, 0)),
    ("Apoio a graduação em engenharia ambiental",      "Apoio a curso externo", "Técnicos e administrativos",            ["P01", "P08", "P09"],        [(2023, 3), (2025, 8)],            (0, 0)),
]
prog = []
n = 0
for nome, tipo, pub, pids, coortes, (lo, hi) in modelos:
    for pid in pids:
        for ano, mes_ini in coortes:
            if (ano - 2023) * 12 + mes_ini - 1 < INICIO[pid] or (ano, mes_ini) > (2026, 10):
                continue                          # não existe programa antes de o projeto começar
            n += 1
            vagas = int(rng.integers(20, 61))
            conc = int(round(vagas * rng.uniform(.70, .95)))
            verde = int(round(conc * rng.uniform(lo, hi))) if hi > 0 else 0
            prog.append((f"PR{n:02d}", pid, nome, tipo, pub, pd.Timestamp(year=ano, month=mes_ini, day=1), vagas, conc, verde))
programas = pd.DataFrame(prog, columns=["programa_id", "projeto_id", "nome_programa", "tipo", "publico_alvo",
                                        "data_inicio", "vagas", "concluintes", "contratados_verde"]).sort_values(["programa_id"])

# ---------------------------------------------------------------- TABELA 7: energia_emissoes
emp_proj = emprego.groupby(["projeto_id", "mes"], as_index=False).empregados_fim_mes.sum().rename(columns={"empregados_fim_mes": "H"})
MWH_EMP = {"Cerâmica": 9.0, "Agroindústria": 7.0, "Laticínios": 6.5, "Resíduos sólidos": 3.0, "Saneamento": 8.0, "Eficiência industrial": 1.5}   # MWh por empregado/mês
S0 = {"Cerâmica": .12, "Agroindústria": .28, "Laticínios": .22, "Resíduos sólidos": .40, "Saneamento": .18, "Eficiência industrial": .55}       # % renovável inicial
GANHO = {"Cerâmica": .26, "Agroindústria": .30, "Laticínios": .28, "Resíduos sólidos": .30, "Saneamento": .22, "Eficiência industrial": .20}  # ganho até o fim
E1_EMP = {"Cerâmica": 2.2, "Agroindústria": 1.0, "Laticínios": .9, "Resíduos sólidos": .7, "Saneamento": .35, "Eficiência industrial": .03}   # tCO2e/empregado/mês (escopo 1)
FATOR_REDE = .06                                                                                                                              # tCO2e por MWh da rede
en = emp_proj.copy()
en["setor"] = en.projeto_id.map(SETOR)
en["ti"] = ((en.mes.dt.year - 2023) * 12 + en.mes.dt.month - 1).astype(int)
# Programa de eficiência (a partir de set/2024) reduz o consumo por empregado nos setores industriais
ef = 1 - np.where(en.setor.isin(["Cerâmica", "Agroindústria", "Laticínios"]), .10, .04) * sig((en.ti - 20) / 3)
cons = en.H * en.setor.map(MWH_EMP) * ef * rng.normal(1, .04, len(en))
s = np.clip(en.setor.map(S0) + en.setor.map(GANHO) * sig((en.ti - 10) / 6) + rng.normal(0, .008, len(en)), 0, .98)
en["energia_renovavel_mwh"] = (cons * s).round(1)
en["energia_nao_renovavel_mwh"] = (cons * (1 - s)).round(1)
fator_red = np.where(en.ti >= 20, 1.5, 1.0)                  # o programa de eficiência aumenta a economia declarada
en["reducao_consumo_mwh"] = (cons * rng.uniform(.004, .014, len(en)) * fator_red).round(1)
# Troca de combustível: cerâmicas saem da lenha para gás/biomassa (fev/2025); caldeiras migram de óleo para biomassa (set/2024)
tend1 = np.select([en.setor == "Cerâmica", en.setor.isin(["Agroindústria", "Laticínios"]), en.setor == "Resíduos sólidos"],
                  [1 - .28 * sig((en.ti - 25) / 3), 1 - .20 * sig((en.ti - 20) / 3), 1 - .10 * sig((en.ti - 30) / 4)], default=1.0)
en["emissoes_escopo1_tco2e"] = (en.H * en.setor.map(E1_EMP) * tend1 * rng.normal(1, .06, len(en))).round(1)
en["emissoes_escopo2_tco2e"] = (en.energia_nao_renovavel_mwh * FATOR_REDE * rng.normal(1, .05, len(en))).round(1)
tot_em = en.emissoes_escopo1_tco2e + en.emissoes_escopo2_tco2e
en["reducao_emissoes_tco2e"] = (tot_em * rng.uniform(.01, .04, len(en))).round(1)
energia_emissoes = en[["projeto_id", "mes", "energia_renovavel_mwh", "energia_nao_renovavel_mwh", "reducao_consumo_mwh",
                       "emissoes_escopo1_tco2e", "emissoes_escopo2_tco2e", "reducao_emissoes_tco2e"]]

# ---------------------------------------------------------------- TABELA 8: ambiental_mensal
# Alimenta R1 (resíduos), R2 (recuperados), A1 (água) e H1 (habitat/áreas restauradas).
# Gerador aleatório SEPARADO (semente 7): mexer aqui não altera as outras tabelas.
rng2 = np.random.default_rng(7)
RES_EMP = {"Cerâmica": 1.1, "Agroindústria": 1.7, "Laticínios": .9, "Resíduos sólidos": .6, "Saneamento": 1.4, "Eficiência industrial": .05}   # t de resíduo por empregado/mês
FRAC_PERIG = {"Cerâmica": .04, "Agroindústria": .03, "Laticínios": .06, "Resíduos sólidos": .08, "Saneamento": .12, "Eficiência industrial": .10}
REC0 = {"Cerâmica": .40, "Agroindústria": .30, "Laticínios": .25, "Resíduos sólidos": .40, "Saneamento": .15, "Eficiência industrial": .50}       # fração recuperada (início)
REC_GANHO = {"Cerâmica": .18, "Agroindústria": .22, "Laticínios": .22, "Resíduos sólidos": .18, "Saneamento": .12, "Eficiência industrial": .10}  # melhora até o fim
AGUA_EMP = {"Cerâmica": .025, "Agroindústria": .075, "Laticínios": .065, "Resíduos sólidos": .008, "Saneamento": .020, "Eficiência industrial": .003}   # ML por empregado/mês
CORTE_AGUA = {"Cerâmica": .10, "Agroindústria": .22, "Laticínios": .20, "Resíduos sólidos": .05, "Saneamento": .05, "Eficiência industrial": 0}  # redução com o reúso (jan/2025)
HAB_MES = {"Cerâmica": .45, "Agroindústria": .60, "Laticínios": .35, "Resíduos sólidos": .80, "Saneamento": .30, "Eficiência industrial": .05}        # ha restaurados/mês (média)
am = emp_proj.copy()
am["setor"] = am.projeto_id.map(SETOR)
am["ti"] = ((am.mes.dt.year - 2023) * 12 + am.mes.dt.month - 1).astype(int)
sz = np.where(am.setor == "Agroindústria", 1 + .15 * safra(am.ti), 1.0)       # na safra cada empregado processa mais fruta: mais resíduo e água
tot_res = am.H * am.setor.map(RES_EMP) * sz * rng2.lognormal(0, .06, len(am))
perig = tot_res * am.setor.map(FRAC_PERIG) * rng2.normal(1, .05, len(am))
nperig = tot_res - perig
# A central de triagem (mar/2024) escoa recicláveis das demais operações: o ganho de recuperação acelera depois dela
rec_frac = np.clip(am.setor.map(REC0) + am.setor.map(REC_GANHO) * sig((am.ti - (T_CENTRAL + 4)) / 5) + rng2.normal(0, .015, len(am)), 0, .9)
recup = tot_res * rec_frac
am["residuos_perigosos_ton"] = perig.round(2)
am["residuos_nao_perigosos_ton"] = nperig.round(2)
am["residuos_recuperados_ton"] = recup.round(2)
am["residuos_disposicao_final_ton"] = (tot_res - recup).round(2)             # fecha a conta: recuperado + disposição = gerado
am["consumo_agua_megalitros"] = (am.H * am.setor.map(AGUA_EMP) * sz * (1 - am.setor.map(CORTE_AGUA) * sig((am.ti - T_REUSO) / 2))
                                 * rng2.lognormal(0, .05, len(am))).round(4)
am["habitat_restaurado_ha"] = (am.setor.map(HAB_MES) * (1 + .5 * am.ti / 45) * rng2.gamma(4, .25, len(am))).round(2)
ambiental_mensal = am[["projeto_id", "mes", "residuos_perigosos_ton", "residuos_nao_perigosos_ton", "residuos_recuperados_ton",
                       "residuos_disposicao_final_ton", "consumo_agua_megalitros", "habitat_restaurado_ha"]]

# ---------------------------------------------------------------- TABELA 9: comunidade (anual)
TIPOS = ["Cisternas comunitárias", "Coleta seletiva em bairros", "Escola técnica ambiental", "Saneamento rural", "Horta e compostagem comunitária"]
INVEST_TOTAL = {"Cerâmica": (8e6, 14e6), "Agroindústria": (14e6, 26e6), "Laticínios": (8e6, 12e6), "Resíduos sólidos": (6e6, 10e6),
                "Saneamento": (20e6, 35e6), "Eficiência industrial": (3e6, 5e6)}
SHARE_REN = {"Cerâmica": (.08, .30), "Agroindústria": (.10, .34), "Laticínios": (.08, .30), "Resíduos sólidos": (.22, .45),
             "Saneamento": (.06, .22), "Eficiência industrial": (.55, .70)}      # parcela do investimento em energia renovável (início, fim)
PROG_COM_DESDE = {"P01": 2024, "P02": 2024, "P03": 2023, "P04": 2024, "P05": 2025, "P06": 2024, "P07": 2023, "P08": 2023, "P09": 2023}


def aviso_semanas(pid, ano):
    """N1: prazo mínimo de aviso (semanas) antes de mudanças operacionais (GRI 402-1)."""
    s = SETOR[pid]
    if s == "Agroindústria":                  # dispensas pós-safra com pouco aviso; a política melhora aos poucos
        return {2023: 2, 2024: 2, 2025: 3, 2026: 5}[ano]
    if s in ("Cerâmica", "Laticínios"):
        return 4 + (ano >= 2025)
    return 6


com = []
rng3 = np.random.default_rng(11)
for pid in projetos.projeto_id:
    s = SETOR[pid]
    primeiro = max(2023, pd.Timestamp(projetos.set_index("projeto_id").loc[pid, "data_inicio"]).year)
    base_inv = rng3.uniform(.4e6, 1.6e6)
    for ano in range(primeiro, 2027):
        inv = base_inv * (1.0, 1.1, .9, 1.0)[ano - 2023] * rng3.uniform(.9, 1.1)
        lo, hi = INVEST_TOTAL[s]
        inv_tot = rng3.uniform(lo, hi) * (1.0, 1.05, 1.0, 1.1)[ano - 2023]
        a, b = SHARE_REN[s]
        share = np.clip(a + (b - a) * (ano - 2023) / 3 + rng3.normal(0, .02), 0, 1)
        com.append((pid, ano, round(inv, -3), TIPOS[int(rng3.integers(0, len(TIPOS)))],
                    "Sim" if ano >= PROG_COM_DESDE[pid] else "Não", aviso_semanas(pid, ano),
                    round(inv_tot, -3), round(inv_tot * share, -3), "Não se aplica"))
comunidade = pd.DataFrame(com, columns=["projeto_id", "ano", "investimento_infraestrutura_rs", "tipo_investimento", "tem_programa_comunidade",
                                        "prazo_aviso_semanas", "investimento_total_rs", "investimento_renovavel_rs", "tem_plano_encerramento"])

# ---------------------------------------------------------------- VERIFICAÇÕES (mesmo espírito do validar_base_v2.py)
ids = set(projetos.projeto_id)
for nome, df in {"emprego": emprego, "capacitacao": capacitacao, "programas": programas, "energia": energia_emissoes,
                 "ambiental": ambiental_mensal, "comunidade": comunidade}.items():
    assert set(df.projeto_id) <= ids, f"{nome}: projeto_id sem correspondente em projetos"
assert set(emprego.ocupacao_id) <= set(ocupacoes.ocupacao_id)
assert set(projetos.empresa_id) <= set(empresas.empresa_id)
assert not emprego.duplicated(["projeto_id", "ocupacao_id", "mes", "genero", "faixa_etaria"]).any()
assert not energia_emissoes.duplicated(["projeto_id", "mes"]).any() and not ambiental_mensal.duplicated(["projeto_id", "mes"]).any()
assert not comunidade.duplicated(["projeto_id", "ano"]).any()
assert (ambiental_mensal.residuos_disposicao_final_ton >= -0.01).all()
assert (energia_emissoes.drop(columns=["projeto_id", "mes"]) >= 0).all().all()
# estoque fecha a conta mês a mês: estoque = anterior + contratações - desligamentos (por célula)
e = emprego.sort_values(["projeto_id", "ocupacao_id", "genero", "faixa_etaria", "mes"])
prev = e.groupby(["projeto_id", "ocupacao_id", "genero", "faixa_etaria"]).empregados_fim_mes.shift(1)
ok = prev.isna() | (e.empregados_fim_mes == prev + e.contratacoes - e.desligamentos)
assert ok.all(), "a conta de estoque não fecha em alguma célula"

# ---------------------------------------------------------------- GRAVAÇÃO
os.makedirs(SAIDA, exist_ok=True)
fmt_data = lambda df, cols: df.assign(**{c: pd.to_datetime(df[c]).dt.strftime("%Y-%m-%d") for c in cols})
tabelas = {
    "empresas": empresas,
    "projetos": fmt_data(projetos, ["data_inicio"]),
    "ocupacoes": ocupacoes,
    "emprego_mensal": fmt_data(emprego, ["mes"]),
    "capacitacao": fmt_data(capacitacao, ["mes"]),
    "programas": fmt_data(programas, ["data_inicio"]),
    "energia_emissoes": fmt_data(energia_emissoes, ["mes"]),
    "ambiental_mensal": fmt_data(ambiental_mensal, ["mes"]),
    "comunidade": comunidade,
}
for nome, df in tabelas.items():
    df.to_csv(os.path.join(SAIDA, f"{nome}.csv"), index=False, encoding="utf-8")
    print(f"{nome}.csv: {len(df)} linhas")
