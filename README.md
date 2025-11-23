# Blockspace Conservation Toy

Interactive web UI for experimenting with the Law of Conservation of Blockspace from
`cred10.tex`. It exposes the key variables—efficiency coefficient rho, usable window `W'`, and
per-user enforcement weight `e`—and visualizes the lower bound on simultaneous unilateral exits.

## Features

- Preset scenarios mirroring the paper (Retail Panic, Quiet Exit, Mixed Economy, Institutional,
  Ark).
- Direct manipulation of `rho`, `W'`, `e`, and coinbase overhead with immediate capacity feedback.
- Table + sparkline showing how `N_max` scales with the window length at the chosen efficiency.
- Operational notes that document how to estimate `rho`, how HTLC jamming inflates `e`, and why the
  model is a static bound.
- Shareable URLs and JSON export for saving/sharing scenarios.
- Deterministic math helpers with Vitest coverage (Lightning per-state weights, Ark lower bounds,
  security zone classifier).

## Getting Started

```bash
# install once
npm install

# run locally
npm run dev

# unit tests (math + scenarios)
npm run test

# production build
npm run build
npm run preview  # optional local preview of /dist
```

Tests live in `src/lib/*.test.ts` and exercise the published figures (e.g., the 83,060 and 94,926
Lightning bounds). The Vitest environment is configured in `vite.config.ts`.

## Project Layout

```
src/
  App.tsx            # main UI
  App.css            # glassmorphism styling + responsive grid
  lib/math.ts        # reusable equations: C_max, rho losses, N_max, zone classifier
  lib/scenarios.ts   # preset catalog, query-string serializer, blended cohorts
```

## Estimating rho (field method)

1. Choose a window `[b, b+W')` and compute `C_max = (4_000_000 - w_cb) * W'`.
2. For each block or mempool diff in the window, sum the serialized weight of:
   - replaced transactions (RBF evictions)
   - orphaned blocks' unique weight
   - transactions stranded as dust
   - policy-filtered packages (ancestor/descendant and package limits)
3. Let `rho = 1 - (losses / C_max)`. The congestion sample from 5 Oct 2025 had total losses
   `160,200,000` wu over `W' = 137` blocks, so `rho ≈ 0.71`.

Lower `rho` collapses `N_max` linearly; HTLC jamming also raises per-user `e`, so the interactive
toy should be interpreted as an optimistic (necessary) bound.

## Sharing & Export

- **Share current setup** copies a permalink with the full scenario embedded in the query string.
- **Download JSON** saves `{ scenario, metrics }` for reproducibility or offline calculations.

## Deploying to GitHub Pages

This repo ships with two options:

1. **GitHub Actions (recommended)**  
   - Push to `main`/`master` and the workflow in `.github/workflows/deploy.yml` will run `npm ci`,
     `npm run test -- --run`, `npm run build`, and publish `dist/` to Pages automatically.
   - Ensure Pages is enabled in your repo settings (`GitHub Pages → Source → GitHub Actions`).

2. **Manual CLI publish**  
   - `npm run deploy`  
     This runs `vite build` (respecting `VITE_BASE`) and uploads `dist/` via `gh-pages`.
   - Set `VITE_BASE` when needed: `VITE_BASE=/my-repo npm run deploy`.
