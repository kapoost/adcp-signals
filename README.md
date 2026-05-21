# AdCP Signals — multi-variant agent monorepo

A bun workspaces monorepo of AdCP `signal-owned` agents. Each variant is a thin layer on top of `core/`, providing only its own catalog and config — the framework wiring (auth, transport, account store, pagination, schema) lives once in `core`.

## Layout

| Package | Purpose |
|---|---|
| `core/` | Framework — `createSignalsAgent(config)` factory, default account store with principal-keyed mode, signals platform wrapper |
| `vanilla/` | Minimal reference — 1 example signal, used as spec-conformance baseline |
| `cats/` | Purrsonality cat-quiz psychographic + behavioral catalog (6 signals) |
| _(future)_ `geo/` | Location-based signals (OSM POI + IP geo) |

## Run a variant

```bash
bun install                              # install all workspaces
cd vanilla && bun run dev                # port 3010
cd cats && bun run dev                   # port 3011
```

## Add a new variant

1. Copy `vanilla/` as a starting template
2. Edit `src/catalog.ts` — your signal catalog
3. Edit `src/index.ts` — set port, data provider domain
4. Add the folder to root `package.json` `workspaces` array

That's it. No framework code to touch.

## Specialism

All variants currently claim `signal-owned`. Specialism is overridable in `createSignalsAgent({ specialism: '...' })` when the AdCP spec adds more signal-specific specialisms.

## SDK pinning

`@adcp/sdk` is pinned to an exact version at the root level. Bump in one place, all variants follow.
