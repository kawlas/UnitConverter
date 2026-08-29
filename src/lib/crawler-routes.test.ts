import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categories as categoryDefinitions } from "./conversion-data";
import { pairPagePath, pairPages } from "./pair-pages";

const projectFile = (...segments: string[]) =>
  readFileSync(join(process.cwd(), ...segments), "utf8");

const canonicalPaths = [
  "/",
  ...categoryDefinitions.map(({ id }) => `/${id}`),
  ...pairPages.map(pairPagePath),
];

describe("crawler and route contracts", () => {
  it("publishes a permissive robots file that points at the production sitemap", () => {
    const robots = projectFile("public", "robots.txt");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(
      "Sitemap: https://qconverter.netlify.app/sitemap.xml",
    );
  });

  it("lists every canonical category and no aliases in the XML sitemap", () => {
    const sitemap = projectFile("public", "sitemap.xml");
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, location]) => location,
    );

    expect(sitemap).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(locations).toEqual(
      canonicalPaths.map((path) => `https://qconverter.netlify.app${path}`),
    );
    expect(locations.some((url) => url.includes("/convert/"))).toBe(false);
  });

  it("redirects the legacy alias without soft-404 catch-all rewrites", () => {
    const redirectLines = projectFile("public", "_redirects")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(redirectLines[0]).toBe(
      "/convert/:categoryId /:categoryId 301!",
    );
    const prerenderedPaths = [
      ...categoryDefinitions.map(({ id }) => `/${id}`),
      ...pairPages.map(pairPagePath),
    ];
    expect(redirectLines.slice(1)).toEqual(
      prerenderedPaths.map((path) => `${path} ${path}/index.html 200!`),
    );
    expect(redirectLines.some((line) => /\/\s+\/.*301!$/.test(line))).toBe(false);
    expect(redirectLines.some((line) => line.startsWith("/* "))).toBe(false);
  });

  it("ships a standalone noindex page for unknown routes", () => {
    const notFound = projectFile("public", "404.html");

    expect(notFound).toMatch(/<meta\s+name="robots"\s+content="noindex, follow"/);
    expect(notFound).toMatch(/<h1[^>]*>Page not found<\/h1>/);
    expect(notFound).toContain('href="/"');
  });

  it("sets baseline response security headers without a brittle CSP", () => {
    const netlify = projectFile("netlify.toml");

    expect(netlify).toContain('X-Content-Type-Options = "nosniff"');
    expect(netlify).toContain('Referrer-Policy = "strict-origin-when-cross-origin"');
    expect(netlify).toContain(
      'Permissions-Policy = "camera=(), microphone=(), geolocation=()"',
    );
    expect(netlify).toContain('X-Frame-Options = "DENY"');
    expect(netlify).toContain("[build.processing.html]");
    expect(netlify).toContain("pretty_urls = false");
    expect(netlify).not.toContain("Content-Security-Policy");
  });

  it("defines a standards-compliant installable app manifest", () => {
    const manifest = JSON.parse(projectFile("public", "manifest.webmanifest"));

    expect(manifest).toMatchObject({
      id: "/",
      name: "Q Converter — Measurement Studio",
      short_name: "Q Converter",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#0f172a",
      background_color: "#0f172a",
    });
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/pwa-192.png", sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ src: "/pwa-512.png", sizes: "512x512", type: "image/png" }),
    ]));
  });
});
