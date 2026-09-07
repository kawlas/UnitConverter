# Uni Converter — Analiza architektury i propozycje optymalizacji

**Data analizy:** 2026-09-07  
**Wersja projektu:** `q-converter` (katalog `UnitConverter/`)  
**Stack:** React 19, TypeScript, Vite 7, Tailwind v4, react-router-dom 7  

---

## 1. Aktualny stan architektury

### 1.1 Mapa plików

| Obszar | Pliki | Uwagi |
|---|---|---|
| Router / layout | `src/App.tsx`, `src/main.tsx` | `React.lazy` dla `ConverterPage`, brak SSR boundary. |
| Strony | `src/pages/ConverterPage.tsx`, `src/pages/convert/[category].tsx`, `src/pages/index.tsx` | Routing w stylu kategorii `/:categoryId`. |
| Komponenty | `ConversionSection.tsx`, `BMICalculator.tsx`, `ConversionCategories.tsx`, `SearchBar.tsx`, `Navbar.tsx`, `Footer.tsx`, `AdCard.tsx` | UI z dużą ilością Radix UI (~30 komponentów). |
| Logika | `src/lib/conversions.ts`, `src/lib/conversion-data.ts` | Wszystkie konwersje w jednym pliku, brak cache. |
| Konfiguracja | `vite.config.ts`, `tailwind.config.js`, `postcss.config.js` | Manual chunking tylko dla 3 grup. |
| Testy | brak plików `*.test.*` / `*.spec.*` w `src/` | Wersja backup miała Playwright + vitest. |

### 1.2 Co działa dobrze

- **React 19 + SWC** — szybki toolchain.
- **Lazy loading** `ConverterPage` — zmniejsza initial bundle.
- **ManualChunks** w Vite — częściowy code-splitting.
- **Kontrolki natywne** (`<input type="number">`, Radix Select) — dobra dostępność.
- **SEO metadata** przez `react-helmet` na poziomie kategorii.

### 1.3 Co słabego / ryzykownego

- **Błąd build TypeScript** w `src/components/ui/calendar.tsx` — `IconLeft` nie istnieje. Blokuje deploy.
- **Brak PWA / Service Worker / offline** — wersja backup miała generowany SW i manifest.
- **Brak SSR / prerenderowania** — SEO zależne od JS, LCP gorsze.
- **Brak historii / ulubionych / udostępniania** — funkcje z backupu.
- **Duży bundle nieużywanych komponentów Radix** — ~30 komponentów UI zaimportowanych, używane są może 8–10.
- **SearchBar nie filtruje kategorii** — `onSearch` nie jest podpięte pod `ConversionCategories`.
- **Brak debounce na inputach** — konwersja wywołuje się na każdy keystroke (dla prostych wzorów OK, ale ryzyko przy złożonych).
- **Brak error boundary** — awaria w `ConversionSection` zniszy całą stronę.
- **Brak testów E2E / a11y** — brak Playwright, brak vitest.
- **`react-helmet` zamiast `react-helmet-async`** — nieprzygotowane na przyszły SSR.
- **Brak locale / precyzji** — wszystkie liczby w formacie domyślnym, brak tłumaczeń.
- **AdSlot stały 728×90** — brak responsywnych formatów reklamowych na mobile.

---

## 2. Propozycje optymalizacji SZYBKOŚCI

### 2.1 Natychmiastowe (0–1 dzień)

| # | Zmiana | Efekt | Weryfikacja |
|---|---|---|---|
| S1 | **Napraw błąd TS** w `calendar.tsx` (usuń komponent lub popraw prop). | Odblokuj build. | `npm run build` / `npm run build-no-errors`. |
| S2 | **Wytnij nieużywane Radix UI** — zostaw tylko `Select`, `Accordion`, `Card`, `Input`, `Button`, `Tabs`, `Toast`. | −50–70% JS vendor. | `npm run check:bundle` (lub `source-map-explorer`). |
| S3 | **Dodaj `?raw` / tree-shake** dla `lucide-react` — importuj ikony pojedynczo. | Zmniejsz ikony z kilkuset KB do kilkudziesięciu. | Diff bundle po build. |
| S4 | **Zastąp `react-helmet` → `react-helmet-async`** (już w package.json backupu). | Przygotowanie na SSR, mniej leaks. | Lint + build. |
| S5 | **Podpięj `SearchBar` pod `ConversionCategories`** — filtruj po tytule. | Użyteczność searcha od razu. | Manual UI check. |

### 2.2 Krótkoterminowe (1–3 dni)

| # | Zmiana | Efekt |
|---|---|---|
| S6 | **Dodaj dynamic import dla `ConversionCategories` / `Footer`** — obecnie `Footer` i `ConversionCategories` nie są lazy. | Mniejszy initial chunk. |
| S7 | **Zoptymalizuj `conversions.ts`** — zamień na mapę `Map<string, (...)>` lub prekompilowane lookup; obecnie `conversionFormulas[category]?.[key]` tworzy stringi w runtime. | Mniejsze GC pressure, szybsze lookup. |
| S8 | **Zmień `ConversionSection` na uncontrolled + ref** — obecnie `value={fromValue}` re-renderuje cały komponent na każdy znak. Dla prostych wzorów nie jest krytyczne, ale ułatwia dodanie debounce. | Mniej re-renderów. |
| S9 | **Dodaj `useMemo` dla listy jednostek w `ConversionSection`** — `units.map(...)` tworzy nowe elementy na każdy render. | Mniej reconciliacji DOM. |
| S10 | **Zastosuj `react-virtual` lub simple virtualization** jeśli dodasz porównanie wszystkich jednostek (`AllUnitsComparison` z backupu). | Stabilny FPS przy 50–100 wierszach. |

### 2.3 Średnioterminowe (1–2 tygodnie)

| # | Zmiana | Efekt |
|---|---|---|
| S11 | **Prerenderowanie kategorii** — generuj statyczny HTML dla `/:categoryId` w czasie buildu (jako backup). | LCP < 1.5s, SEO 100, offline-first. |
| S12 | **Service Worker + PWA manifest** — fingerprint assets, precache canonical routes. | Instalowalność, offline, FID lepszy. |
| S13 | **Bundle budget + source-map-explorer CI** — automatyczny próg (np. 200 KB gzip per route). | Zapobiega regresom. |
| S14 | **Font subset / `fontsource`** — obecnie brak fontów, używamy system sans. Jeśli dodasz Manrope/Inter, włącz `unicode-range`. | −30–50 KB fontów. |
| S15 | **Preload critical fonts / CSS** — `<link rel="preload">` dla above-the-fold. | Lepsze FCP. |

---

## 3. Propozycje optymalizacji UX

### 3.1 Natychmiastowe (0–1 dzień)

| # | Zmiana | Efekt |
|---|---|---|
| U1 | **Podpięj `onSearch` pod `ConversionCategories`** — filtruj kategorie po frazie. | Search staje się użyteczny. |
| U2 | **Dodaj `error boundary` na `ConversionSection`** — zamiast białej strony pokaż „Spróbuj ponownie”. | Odporność na błędy. |
| U3 | **Pokazuj „Brak wyników”** w `ConversionCategories` gdy search nic nie znajdzie. | Feedback UX. |
| U4 | **Zwiększ touch target** — obecnie `Button` icon-only ma 32×32, powinno być min 44×44. | Mobilny UX. |

### 3.2 Krótkoterminowe (1–3 dni)

| # | Zmiana | Efekt |
|---|---|---|
| U5 | **Dodaj historię i ulubione** (localStorage z 30-dniowym TTL). | Powtarzalność, engagement. |
| U6 | **Dodaj „kopiuj wynik” / „udostępnij link”** — kopiuj URL z query params. | Viralność, użyteczność. |
| U7 | **Dodaj „Porównaj wszystkie jednostki”** — tabela pokazująca wartość w każdej jednostce kategorii. | Odkrywanie, retention. |
| U8 | **Precision control** — suwak 0–12 miejsc po przecinku. | Profesjonalne użycie. |
| U9 | **Locale-aware formatting** (`Intl.NumberFormat`) — obecnie `toString()` nie formatuje po polsku/niemiecku. | Jakość prezentacji. |
| U10 | **Swap z zachowaniem wartości** — obecnie swap kopiuje `result` do `fromValue`, co może „zapomnieć” oryginalną wartość. | Intuicyjność. |

### 3.3 Średnioterminowe (1–2 tygodnie)

| # | Zmiana | Efekt |
|---|---|---|
| U11 | **Smart query parser** — „5 ft to cm” otwiera kalkulator z prezupełnionym stanem. | Wyszukiwanie naturalne. |
| U12 | **Dodaj kalkulatory wysokości, BMI, gotowania** — już istnieją w backupie. | Więcej przydatności. |
| U13 | **Batch conversion** — wklej wiele wartości, konwertuj całą listę. | Power users. |
| U14 | **A11y audit** — dodaj `aria-live` na wynik, focus management w selectach, visible focus outline. | Accessibility score. |
| U15 | **Keyboard shortcuts** — `Tab` po from/to, `Enter` na swap, `Esc` na reset. | Power users / desktop. |

---

## 4. PWA, offline i mobilny UX

| # | Zmiana | Efekt |
|---|---|---|
| P1 | **Dodaj `public/manifest.webmanifest`** — nazwa, ikony, theme-color, shortcuts dla kategorii. | Instalowalność. |
| P2 | **Wygeneruj SW w buildzie** — precache hashed assets + prerendered routes. | Offline, szybki powtórny dostęp. |
| P3 | **Dodaj `ConnectivityStatus`** — banner „Jesteś offline / ponownie połączony”. | Transparentność offline. |
| P4 | **Responsywne AdSlot** — 728×90 na desktop, 300×250 / 320×50 na mobile. | Dochód reklamowy, UX. |
| P5 | **Zablokuj horizontal overflow** — obecnie `max-w-3xl` + px-4, ale brakuje globalnego `overflow-x: hidden` na body. | Nie przewija się na boki na iPhone SE. |
| P6 | **Minimum viewport 320px** — przetestuj na małych ekranach. | Zgodność z constraintami backupu. |

---

## 5. Obsługa błędów i odporność

| # | Zmiana | Efekt |
|---|---|---|
| E1 | **Dodaj `ErrorBoundary`** na poziom `App` lub `ConverterPage`. | Graceful degradation. |
| E2 | **Waliduj localStorage** — obecnie brak parsowania z fallbackiem (backup miał 30-dniowy TTL + tolerant reading). | Nie trafi danych przy czyszczeniu storage. |
| E3 | **Zapewnij fallback dla `categories.find()`** — obecnie przekierowuje na `/power`, ale nie loguje błędu. | Debugowalność. |
| E4 | **Obsłuż `parseFloat` edge cases** — obecnie `NaN` → „0”, ale brak komunikatu dla użytkownika. | Clarity. |

---

## 6. Priorytety (co najpierw)

1. **Napraw build** — S1 (`calendar.tsx` błąd TS).
2. **Wytnij nieużywane UI** — S2 (znaczny wpływ na szybkość).
3. **Podpięj search** — U1 (natychmiastowa wartość UX).
4. **Dodaj error boundary** — E1 (odporność).
5. **PWA baseline** — P1 + P2 (offline, instalowalność).

---

## 7. Sugerowane metryki celu

| Metryka | Obecnie (szac.) | Cel |
|---|---|---|
| Lighthouse Performance | ~73 (z backupu) | > 85 |
| FCP | ~3.4s | < 1.8s |
| LCP | ~4.9s | < 2.5s |
| JS bundle (gzip, per route) | nieznane | < 200 KB |
| TTI | nieznane | < 3.5s |
| Axe violations | brak danych | 0 serious/critical |
| Playwright coverage | 0 | 15+ smoke tests |

---

## 8. Pliki analizy

- `docs/architecture-analysis.md` — ten dokument.
- Brak modyfikacji w kodzie źródłowym — tylko rekomendacje.

---

*Analiza wygenerowana na podstawie inspekcji katalogu `/Users/oldspice/Documents/PROJEKTY/UNI CONVERTER/UnitConverter/` oraz porównania z wersją backup z PR #31.*
