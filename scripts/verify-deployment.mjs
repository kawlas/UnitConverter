import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = new URL(process.env.BASE_URL ?? "http://127.0.0.1:4173");
const canonicalOrigin = new URL(
  process.env.CANONICAL_ORIGIN ?? "https://qconverter.netlify.app",
);
const verifyHostingHeaders = baseUrl.protocol === "https:";

const failures = [];
const pass = (message) => console.log(`PASS ${message}`);
const fail = (message) => failures.push(message);

const request = async (path, options = {}) => {
  const response = await fetch(new URL(path, baseUrl), options);
  return { response, body: options.method === "HEAD" ? "" : await response.text() };
};

const expect = (condition, message) => {
  if (condition) pass(message);
  else fail(message);
};

const localSitemap = await readFile(join(projectRoot, "public", "sitemap.xml"), "utf8");
const canonicalPaths = [...localSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, location]) => new URL(location).pathname);

for (const path of canonicalPaths) {
  const { response, body } = await request(path);
  const label = path === "/" ? "home" : path;
  expect(response.status === 200, `${label} returns 200`);
  expect(response.headers.get("content-type")?.startsWith("text/html"), `${label} serves HTML`);
  expect((body.match(/<title(?:\s[^>]*)?>/g) ?? []).length === 1, `${label} has one title`);
  expect((body.match(/<meta\b[^>]*name="description"/g) ?? []).length === 1, `${label} has one description`);
  expect((body.match(/<link\b[^>]*rel="canonical"/g) ?? []).length === 1, `${label} has one canonical`);
  expect(body.includes(`href="${new URL(path, canonicalOrigin).href}"`), `${label} canonical is correct`);
  expect(body.includes("<h1"), `${label} has first-response H1`);
  expect(!body.includes("Loading..."), `${label} contains resolved content`);
}

const redirectChecks = [["/convert/length?value=12", "/length?value=12"]];
for (const [source, target] of redirectChecks) {
  const { response } = await request(source, { redirect: "manual" });
  expect(response.status === 301, `${source} returns 301`);
  const location = response.headers.get("location");
  expect(Boolean(location) && new URL(location, baseUrl).pathname + new URL(location, baseUrl).search === target, `${source} redirects to ${target}`);
}

const trailingSlashChecks = [
  ["/length/?value=12", "/length"],
  ["/length/meters-to-feet/?value=2", "/length/meters-to-feet"],
];
for (const [source, canonicalPath] of trailingSlashChecks) {
  const { response, body } = await request(source, { redirect: "manual" });
  expect(response.status === 200, `${source} returns 200 without a redirect loop`);
  expect(
    body.includes(`href="${new URL(canonicalPath, canonicalOrigin).href}"`),
    `${source} advertises ${canonicalPath} as canonical`,
  );
}

const missing = await request("/__deployment-verifier-missing-route__");
expect(missing.response.status === 404, "unknown route returns 404");
expect(/<meta\s+name="robots"\s+content="noindex, follow"/.test(missing.body), "404 response is noindex");

const robots = await request("/robots.txt");
expect(robots.response.status === 200, "robots.txt returns 200");
expect(robots.response.headers.get("content-type")?.startsWith("text/plain"), "robots.txt has text MIME");
expect(robots.body.includes(`${canonicalOrigin.origin}/sitemap.xml`), "robots.txt advertises the canonical sitemap");

const sitemap = await request("/sitemap.xml");
expect(sitemap.response.status === 200, "sitemap.xml returns 200");
expect(sitemap.response.headers.get("content-type")?.includes("xml"), "sitemap.xml has XML MIME");
expect(canonicalPaths.every((path) => sitemap.body.includes(new URL(path, canonicalOrigin).href)), "deployed sitemap contains every canonical URL");

const home = await request("/");
const entryAsset = home.body.match(/<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
expect(Boolean(entryAsset), "home references a hashed entry asset");
if (entryAsset) {
  const asset = await request(entryAsset, { method: "HEAD" });
  expect(asset.response.status === 200, "hashed entry asset returns 200");
  expect(asset.response.headers.get("content-type")?.includes("javascript"), "hashed entry asset has JavaScript MIME");
  if (verifyHostingHeaders) {
    const cacheControl = asset.response.headers.get("cache-control") ?? "";
    expect(cacheControl.includes("max-age=31536000") && cacheControl.includes("immutable"), "hashed assets use immutable annual caching");
  }
}

const manifest = await request("/manifest.webmanifest", { method: "HEAD" });
expect(manifest.response.status === 200, "manifest returns 200");
expect(manifest.response.headers.get("content-type")?.includes("application/manifest+json"), "manifest has webmanifest MIME");

const serviceWorker = await request("/sw.js", { method: "HEAD" });
expect(serviceWorker.response.status === 200, "service worker returns 200");
if (verifyHostingHeaders) {
  const cacheControl = serviceWorker.response.headers.get("cache-control") ?? "";
  expect(cacheControl.includes("no-cache") && cacheControl.includes("no-store"), "service worker is never stored stale");
  const securityHeaders = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "x-frame-options": "DENY",
  };
  for (const [name, value] of Object.entries(securityHeaders)) {
    expect(home.response.headers.get(name) === value, `${name} security header is correct`);
  }
}

if (failures.length > 0) {
  console.error(`\nDeployment verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`\nDeployment verification passed for ${baseUrl.origin} (${canonicalPaths.length} canonical routes).`);
}
