import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = join(projectRoot, "dist");
const serverDirectory = join(projectRoot, ".prerender");
const template = await readFile(join(distDirectory, "index.html"), "utf8");
const serverEntry = await import(pathToFileURL(join(serverDirectory, "entry-server.js")).href);

const renderDocument = async (route) => {
  const rendered = await serverEntry.render(route);
  const suspenseBoundary = rendered.indexOf("<!--$-->");
  if (suspenseBoundary < 0) {
    throw new Error(`Prerendered route ${route} did not resolve its Suspense boundary.`);
  }

  const routeHead = rendered.slice(0, suspenseBoundary);
  const routeBody = rendered.slice(suspenseBoundary);
  const document = template
    .replace(/\s*<title>[^<]*<\/title>/, "")
    .replace("</head>", `    ${routeHead}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${routeBody}</div>`);

  const count = (pattern) => [...document.matchAll(pattern)].length;
  const expectedCanonical = `https://qconverter.netlify.app${route}`;
  const invalid = [
    count(/<title>/g) !== 1 && "exactly one title",
    count(/<meta name="description"/g) !== 1 && "exactly one description",
    count(/rel="canonical"/g) !== 1 && "exactly one canonical",
    !document.includes(`href="${expectedCanonical}"`) && `canonical ${expectedCanonical}`,
    !document.includes("<h1") && "an h1",
    route !== "/" && !document.includes("Sources &amp; methodology") && "visible methodology sources",
    document.includes('<div id="root"></div>') && "non-empty root markup",
    document.includes("Loading...") && "resolved lazy content",
    route !== "/" && !document.includes('type="application/ld+json"') && "JSON-LD",
  ].filter(Boolean);
  if (invalid.length > 0) {
    throw new Error(`Prerendered route ${route} is missing: ${invalid.join(", ")}.`);
  }
  return document;
};

try {
  for (const route of serverEntry.prerenderRoutes) {
    const outputFile = route === "/"
      ? join(distDirectory, "index.html")
      : join(distDirectory, route.slice(1), "index.html");
    await mkdir(dirname(outputFile), { recursive: true });
    await writeFile(outputFile, await renderDocument(route), "utf8");
  }
} finally {
  await rm(serverDirectory, { recursive: true, force: true });
}
