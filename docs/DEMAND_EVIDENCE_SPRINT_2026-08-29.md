# Demand evidence sprint — 2026-08-29

## Project brief

- Product: **Q Converter**, an English-language, privacy-friendly unit converter.
- Audience: everyday, travel, property, cooking, vehicle and education users in the US, UK and metric markets; Poland, Germany and France were included in discovery.
- Primary conversion: complete a correct conversion immediately. Secondary conversions: copy, share, save and return.
- Search goal: grow non-brand traffic through useful pair pages, without promising rankings or manufacturing thin pages.
- Baseline: production exposes 29 canonical URLs with prerendered titles, descriptions, canonicals, H1s and resolved content. GA4 is consent-gated, but no Search Console or Bing verification is present in the repository and no query-volume export was available.
- Guardrails: preserve existing URLs, calculator-first UX, explicit US/Imperial variants, sourced factors, 320 px support and the 30-day local-data TTL. No live currency, medical claims or density-blind grams-to-cups pages.
- Review windows: validate crawlability at release, then review Search Console impressions and query coverage after 7, 28 and 56 days.

## Method and limitations

This expansion uses localized Google autocomplete observations and current competitor/SERP coverage for the US, UK, Poland, Germany and France. Autocomplete is evidence that a query pattern exists, not a search-volume estimate. No Ahrefs, Keyword Planner or Search Console volume was available, so the pages below are a controlled discovery cluster rather than a traffic forecast.

Observed autocomplete examples included:

- US: `kg to lbs`, `kg to stone`, `square feet to m2`, `mph to kmh`, `miles to km`, `grams to ounces`, `cups to ml`;
- UK: `stone to kg`, `mpg to l/100km`, `mpg to l/100km uk`;
- Poland: `hektar na m2`, `hektar na m2 kalkulator`, `m2 na ha`, `kg na gramy`;
- Germany: `cm in zoll`, `liter pro 100 km in mpg`, `umrechnung mpg in liter pro 100 km`;
- France: `kg en lbs`, `kg en livres`, `kg en g`, `cm en pouce`.

Primary discovery sources:

- [Google autocomplete — US kg](https://suggestqueries.google.com/complete/search?client=firefox&q=kg%20to&hl=en&gl=us)
- [Google autocomplete — US area](https://suggestqueries.google.com/complete/search?client=firefox&q=square%20feet%20to&hl=en&gl=us)
- [Google autocomplete — US speed](https://suggestqueries.google.com/complete/search?client=firefox&q=mph%20to&hl=en&gl=us)
- [Google autocomplete — UK stone](https://suggestqueries.google.com/complete/search?client=firefox&q=stone%20to&hl=en&gl=gb)
- [Google autocomplete — UK fuel](https://suggestqueries.google.com/complete/search?client=firefox&q=mpg%20to&hl=en&gl=gb)
- [Google autocomplete — Polish area](https://suggestqueries.google.com/complete/search?client=firefox&q=hektar%20na&hl=pl&gl=pl)
- [Google autocomplete — German fuel](https://suggestqueries.google.com/complete/search?client=firefox&q=liter%20pro%20100%20km%20in&hl=de&gl=de)
- [Google autocomplete — French weight](https://suggestqueries.google.com/complete/search?client=firefox&q=kg%20en&hl=fr&gl=fr)
- [Google Search Help — supported conversion categories](https://support.google.com/websearch/answer/3284611?hl=en)
- [NIST — US customary to metric factors](https://www.nist.gov/pml/owm/metric-si/unit-conversion/approximate-conversions-us-customary-measures-metric)

## Controlled first cluster

| Proposed canonical page | Observed intent signal | Market signal | Confidence |
| --- | --- | --- | --- |
| `/length/miles-to-kilometers` | `miles to km` | US/global travel | High |
| `/speed/mph-to-kph` | `mph to kmh`, `mph to kph` | US/global driving | High |
| `/weight/grams-to-ounces` | `grams to ounces`, `grams to oz` | US cooking/products | High |
| `/volume/us-cups-to-milliliters` | `cups to ml` | US recipes | High |
| `/weight/stone-to-kilograms` | `stone to kg` | UK/Ireland weight | High |
| `/area/square-feet-to-square-meters` | `square feet to m2` | US/global property | High |
| `/area/hectare-to-square-meters` | `hektar na m2` | Poland/metric land | High |
| `/area/square-meters-to-hectare` | `m2 na ha` | Poland/metric land | High |
| `/fuel/miles-per-gallon-to-liters-per-100km` | `mpg to l/100km` | US/imported vehicles | High |
| `/fuel/miles-per-imperial-gallon-to-liters-per-100km` | `mpg to l/100km uk` | UK vehicles | High |

## Visible content diff

Current state: each intent falls back to a broad category page, so the title, examples and formula do not answer the exact pair query.

Proposed state: each route receives a unique pair-specific title, short task-focused introduction, explicit formula, five or more practical examples, preselected calculator units and links to its category and related pair pages. US cups and US/UK MPG are named explicitly; no generic gallon or cup is silently assumed.

## Acceptance and rollback

- Every new page must use supported catalog units and compute every published example.
- Titles, descriptions, introductions, formulas and canonical paths remain unique.
- Sitemap, redirect rules, prerender routes and internal links stay synchronized through contract tests.
- Production verification must confirm resolved first-response content, canonical URL, H1, JSON-LD and a real 404 boundary.
- Rollback: remove the ten pair definitions and their generated sitemap/redirect entries; existing category and pair URLs remain unchanged.

Expansion beyond this cluster is blocked until Search Console or equivalent query evidence shows which pages receive impressions and which adjacent intents deserve dedicated pages.
