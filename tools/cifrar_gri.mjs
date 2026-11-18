// =====================================================================================
// cifrar_gri.mjs — gera catalogo/gri_catalogo.cifrado.json a partir de privado/gri_catalogo.json
//
// Uso (na pasta do projeto):   npm run cifrar-gri
//   1) pede a senha DUAS vezes, sem mostrar na tela;
//   2) cifra o catálogo (ver src/js/nucleo/cifra.js) e grava o arquivo que VAI para o GitHub;
//   3) decifra de volta e compara com o original, para ter certeza de que a senha abre o arquivo.
// Trocar a senha = rodar de novo. A senha NUNCA é gravada em arquivo nenhum.
//
// CONFERIR (sem gravar nada):   npm run conferir-gri   → pede a senha e diz se ela abre o arquivo publicado
//                                e se o conteúdo é idêntico a privado/gri_catalogo.json.
//
// Sem terminal interativo (automação), a senha pode vir da variável de ambiente SENHA_GRI.
// Cuidado: variável de ambiente pode ficar no histórico do terminal; para uso normal, digite.
// =====================================================================================
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import readline from "node:readline";
import { cifrarTexto, decifrarTexto } from "../src/js/nucleo/cifra.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRADA = path.join(RAIZ, "privado/gri_catalogo.json");
const SAIDA = path.join(RAIZ, "catalogo/gri_catalogo.cifrado.json");
const MINIMO = 12;

/**
 * Pergunta as duas senhas sem ecoar o que é digitado. O readline do Node não tem "modo senha" pronto:
 * trocamos a função que escreve na tela para mostrar só a pergunta. UMA interface para as duas perguntas
 * (duas interfaces seguidas perdem a segunda linha quando a entrada vem de um pipe).
 */
function perguntarDuasVezesOculto(p1, p2) {
  return new Promise((resolver) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
    let pergunta = p1;
    rl._writeToOutput = (s) => { if (s.includes(pergunta)) process.stdout.write(pergunta); };   // esconde o que é digitado
    rl.question(p1, (a) => {
      process.stdout.write("\n");
      if (!p2) { rl.close(); resolver([a]); return; }          // só uma pergunta (modo conferir)
      pergunta = p2;
      rl.question(p2, (b) => { process.stdout.write("\n"); rl.close(); resolver([a, b]); });
    });
  });
}

async function obterSenha() {
  if (process.env.SENHA_GRI) { console.log("Usando a senha da variável SENHA_GRI."); return process.env.SENHA_GRI; }
  console.log(`Escolha uma senha LONGA (mínimo ${MINIMO} caracteres). Dica: 4 ou 5 palavras aleatórias, ex.: "caju ponte azul lentilha".`);
  const [a, b] = await perguntarDuasVezesOculto("Senha: ", "Repita a senha: ");
  if (a !== b) throw new Error("As senhas não conferem. Nada foi gravado.");
  return a;
}

/** Modo --conferir: a senha abre o arquivo PUBLICADO e devolve exatamente o catálogo de privado/? Não grava nada. */
async function conferir() {
  const env = JSON.parse(await readFile(SAIDA, "utf-8"));
  const original = await readFile(ENTRADA, "utf-8");
  if (process.env.SENHA_GRI) console.log("Atenção: usando a variável SENHA_GRI (não a senha digitada). Para digitar: Remove-Item Env:SENHA_GRI");
  const senha = process.env.SENHA_GRI || (await perguntarDuasVezesOculto("Senha: ", null))[0];
  // diagnóstico SEM revelar a senha: ajuda a achar acento/espaço que o terminal tenha mudado
  const naoAscii = [...senha].filter((c) => c.charCodeAt(0) > 126).length;
  console.log(`Senha lida: ${[...senha].length} caracteres; fora do ASCII (acentos, ç, emoji): ${naoAscii}; espaço no começo/fim: ${senha !== senha.trim() ? "SIM" : "não"}`);
  try {
    const texto = await decifrarTexto(env, senha);
    if (texto === original) console.log("OK: a senha abre o arquivo publicado e o conteúdo é idêntico a privado/gri_catalogo.json.");
    else { console.error("A senha abre, mas o conteúdo é DIFERENTE do privado/ (o catálogo mudou depois de cifrar?). Rode npm run cifrar-gri de novo."); process.exitCode = 1; }
  } catch (e) {
    console.error(e.name === "SenhaIncorreta" ? "Senha incorreta para o arquivo publicado." : `Erro: ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv.includes("--conferir")) await conferir();
else try {
  let texto;
  try { texto = await readFile(ENTRADA, "utf-8"); }
  catch { throw new Error(`Não achei ${path.relative(RAIZ, ENTRADA)}. Coloque o catálogo recebido por e-mail nessa pasta.`); }
  const cat = JSON.parse(texto);
  if (!Array.isArray(cat.conteudos)) throw new Error("O catálogo não tem a lista \"conteudos\"; confira o arquivo.");

  const senha = await obterSenha();
  if (senha.length < MINIMO) throw new Error(`Senha curta demais (${senha.length} caracteres; mínimo ${MINIMO}). Nada foi gravado.`);

  console.log("Cifrando (leva menos de um segundo)…");
  const envelope = await cifrarTexto(texto, senha);
  // conferência: o arquivo gravado precisa abrir com a mesma senha e devolver o catálogo idêntico
  if (await decifrarTexto(envelope, senha) !== texto) throw new Error("A conferência falhou; nada foi gravado.");
  await writeFile(SAIDA, JSON.stringify(envelope, null, 1) + "\n", "utf-8");

  console.log(`Pronto: ${path.relative(RAIZ, SAIDA)} (${cat.conteudos.length} conteúdos GRI, cifrado).`);
  console.log("Próximos passos: abra o painel, clique em \"Desbloquear GRI\" e teste a senha; depois git add / commit / push.");
  console.log("Passe a senha ao grupo por mensagem. NUNCA coloque a senha no GitHub.");
} catch (e) {
  console.error(`Erro: ${e.message}`);
  process.exitCode = 1;
}
