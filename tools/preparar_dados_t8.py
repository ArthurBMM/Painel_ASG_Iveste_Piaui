# -*- coding: utf-8 -*-
"""
Prepara a pasta de dados do tema T8 a partir dos CSVs gerados por tools/gerador/gerar_base_v2.py.

O que este script faz (e por quê):
  1) Copia os 8 CSVs da base v2 para temas/t8-empregos-verdes/dados/ (sem o prefixo "csv_").
  2) CRIA a dimensão `empresas` (nova na v3): a Investe Piauí tem parcerias com empresas e
     instituições e também iniciativas próprias, então cada projeto passa a pertencer a uma
     "entidade" com uma ORIGEM. Isso habilita a página "Empresas e projetos".
  3) Acrescenta `empresa_id` em projetos.csv.

IMPORTANTE: nenhum número aleatório é sorteado aqui. Só ligamos projetos a empresas por uma
tabela fixa, então TODOS os indicadores já validados continuam com os mesmos valores.
TODOS os nomes são FICTÍCIOS; qualquer semelhança com empresas reais é coincidência.

Uso:  python3 tools/preparar_dados_t8.py --origem <pasta com csv_*.csv> [--destino <pasta>]
"""
import argparse, csv, pathlib, shutil

TABELAS = ["projetos", "ocupacoes", "emprego_mensal", "capacitacao", "programas",
           "energia_emissoes", "ambiental_mensal", "comunidade"]

# empresa_id, nome (fictício), origem
EMPRESAS = [
    ("E01", "Ventos do Piauí Energia S.A.",        "Empresa parceira"),
    ("E02", "Brisa Litoral Renováveis Ltda.",      "Empresa parceira"),
    ("E03", "Solaris Nordeste Geração S.A.",       "Empresa parceira"),
    ("E04", "Sol de Picos Energia Ltda.",          "Empresa parceira"),
    ("E05", "Consórcio Hidro Parnaíba",            "Instituição parceira"),
    ("E06", "Investe Piauí – iniciativas próprias", "Iniciativa própria"),
    ("E07", "Pedra Norte Mineração S.A.",          "Empresa parceira"),
    ("E08", "Serra Cinza Minerais Ltda.",          "Empresa parceira"),
    ("E09", "Vale do Sul Lavra e Beneficiamento Ltda.", "Empresa parceira"),
]
# projeto -> empresa (P08 e P09 são obras públicas sustentáveis: iniciativa própria da Investe PI)
PROJETO_EMPRESA = {"P01": "E01", "P02": "E01", "P03": "E02", "P04": "E03", "P05": "E03",
                   "P06": "E04", "P07": "E05", "P08": "E06", "P09": "E06",
                   "P10": "E07", "P11": "E08", "P12": "E09"}

ap = argparse.ArgumentParser()
ap.add_argument("--origem", required=True)
ap.add_argument("--destino", default=str(pathlib.Path(__file__).resolve().parents[1] / "temas/t8-empregos-verdes/dados"))
a = ap.parse_args()
orig, dest = pathlib.Path(a.origem), pathlib.Path(a.destino)
dest.mkdir(parents=True, exist_ok=True)

for t in TABELAS:
    if t == "projetos":
        continue
    shutil.copyfile(orig / f"csv_{t}.csv", dest / f"{t}.csv")

# projetos + empresa_id
with open(orig / "csv_projetos.csv", encoding="utf-8", newline="") as f:
    linhas = list(csv.DictReader(f))
campos = list(linhas[0].keys()) + ["empresa_id"]
with open(dest / "projetos.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=campos, lineterminator="\n")
    w.writeheader()
    for l in linhas:
        l["empresa_id"] = PROJETO_EMPRESA[l["projeto_id"]]
        w.writerow(l)

# empresas
with open(dest / "empresas.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, lineterminator="\n")
    w.writerow(["empresa_id", "nome_empresa", "origem"])
    w.writerows(EMPRESAS)
print("ok:", dest)
