// =====================================================================================
// servir.mjs — servidor local mínimo, sem dependências (só precisa do Node).
// Por que existe? O navegador bloqueia fetch() de arquivos abertos com duplo clique (file://).
// Uso:  npm run servir   →  http://localhost:8080      (outra porta: PORTA=9000 npm run servir)
// Funciona igual em Windows, macOS e Linux (o python3 não existe por padrão no Windows).
// =====================================================================================
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORTA = Number(process.env.PORTA) || 8080;
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".csv": "text/csv; charset=utf-8",
  ".md": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
};

createServer(async (req, res) => {
  try {
    let caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (caminho.endsWith("/")) caminho += "index.html";
    const arquivo = normalize(join(RAIZ, caminho));
    // segurança básica: nunca servir nada fora da pasta do projeto (evita "../../")
    if (arquivo !== RAIZ && !arquivo.startsWith(RAIZ + sep)) { res.writeHead(403).end("Proibido"); return; }
    if (!(await stat(arquivo)).isFile()) throw new Error("não é arquivo");
    res.writeHead(200, { "Content-Type": TIPOS[extname(arquivo)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(await readFile(arquivo));
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Não encontrado");
  }
}).listen(PORTA, () => console.log(`Painel ASG em http://localhost:${PORTA}  (Ctrl+C para parar)`));
