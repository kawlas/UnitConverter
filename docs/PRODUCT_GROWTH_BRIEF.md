# Q Converter product and growth brief

Last reviewed: 2026-08-28

## Product and audience

- Product: **Q Converter**, a privacy-friendly measurement studio at
  <https://qconverter.netlify.app>.
- Primary audiences: people making everyday, educational, cooking, travel,
  engineering, fitness and digital-data conversions.
- Current language: English UI and content. `en-US`, `pl-PL`, `de-DE` and
  `fr-FR` currently control number formatting only; they are not translated
  site variants.
- Primary conversion: complete a correct unit conversion.
- Secondary conversions: copy a result or shareable URL, save a favorite,
  replay recent work, install or revisit the product.

## Search and growth goals

- Aspirational outcome: become a leading unit-conversion product and grow toward
  one million monthly sessions. Ranking and traffic are outcomes to measure, not
  promises a release can guarantee.
- Initial search intents: category converters such as length, weight,
  temperature and digital data; then researched pair intents such as metres to
  feet, kilograms to pounds and Celsius to Fahrenheit.
- Growth model: indexable technical foundation -> useful sourced category
  content -> a small quality-gated pair-page cluster -> retention features ->
  distribution through share links, embeds and offline use.
- Baseline analytics, Search Console demand and backlink data are not available
  in the repository. They must be captured before setting traffic forecasts.

## Verified product facts

- React 19, TypeScript, Vite 7 and Tailwind 4 hosted on Netlify.
- Fifteen tools: fourteen conversion categories and a BMI calculator.
- The conversion engine supports linear, affine and custom formulas.
- Conversion URL state includes units, value, precision and number locale.
- Favorites and history use browser storage with a 30-day TTL.
- The production app is currently a client-rendered SPA.

## Guardrails

- Preserve canonical short routes, shareable URL state, conversion accuracy,
  keyboard semantics, 320 px support and the 30-day saved-data TTL.
- Do not add unverified ratings, prices, standards, medical claims or conversion
  factors.
- Health content requires conservative wording, a named primary source and a
  clear statement of limitations.
- Do not introduce authentication, cloud sync, live currency or a backend as an
  incidental UI/SEO change. Those require explicit architecture and privacy
  review before external resources are created.
- No production deploy or merge is implied by implementation work; release
  remains a separate approval gate.

## Production baseline (2026-08-28)

- `/`, `/length`, `/convert/length`, an unknown URL, `/robots.txt` and
  `/sitemap.xml` all returned `200 text/html` with the same app-shell response.
- First-response HTML contained a generic title and an empty `#root`, but no
  route-specific H1, canonical, description or structured data.
- `robots.txt` and `sitemap.xml` were not real crawler resources.
- Unknown routes were soft 404s and the alias route returned 200 rather than a
  redirect.
- `npm ci` on current `origin/main` failed because `package.json` requested
  `react-resizable-panels` 3.x while the lockfile resolved 4.11.2.

## Delivery stages and acceptance criteria

1. **Reliability and security foundation**
   - clean `npm ci`, unit/lint/build checks on pull requests;
   - remove the production Tempo proxy script;
   - protect environment files and add conservative response headers.
2. **Crawler and routing foundation**
   - real `robots.txt`, canonical-only sitemap and 301 alias redirects;
   - unknown routes return a real 404 with `noindex`;
   - contract tests keep routes and crawler files synchronized.
3. **Indexable HTML**
   - `/` and every canonical category return unique first-response title,
     description, canonical, H1, useful content and valid JSON-LD without JS.
4. **Core UX quality**
   - no history entry for the untouched default value;
   - accessible search combobox and 320 px/zoom/reduced-motion coverage;
   - safe BMI copy and shareable BMI state.
5. **Content and product expansion**
   - sourced methodology and unit definitions;
   - a small, research-backed pair-page cluster with unique examples and tables;
   - compare-all, natural-language input and PWA experiments.

The first implementation slices now cover sourced methodology, compare-all results, an
eight-page curated pair cluster, deterministic local conversion queries and an installable,
offline-capable PWA. Standard converters also accept strict fraction and mixed-number input,
supporting cooking, construction and craft workflows without adding category-specific UI.
The existing volume and weight tools now cover explicitly named US liquid cooking measures
and British stone, extending real utility without creating new low-value routes.
Pair expansion must wait for Search Console evidence and continue to
pass the uniqueness and real-404 quality gates. Retention should be measured through repeat
usage and install events only after the privacy-safe analytics release gate is enabled.

## KPIs and review windows

- 0-14 days after release: all canonical URLs have complete first-response HTML;
  no known soft 404s; crawler resources and redirects pass live HTTP checks.
- 14-28 days: valid schema, verified single analytics page views and field CWV
  collection.
- 28-56 days: monitor Search Console canonical selection, non-brand impressions,
  indexed pages and query coverage; Google retains final canonical/indexing
  control.
- 8-12 weeks per content cluster: compare impressions, CTR at comparable average
  position, conversion completion and return usage against the pre-release
  baseline.

## Primary research references

- Google Search Central: JavaScript SEO, canonicalization, sitemaps, AI features
  and structured-data documentation.
- web.dev: Core Web Vitals thresholds (LCP <= 2.5 s, INP <= 200 ms,
  CLS <= 0.1 at the 75th percentile).
- MDN Progressive Web Apps: installability requires a linked web app manifest and HTTPS;
  service workers can provide offline behavior but remain a progressive enhancement.
- BIPM, NIST and IEC sources will be required before publishing detailed unit
  methodology or standards claims.
