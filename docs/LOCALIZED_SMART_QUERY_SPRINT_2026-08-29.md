# Localized smart-query sprint — 2026-08-29

## Brief and evidence

- Product: Q Converter, an English-language unit converter with deterministic local query parsing.
- Primary task: turn a typed value/source/target request into a correct, shareable conversion without a backend or LLM.
- Audience in this slice: German- and French-speaking visitors who already use familiar unit phrases in the home search.
- Observed patterns include German `cm in Zoll` and French `kg en livres`; current search results contain dedicated pages using those exact phrases:
  - [Omni Calculator — Cm in Zoll Umrechner](https://www.omnicalculator.com/de/umrechnungen/cm-in-zoll-umrechner)
  - [RapidTables — kg en livres](https://www.rapidtables.org/fr/convert/weight/kg-to-pound.html)
- [Duden defines German `Pfund` as 500 g](https://www.duden.de/rechtschreibung/Pfund), so the bare word cannot safely be treated as an alias for `lb`.
- Demand evidence establishes useful phrasing, not search volume or a ranking forecast.

## Controlled scope

Current: Polish and English requests such as `10 kg na gramy` and `5 ft to cm` resolve locally, while `10 cm in Zoll` and `5 kg en livres` fail.

Proposed: recognize a small allowlist of German and French command words, connectors and unit aliases for length, weight and area. The resulting calculator remains English and explicitly labels the target as `Pounds`, `Inches` or `Square Meters`.

This is not a translated site, does not create localized URLs, and must not emit `hreflang`. Localized SEO pages require native-quality visible content, metadata and navigation as a separate reviewed stage.

## Ambiguity and safety

German `Pfund` commonly means 500 g. French `livre` can mean a book and can also refer historically or colloquially to a 500 g metric pound. Bare `Pfund` and `livre(s)` therefore produce a clarification instead of a number. Explicit `lb`, `englische Pfund` and `livres anglaises` map to the international avoirdupois pound defined as exactly 0.45359237 kg. The opened calculator visibly says `Pounds`; no generic conversion factor or hidden regional assumption is introduced.

## Acceptance and rollback

- Seven explicit DE/FR requests resolve through existing catalog units and existing conversion factors.
- Bare German `Pfund` and French `livre(s)` fail closed with an actionable 500 g versus international-pound clarification.
- Accented and unaccented French forms normalize to the same allowlisted alias.
- Existing English, Polish, symbol-case and ambiguity tests remain green.
- No network call, new route, schema, canonical or sitemap entry is added.
- Rollback removes the localized command/connector tokens and aliases; all existing URLs remain unchanged.
