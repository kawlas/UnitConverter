# Lessons

## 2026-08-21 — React 19 peer compatibility

Before replacing a framework integration package, check its current peer contract:

```bash
npm view <package> version peerDependencies --json
```

For React 19, use a release that explicitly declares React 19 support. In this project,
`react-helmet-async@3` is compatible; `react-helmet-async@2` is not.
