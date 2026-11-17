# -*- coding: utf-8 -*-
"""
Gera a planilha de EXEMPLO (uma aba por tabela) a partir dos CSV do T8:
    temas/t8-empregos-verdes/exemplo-importacao/t8-empregos-verdes.xlsx

Por que existe? A importação de XLSX ainda não está implementada (ver docs/decisoes.md, D16), mas o arquivo de
exemplo será o caso de teste do futuro leitor, então precisa acompanhar as tabelas do contrato (a versão antiga
ficou sem conformidade, integridade e seguranca). Números viram número; datas ficam como texto AAAA-MM-DD,
igual aos CSV.  Uso:  python3 tools/gerar_exemplo_xlsx.py
"""
import csv, json, pathlib
from openpyxl import Workbook

RAIZ = pathlib.Path(__file__).resolve().parents[1]
PASTA = RAIZ / "temas/t8-empregos-verdes"
tema = json.loads((PASTA / "tema.json").read_text(encoding="utf-8"))
contrato = json.loads((PASTA / tema["contrato"]).read_text(encoding="utf-8"))

def converter(valor, tipo):
    """Texto do CSV → valor da célula: vazio vira célula vazia (sem dado), número vira número."""
    if valor == "":
        return None
    if tipo == "numero":
        return float(valor)
    if tipo == "inteiro":
        return int(float(valor))
    return valor                                     # texto e data ficam como texto


wb = Workbook(); wb.remove(wb.active)
for nome, d in contrato["tabelas"].items():
    ws = wb.create_sheet(nome)                       # nome da aba = nome da tabela
    with open(PASTA / tema["pasta_dados"] / d["arquivo"], encoding="utf-8", newline="") as f:
        leitor = csv.reader(f)
        cabecalho = next(leitor)
        ws.append(cabecalho)
        for linha in leitor:
            ws.append([converter(v, d["colunas"].get(c, "texto")) for c, v in zip(cabecalho, linha)])

saida = PASTA / "exemplo-importacao/t8-empregos-verdes.xlsx"
wb.save(saida)
print(f"{len(contrato['tabelas'])} abas gravadas em {saida.relative_to(RAIZ)}")
