# Ingredient-aware cooking converter brief

## Business and audience

- Product: Q Converter.
- Audience: home cooks and bakers converting recipe mass and US customary volume.
- Primary job: answer "how many US cups is this many grams?" without implying that every ingredient has the same mass per cup.
- Primary conversion: a correct, immediate calculator result; secondary actions are swapping direction and sharing a stable URL.

## Search goal and evidence

- First intent: `grams to cups`; reverse direction is supported on the same useful tool.
- Public demand snapshot reviewed 2026-08-28: Ahrefs estimates about 101K US monthly searches for `grams to cups` on a leading calculator site.
- Measurement references reviewed 2026-08-28:
  - NIST's cooking equivalencies identify 1 US cooking cup as approximately 240 mL: <https://www.nist.gov/pml/owm/metric-si/metric-kitchen/metric-kitchen-cooking-measurement-equivalencies>
  - King Arthur Baking's tested ingredient chart provides ingredient-specific reference weights: <https://www.kingarthurbaking.com/learn/ingredient-weight-chart>
- Search Console and product-analytics baseline are not available in this worktree. Measure impressions, clicks, calculator completion and organic landing traffic after release at 7/28/56 days.

## Product contract

- The calculator appears immediately below the H1 on mobile and desktop.
- Ingredient choice is visible before the result; the default is all-purpose flour, never an unlabeled water-density assumption.
- Launch data is a small, locally stored, cited set: all-purpose flour, granulated sugar, packed brown sugar, solid butter and whole milk.
- Results are approximate recipe references because brands, packing and measuring technique vary. The UI must say so next to the result.
- No API, account, subscription, personal data or ad is required to calculate.
- The canonical page is `/grams-to-cups`; it is prerendered, present in the sitemap and useful without client-side data fetching.

## Guardrails and acceptance

- Preserve current canonical routes, saved-data behavior and analytics privacy boundary.
- No ad above the calculator or between its input and result.
- Native controls, 44 px targets, visible focus, polite live result and no horizontal overflow at 320 px.
- Test pure conversion/validation first, then browser behavior, prerendered HTML, metadata, sitemap, accessibility, lint, types, build and bundle budgets.
- Commit on `feature/ingredient-aware-cooking-20260828`; do not merge, push or deploy without explicit approval.
