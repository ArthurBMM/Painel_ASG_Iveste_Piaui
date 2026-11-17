# LEIA PRIMEIRO (para assistentes de IA)

Você está ajudando **um estudante** de um grupo de 5 a trabalhar neste repositório. Leia **toda a pasta `contexto-ia/`** antes de sugerir ou escrever código. Ela é a memória compartilhada do grupo: se o que o estudante pedir contradisser algo aqui, avise e pergunte, não ignore.

Ordem de leitura:

| Arquivo | Para quê |
|---|---|
| `00-LEIA-PRIMEIRO.md` | este arquivo: projeto, regras de ouro, como trabalhar |
| `01-escopo-e-requisitos.md` | o que a ferramenta precisa fazer e o que já está feito |
| `02-metricas-pesos-e-normalizacao.md` | **como pontuamos A, S e G** e onde ficam os parâmetros editáveis |
| `03-mapa-do-repositorio.md` | o que cada pasta significa e o que colocar nela |
| `04-estado-e-tarefas.md` | situação atual, frentes de trabalho, critério de "pronto" e registro de sessões |
| `05-glossario.md` | termos (ASG, GRI, tema, contrato, registro, piso/teto…) |

## O projeto em poucas linhas

- **Disciplina:** Ciência de Dados (iCEV) · **Desafio ASG Investe Piauí** · **Tema T8:** *Empregos verdes e qualificação para a transição energética*.
- **O que entregamos:** uma **ferramenta web estática** que a Investe Piauí poderia adotar para monitorar, com base nas **Normas GRI**, (a) a própria Investe Piauí como instituição e (b) as empresas e projetos parceiros, em **Ambiental, Social e Governança (ASG)**.
- **Não entregamos resultados reais.** Os dados são **fictícios**. O que está em avaliação é a *ferramenta*: método, escalabilidade, transparência dos cálculos.
- **Para que serve na prática:** é uma **apresentação especializada em ASG**, um "upgrade de slide" para uma **reunião séria** com a Investe Piauí. Não há exportação de relatório/PDF: o usuário **importa os dados e apresenta na própria ferramenta**. A **identidade da Investe Piauí** (logo) é a marca principal da interface.
- **Prazos:** entrega parcial **16/11/2026** · apresentação **27/11/2026** (foco no T8).
- A professora **permitiu** que o grupo estipule pesos, metas e normalização por conta própria, **desde que** o resultado final mostre os cálculos com uma justificativa breve e que tudo seja **fácil de alterar**, porque a Investe Piauí não fornece dados oficiais e poderá ajustar os parâmetros à realidade dela.

## Regras de ouro (valem para qualquer tarefa)

1. **Só dados fictícios.** Nada real ou confidencial no repositório **nem em prompts**. Material interno da disciplina (cronograma etc.) fica fora do Git (`material-privado/`, ignorada) e **nunca** é enviado a uma IA. Não abra links desses materiais.
2. **Escalabilidade primeiro.** Um tema é uma **pasta** (`temas/<id>/`). É proibido colocar em `src/` qualquer nome de empresa, setor, coluna ou indicador específico do T8. Um tema novo deve encaixar nas mesmas páginas, gráficos e leituras sem mexer em `src/`.
3. **Parâmetros em um só lugar.** Pesos, pisos/tetos, faixas e metas ficam em `config/metricas.json` (ver `02-…`), cada um com `justificativa` e `fonte`. Nunca escreva um número mágico dentro de função.
4. **Todo cálculo é demonstrável.** O que a tela mostra precisa poder ser explicado na página *Indicadores e método*: fórmula, normalização, peso, justificativa e **onde está no código/arquivo de configuração**.
5. **Estático e sem persistência.** Sem backend e sem banco. O fluxo é: **importar arquivos (CSV hoje; XLSX previsto) → calcular na memória → apresentar**. Ao recarregar a página, os dados importados somem; isso é aceitável (e pode ser mudado só se a professora pedir). **Não implemente exportação** (PDF, CSV, imagem): foi decidido que não existe.
6. **Zero dependências e zero build**, salvo decisão registrada em `docs/decisoes.md`. Bibliotecas, se necessárias, ficam versionadas no repositório (`vendor/`), não por CDN. (Leitura de XLSX: ver `01-…`.)
7. **Testes passam.** `npm test` verde antes de qualquer Pull Request. Mudou regra de cálculo? Atualize a referência independente (`tests/`) e explique no PR.
8. **Honestidade metodológica.** O GRI **não** classifica conteúdos em A/S/G e **não** define "emprego verde". Essas são **decisões do grupo** e precisam aparecer como tal na interface e na documentação.
9. **Conteúdo das Normas GRI é privado.** Títulos, páginas e trechos das Normas ficam em `privado/` (ignorada pelo Git) e **nunca** entram em arquivo versionado (docs, código, testes, commits). Nos arquivos versionados cite só o **código** (ex.: `305-4`). Nunca use `git add -f` em `privado/`.
10. **Nulo ≠ zero.** Dado ausente é "sem dado" e não entra na média; nunca vire 0 silenciosamente.

## Como trabalhar com o estudante

- Os integrantes são **estudantes em formação**. Explique *por que* da solução, compare alternativas em poucas linhas (vantagens/desvantagens) e **comente o código** (o porquê, não o óbvio).
- **Não concorde por reflexo.** Se houver caminho melhor ou mais simples, diga, com o raciocínio. A decisão final é do grupo.
- Uma tarefa por branch (`area/descricao`), mudanças pequenas e focadas. Não refatore o que não foi pedido.
- Português nos nomes de domínio (`empregados`, `balanco`, `pilar`).
- Antes de encerrar uma sessão de trabalho: **atualize `04-estado-e-tarefas.md`** (o que mudou, o que ficou pendente) e, se houve decisão, `docs/decisoes.md`.
- Se faltar contexto, **pergunte ao estudante** em vez de inventar. Não invente códigos GRI, páginas ou números: o catálogo privado em `privado/gri_catalogo.json` (se o estudante o tiver) é a fonte; sem ele, peça o código ao estudante.

## Rodar e testar

```bash
npm run servir   # http://localhost:8080  (precisa de Node 20+; duplo clique no index.html não funciona)
npm test         # 30 testes de regressão (motor vs. referência independente em pandas)
```
