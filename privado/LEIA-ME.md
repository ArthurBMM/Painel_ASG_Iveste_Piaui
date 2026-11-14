# Pasta `privado/` (conteúdo fora do Git)

Aqui fica o **catálogo das Normas GRI** (`gri_catalogo.json`): códigos, títulos, normas, páginas e pilar sugerido de cada conteúdo.
Esse arquivo **não é versionado** (o `.gitignore` o ignora): o grupo o recebe por **e-mail** e o coloca nesta pasta.

## Como usar
1. Peça o arquivo `gri_catalogo.json` ao grupo (e-mail).
2. Salve em `privado/gri_catalogo.json` (este caminho exato).
3. Rode `npm run servir` e abra a página *Indicadores e método*: o catálogo, as páginas GRI dos cartões e os níveis de maturidade aparecem.

## E se o arquivo não estiver aqui?
O app **funciona normalmente**, só que:
- os indicadores aparecem identificados pelo **código** GRI (ex.: `GRI 305-1`), sem página nem título;
- a página *Indicadores e método* mostra o aviso "Catálogo GRI não carregado";
- 2 testes são **pulados** (não falham): `npm test` continua útil.

## Por que não usar `.env`?
`.env` serve para segredos de **servidores** (chaves de API) lidos por um programa em execução. Este projeto é um site estático rodando no navegador, que não lê `.env`, e o catálogo é um arquivo de dados grande, não um segredo curto. Uma pasta ignorada pelo Git resolve o mesmo problema de forma simples.

## Regras
- **Nunca** faça `git add -f` nesta pasta, nem copie títulos/páginas/trechos das Normas GRI para arquivos versionados (docs, código, testes). Nos arquivos versionados, cite só o **código** (ex.: `305-4`).
- Gerar de novo a partir do PDF: `tools/extrair_catalogo_gri.py` (grava aqui). Atenção: ele recria o catálogo **sem** a seção `refs_setoriais` (títulos/páginas das normas setoriais GRI 11, 12 e 14 usadas em T1 e M1); se regenerar, preserve essa seção copiando-a do arquivo anterior.
- Um **modelo vazio** do formato está descrito em `catalogo/README.md`.
