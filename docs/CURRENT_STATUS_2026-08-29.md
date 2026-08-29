# Q Converter — current status and next goal

Updated: 2026-08-29. This document describes repository work in progress; it does not claim that unmerged changes are live in production.

## Product goal

Make Q Converter the fastest trustworthy answer to everyday conversion questions: the input and answer must be visible immediately, natural-language queries must open the correct calculator state, results must be accurate and shareable, and every indexable page must solve a real search intent. Growth is measured with Search Console impressions, clicks, queries and field performance—not promised rankings or invented traffic forecasts.

## Current product candidate

- 17 tools: 14 standard unit categories plus dedicated Height, BMI and Grams-to-Cups calculators.
- 22 curated pair-intent pages with unique formulas, examples, canonical URLs and internal links.
- Home instant answers for queries such as `10 kg to g`, `5 ha to m²`, `7 L/100km to mpg`, and `180 cm in feet and inches`.
- Search results render inside the hero's normal document flow, so the hero frame expands instead of clipping the dropdown after typing.
- Responsive primary controls, keyboard navigation, copy/share actions, URL-restored state, local history/favorites, privacy-gated analytics, prerendered HTML, crawler files and an offline-capable PWA.
- Advertising components are layout-stable placeholders only; real ads require an approved publisher account, consent configuration and performance review.

## Release and review state

- The release candidate was staged and reviewed as a linear stack: growth foundation, home instant-answer UX, then the height calculator.
- The user explicitly approved the merge on 2026-08-29. The stack is merged in dependency order only after local checks and required GitHub checks pass.
- An invalid `GITHUB_TOKEN` environment override initially caused a `401`; the secret was never printed, and GitHub access was restored by using the authenticated keyring session.

## What is completed in this branch

- Exact centimeters ↔ feet-plus-inches math, strict validation and rounding carry behavior.
- A compact `/height` calculator with swap, decimals, copy result, copy link and URL state.
- Home-query support for metric height expressed as feet and inches.
- Canonical route, prerender/sitemap/redirect integration, FAQ content and methodology references.
- Regression coverage for math, smart query, crawler contracts, mobile layout and accessibility.
- Project documentation updated to the current 17-tool and 22-pair-page architecture.

## Next work after review

1. Review the stacked pull requests and merge only after approval, then verify the actual production HTML and primary mobile workflows.
2. Connect Search Console, submit the canonical sitemap and record a 28-day baseline by query, landing page, country and device.
3. Use real impressions and weak click-through pages to choose the next pair pages or calculator—not raw page count.
4. Measure field Core Web Vitals and ad-slot layout stability before enabling live ads; keep the converter above ads.
5. Enable GA4 only after disabling automatic browser-history pageviews in the property and confirming consent behavior.

## External gates

- GitHub authentication/review and explicit merge approval.
- Search Console ownership and sitemap submission.
- GA4 property-side Enhanced Measurement setting.
- AdSense or another ad-network account approval, consent requirements and publisher identifiers.
