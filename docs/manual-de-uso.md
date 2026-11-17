# Manual de uso

Para quem vai **abrir, apresentar ou alimentar** o painel. Para entender o código, veja `docs/arquitetura.md`.

## 1. Abrir

O painel é um site estático, mas o navegador bloqueia a leitura dos arquivos quando a página é aberta com duplo clique (`file://`). Rode um servidor local na pasta do projeto:

```
npm run servir          # abre em http://localhost:8080
# ou, sem Node:  python3 -m http.server 8080
```

## 2. Navegar

- **Tema:** com mais de um tema em `temas/index.json`, o título do tema no cabeçalho vira uma lista para trocar (recarrega a página; dados importados são descartados). Também dá para abrir direto: `?tema=gestao-ambiental`.
- **Abas:** Visão ASG · Ambiental · Social · Governança · Empresas e projetos · Indicadores e método.
- **Filtros** (ano, origem, empresa/instituição, projeto, setor, município; classe de ocupação só na aba Social). Valem para todas as abas. O botão **Filtros** recolhe o painel; recolhido, uma linha mostra o que está filtrado.
- **Notas (0 a 100):** cada pilar e o ASG geral têm nota, faixa (*Alinhado* ≥ 70, *Em atenção* 40 a 70, *Crítico* < 40) e **cobertura** (quanto do peso tem dado). A cor nunca é a única informação: o rótulo vem em texto.
- **Indicadores e método:** parâmetros (piso, teto, peso, justificativa, fonte), onde editar e uma **demonstração da conta** de uma entidade à escolha.

## 3. Apresentar

Botão **Apresentar** (ou tecla **P**): tela cheia, letras maiores, cabeçalho enxuto e filtros recolhidos.

| Tecla | Efeito |
|---|---|
| `→` ou `PageDown` | próxima página |
| `←` ou `PageUp` | página anterior |
| `1` a `6` | ir direto para a aba |
| `F` | mostrar/esconder filtros |
| `Esc` (ou `P`) | sair |

Dentro de um filtro (menu aberto), as setas mudam o filtro, não a página. Em telas menores que 1400 px as letras não aumentam, para a tabela de Empresas continuar cabendo.

## 4. Importar dados (CSV)

Botão **Importar dados**. Tudo é lido no navegador: **nada é enviado nem salvo**; ao recarregar a página voltam os dados de demonstração. Enquanto há dados importados, uma faixa verde avisa e oferece **Voltar à demonstração**.

1. Prepare **um CSV por tabela**, com os nomes do molde (ex.: `projetos.csv`, `emprego_mensal.csv`). A janela de importação lista as tabelas, quais são obrigatórias e as colunas. Os arquivos em `temas/t8-empregos-verdes/dados/` servem de modelo.
2. Escolha os arquivos (ou arraste, ou **Escolher uma pasta**). Pode juntar `metricas.json` (parâmetros próprios da pontuação) e `gri_catalogo.json` (catálogo GRI).
3. Leia o **relatório**: erros (em vermelho) bloqueiam; avisos (em laranja) informam. Só com zero erros o botão **Usar estes dados** habilita.

Aceitamos: separador vírgula, ponto e vírgula ou tab; números `1234.5`, `1234,5` e `1.234,5`; datas `AAAA-MM-DD` ou `DD/MM/AAAA`; arquivos em UTF-8 ou Windows-1252 (Excel em português). **Célula vazia numa coluna numérica significa "sem dado"**, não zero.

Erros comuns: tabela obrigatória ausente · coluna faltando ou com outro nome · texto onde deveria ser número (ex.: `n/d`) · data inválida · mês vazio · chave repetida (dois projetos com o mesmo `projeto_id`) · `metricas.json` sem justificativa ou fonte. A mensagem diz o arquivo, a coluna e a linha.

**Apresentar com dados importados:** importe antes da reunião e mantenha a aba aberta. Recarregar ou fechar descarta a importação (não guardamos nada no navegador, de propósito).

**XLSX:** ainda não. No Excel, use *Salvar como → CSV*. Está previsto (`docs/decisoes.md`, D16).

## 5. Trocar parâmetros, nome e logo

- **Notas:** edite `config/metricas.json` (pesos, piso, teto, faixas; cada indicador pontuado exige `justificativa` e `fonte`). Recarregue a página. Se houver erro, a aba *Indicadores e método* lista o que corrigir e as notas ficam desligadas até corrigir.
- **Nome e cores:** `config/identidade.json`.
- **Logo:** `assets/logo-investe-piaui.png` (ver `assets/LEIA-ME.md`). Sem o arquivo, aparece só o nome.
- **Código do tema** (o selo "T8" no cabeçalho): campo opcional `codigo` em `tema.json`.
- **Aviso de um pilar** (ex.: "Governança tem poucos indicadores neste tema"): campo opcional `notas_pilar` em `tema.json`.

## 6. Testar

```
npm test
```

Deve terminar com 0 falhas. Os testes com o catálogo GRI só rodam se `privado/gri_catalogo.json` existir (o catálogo não vai para o Git).

## 7. Problemas

| Sintoma | Causa provável |
|---|---|
| "Não foi possível carregar" | abriu por duplo clique; use o servidor local |
| Importação não habilita o botão | há erro no relatório; leia o primeiro item |
| Acentos estranhos no importado | arquivo em outra codificação; salve como CSV UTF-8 |
| Sem notas, só valores | `config/metricas.json` inválido ou ausente (ver *Indicadores e método*) |
| Referências GRI só com código | falta `privado/gri_catalogo.json` (pedir por e-mail ao grupo) |
