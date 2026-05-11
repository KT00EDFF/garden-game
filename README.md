# Garden Planner

Visual garden planner with a pixel-art aesthetic. Lay out raised beds, drop in plants from a palette, get companion-planting feedback, track harvests / seeds / achievements, and check the local 7-day weather and frost outlook. Plans are persisted to `localStorage` and the app installs as a PWA.

Built with React 19 + TypeScript + Vite, styled with Tailwind CSS v4, and packaged for offline use via [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/). Weather data comes from [Open-Meteo](https://open-meteo.com/).

## Features

- Grid-based bed editor — drop plants into beds, with live companion / antagonist rings and spacing validation.
- Multiple garden plans you can switch between (e.g. one per growing year).
- Plant palette with categories (vegetable / fruit / herb / flower), maturity days, sun and sow requirements.
- Achievements with XP, harvest log, seed inventory, and crop-rotation tracking.
- Weather panel using the user's zip code, including a frost warning when freezing temps are forecast.
- Export the current plan to a labeled PNG.
- Offline-capable PWA with auto-update.

## Getting started

Requires Node 22+ and npm 10+.

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:5173/>.

## Scripts

- `npm run dev` — Vite dev server with HMR.
- `npm run build` — `tsc -b && vite build`, outputs to `dist/`.
- `npm run preview` — serve the built `dist/` locally.
- `npm run lint` — ESLint on the project.

## Project layout

```
src/
  components/   React UI (Header, BedGrid, PlantPalette, modals, etc.)
  hooks/        useGarden, useWeather, useAchievements, …
  data/         plant catalog, default garden config, achievement defs
  utils/        companion rules, achievement evaluation, helpers
  types.ts      shared TypeScript types
```

State lives in React + `localStorage`; there is no backend.

## Configuration

The weather panel reads the user's zip code from the in-app Settings modal and queries Open-Meteo's free geocoding + forecast endpoints. No API keys required.

PWA manifest, theme color, and icons are configured in [`vite.config.ts`](./vite.config.ts).
