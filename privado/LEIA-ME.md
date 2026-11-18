# Pasta `privado/` (conteúdo fora do Git)

Aqui fica o **catálogo das Normas GRI** (`gri_catalogo.json`): códigos, títulos, normas, páginas e pilar sugerido de cada conteúdo.
Esse arquivo **não é versionado** (o `.gitignore` o ignora): o grupo o recebe por **e-mail** e o coloca nesta pasta.

## Como usar
1. Peça o arquivo `gri_catalogo.json` ao grupo (e-mail).
2. Salve em `privado/gri_catalogo.json` (este caminho exato).
3. Rode `npm run servir` e abra a página *Indicadores e método*: o catálogo, as páginas GRI dos cartões e os níveis de maturidade aparecem.

## Versão cifrada (publicada no GitHub)
O site publicado não tem esta pasta. Por isso existe `catalogo/gri_catalogo.cifrado.json`: o **mesmo catálogo, cifrado com senha** (AES-256-GCM, chave derivada da senha por PBKDF2-SHA256 com 600.000 repetições; código em `src/js/nucleo/cifra.js`).

- **Gerar ou trocar a senha:** com o catálogo aqui, rode `npm run cifrar-gri`. O script pede a senha duas vezes, sem mostrar na tela, grava o arquivo cifrado e confere que ele abre.
- **Usar:** no site, botão **🔒 Desbloquear GRI** → senha. O navegador decifra na memória; nada é enviado nem salvo.
- **A senha nunca vai para o Git.** Ela é passada ao grupo e à professora por mensagem.
- **Conferir o arquivo publicado:** `npm run conferir-gri` (pede a senha sem mostrar e diz se ela abre o arquivo e se o conteúdo é idêntico ao de `privado/`). Evite pôr a senha na linha de comando: no PowerShell, aspas duplas alteram senhas com `$` ou crase, e o comando fica salvo no histórico do terminal.
- **Limites:** a segurança depende de uma senha **longa** (o arquivo cifrado fica público, inclusive no histórico, e alguém pode tentar adivinhar a senha). Trocar a senha não apaga as versões antigas do histórico. Quem tem a senha pode copiar o catálogo.

## E se o arquivo não estiver aqui?
O app **funciona normalmente**, só que:
- os indicadores aparecem identificados pelo **código** GRI (ex.: `GRI 305-1`), sem página nem título, até alguém **desbloquear** com a senha;
- a página *Indicadores e método* mostra o aviso "Catálogo GRI não carregado";
- 2 testes são **pulados** (não falham): `npm test` continua útil.

## Por que não usar `.env` (nem um "login" com senha guardada)?
`.env` serve para segredos de **servidores**, lidos por um programa em execução. Um site estático não lê `.env`: qualquer senha colocada no JavaScript publicado fica visível no código-fonte, e qualquer arquivo publicado aberto pode ser baixado direto, sem passar pela tela de login. Por isso o catálogo é publicado **cifrado** e a senha é a própria chave: sem ela, o arquivo não serve para nada.

## Regras
- **Nunca** faça `git add -f` nesta pasta, nem copie títulos/páginas/trechos das Normas GRI para arquivos versionados (docs, código, testes). Nos arquivos versionados, cite só o **código** (ex.: `305-4`).
- Gerar de novo a partir do PDF: `tools/extrair_catalogo_gri.py` (grava aqui). Atenção: ele recria o catálogo **sem** a seção `refs_setoriais` (títulos/páginas das normas setoriais GRI 11, 12 e 14 usadas em T1 e M1); se regenerar, preserve essa seção copiando-a do arquivo anterior.
- Um **modelo vazio** do formato está descrito em `catalogo/README.md`.
