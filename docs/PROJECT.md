# Q Converter project handoff

## Identity and current state

- **Product:** Q Converter, a modern measurement-studio frontend.
- **Stack:** React 19, TypeScript, Vite 7, Tailwind v4.
- **Production:** <https://qconverter.netlify.app>
- **Repository:** <https://github.com/kawlas/UnitConverter>
- **Shipped redesign:** PR #31, merge `611658f`.
- **Latest production deploy:** `6a88522abce553be2b8d4f85`.
- CSS is restored using Tailwind v4 syntax (`@import "tailwindcss"` plus the project config).
- Conversion history and favorites use `localStorage` with a 30-day TTL; users can clear saved data.
- Playwright and axe coverage are part of the test surface.
- The CodeQL workflow was removed because this private repository does not have purchased GitHub Advanced Security (GHAS). The `production-smoke` workflow remains.

This document is the detailed project reference. Agents must read the root `AGENTS.md`,
then this file, then Wiki `[[unit-converter]]` and `Wiki/log.md` when available. Work on a
branch for every task; never work directly on `main`.

## Architecture map

- `src/App.tsx` — React Router route table and lazy page loading.
- `src/pages/HomePage.tsx` — search-led home page, category cards, FAQ, metadata.
- `src/pages/ConverterPage.tsx` — category page, formula/examples/FAQ, metadata and canonical URL.
- `src/components/Navbar.tsx`, `Footer.tsx`, `SearchBar.tsx` — global navigation and discovery UI.
- `src/components/ConversionSection.tsx` — inputs, URL state, conversion controls, history, favorites, sharing, locale and precision.
- `src/components/AllUnitsComparison.tsx` — accessible, responsive table that compares one input across the complete category catalog.
- `src/components/BatchConversion.tsx` — local, bounded multi-value conversion with per-row validation and copy-all output.
- `src/components/BMICalculator.tsx` — BMI-specific calculator UI.
- `src/components/HeightCalculator.tsx` — exact two-way centimeters ↔ feet-plus-inches calculator with shareable state.
- `src/components/CookingCalculator.tsx` — ingredient-aware grams ↔ US cups calculator.
- `src/lib/conversion-data.ts` / `src/lib/conversions.ts` — typed catalog, unit definitions and exact conversion engine.
- `src/lib/pair-pages.ts` — small registry of quality-gated pair-intent pages and their unique copy and examples.
- `src/lib/smart-query.ts` — deterministic, local parser for typed queries such as `5 ft to cm`.
- `src/components/ConnectivityStatus.tsx`, `InstallAppButton.tsx` — progressive offline and native-install UX.
- `public/manifest.webmanifest` — install identity, branded icons and category shortcuts.
- `scripts/generate-service-worker.mjs` — final build step that fingerprints and precaches the current prerendered product.
- `scripts/check-bundle-budget.mjs` — build gate for compressed CSS and route-level JavaScript budgets.
- `scripts/verify-deployment.mjs` — live HTTP gate for canonical HTML, redirects, crawler files, MIME, cache and security headers.
- `src/index.css` — Tailwind v4 entry point, theme variables, base styles and overflow/accessibility guards.
- `vite.config.ts` — Vite/React plugin, aliases and production chunking.
- `tests/e2e/smoke.pw.ts` — styling, responsive overflow, title, URL state, swap, canonical, saved controls, navigation and axe smoke tests.
- `.github/workflows/production-smoke.yml` — scheduled/manual production E2E smoke run.
- `netlify.toml` — `npm run build` and `dist` publish configuration.

## Product behavior

The app exposes a typed catalog of measurement categories and exact standard conversion
formulas, including linear and affine units plus custom conversions and dedicated height,
BMI and cooking calculators. A standard conversion
is encoded in shareable URL query state (`from`, `to`, `value`, `precision`, and `locale`),
so a copied link restores the same inputs. Standard converters accept strict locale-aware
decimals, ASCII or Unicode-slash fractions, mixed numbers and common vulgar fraction
characters; malformed fractions and zero denominators are rejected. Users can swap units, reset a category, copy or
share a URL, copy the exact visible localized result, save favorites, revisit recent history,
and clear saved data. History and favorites are retained for at most 30 days and tolerate
unavailable or malformed browser
storage. Every standard category also shows the current input across all supported units;
any comparison row can become the primary target without re-entering the value.
An optional batch panel converts up to 100 non-empty lines locally, rejects oversized
input as a whole and copies only successful rows. The primary unit controls use native
select elements for accessible platform pickers and a substantially smaller route bundle.
Cooking-oriented volume entries are explicitly labelled as US customary liquid measures
to avoid silently mixing them with Imperial, metric-cooking or US dry variants. The weight
catalog identifies stone as the British 14-pound unit.
Twenty-two curated pair routes provide focused formulas and worked examples for selected
high-utility conversions. They are explicitly prerendered, self-canonical, listed in the
sitemap and linked from their parent category; unsupported pairs remain real noindex 404s.
The home search also recognizes explicit value/source/target queries such as `5 ft to cm`,
previews the result locally and opens canonical shareable calculator state. It never calls
an LLM or backend, preserves case-sensitive digital symbols (`b`, `B`, `kb`, `kB`) and asks
the user to clarify ambiguous or incompatible units instead of guessing.
The special height intent `180 cm in feet and inches` is resolved locally into a natural
compound result and opens `/height` with exact, shareable state. The height calculator
accepts non-negative centimeters or whole feet plus an inch remainder below 12, uses the
exact international inch definition, and keeps rounding as presentation only.

Supported presentation behavior includes `en-US`, `pl-PL`, `de-DE`, and `fr-FR` number
locales, precision from 0–12 decimals, category SEO metadata, canonical short routes, the
`/convert/:categoryId` alias, FAQ/structured data, and a keyboard-accessible mobile menu.

The production artifact is also an installable progressive web app. Its generated,
content-versioned service worker precaches every canonical prerendered tool and hashed
application asset. Navigations remain network-first for fresh HTML, then fall back to the
matching cached canonical route without persisting conversion query values as cache keys.
Hashed assets are cache-first, cross-origin requests are never intercepted, stale product
caches are removed during activation, and registration failure never blocks the converter.
An install action appears only when the browser exposes its native install prompt; a small
live status explains when the product is operating offline.

Optional GA4 analytics is blocked at build time unless
`VITE_GA4_MANUAL_PAGEVIEWS_READY=true`. Before enabling that flag, the GA4 web stream must
have Enhanced Measurement → Page views → **Page changes based on browser history events**
disabled. [Google documents that `send_page_view: false` does not disable those automatic
history events](https://developers.google.com/analytics/devguides/collection/ga4/views#disable_page_changes_based_on_browser_history_events).
The app then loads GA4 only after an explicit opt-in, sends manual SPA pageviews with
`origin + pathname` (never URL query state), expires the stored choice after
30 days, and lets the user reopen or revoke the choice from the footer. Without the build
flag, no analytics UI or Google analytics script is shipped. Recheck the external GA4
setting before every environment enables the flag; the repository cannot enforce a
property-side setting.
After opt-in, bounded product events measure completed conversions, result/link copying,
native sharing, favorite changes, saved-conversion playback, saved-data clearing and batch
copying. They also distinguish a successful instant conversion query from a successful
single-category search selection. Event payloads contain only an allowlisted event name and
a validated category ID; they never include search text, entered values, unit selections,
result text or URL query parameters.

## Design direction and constraints

The shipped redesign is a calm, high-contrast measurement studio: a dark navy hero,
white surfaces, indigo primary actions and teal success accents. Keep typography clear and
compact (Inter/system sans, strong heading hierarchy, restrained uppercase labels), with
rounded cards, thin slate borders, and light depth rather than decorative UI.

Core tokens in `src/index.css`:

| Token | Light value | Dark value |
| --- | --- | --- |
| `--canvas` | `#F6F8FC` | `#0F172A` |
| `--surface` | `#fff` | `#1E293B` |
| `--ink` | `#0F172A` | `#F6F8FC` |
| `--muted-ink` | `#475569` | `#CBD5E1` |
| `--line` | `#64748B` | `#94A3B8` |
| `--indigo` | `#4F46E5` | `#818CF8` |
| `--success` | `#0F766E` | `#2DD4BF` |

Responsive rules are intentional: support a minimum 320px viewport; prevent document/body
horizontal overflow; use constrained `max-w-7xl` content; stack converter controls and
cards on small screens; keep controls at least 44px high/wide; use a desktop category nav
from `md` upward and a scrollable, keyboard-safe mobile menu below it; and contain any
wide example table inside its own horizontal scroller. Preserve visible focus outlines,
accessible labels/live results, and touch-sized targets.

## Verification and acceptance baseline

Run from the repository root:

```sh
npm ci
npm run test:critical
npm run test:e2e
BASE_URL=https://qconverter.netlify.app npm run verify:deployment
BASE_URL=https://qconverter.netlify.app npm run test:e2e
npm run build
git diff --check
```

When Playwright browsers are missing, run `npx playwright install --with-deps chromium`
(or the platform-appropriate browser install) before E2E. The recorded shipped-redesign
acceptance baseline is **21/21 unit tests**, **15/15 E2E tests**, **axe 4/4 with no
serious/critical violations**, **responsive overflow 4/4**, and passing URL-state, swap,
title, and canonical-route checks. Treat these numbers as a baseline to re-run—not as a
claim of fresh verification for an untested change.

## Deployment procedure

1. Create/use a task branch; never deploy unreviewed work from `main`.
2. Install dependencies and run critical, local E2E, build, and diff checks.
   Confirm that `dist/manifest.webmanifest`, the PWA/touch icons and the generated `dist/sw.js`
   exist; the PWA E2E test verifies a controlled page and a real offline conversion.
3. Commit, push, and open a PR; merge only after review.
4. Link the production site when needed: `npx netlify link --name qconverter`.
5. Deploy the built output: `npx netlify deploy --prod --dir=dist`.
6. Run production E2E: `BASE_URL=https://qconverter.netlify.app npm run test:e2e`.
   Run `BASE_URL=https://qconverter.netlify.app npm run verify:deployment` first for
   fast status, canonical, header and caching diagnostics.
7. Remove deployment-local artifacts from the working tree (`.netlify` and its
   `.gitignore`) and verify the final diff before handoff.

Do not place Netlify tokens or other secrets in files or command output. A production
smoke pass is evidence for that deploy only; do not generalize it to unrelated changes.

## Known limits and next steps

- Netlify automatic PR preview checks may fail because the external integration lacks
  permissions; manual production deploy and the production-smoke workflow work.
- Re-enable CodeQL only after a GHAS purchase or a decision to make the repository public.
- Investigate and repair the Netlify integration when access is available.
- Rerun Lighthouse after material UI or loading changes; the existing audit is not a
  permanent performance guarantee.
- The build now fails when the compressed converter chunk, compiled CSS or route-level
  JavaScript exceeds its recorded budget. Adjust a budget only with a measured reason.
- Native install promotion varies by browser and platform. The app remains fully usable
  when `beforeinstallprompt` is unavailable and relies on the browser's own Add to Home
  Screen or Add to Dock flow.
