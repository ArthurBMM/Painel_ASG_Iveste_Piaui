# Roteiro da apresentação (27/11/2026)

Tempo sugerido: **10 a 12 minutos** + perguntas. A ferramenta **é** a apresentação (sem slides). Os números abaixo são da **demonstração fictícia** em 17/11/2026; se os dados mudarem, confira antes.

## Antes de abrir

- `npm run servir`, abrir `http://localhost:8080`, tecla **P** (tela cheia). Testar a projeção antes.
- Conferir o logo (`assets/logo-investe-piaui.png`) e que a faixa de aviso ("dados fictícios") está visível.
- Ter à mão uma pasta com CSV de teste para mostrar a importação (opcional; ensaie antes).
- **Vai apresentar com dados próprios?** Abra o painel **antes** da reunião, importe os arquivos e **não recarregue nem feche a aba**: nada é guardado, e recarregar volta à demonstração. Isso é proposital (nenhum dado fica no navegador).

## Sequência

| # | Tela | O que mostrar | O que dizer |
|---|---|---|---|
| 1 | **Visão ASG** (1,5 min) | Mensagem do topo, nota ASG **62 (Em atenção)**, pilares A 60, S 60, G 65, cartões (2.265 empregados, 45,1% verdes, 22,6% alto impacto) | "A transição está acontecendo, mas não está completa." Cada nota mostra faixa e **cobertura**; nenhuma depende só de cor |
| 2 | **Ambiental** (1,5 min) | Energia renovável, emissões por empregado, gráficos | Como as operações tratam território e clima; indicadores GRI 302/305 |
| 3 | **Social** (2 min) | Empregos verdes × alto impacto, requalificação, capacitação, **segurança do trabalho** (GRI 403-9) | A transição só vale se quem sai da mineração é aproveitado; filtro por classe de ocupação |
| 4 | **Governança** (1,5 min) | Multas (2-27), corrupção (205-3), capacitação anticorrupção (205-2), políticas (2-23) | A governança é o pilar com menos indicadores; já tem 7 e há mais candidatos |
| 5 | **Empresas e projetos** (2 min) | Ranking com notas A, S, G e ASG; **Brisa Litoral e Sol de Picos 85**; **Pedra Norte e Serra Cinza 37**; abrir uma linha e ver os projetos; a **Investe Piauí** como entidade | "Mesma lente para cada empresa, projeto e para a própria Investe Piauí" |
| 6 | **Indicadores e método** (2 min) | Tabela de parâmetros; escolher uma entidade na **demonstração da conta** | Transparência: toda nota tem piso, teto, peso, justificativa e fonte, e dá para refazer a conta à mão |
| 7 | **Importar dados** (1 min, opcional) | Importar os CSV, ver o relatório, "Voltar à demonstração" | Escalável: outros dados e outros temas entram sem mexer no código; nada é guardado |

## Mensagens que não podem faltar

1. **Os dados são fictícios.** Servem para provar o método.
2. **Os parâmetros são hipóteses do grupo**, não metas oficiais da Investe Piauí; ficam em `config/metricas.json`, com justificativa, e podem ser trocados pela Investe Piauí.
3. **Dado ausente nunca vira zero**; a cobertura mostra a confiança da nota.
4. **O ranking depende dos pesos.** Com pesos iguais, 5 das 9 entidades mudam de posição (no máximo 2). Por isso falamos em **faixas**, não em "A é melhor que B".
5. **Totais absolutos** (C1, ES6, H1) ficam fora da nota: dependem do tamanho da empresa.
6. A classificação A/S/G dos indicadores é **escolha do grupo**; o GRI não classifica assim.

## Perguntas prováveis

- **"De onde vêm os pisos e tetos?"** Estimativas do grupo, cada uma justificada; foram calibradas olhando a base fictícia e precisam ser revistas com dados reais (está escrito na justificativa).
- **"Existe um critério de mercado, tipo 50% ou 75%?"** Não encontramos um critério único. EcoVadis usa percentil (notas de corte indicativas de 58 a 81); o ISE B3 exige pontuação qualitativa mínima de 70 pontos percentuais e uma nota de corte recalculada por ciclo. Nossos cortes 70/40 estão na mesma vizinhança, mas continuam hipóteses. (Fontes em `contexto-ia/02-…`.)
- **"Posso usar outros dados?"** Sim, por CSV no molde do tema; nada é gravado.
- **"E outros temas?"** Um tema é uma pasta (`temas/<id>/`); o segundo tema de demonstração mostra isso.
- **"É um sistema pronto para produção?"** Não. É um protótipo estático, sem login nem histórico.
- **"Dá para exportar?"** Decidimos que não: a ferramenta é a própria apresentação.

## O que não afirmar

- Que alguma empresa "está aprovada" ou "reprovada".
- Que os números representam projetos reais.
- Que 70 e 40 são cortes oficiais.
