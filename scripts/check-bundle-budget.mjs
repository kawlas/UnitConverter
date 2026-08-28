import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDirectory = join(projectRoot, "dist", "assets");
const assets = await readdir(assetsDirectory);

const asset = async (prefix, extension) => {
  const matches = assets.filter((file) => file.startsWith(`${prefix}-`) && file.endsWith(extension));
  if (matches.length !== 1) {
    throw new Error(`Expected one ${prefix}-*${extension} asset, found: ${matches.join(", ") || "none"}`);
  }
  const contents = await readFile(join(assetsDirectory, matches[0]));
  return { file: matches[0], raw: contents.byteLength, gzip: gzipSync(contents, { level: 9 }).byteLength };
};

const chunks = {
  entry: await asset("index", ".js"),
  styles: await asset("index", ".css"),
  react: await asset("react-vendor", ".js"),
  utils: await asset("utils-vendor", ".js"),
  navbar: await asset("Navbar", ".js"),
  home: await asset("HomePage", ".js"),
  converter: await asset("ConverterPage", ".js"),
};

const totals = {
  home: chunks.entry.gzip + chunks.react.gzip + chunks.utils.gzip + chunks.navbar.gzip + chunks.home.gzip,
  converter: chunks.entry.gzip + chunks.react.gzip + chunks.utils.gzip + chunks.navbar.gzip + chunks.converter.gzip,
};

const budgets = [
  ["shared entry JavaScript", chunks.entry.gzip, 70_000],
  ["converter route chunk", chunks.converter.gzip, 20_000],
  ["compiled CSS", chunks.styles.gzip, 12_000],
  ["home route JavaScript", totals.home, 125_000],
  ["converter route JavaScript", totals.converter, 135_000],
];

const format = (bytes) => `${(bytes / 1024).toFixed(2)} KiB gzip`;
const failures = [];
for (const [label, actual, limit] of budgets) {
  const line = `${label}: ${format(actual)} / ${format(limit)}`;
  if (actual > limit) failures.push(line);
  else console.log(`PASS ${line}`);
}

if (failures.length > 0) {
  throw new Error(`Bundle budget exceeded:\n${failures.map((line) => `- ${line}`).join("\n")}`);
}
