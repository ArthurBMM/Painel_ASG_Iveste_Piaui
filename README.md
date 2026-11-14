# Painel ASG · Investe Piauí

Ferramenta web (estática, sem build) que organiza **indicadores das Normas GRI** em três pilares — **Ambiental, Social e Governança** — para acompanhar a carteira de projetos e empresas da Investe Piauí.

> Projeto da disciplina de Ciência de Dados (iCEV) · Desafio ASG Investe Piauí · Tema T8: *Empregos verdes e qualificação para a transição energética*.
> **Todos os dados são fictícios.** O que está sendo proposto é a *ferramenta*, não os números.

## O que ela faz

- **Navega por pilar** (Visão ASG, Ambiental, Social, Governança). Cada indicador mostra o valor, a variação contra o ano anterior e a referência GRI (código + página).
- **Olha por entidade** (aba *Empresas e projetos*): cada empresa, instituição parceira ou iniciativa própria da Investe Piauí, com seus projetos e o balanço A/S/G.
- **Usa o catálogo completo das Normas GRI** (130 conteúdos, com página e pilar sugerido) na aba *Indicadores e método*, com níveis de maturidade. O catálogo é **privado** (fora do Git, ver abaixo): `catalogado → mapeado → calculável → em painel`.
- **É escalável por tema**: um tema novo é uma pasta com `tema.json`, `contrato.json` e CSVs. O motor de cálculo não muda.

## Catálogo GRI privado (faça isto uma vez)

O conteúdo das Normas GRI não é versionado. Peça o arquivo `gri_catalogo.json` ao grupo (e-mail) e salve em `privado/gri_catalogo.json`. Sem ele tudo funciona, mas os indicadores aparecem só pelo código GRI (veja `privado/LEIA-ME.md`).

## Como rodar

Precisa só do [Node.js](https://nodejs.org) 20 ou mais novo (nada de `npm install`).

```bash
npm run servir      # abre um servidor local em http://localhost:8080
npm test            # roda os testes de regressão (30 testes)
```

Abrir o `index.html` com duplo clique **não funciona**: o navegador bloqueia a leitura dos CSVs em `file://`. Por isso o servidor local.

Para abrir outro tema: `http://localhost:8080/?tema=<id>` (os ids estão em `temas/index.json`).

## Mapa das pastas

```
catalogo/    indicadores.json (registro público: fórmulas, pilar, código GRI)
privado/     gri_catalogo.json (catálogo GRI, FORA do Git, recebido por e-mail)
temas/       uma pasta por tema (t8-empregos-verdes) + _modelo/ para copiar
src/js/nucleo/   motor: lê CSV, valida contrato, avalia fórmulas, calcula variações (sem HTML aqui)
src/js/ui/       telas: casca, páginas, cartões, gráficos SVG
tests/       testes + verificação independente contra pandas
tools/       servir.mjs, extração do catálogo GRI, preparo de dados, gerador de dados fictícios
docs/        arquitetura, contrato de dados, mapeamento ASG, decisões, roadmap, divisão de tarefas
```

## Por onde começar a ler o código

1. `docs/arquitetura.md` (10 minutos; explica o fluxo todo).
2. `catalogo/indicadores.json`: veja um indicador inteiro (ex.: `EV1`). É aqui que se "programa" um indicador, sem tocar em JavaScript.
3. `src/js/nucleo/avaliador.js`: o interpretador das fórmulas.
4. `src/js/ui/paginas/pilar.js`: como uma tela é montada.

## Para assistentes de IA

Leia `AGENTS.md` e a pasta `contexto-ia/` (começa em `00-LEIA-PRIMEIRO.md`): é a memória compartilhada do grupo (escopo, regras, método de pontuação, estado e tarefas).

## Contribuindo

Veja `CONTRIBUTING.md` (fluxo de branches, testes, regras de dados) e `docs/divisao-de-tarefas.md`.

## Limites conhecidos (honestidade primeiro)

- É um **protótipo estático**: sem login, sem histórico de versões, sem multiusuário.
- Importação por **CSV e XLSX** (planilha com uma aba por tabela): especificada, **ainda não implementada**. Não haverá exportação (a ferramenta é a própria apresentação).
- "Pilar" de cada indicador é **decisão do grupo**; o GRI não classifica conteúdos em A, S ou G (ver `docs/mapeamento-asg.md`).
- Governança tem cobertura parcial no T8 (4 indicadores).
- A **pontuação 0–100** por pilar (com pesos e justificativas editáveis) está **implementada, versão 1.0** (`config/metricas.json` + `src/js/nucleo/pontuacao.js`) e mostrada com cobertura e a conta passo a passo. Os parâmetros são *hipóteses do grupo*, não metas oficiais (ver `contexto-ia/02-metricas-pesos-e-normalizacao.md`).
- Hoje o tema é lido da pasta `temas/`; o **modo apresentação** e a **identidade da Investe Piauí** (logo) também estão pendentes.
