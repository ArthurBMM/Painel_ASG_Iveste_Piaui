# -*- coding: utf-8 -*-
"""
Gera a tabela FICTÍCIA de segurança do trabalho do T8:
  seguranca.csv   GRI 403-9  Lesões relacionadas ao trabalho   (indicador SST1)

Por que um script separado do gerar_base_v2.py? Para NÃO mexer nos números já validados das outras
tabelas (mesma ideia de gerar_governanca.py): aqui usamos uma semente própria (31) e lemos
projetos.csv e emprego_mensal.csv. Rodar de novo gera exatamente o mesmo arquivo.

Uma linha por projeto e ano (mesma grade das tabelas `comunidade` e `conformidade`).

Colunas:
  horas_trabalhadas       horas trabalhadas pelos empregados do projeto no ano (base da taxa)
  acidentes_registraveis  nº de lesões relacionadas ao trabalho registráveis no ano
  dias_perdidos           dias de trabalho perdidos por essas lesões no ano

Como as horas ficam coerentes com o resto da base:
  horas = empregados (média dos meses com dado, de emprego_mensal) × meses com dado × 160 h
  × uma variação de ±3%. 160 h por empregado-mês é uma referência simples DESTE gerador, não um
  parâmetro do GRI. Em 2026 a base tem só 10 meses, então as horas desse ano são proporcionais.

Como saem os acidentes (enredo inventado, só para a demonstração ter história):
  taxa-base = acidentes por 1 milhão de horas, por setor e ano; nº de acidentes ~ Poisson(taxa × horas / 1e6).
  - Mineração: a taxa mais alta, caindo ano a ano.
  - Obras sustentáveis: canteiro de obras, risco intermediário.
  - Eólica: baixa, exceto em 2025 (ano das demissões: ver N1): equipe enxuta, taxa dobra.
  - Hidrelétrica e Solar: baixas.
Cada acidente perde entre 1 e um teto de dias (maior na mineração).

Não modelamos óbitos nem lesões de grande consequência separadas: o indicador SST1 cobre só a taxa de
acidentes registráveis e os dias perdidos (por isso a cobertura do 403-9 é "parcial").
TODOS OS DADOS SÃO FICTÍCIOS.

Uso (na raiz do repositório):  python3 tools/gerador/gerar_seguranca.py
"""
import pathlib
import numpy as np
import pandas as pd

RAIZ = pathlib.Path(__file__).resolve().parents[2]
DADOS = RAIZ / "temas/t8-empregos-verdes/dados"

projetos = pd.read_csv(DADOS / "projetos.csv")
emprego = pd.read_csv(DADOS / "emprego_mensal.csv")
rng = np.random.default_rng(31)          # semente fixa = resultado reproduzível

HORAS_POR_EMPREGADO_MES = 160            # referência simples deste gerador

# acidentes registráveis por 1 milhão de horas trabalhadas, por setor e ano
TAXA = {
    "Mineração":          {2023: 14.0, 2024: 12.0, 2025: 9.0, 2026: 7.0},
    "Obras sustentáveis": {2023: 8.0, 2024: 7.0, 2025: 6.0, 2026: 5.0},
    "Hidrelétrica":       {2023: 4.0, 2024: 4.0, 2025: 3.5, 2026: 3.5},
    "Eólica":             {2023: 3.0, 2024: 3.0, 2025: 6.0, 2026: 3.0},
    "Solar":              {2023: 2.5, 2024: 2.5, 2025: 2.0, 2026: 2.0},
}
TETO_DIAS = {"Mineração": 30}            # dias perdidos por acidente: sorteio entre 1 e o teto
TETO_DIAS_PADRAO = 15
MAX_ACIDENTES = 60                       # só para dimensionar os sorteios de gravidade

# empregados por projeto e mês -> média por projeto e ano, e nº de meses com dado
por_mes = emprego.groupby(["projeto_id", "mes"], as_index=False).empregados_fim_mes.sum()
por_mes["ano"] = por_mes.mes.str[:4].astype(int)
base = por_mes.groupby(["projeto_id", "ano"]).agg(empregados=("empregados_fim_mes", "mean"),
                                                  meses=("mes", "count"))

linhas = []
for pid, setor in zip(projetos.projeto_id, projetos.setor):
    for ano in (2023, 2024, 2025, 2026):
        b = base.loc[(pid, ano)]
        # sorteios sempre feitos na mesma ordem, para a sequência da semente não depender do resultado
        variacao = rng.uniform(0.97, 1.03)
        horas = int(round(b.empregados * b.meses * HORAS_POR_EMPREGADO_MES * variacao, -2))
        n_bruto = int(rng.poisson(TAXA[setor][ano] * horas / 1e6))
        dias_unit = rng.integers(1, TETO_DIAS.get(setor, TETO_DIAS_PADRAO) + 1, size=MAX_ACIDENTES)
        n = min(n_bruto, MAX_ACIDENTES)
        linhas.append((pid, ano, horas, n, int(dias_unit[:n].sum())))

df = pd.DataFrame(linhas, columns=["projeto_id", "ano", "horas_trabalhadas", "acidentes_registraveis", "dias_perdidos"])
df.to_csv(DADOS / "seguranca.csv", index=False)
print(len(df), "linhas ->", DADOS / "seguranca.csv")

resumo = df.merge(projetos[["projeto_id", "setor"]], on="projeto_id").groupby("setor").agg(
    horas=("horas_trabalhadas", "sum"), acidentes=("acidentes_registraveis", "sum"), dias_perdidos=("dias_perdidos", "sum"))
resumo["taxa_por_milhao_h"] = (resumo.acidentes / resumo.horas * 1e6).round(1)
print(resumo)
