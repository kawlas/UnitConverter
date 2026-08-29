# Height converter sprint — 2026-08-29

## Project brief

- Product: **Q Converter**, an English-language, privacy-friendly measurement tool.
- Audience: people translating personal height, forms, sports profiles, clothing references and international records between metric and feet-plus-inches notation.
- Primary job: answer `180 cm in feet and inches` or reverse a feet-and-inches height without manual remainder arithmetic.
- Primary conversion: obtain a human-readable result immediately. Secondary actions: swap direction, copy and share a stable URL.
- Canonical route: `/height`; no generated value-specific pages.
- Guardrails: exact inch definition, local-only calculation, non-negative values, inches below 12, 320 px support, no medical or population claims.
- Release boundary: branch and commit only; no merge or production mutation without explicit approval.

## Demand and competitor evidence

- Current search results contain dedicated answers and tools for `180 cm in feet and inches`, including a copy-ready compound answer: [The Calculator Site](https://www.thecalculatorsite.com/conversions/height/180cm).
- A current two-way competitor exposes centimeters, feet plus inches, decimal feet and quick common-height values in one tool: [Calculator App](https://calculatorapp.io/math/cm-to-feet.html).
- A user describes repeatedly needing `163cm in feet and inches` rather than a decimal-foot result: [r/raycastapp](https://www.reddit.com/r/raycastapp/comments/1hmzak5/i_just_want_to_quickly_convert_centimeters_to/).
- These are intent and workflow signals, not a volume forecast. Search Console remains the release measurement source.

## Visible change

Current: Q Converter handles compound source input such as `5'11" in cm`, but `180 cm in feet and inches` has no matching target and the general length converter returns decimal feet or total inches.

Proposed: add a dedicated two-way Height Calculator immediately below its H1. The metric direction accepts centimeters and returns whole feet plus remaining inches; reverse mode uses separate feet and inches fields. The home instant-answer parser opens the exact same shareable calculator state.

## Acceptance and rollback

- `180 cm` displays `5 ft 10.87 in` at two-decimal precision.
- `5 ft 11 in` displays `180.34 cm`; rounding to 12 inches carries into the next foot.
- Swap preserves the exact underlying quantity rather than reusing only the rounded label.
- Invalid, negative, non-finite and `12+` inch remainder inputs fail closed with actionable feedback.
- The first-response HTML contains a working default answer, unique metadata, FAQ schema, exact method and NIST/BIPM sources.
- Sitemap, redirects, prerender routes, service-worker precache and crawler contracts include `/height`.
- Input, result, swap and copy remain visible without scrolling at 320×568; axe and overflow checks pass.
- Targeted unit/E2E tests, lint, build, bundle budgets and `git diff --check` pass.
- Rollback removes the category, component, parser branch, crawler entries and this brief without changing existing URLs.
