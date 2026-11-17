# Registro de decisões

Formato: **decisão · por quê · alternativa descartada · quando rever.** Atualize sempre que o grupo mudar algo de conteúdo ou de arquitetura.

## Tomadas

### D1. Ferramenta web estática em vez de só um painel Power BI
- **Por quê:** o professor pediu uma *ferramenta* que a Investe Piauí possa adotar e escalar (importar outros temas, catálogo GRI completo). Um site com motor genérico e dados em pasta atende melhor que um `.pbix`.
- **Descartado:** Power BI como entrega principal. Continua válido como apoio/validação (os números do Power BI foram usados para validar o motor).
- **Rever:** se a Investe Piauí exigir Power BI.

### D2. Navegação por pilar (A, S, G) primeiro; método ao fim
- **Por quê:** o feedback foi relacionar tudo a ASG e manter as telas limpas. Fórmulas e GRI ficam em "Indicadores e método" e no "Por que importa…" de cada cartão.

### D3. Indicadores em registro de dados (JSON), não em código
- **Por quê:** "quanto mais indicadores melhor" pede escala. Ver `arquitetura.md`.

### D4. Catálogo GRI completo com níveis de maturidade
- **Por quê:** o professor aceitou que a interpretação (listar com metadados, sem calcular todos) basta. O catálogo mostra o que existe, o que está mapeado e o que já está no painel.
- **Atenção:** dois GRI 306 coexistem (2016 e 2020); por isso o id é `código:versão`.

### D5. (revisada em 14/11) Pontuação 0–100 por pilar **e** balanço de tendência
- **Versão inicial:** só balanço (quantos indicadores melhoraram/pioraram), por receio de falsa precisão num índice com pesos arbitrários.
- **Revisão:** a professora aceita pesos/normalização estipulados pelo grupo **desde que** os cálculos sejam mostrados com breve embasamento e fáceis de alterar; a Investe Piauí não fornece dados oficiais e poderá trocar os parâmetros. Então: nota por pilar (normalização linear com piso/teto, média ponderada) + nota ASG geral + faixas, **mantendo** o balanço como leitura de tendência.
- **Mitigação do risco de falsa precisão:** parâmetros num único arquivo (`config/metricas.json`) com justificativa e fonte; aviso "hipóteses do grupo" na tela; **cobertura** exibida junto da nota; análise de sensibilidade dos pesos. Detalhes em `contexto-ia/02-metricas-pesos-e-normalizacao.md`.
- **Piso/teto fixos** (e não min-máx dos dados), para a nota de uma entidade não mudar quando outra entra na carteira.
- **Rever:** quando a Investe Piauí fornecer metas/pesos reais.

### D9. Navegação: A, S, G individuais + página ASG geral
- **Por quê:** a Investe Piauí quer monitorar a si mesma e às parceiras nos três critérios; cada pilar tem leitura especializada, e a geral consolida. Os mesmos filtros de entidade valem em todas as páginas.

### D10. Importação no navegador, sem persistência
- **Por quê:** a professora quer "importou → sabe ler → monta a apresentação". O motor já recebe um `leitor`; a importação é um leitor sobre arquivos escolhidos pelo usuário. Dados somem ao recarregar. Rever se a professora pedir permanência (segunda-feira, 16/11).

### D11. Sem exportação
- **Por quê:** o uso real é apresentar dentro da ferramenta, como um slide melhor, em reunião; ninguém vai exportar PDF. Menos código e menos superfície de erro.

### D12. Modo apresentação e identidade da Investe Piauí
- **Por quê:** a ferramenta substitui o slide numa reunião séria, e a Investe Piauí pediu ver a representação dela no painel. Logo no cabeçalho como marca principal, configurável (`config/identidade.json`). O logo oficial é fornecido pelo grupo (não é criado por IA).

### D13. XLSX e CSV na importação; dados de demonstração fixos
- **Por quê:** a Investe Piauí trabalha com planilhas. Os dados do T8 ficam como demonstração fixa e a Investe Piauí pode trocá-los por importação. Há uma planilha de exemplo (uma aba por tabela) em `temas/t8-empregos-verdes/exemplo-importacao/`. Leitor XLSX: próprio (sem biblioteca) ou biblioteca versionada; ver `contexto-ia/01-…`.

### D16. Importação: só CSV por enquanto; XLSX fica para depois
- **Por quê:** prazo de entrega em 18/11. O CSV cobre o fluxo importar → calcular → apresentar e é o que dá para validar bem (testes provam que o mesmo dado em estilo Excel pt-BR produz o mesmo modelo). Quem tem planilha usa *Salvar como CSV*.
- **O que foi feito:** leitor com detecção de separador, vírgula decimal, datas DD/MM/AAAA e Windows-1252; validação por contrato com mensagens de arquivo/coluna/linha; `metricas.json` e `gri_catalogo.json` opcionais; nada é gravado.
- **Rever:** implementar XLSX (leitor próprio ou biblioteca em `vendor/`) se a Investe Piauí exigir planilhas (ver `contexto-ia/01-…`).

### D17. Modo apresentação e identidade por configuração
- **Por quê:** a ferramenta substitui o slide. Modo apresentação = tela cheia, letras maiores (zoom só em telas largas), atalhos de teclado, filtros recolhíveis. Nome, cores e logo vêm de `config/identidade.json`; o logo oficial é fornecido pelo grupo (nunca gerado por IA) e, se faltar, o painel mostra só o nome.

### D7. Gráficos em SVG próprio, sem Chart.js
- **Por quê:** o registro npm estava bloqueado no ambiente em que o código foi gerado e queremos zero dependências. Simples de ler e funciona offline.
- **Rever:** se precisarmos de interações complexas (zoom, tooltips ricos).

### D8. Dados 100% fictícios
- **Por quê:** requisito da disciplina e do grupo. Nada confidencial no repositório.

### D14. Catálogo GRI privado, fora do Git
- **Por quê:** o grupo considera o conteúdo das Normas GRI confidencial. Títulos, páginas e pilar sugerido ficam em `privado/gri_catalogo.json` (no `.gitignore`), distribuído por e-mail. O Git guarda só o **código** GRI de cada indicador (necessário para rastrear a origem).
- **Por que não `.env`:** o site é estático e roda no navegador, que não lê `.env`; o catálogo é um arquivo de dados, não um segredo curto.
- **Consequência:** sem o catálogo o app mostra só os códigos e avisa; 2 testes são pulados. A importação deve aceitar `gri_catalogo.json`.
- **Limite honesto:** os códigos (ex.: `305-1`) continuam no repositório. Se isso também precisar sair, teríamos de usar códigos internos, perdendo a identificação clara do GRI que a professora pediu.

### D6. Dimensão "Empresa / instituição"
- **Por quê:** o feedback pediu ver cada empresa/projeto e a própria Investe Piauí como instituição. `empresas.csv` tem `origem` (empresa parceira, instituição parceira, iniciativa própria).

### D15. Pontuação: totais absolutos fora da nota; limites fixos; sensibilidade exibida
- **Por quê:** `C1`, `ES6` e `H1` crescem com o tamanho da entidade e não indicam desempenho; limites tirados dos dados fariam a nota de uma entidade mudar quando outra entrasse; e como os pesos são arbitrários, a tela compara o ranking com pesos iguais.
- **Descartado por ora:** min-máx dos dados, z-score, percentil, escala robusta, log e sigmoide (comparação completa em `contexto-ia/02-…`). Os relativos dependem da distribuição da carteira, que não temos.
- **Referências de mercado** (EcoVadis, ISE B3, Sustainalytics) consultadas em 14/11 apenas para ordem de grandeza; não existe critério universal "50% ou 75%".
- **Rever:** com dados reais, ou quando existirem medidas proporcionais (por empregado, por MWh). Parte dos limites foi calibrada vendo os dados fictícios; a justificativa de cada um diz isso.

## Em aberto (precisam do grupo)

| # | Pergunta | Impacto |
|---|---|---|
| E1 | ~~O que significa "obedecer"?~~ **Resolvida em 14/11 (D5):** faixas sobre a nota (Alinhado / Em atenção / Crítico), com cortes 70/40 como hipótese do grupo. Falta decidir se os cortes ficam assim | Avaliação por entidade |
| E2 | Revisar o pilar de cada indicador (ver `mapeamento-asg.md`), em especial Q3 e T1 | Conteúdo |
| E3 | Como reforçar G (hoje 3 indicadores)? Ver `indicadores-candidatos.md` | Cobertura |
| E4 | Segundo tema de demonstração para provar a escalabilidade (sugestão: "Gestão ambiental", reaproveitando `ambiental_mensal`) | Apresentação |
| E5 | CSV pronto (D16). XLSX adiado: leitor próprio ou biblioteca? | Frente 2 |
| E6 | Quanto do catálogo vira "calculável" até 27/11? | Planejamento |

## Críticas honestas ao próprio projeto

- Os números são fictícios e gerados por regras nossas: servem para provar o **motor**, não para tirar conclusões.
- A classificação A/S/G é nossa; um avaliador pode discordar. Por isso ela está documentada e sinalizada na tela.
- Protótipo estático: sem permissões, sem auditoria, sem histórico. Para uso real seria preciso backend e banco.
