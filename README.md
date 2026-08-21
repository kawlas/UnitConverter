# Q Converter

A precise, shareable online measurement studio for everyday unit conversions.

- **Live:** <https://qconverter.netlify.app>
- **Source:** <https://github.com/kawlas/UnitConverter>
- **Stack:** React 19 · TypeScript · Vite 7 · Tailwind v4

## What it does

Q Converter provides a typed catalog of standard conversion formulas, including linear,
affine, custom, and BMI calculations. Each converter supports URL-restored state, unit
swap, reset, precision (0–12 decimals), locale-aware formatting (`en-US`, `pl-PL`,
`de-DE`, `fr-FR`), copy/share links, favorites, recent history, and clear saved data.
History and favorites expire from `localStorage` after 30 days. Category pages provide
SEO metadata, structured data, canonical short routes, and a `/convert/:categoryId` alias.
The responsive navigation includes a keyboard-accessible mobile menu.

## Local development

```sh
npm ci
npm run dev
```

If Playwright browsers are missing, install Chromium before E2E:

```sh
npx playwright install --with-deps chromium
```

## Verification

```sh
npm run test:critical
npm run test:e2e
BASE_URL=https://qconverter.netlify.app npm run test:e2e
npm run build
git diff --check
```

The shipped redesign baseline is 21/21 unit tests, 15/15 E2E tests, axe 4/4 with no
serious/critical violations, responsive overflow 4/4, and passing URL-state, swap, title,
and canonical checks. Re-run the commands for fresh evidence; the baseline is not a claim
about an untested change.

## Code map

- `src/App.tsx` — routing; `src/pages/HomePage.tsx` and `ConverterPage.tsx` — pages.
- `src/components/` — `Navbar`, `Footer`, `SearchBar`, `ConversionSection`, and `BMICalculator`.
- `src/lib/conversion-data.ts` and `src/lib/conversions.ts` — catalog and conversion engine.
- `src/index.css` — Tailwind v4 entry, tokens, base and responsive constraints.
- `vite.config.ts`, `tests/e2e/smoke.pw.ts`, `.github/workflows/production-smoke.yml`, and `netlify.toml` — build, smoke coverage, CI, and Netlify deployment.

The visual direction is a calm, high-contrast measurement studio: dark navy hero, white
surfaces, indigo actions, teal success accents, slate borders, rounded cards, restrained
shadows, and clear system/Inter typography. Keep the minimum viewport at 320px, avoid
page-level horizontal overflow, stack narrow layouts, preserve 44px touch targets and
focus states, and keep wide tables inside local scrollers. Token values and the full map
live in [`docs/PROJECT.md`](docs/PROJECT.md).

## Deployment

Use a branch, run checks, commit, push, open a PR, and merge after review. For a manual
production deploy:

```sh
npx netlify link --name qconverter
npx netlify deploy --prod --dir=dist
BASE_URL=https://qconverter.netlify.app npm run test:e2e
```

Then clean up `.netlify` and its `.gitignore`, and verify `git diff --check`. Netlify PR
preview checks can fail due to external integration permissions; manual production deploy
and the `production-smoke` workflow remain available. CodeQL is currently removed because
the private repository lacks purchased GHAS; revisit only after a GHAS purchase/public-repo
decision. Investigate the Netlify integration and rerun Lighthouse after material UI
changes.

## Agent and safety notes

Read root [`AGENTS.md`](AGENTS.md), then [`docs/PROJECT.md`](docs/PROJECT.md), then Wiki
`[[unit-converter]]`/`Wiki/log.md` when available. Use a branch for every task and never
work directly on `main`. Do not edit `Clippings/` or `raw/`, add secrets, or report tests,
deploys, or other verification without fresh evidence. Documentation-only handoffs must
not modify source, package files, Wiki, or commit unless explicitly requested.
