# Agent instructions

## Start here

For every task, read these sources in order:

1. This root `AGENTS.md`.
2. [`docs/PROJECT.md`](docs/PROJECT.md).
3. The Wiki entity `[[unit-converter]]` and `Wiki/log.md`, when available.

Use a branch for every task. Never work directly on `main`; the current handoff branch is
`docs/project-handoff`. Do not commit unless the task explicitly requests it.

## Project guardrails

- This is a React 19 + TypeScript + Vite 7 application using Tailwind v4.
- Keep implementation and documentation consistent with the shipped measurement-studio redesign.
- Do not edit `Clippings/` or `raw/`; do not add secrets, credentials, or environment values to the repository.
- Do not modify source, package, Wiki, or deployment files during a documentation-only task.
- Do not claim tests, deploys, or other verification without fresh evidence. Record the command and result.
- Preserve canonical routes, shareable URL state, accessibility semantics, mobile navigation, and the 30-day saved-data TTL when changing the app.

## Verification

From the repository root, the standard checks are:

```sh
npm ci
npm run test:critical
npm run test:e2e
BASE_URL=https://qconverter.netlify.app npm run test:e2e
npm run build
git diff --check
```

If Playwright browsers are unavailable, install Chromium first with
`npx playwright install --with-deps chromium` (or the platform-appropriate Playwright
install command), then rerun the E2E check. See [`docs/PROJECT.md`](docs/PROJECT.md) for
architecture, acceptance baseline, design constraints, and deployment procedure.

## Safety and handoff

Before editing, check branch and working-tree state. Keep changes scoped to the requested
files, avoid overlapping edits, and report changed files, verification evidence, blockers,
remaining risks, and the next recommended action. The public endpoints are:

- Netlify: <https://qconverter.netlify.app>
- GitHub: <https://github.com/kawlas/UnitConverter>
