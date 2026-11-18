# -*- coding: utf-8 -*-
"""
Gera, para CADA tema de temas/index.json, uma planilha com as tabelas fictícias (uma aba por tabela):
    temas/<id>/exemplo-importacao/<id>.xlsx

Para que serve?
  - Entregar as TABELAS GERADAS num formato fácil de abrir (Excel), além dos CSV em temas/<id>/dados/,
    que continuam sendo a fonte usada pelo painel.
  - Ser o caso de teste do futuro leitor de XLSX (a importação de XLSX ainda não existe; ver docs/decisoes.md, D16).
Números viram número; datas ficam como texto AAAA-MM-DD, igual aos CSV; célula vazia = sem dado.

Uso:  npm run planilhas      (ou: python tools/gerar_exemplo_xlsx.py; precisa do openpyxl: pip install openpyxl)
"""
import csv, json, pathlib
from openpyxl import Workbook

RAIZ = pathlib.Path(__file__).resolve().parents[1]


def converter(valor, tipo):
    """Texto do CSV → valor da célula: vazio vira célula vazia (sem dado), número vira número."""
    if valor == "":
        return None
    if tipo == "numero":
        return float(valor)
    if tipo == "inteiro":
        return int(float(valor))
    return valor                                     # texto e data ficam como texto


def gerar(pasta_tema):
    tema = json.loads((pasta_tema / "tema.json").read_text(encoding="utf-8"))
    contrato = json.loads((pasta_tema / tema["contrato"]).read_text(encoding="utf-8"))
    wb = Workbook(); wb.remove(wb.active)
    for nome, d in contrato["tabelas"].items():
        arquivo = pasta_tema / tema["pasta_dados"] / d["arquivo"]
        if not arquivo.exists():                     # tabela opcional que o tema não tem
            continue
        ws = wb.create_sheet(nome)                   # nome da aba = nome da tabela
        with open(arquivo, encoding="utf-8", newline="") as f:
            leitor = csv.reader(f)
            cabecalho = next(leitor)
            ws.append(cabecalho)
            for linha in leitor:
                ws.append([converter(v, d["colunas"].get(c, "texto")) for c, v in zip(cabecalho, linha)])
        ws.freeze_panes = "A2"                       # cabeçalho fixo ao rolar
    saida = pasta_tema / "exemplo-importacao" / f"{tema['id']}.xlsx"
    saida.parent.mkdir(exist_ok=True)
    wb.save(saida)
    print(f"{len(wb.sheetnames)} abas em {saida.relative_to(RAIZ)}")


indice = json.loads((RAIZ / "temas/index.json").read_text(encoding="utf-8"))
for info in indice["temas"]:
    gerar(RAIZ / info["pasta"])
