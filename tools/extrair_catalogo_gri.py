# -*- coding: utf-8 -*-
"""
Extrai o CATÁLOGO de conteúdos (divulgações) das Normas GRI consolidadas em português
e grava privado/gri_catalogo.json (PRIVADO: está no .gitignore; nunca versionar).

Como gerar o texto de entrada (precisa do poppler-utils; no Windows use o WSL ou baixe o texto pronto):
    pdftotext -layout "Normas GRI Consolidadas.pdf" gri_all.txt

Uso:
    python3 tools/extrair_catalogo_gri.py gri_all.txt

IDEIA DO ALGORITMO (para você poder mexer):
  1) O texto vem dividido em páginas por "\f" (quebra de página). Como o PDF consolidado preserva a
     numeração original, "índice da página + 1" == número de página impresso.
  2) O sumário (primeiras páginas) lista cada norma e a página onde ela começa. Isso nos dá os
     INTERVALOS de páginas de cada norma. Atenção: existem duas versões do GRI 306 (2020 e 2016),
     então a chave de uma norma é (número, ano) e não só o número.
  3) Em cada página procuramos linhas "Conteúdo NNN-N Título". O título pode quebrar em até 3 linhas.
     Só aceitamos o conteúdo se o seu prefixo (NNN) for o da norma cujo intervalo contém a página
     (isso descarta referências cruzadas, como "veja o Conteúdo 401-1").
  4) O PILAR (A/S/G) é uma sugestão por norma (pilar_padrao) com algumas exceções. O grupo deve
     REVISAR: o GRI não classifica conteúdos em A, S ou G.

LIMITES (seja honesto ao apresentar): o catálogo cobre os Conteúdos das Normas Universais (GRI 2 e 3),
da GRI 101 e das Normas Temáticas 200/300/400. Os "tópicos" das Normas Setoriais (GRI 11 a 14) não
são extraídos aqui; quando usados, entram à mão em catalogo/indicadores.json (só a norma, ex.: "GRI 11") e o título/página vão em "refs_setoriais" do catálogo privado.
"""
import json, re, sys, pathlib, collections

PADRAO_PILAR = {2: "G", 3: "G", 101: "A", 201: "G", 202: "S", 203: "S", 204: "G", 205: "G", 206: "G",
                207: "G", 415: "G", 418: "G"}
EXCECOES_PILAR = {"2-7": "S", "2-8": "S", "2-30": "S", "201-2": "A"}
CONECTORES = {"de", "da", "do", "das", "dos", "e", "ou", "para", "por", "em", "ao", "a", "os", "as",
              "no", "na", "com", "sobre", "à", "aos", "pelo", "pela", "que"}
PARAR = ("Conteúdo", "Requisitos", "Recomendações", "Orientações", "Tema", "Divulgação",
         "A organização", "REQUISITOS", "Se a organização", "Nota")

def pilar_de(numero, codigo):
    if codigo in EXCECOES_PILAR:
        return EXCECOES_PILAR[codigo]
    if numero in PADRAO_PILAR:
        return PADRAO_PILAR[numero]
    return "A" if 300 <= numero < 400 else "S" if 400 <= numero < 500 else "G"

def main(caminho_txt):
    paginas = pathlib.Path(caminho_txt).read_text(encoding="utf-8").split("\f")
    # 1) normas do sumário (cada linha: "GRI 201: Desempenho Econômico 2016      555")
    sumario = re.findall(r"^\s*GRI (\d+): (.+?)\s{2,}(\d+)\s*$", "\n".join(paginas[:6]), re.M)
    normas = sorted(((int(p), int(n), f"GRI {n}: {rot.strip()}") for n, rot, p in sumario))   # (pagina_inicio, numero, rotulo)
    def norma_da_pagina(pg):
        achada = None
        for ini, num, rot in normas:
            if ini <= pg:
                achada = (num, rot)
        return achada
    # 2) conteúdos
    pat = re.compile(r"^[ ]{8,}Conteúdo (\d{1,3})-(\d{1,2})[ ]+(\S.*)$")
    itens = collections.OrderedDict()
    for pg, texto in enumerate(paginas, 1):
        linhas = texto.split("\n")
        norma = norma_da_pagina(pg)
        if not norma:
            continue
        for i, l in enumerate(linhas):
            m = pat.match(l)
            if not m or int(m.group(1)) != norma[0]:
                continue
            titulo = m.group(3).strip()
            j = i + 1
            # junta linhas de continuação enquanto o título parecer "cortado"
            while j < len(linhas) and j < i + 4:
                prox = linhas[j].strip()
                ultima = titulo.split()[-1].lower().strip("(),")
                if not prox or prox.startswith(PARAR) or len(prox) > 80:
                    break
                if ultima in CONECTORES or titulo.endswith(("(", ",")) or prox[0].islower() or prox[0] == "(":
                    titulo += " " + prox
                    j += 1
                else:
                    break
            codigo = f"{m.group(1)}-{m.group(2)}"
            rotulo = norma[1]                                     # ex.: "GRI 401: Emprego 2016"
            mm = re.match(r"GRI (\d+): (.+?) (\d{4})$", rotulo)
            tema, ano = (mm.group(2), int(mm.group(3))) if mm else (rotulo, None)
            chave = f"{codigo}:{ano}"
            if chave not in itens:                                # mantém a 1ª ocorrência
                itens[chave] = {"id": chave, "codigo": codigo, "titulo": titulo, "norma": rotulo,
                                "norma_numero": norma[0], "tema": tema, "versao": ano, "pagina": pg,
                                "pilar_padrao": pilar_de(norma[0], codigo), "pilar_revisado": False}
    saida = pathlib.Path(__file__).resolve().parents[1] / "privado" / "gri_catalogo.json"
    saida.write_text(json.dumps({"fonte": "Normas GRI Consolidadas (PT) — páginas = numeração impressa",
                                 "total": len(itens), "conteudos": list(itens.values())},
                                ensure_ascii=False, indent=1), encoding="utf-8")
    por = collections.Counter(v["norma"] for v in itens.values())
    print(f"{len(itens)} conteúdos em {len(por)} normas -> {saida}")

if __name__ == "__main__":
    main(sys.argv[1])
