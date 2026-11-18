// =====================================================================================
// cifra.js — cifra e decifra um TEXTO com uma SENHA (usado para o catálogo GRI publicado)
//
// POR QUE EXISTE? O repositório é público, mas o catálogo GRI (títulos e páginas das Normas) não
// pode ficar aberto. Publicamos o catálogo CIFRADO; quem tem a senha digita no site e o navegador
// decifra NA MEMÓRIA. Nada é enviado nem guardado.
//
// COMO FUNCIONA (sem criptografia "caseira": tudo é a Web Crypto API, nativa do navegador e do Node):
//   1) senha → chave:  PBKDF2-SHA256 com muitas repetições e um "sal" aleatório.
//      As repetições deixam CADA tentativa lenta (~0,5 s): irrelevante para quem sabe a senha,
//      caríssimo para quem tenta adivinhar milhões de senhas. O sal impede tabelas pré-calculadas.
//   2) chave → cifra:  AES-256-GCM com um "iv" (número usado uma vez) aleatório.
//      O GCM é AUTENTICADO: com senha errada ou arquivo adulterado, a decifragem FALHA
//      em vez de devolver lixo. É assim que sabemos que a senha está errada.
//
// O que fica no arquivo publicado (o "envelope"): formato, parâmetros, sal, iv e os dados cifrados.
// Nada disso revela o conteúdo; a segurança está só na SENHA (por isso ela precisa ser longa).
// =====================================================================================

export const FORMATO = "asg-cifra-v1";
/** Repetições do PBKDF2. 600.000 é a recomendação da OWASP (2023) para PBKDF2-HMAC-SHA256. */
export const ITERACOES_PADRAO = 600_000;

/** Erro específico para a tela poder dizer "senha incorreta" (e não "arquivo quebrado"). */
export class SenhaIncorreta extends Error {
  constructor() { super("Senha incorreta (ou o arquivo cifrado foi alterado)."); this.name = "SenhaIncorreta"; }
}

/** Web Crypto só existe em "contexto seguro": https ou localhost. Aberto por IP da rede (http://192.168…), não há. */
function subtle() {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error("Este navegador não liberou a criptografia: abra o painel por https ou por http://localhost.");
  return s;
}

// ---------- base64 <-> bytes (btoa/atob existem no navegador e no Node ≥ 16)
const paraBase64 = (bytes) => { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };
const deBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** Deriva a chave AES a partir da senha e do sal. "extractable: false": a chave não pode ser exportada. */
async function derivarChave(senha, sal, iteracoes) {
  // normalize("NFC"): "é" pode ser 1 caractere ou "e" + acento (2), conforme o teclado/sistema. Sem isso, a MESMA
  // senha com acento digitada em outro computador poderia virar outra chave. Para senha sem acento, não muda nada.
  const base = await subtle().importKey("raw", new TextEncoder().encode(String(senha).normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteracoes }, base,
    { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

// O "additionalData" do GCM amarra o formato à cifra: se alguém trocar o campo "formato", a decifragem falha.
const dadosAdicionais = () => new TextEncoder().encode(FORMATO);

/**
 * Cifra um texto com uma senha.
 * @returns {Promise<object>} envelope JSON-serializável
 */
export async function cifrarTexto(texto, senha, { iteracoes = ITERACOES_PADRAO } = {}) {
  if (!senha) throw new Error("Senha vazia.");
  const sal = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));   // 12 bytes é o tamanho recomendado para GCM
  const chave = await derivarChave(senha, sal, iteracoes);
  const cifrado = await subtle().encrypt({ name: "AES-GCM", iv, additionalData: dadosAdicionais() }, chave, new TextEncoder().encode(texto));
  return { formato: FORMATO, kdf: "PBKDF2-SHA256", iteracoes, cifra: "AES-256-GCM",
           sal: paraBase64(sal), iv: paraBase64(iv), dados: paraBase64(new Uint8Array(cifrado)) };
}

/** Confere se um objeto tem cara de envelope nosso. Devolve a lista de problemas (vazia = ok). */
export function validarEnvelope(env) {
  const p = [];
  if (!env || typeof env !== "object") return ["o arquivo não é um objeto JSON"];
  if (env.formato !== FORMATO) p.push(`formato desconhecido ("${env.formato}"); esperado "${FORMATO}"`);
  if (env.kdf !== "PBKDF2-SHA256") p.push("kdf deve ser PBKDF2-SHA256");
  if (env.cifra !== "AES-256-GCM") p.push("cifra deve ser AES-256-GCM");
  if (!Number.isInteger(env.iteracoes) || env.iteracoes < 1) p.push("iteracoes inválido");
  for (const k of ["sal", "iv", "dados"]) if (typeof env[k] !== "string" || !env[k]) p.push(`falta "${k}"`);
  return p;
}

/**
 * Decifra um envelope com a senha.
 * @throws {SenhaIncorreta} senha errada OU envelope adulterado (o GCM não distingue os dois, de propósito)
 */
export async function decifrarTexto(env, senha) {
  const problemas = validarEnvelope(env);
  if (problemas.length) throw new Error(`Arquivo cifrado inválido: ${problemas.join("; ")}`);
  let sal, iv, dados;
  try { sal = deBase64(env.sal); iv = deBase64(env.iv); dados = deBase64(env.dados); }
  catch { throw new Error("Arquivo cifrado inválido: base64 corrompido"); }
  const chave = await derivarChave(senha, sal, env.iteracoes);
  try {
    const claro = await subtle().decrypt({ name: "AES-GCM", iv, additionalData: dadosAdicionais() }, chave, dados);
    return new TextDecoder().decode(claro);
  } catch { throw new SenhaIncorreta(); }
}
