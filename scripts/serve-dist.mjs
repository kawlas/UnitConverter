import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const distDirectory = join(fileURLToPath(new URL("..", import.meta.url)), "dist");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const resolvePublicFile = async (pathname) => {
  const relativePath = pathname === "/"
    ? "index.html"
    : extname(pathname)
      ? pathname.slice(1)
      : join(pathname.slice(1), "index.html");
  const candidate = normalize(join(distDirectory, relativePath));
  if (!candidate.startsWith(`${distDirectory}/`) && candidate !== join(distDirectory, "index.html")) return undefined;
  try {
    return (await stat(candidate)).isFile() ? candidate : undefined;
  } catch {
    return undefined;
  }
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:4173");
  const alias = url.pathname.match(/^\/convert\/([^/]+)$/);
  if (alias) {
    response.writeHead(301, { location: `/${alias[1]}${url.search}` });
    response.end();
    return;
  }

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    const canonicalPath = url.pathname.slice(0, -1);
    if (await resolvePublicFile(canonicalPath)) {
      response.writeHead(301, { location: `${canonicalPath}${url.search}` });
      response.end();
      return;
    }
  }

  const publicFile = await resolvePublicFile(decodeURIComponent(url.pathname));
  const outputFile = publicFile ?? join(distDirectory, "404.html");
  response.writeHead(publicFile ? 200 : 404, {
    "content-type": contentTypes[extname(outputFile)] ?? "application/octet-stream",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(outputFile).pipe(response);
}).listen(4173, "127.0.0.1", () => {
  console.log("Static test server listening on http://127.0.0.1:4173");
});
