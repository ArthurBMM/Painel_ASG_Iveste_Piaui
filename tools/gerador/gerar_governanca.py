# -*- coding: utf-8 -*-
"""
Gera as tabelas FICTÍCIAS de Governança do T8:
  conformidade.csv  GRI 2-27  Conformidade com leis e regulamentos           (indicador CL1)
  integridade.csv   GRI 205-3, 205-2, 2-23  corrupção, capacitação anticorrupção e políticas  (AC1, AC2, PO1)

Por que um script separado do gerar_base_v2.py? Para NÃO mexer nos números já validados das outras
tabelas: aqui usamos uma semente própria (23) e lemos os projetos de projetos.csv. Rodar de novo
gera exatamente o mesmo arquivo.

Uma linha por projeto e ano (mesma grade da tabela `comunidade`).

--- conformidade.csv
  multas_qtd        nº de multas/sanções NÃO monetárias e monetárias recebidas no ano
  multas_valor_rs   valor total das multas no ano (R$); 0 quando não houve multa
  teve_multa        "Sim" se multas_qtd > 0, senão "Não" (coluna auxiliar: o motor filtra por texto, como em M1)

Enredo (inventado, só para a demonstração ter história):
  - Mineração: mais incidentes, que diminuem com a pressão da transição.
  - Eólica: incidentes raros, exceto em 2025, ano das demissões com pouco aviso (ver N1).
  - Demais setores: incidentes raros.
TODOS OS DADOS SÃO FICTÍCIOS.

Uso (na raiz do repositório):  python3 tools/gerador/gerar_governanca.py
"""
import pathlib
import numpy as np
import pandas as pd

RAIZ = pathlib.Path(__file__).resolve().parents[2]
DADOS = RAIZ / "temas/t8-empregos-verdes/dados"

projetos = pd.read_csv(DADOS / "projetos.csv")
rng = np.random.default_rng(23)          # semente fixa = resultado reproduzível

# probabilidade de ter ao menos uma multa no ano, por setor (e, na eólica, por ano)
PROB_MINERACAO = {2023: .70, 2024: .60, 2025: .45, 2026: .35}
PROB_EOLICA_2025 = .60                   # demissões com pouco aviso geraram autuações
PROB_BASE = .08

linhas = []
for pid, setor in zip(projetos.projeto_id, projetos.setor):
    for ano in (2023, 2024, 2025, 2026):
        if setor == "Mineração":
            p = PROB_MINERACAO[ano]
        elif setor == "Eólica" and ano == 2025:
            p = PROB_EOLICA_2025
        else:
            p = PROB_BASE
        # sorteios sempre feitos na mesma ordem, para a sequência da semente não depender do resultado
        teve, n_bruto, valores = rng.random() < p, rng.integers(1, 4), rng.uniform(40e3, 400e3, 3)
        qtd = int(n_bruto) if teve else 0
        valor = round(float(valores[:qtd].sum()), -3) if qtd else 0.0
        linhas.append((pid, ano, qtd, valor, "Sim" if qtd > 0 else "Não"))

df = pd.DataFrame(linhas, columns=["projeto_id", "ano", "multas_qtd", "multas_valor_rs", "teve_multa"])
df.to_csv(DADOS / "conformidade.csv", index=False)
print(len(df), "linhas ->", DADOS / "conformidade.csv")
print(df.groupby("ano").agg(projetos_com_multa=("teve_multa", lambda s: (s == "Sim").sum()), multas=("multas_qtd", "sum")))


# =====================================================================================
# integridade.csv  (AC1 = GRI 205-3, AC2 = GRI 205-2, PO1 = GRI 2-23)
# Semente própria (29), separada da de conformidade, para uma tabela não alterar a outra.
#   casos_corrupcao                     casos confirmados de corrupção no ano (205-3)
#   teve_caso_corrupcao                 "Sim" se casos_corrupcao > 0 (coluna auxiliar, como teve_multa)
#   gestores_total                      gestores e membros da direção do projeto (base de 205-2)
#   gestores_capacitados_anticorrupcao  quantos receberam capacitação em anticorrupção no ano (205-2)
#   politica_ambiental / _direitos_humanos / _anticorrupcao   "Sim"/"Não": compromisso de política formal (2-23)
#   politicas_adotadas_qtd              quantas das 3 políticas existem (0 a 3; coluna auxiliar)
# Enredo (inventado): a mineração tem mais casos e adota as políticas mais tarde; a capacitação
# cresce em todos os setores; o P12 nunca adota a política anticorrupção.
# =====================================================================================
rng2 = np.random.default_rng(29)
PROB_CASO = {"Mineração": {2023: .25, 2024: .20, 2025: .15, 2026: .10}}
PROB_CASO_BASE = .03
GESTORES = {"Mineração": (18, 30), "Eólica": (8, 14), "Solar": (6, 10), "Hidrelétrica": (10, 16), "Obras sustentáveis": (6, 12)}
SHARE_CAP = {2023: .35, 2024: .50, 2025: .65, 2026: .75}   # fração média de gestores capacitados
# ano a partir do qual cada projeto de MINERAÇÃO adota a política (None = nunca); os demais setores adotam desde 2023
POL_MIN = {"ambiental": {"P10": 2023, "P11": 2024, "P12": 2024},
           "direitos_humanos": {"P10": 2025, "P11": 2025, "P12": 2026},
           "anticorrupcao": {"P10": 2024, "P11": 2025, "P12": None}}

def adota(pid, setor, politica, ano):
    if setor != "Mineração":
        return ano >= 2023
    desde = POL_MIN[politica][pid]
    return desde is not None and ano >= desde

linhas = []
for pid, setor in zip(projetos.projeto_id, projetos.setor):
    lo, hi = GESTORES[setor]
    gestores = int(rng2.integers(lo, hi + 1))          # fixo por projeto ao longo dos anos
    for ano in (2023, 2024, 2025, 2026):
        p = PROB_CASO.get(setor, {}).get(ano, PROB_CASO_BASE)
        teve, n_bruto = rng2.random() < p, int(rng2.integers(1, 3))
        casos = n_bruto if teve else 0
        frac = float(np.clip(SHARE_CAP[ano] + (-.10 if setor == "Mineração" else 0) + rng2.uniform(-.10, .10), 0, 1))
        capacitados = int(round(gestores * frac))
        pol = [adota(pid, setor, k, ano) for k in ("ambiental", "direitos_humanos", "anticorrupcao")]
        linhas.append((pid, ano, casos, "Sim" if casos > 0 else "Não", gestores, capacitados,
                       *["Sim" if x else "Não" for x in pol], int(sum(pol))))

integ = pd.DataFrame(linhas, columns=["projeto_id", "ano", "casos_corrupcao", "teve_caso_corrupcao", "gestores_total",
                                      "gestores_capacitados_anticorrupcao", "politica_ambiental",
                                      "politica_direitos_humanos", "politica_anticorrupcao", "politicas_adotadas_qtd"])
integ.to_csv(DADOS / "integridade.csv", index=False)
print(len(integ), "linhas ->", DADOS / "integridade.csv")
print(integ.groupby("ano").agg(projetos_com_caso=("teve_caso_corrupcao", lambda s: (s == "Sim").sum()),
                               capacitados=("gestores_capacitados_anticorrupcao", "sum"), gestores=("gestores_total", "sum"),
                               politicas=("politicas_adotadas_qtd", "sum")))
