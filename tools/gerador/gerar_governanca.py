# -*- coding: utf-8 -*-
"""
Gera a tabela FICTÍCIA `conformidade.csv` (GRI 2-27, Conformidade com leis e regulamentos).

Por que um script separado do gerar_base_v2.py? Para NÃO mexer nos números já validados das outras
tabelas: aqui usamos uma semente própria (23) e lemos os projetos de projetos.csv. Rodar de novo
gera exatamente o mesmo arquivo.

Uma linha por projeto e ano (mesma grade da tabela `comunidade`):
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
