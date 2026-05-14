# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — TypeScript check (`tsc -b`) + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build locally
- No test framework is configured yet

## Project Overview

A pixel-art-themed garden planner PWA built with React 19, TypeScript (strict), Vite 8, and Tailwind CSS 4. Users lay out garden beds on a 1-tile-per-square-foot CSS grid, place plants via drag-and-drop, and get companion planting validation, spacing checks, planting schedules, crop rotation tracking, weather forecasts, and achievements.

Designed for Zone 6a (IL area) but configurable per user settings (zone, frost dates, ZIP code).

## Architecture

**State management**: No external store — a single `useGarden` hook owns all garden state and persists to LocalStorage (multi-plan support, auto-save on every change). `useWeather` fetches from the free Open-Meteo API with 30-min sessionStorage cache.

**Data flow**: App.tsx renders a 3-column layout (PlantPalette | GardenView + SeasonTimeline | WeatherPanel + Alerts) plus 8 modal dialogs. All state flows down from App via props/callbacks — no context providers.

**Key directories**:
- `src/hooks/` — `useGarden.ts` (~465 lines, core state + all mutations) and `useWeather.ts`
- `src/engine/` — Pure logic: planting rule validation, achievement evaluation, growth stage calculation, planting schedule computation, image export
- `src/data/` — Plant database (20+ plants), plant family mappings, growth sprites, LocalStorage persistence layer (`garden-config.ts`)
- `src/components/` — 17 React components, all in flat files (no nested directories)
- `src/types/index.ts` — All TypeScript interfaces (GardenState, Plant, PlacedPlant, BedConfig, etc.)

**Plant placement pipeline**: User drags from PlantPalette → drop on BedGrid tile → `placePlant()`/`placePlantById()` in useGarden → spacing validation (`engine/planting-rules.ts`) → state update → auto-save → achievement re-evaluation.

## Conventions

- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` enabled — prefix unused params with `_`
- Tailwind v4 via PostCSS plugin (not the old `tailwind.config.js` approach) — custom theme variables defined in `src/index.css` via `@theme` block
- Pixel art aesthetic: "Press Start 2P" font, `image-rendering: pixelated`, dark green/beige/gold color scheme
- PWA configured via `vite-plugin-pwa` with auto-update strategy and workbox precaching
- CSS Grid for bed tile layouts (widthFt × heightFt)
