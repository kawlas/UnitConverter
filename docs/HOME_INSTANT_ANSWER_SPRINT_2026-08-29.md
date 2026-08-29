# Home instant-answer sprint — 2026-08-29

## Project brief

- Product: **Q Converter**, an English-language, privacy-friendly unit converter.
- Audience: people who want a correct everyday conversion with the fewest possible actions.
- Primary conversion: obtain and reuse a result. Secondary conversion: open the detailed calculator.
- Current path: type a complete query on the home page, read the answer, open the category page, then copy it.
- Proposed path: type a complete query, read the answer and copy a self-contained equation directly from the same result panel.
- Protected behavior: existing canonical URLs, keyboard navigation, local-only parsing, 320 px support, shareable calculator state and analytics privacy.
- Release boundary: implementation and commit only; no merge or production mutation without explicit approval.

## Evidence and limitation

- A current competitor result exposes copy actions beside its feet-and-inches, decimal-feet and total-inches answers: [The Calculator Site](https://www.thecalculatorsite.com/conversions/height/180cm).
- In a unit-converter discussion, a user specifically praises real-time answers with no Convert button and a copy button, while another says switching units should be quick and easy: [r/MechanicalEngineering](https://www.reddit.com/r/MechanicalEngineering/comments/tmebzg/here_is_a_great_little_program_for_unit_conversion/).
- Q Converter already produces deterministic instant answers locally, so direct copying removes a navigation step without adding a backend, dependency or new route.
- This is product-pattern evidence, not a traffic-volume estimate. Search Console and production event data remain necessary to measure adoption.

## Visible change

Current: the instant-answer card is only a link to the detailed calculator.

Proposed: preserve that link and Enter-key behavior, then add a separate touch-sized **Copy answer** action. It copies a self-contained equation such as `10 kg = 10,000 g`, confirms success accessibly and leaves the typed query and current page intact.

## Acceptance and rollback

- Copy is available only for a successfully parsed conversion.
- The copied text contains source value/unit, equals sign and formatted result/unit.
- Copy does not navigate, clear the query or send entered values to analytics.
- Existing Enter, arrow-key, category-search and explicit clear behavior remain unchanged.
- The control is keyboard reachable, at least 44 px high, accessible and overflow-free at 320 px.
- Targeted smart-query E2E, analytics privacy checks, lint, build, bundle budget and `git diff --check` pass.
- Rollback removes the copy action and this brief; existing search behavior and URLs remain unchanged.

## Branch verification

- At 320×568 with the consent banner visible, the search input begins at 187 px, the answer begins at 273 px and **Copy answer** ends at 414 px; the banner begins at 458 px.
- At 1280×800, the copy action ends at 609 px and the expanded hero ends at 774 px, so the result is not clipped.
- The page has no horizontal overflow at either measured viewport.
- Eight focused smart-query E2E checks passed, including keyboard behavior, clipboard output, axe and the mobile fold contract.
- The consent-gated analytics check confirmed `result_copied` contains only `{ tool_category: "weight" }`, never the query or numeric result.
- Ten focused unit checks, lint, build, bundle budgets and `git diff --check` passed. The home route is 112.36 KiB gzip against a 122.07 KiB budget.
