# -*- coding: utf-8 -*-
"""
REFERÊNCIA INDEPENDENTE da PONTUAÇÃO (notas 0-100). Grava tests/referencia_pontuacao.json.

Por que separar? A pontuação tem duas partes: (1) os VALORES dos indicadores e (2) a CONTA que os transforma
em nota. Os valores já são conferidos em tests/referencia.json (pandas). Aqui refazemos só a conta, em Python
e escrita DE OUTRO JEITO (dois ramos "maior é melhor" e "menor é melhor" em vez da fórmula única do JS),
partindo dos valores do pandas. Se o motor JS e este script chegam à mesma nota, a conta está certa.

Fluxo:  python3 tools/referencia_pandas.py   (gera os valores)
        python3 tools/referencia_pontuacao.py (gera as notas a partir deles e de config/metricas.json)
"""
import json, pathlib

RAIZ = pathlib.Path(__file__).resolve().parents[1]
cfg = json.loads((RAIZ / "config/metricas.json").read_text(encoding="utf-8"))
reg = json.loads((RAIZ / "catalogo/indicadores.json").read_text(encoding="utf-8"))
tema = json.loads((RAIZ / "temas/t8-empregos-verdes/tema.json").read_text(encoding="utf-8"))
valores_por_contexto = json.loads((RAIZ / "tests/referencia.json").read_text(encoding="utf-8"))
F = cfg["faixas"]

pilar_de = {i["id"]: i["pilar"] for i in reg["indicadores"]}
principal = {i["id"]: next((m["chave"] for m in i["medidas"] if m.get("principal")), i["medidas"][0]["chave"]) for i in reg["indicadores"]}


def nota_indicador(v, n, maior_melhor):
    """Dois ramos explícitos (de propósito diferente do JS, que usa uma fórmula única)."""
    if v is None:
        return None
    if maior_melhor:                      # piso < teto
        if v <= n["piso"]: return 0.0
        if v >= n["teto"]: return 100.0
        return 100.0 * (v - n["piso"]) / (n["teto"] - n["piso"])
    else:                                 # piso > teto: menor é melhor
        if v >= n["piso"]: return 0.0
        if v <= n["teto"]: return 100.0
        return 100.0 * (n["piso"] - v) / (n["piso"] - n["teto"])


def faixa(nota, cob):
    if nota is None or cob is None or cob < F["cobertura_minima"]:
        return "sem_dados"
    return "alinhado" if nota >= F["alinhado"] else ("atencao" if nota >= F["atencao"] else "critico")


def pontuar(valores, pesos_iguais=False):
    saida = {}
    for p in "ASG":
        pesos, notas = [], []
        for id_ in tema["indicadores"]:
            c = cfg["indicadores"].get(id_)
            if pilar_de[id_] != p or c is None or c.get("pontuar") is False:
                continue
            v = valores.get(f"{id_}.{c.get('medida', principal[id_])}")
            n = c["normalizacao"]
            pesos.append(1 if pesos_iguais else c["peso"])
            notas.append(nota_indicador(v, n, n["teto"] > n["piso"]))
        tot = sum(pesos)
        pc = sum(w for w, x in zip(pesos, notas) if x is not None)
        nota = sum(w * x for w, x in zip(pesos, notas) if x is not None) / pc if pc > 0 else None
        cob = pc / tot if tot > 0 else None
        saida[p] = {"nota": nota, "cobertura": cob, "faixa": faixa(nota, cob), "avaliados": sum(x is not None for x in notas), "total": len(notas)}
    wp = {"A": 1, "S": 1, "G": 1} if pesos_iguais else cfg["pesos_pilares"]
    com_cob = [p for p in "ASG" if saida[p]["cobertura"] is not None]
    com_nota = [p for p in com_cob if saida[p]["nota"] is not None]
    pn = sum(wp[p] for p in com_nota)
    nota = sum(wp[p] * saida[p]["nota"] for p in com_nota) / pn if pn > 0 else None
    pt = sum(wp[p] for p in com_cob)
    cob = sum(wp[p] * saida[p]["cobertura"] for p in com_cob) / pt if pt > 0 else None
    saida["geral"] = {"nota": nota, "cobertura": cob, "faixa": faixa(nota, cob)}
    return saida


resultado = [{"normal": pontuar(c["valores"]), "pesos_iguais": pontuar(c["valores"], True)} for c in valores_por_contexto]
(RAIZ / "tests/referencia_pontuacao.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"{len(resultado)} contextos gravados em tests/referencia_pontuacao.json")
