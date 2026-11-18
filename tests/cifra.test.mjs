// =====================================================================================
// cifra.test.mjs — o catálogo GRI cifrado: ida e volta, senha errada, adulteração e o arquivo publicado
//
// Os testes usam POUCAS repetições do PBKDF2 (rápido); um teste confere que o padrão continua alto.
// A senha real NUNCA aparece aqui. Para conferir o arquivo publicado contra privado/, prefira
//     npm run conferir-gri        (pede a senha sem mostrar e sem passar pela linha de comando)
// A variável SENHA_GRI também liga o último teste abaixo, mas no PowerShell use ASPAS SIMPLES
// ($env:SENHA_GRI='...'): com aspas duplas, "$" e crase dentro da senha são interpretados.
// =====================================================================================
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cifrarTexto, decifrarTexto, validarEnvelope, SenhaIncorreta, ITERACOES_PADRAO, FORMATO } from "../src/js/nucleo/cifra.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAPIDO = { iteracoes: 1000 };
const TEXTO = JSON.stringify({ conteudos: [{ id: "305-1:2016", titulo: "Emissões diretas (Escopo 1) — ação, informação" }] });

test("ida e volta: decifrar devolve exatamente o texto (com acentos e travessão)", async () => {
  const env = await cifrarTexto(TEXTO, "uma senha bem longa", RAPIDO);
  assert.equal(await decifrarTexto(env, "uma senha bem longa"), TEXTO);
});

test("o envelope tem o formato esperado e não contém o texto aberto", async () => {
  const env = await cifrarTexto(TEXTO, "uma senha bem longa", RAPIDO);
  assert.deepEqual(validarEnvelope(env), []);
  assert.equal(env.formato, FORMATO);
  assert.ok(!JSON.stringify(env).includes("Emissões"));
});

test("senha errada → SenhaIncorreta", async () => {
  const env = await cifrarTexto(TEXTO, "uma senha bem longa", RAPIDO);
  await assert.rejects(decifrarTexto(env, "uma senha bem longA"), SenhaIncorreta);
  await assert.rejects(decifrarTexto(env, ""), SenhaIncorreta);
});

test("arquivo adulterado falha (dados, sal, iv, repetições ou formato)", async () => {
  const env = await cifrarTexto(TEXTO, "uma senha bem longa", RAPIDO);
  const troca = (b64) => { const s = atob(b64); return btoa(String.fromCharCode(s.charCodeAt(0) ^ 1) + s.slice(1)); };   // vira 1 bit
  for (const campo of ["dados", "sal", "iv"]) await assert.rejects(decifrarTexto({ ...env, [campo]: troca(env[campo]) }, "uma senha bem longa"), SenhaIncorreta, campo);
  await assert.rejects(decifrarTexto({ ...env, iteracoes: env.iteracoes + 1 }, "uma senha bem longa"), SenhaIncorreta);
  await assert.rejects(decifrarTexto({ ...env, formato: "outro" }, "uma senha bem longa"), /formato desconhecido/);
});

test("envelope malformado gera erro claro (não 'senha incorreta')", async () => {
  await assert.rejects(decifrarTexto(null, "x"), /não é um objeto/);
  await assert.rejects(decifrarTexto({ formato: FORMATO, kdf: "PBKDF2-SHA256", cifra: "AES-256-GCM", iteracoes: 10 }, "x"), /falta "sal"/);
  await assert.rejects(decifrarTexto({ formato: FORMATO, kdf: "PBKDF2-SHA256", cifra: "AES-256-GCM", iteracoes: 10, sal: "%%%", iv: "AAAA", dados: "AAAA" }, "x"), /base64/);
});

test("duas cifragens do mesmo texto dão resultados diferentes (sal e iv aleatórios)", async () => {
  const a = await cifrarTexto(TEXTO, "uma senha bem longa", RAPIDO);
  const b = await cifrarTexto(TEXTO, "uma senha bem longa", RAPIDO);
  assert.notEqual(a.sal, b.sal); assert.notEqual(a.iv, b.iv); assert.notEqual(a.dados, b.dados);
});

test("caracteres especiais, espaços e acentos funcionam; acento composto ou decomposto dá a mesma chave", async () => {
  const senha = "Ação!@# #$%&*()_+ 2026 çãé ☀";
  const env = await cifrarTexto(TEXTO, senha, RAPIDO);
  assert.equal(await decifrarTexto(env, senha), TEXTO);
  assert.equal(await decifrarTexto(env, senha.normalize("NFD")), TEXTO);    // "ç" como "c" + cedilha
  await assert.rejects(decifrarTexto(env, senha.trim() + " "), SenhaIncorreta); // espaço a mais muda a senha
});

test("o padrão de repetições continua alto (≥ 600.000, recomendação OWASP)", () => {
  assert.ok(ITERACOES_PADRAO >= 600_000);
});

// ---------------------------------------------------------------- o arquivo PUBLICADO
const CIFRADO = path.join(RAIZ, "catalogo/gri_catalogo.cifrado.json");
const PRIVADO = path.join(RAIZ, "privado/gri_catalogo.json");

test("catálogo publicado: formato válido e parâmetros fortes", { skip: !existsSync(CIFRADO) && "ainda não gerado (npm run cifrar-gri)" }, async () => {
  const env = JSON.parse(await readFile(CIFRADO, "utf-8"));
  assert.deepEqual(validarEnvelope(env), []);
  assert.ok(env.iteracoes >= 600_000, "o arquivo publicado precisa usar as repetições do padrão");
});

test("catálogo publicado: nenhum título do GRI aparece em texto aberto", { skip: !(existsSync(CIFRADO) && existsSync(PRIVADO)) && "precisa do cifrado e de privado/" }, async () => {
  const publicado = await readFile(CIFRADO, "utf-8");
  const cat = JSON.parse(await readFile(PRIVADO, "utf-8"));
  const vazados = cat.conteudos.filter((c) => c.titulo && c.titulo.length > 12 && publicado.includes(c.titulo));
  assert.equal(vazados.length, 0, `títulos em texto aberto: ${vazados.slice(0, 3).map((c) => c.titulo).join(" | ")}`);
});

test("catálogo publicado decifra com SENHA_GRI e é idêntico a privado/", { skip: !(process.env.SENHA_GRI && existsSync(CIFRADO) && existsSync(PRIVADO)) && "defina SENHA_GRI para conferir" }, async () => {
  const env = JSON.parse(await readFile(CIFRADO, "utf-8"));
  assert.equal(await decifrarTexto(env, process.env.SENHA_GRI), await readFile(PRIVADO, "utf-8"));
});
