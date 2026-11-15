# Mapeamento ASG dos indicadores

## Aviso importante

**O GRI não classifica seus conteúdos em Ambiental, Social e Governança.** O GRI organiza por tema (série 200 econômica, 300 ambiental, 400 social, mais os Conteúdos Gerais da GRI 2). A divisão A/S/G neste projeto é **decisão do grupo**, aplicada ao registro (`pilar`) e ao catálogo (`pilar_padrao`, com `pilar_revisado: false` até revisão).

Regra prática usada como ponto de partida:

| Série GRI | Pilar sugerido |
|---|---|
| 300 (materiais, energia, água, biodiversidade, emissões, resíduos…) | A |
| 400 (emprego, saúde e segurança, capacitação, diversidade, comunidades, fornecedores sociais) | S |
| GRI 2 (governança, políticas, conformidade) e GRI 205 (anticorrupção) | G |
| 200 (impactos econômicos) | decidir caso a caso (ex.: 201-2 → G; 202-2, 203-1 → S) |

## Indicadores do T8 hoje (26 indicadores, 42 medidas)

| Pilar | Qtd | Indicadores |
|---|---|---|
| **A** | 9 | ES1 energia (302-1), ES2 intensidade energética (302-3), ES3 redução de energia (302-4), ES4 emissões escopo 1 e 2 (305-1/2), ES6 redução de emissões (305-5), R1 resíduos (306-3), R2 resíduos não destinados à disposição final (306-4), A1 água (303-5), H1 habitats (304-3) |
| **S** | 10 | EV1 empregos verdes (2-7), EV2 contratações (401-1), EV3 rotatividade (401-1), EV4 diversidade (405-1), Q1 horas de capacitação (404-1), Q2 programas de transição (404-2), N1 aviso de mudanças operacionais (402-1), C1 investimentos em infraestrutura (203-1), C3 programas na comunidade (413-1), SST1 acidentes de trabalho (403-9) |
| **G** | 7 | Q3 avaliação de desempenho (404-3), T1 direcionamento do investimento (201-2, GRI 11, GRI 12), M1 encerramento de minas (GRI 14), CL1 conformidade com leis e regulamentos (2-27), AC1 casos de corrupção (205-3), AC2 capacitação anticorrupção (205-2), PO1 compromissos de política (2-23) |

Os códigos vêm do catálogo privado (`privado/gri_catalogo.json`, fora do Git). Títulos e páginas das Normas não são reproduzidos neste repositório.

## Pontos que precisam de revisão do grupo

1. **Q3 (404-3)** está em G porque trata de avaliação/gestão de pessoas. Defensável também em S. Decidir.
2. **T1** usa GRI 201-2 (riscos e oportunidades das mudanças climáticas) e os padrões setoriais GRI 11 (óleo e gás) e GRI 12 (carvão). Revisar se a base setorial é a mais adequada ao T8.
3. **Governança ainda é a mais fina (7 indicadores, contra 9 em A e 9 em S).** A cobertura é marcada `parcial` na tela de propósito, para não fingir completude. Candidatos para fortalecer G estão em `indicadores-candidatos.md`.
4. **Trabalho decente**: indicadores de remuneração foram retirados da versão anterior; segue só rotatividade e diversidade.
5. **"Emprego verde"** não existe no GRI. A classe (Verde, Neutra, Alto impacto) é critério do grupo, aplicada por **ocupação** e documentada em `ocupacoes.csv`.

## Como mudar um pilar

Edite `pilar` em `catalogo/indicadores.json` (e `pilar_padrao` no catálogo, se for o caso, marcando `pilar_revisado: true`), anote o motivo em `docs/decisoes.md`, rode `npm test`.
