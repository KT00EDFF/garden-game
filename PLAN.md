# Garden Game — Implementation Plan

## User Profile
- **Location**: Zip 60068 (Park Ridge, IL area), Zone 6a
- **Last frost**: ~April 25–May 1
- **First frost**: ~October 10–15
- **Growing season**: ~165 days

## Garden Layout
| Bed ID | Type | Dimensions (ft) | Tiles (1ft grid) |
|--------|------|-----------------|-------------------|
| bed-1 | Raised | 5×3 | 15 |
| bed-2 | Raised | 5×3 | 15 |
| bed-3 | Raised | 8×2 | 16 |
| bed-4 | In-ground | 8×2 | 16 |
| bed-5 | In-ground | 8×2 | 16 |
| bed-6 | Raised | 4×3 | 12 |
| bed-7 | Raised | 3×1.5 | ~5 (round up) |
| bed-8 | Raised | 3×1.5 | ~5 (round up) |
| bed-9 | In-ground | 16×2 | 32 |
| **Total** | | | **~132 tiles** |

## Plant List (V1 Priority)
| Plant | Category | Start Method | Notes |
|-------|----------|-------------|-------|
| Garlic | Vegetable | Fall-planted (Oct) | Already in ground? Or spring planting |
| Onions | Vegetable | Sets or seed indoors 8-10wk before last frost | Long season |
| Strawberries | Fruit | Bare root transplant early spring | Perennial — mark permanent |
| Brassicas (broccoli, cabbage, kale, cauliflower) | Vegetable | Seed indoors 6-8wk before last frost | Cool season, spring + fall crop |
| Potatoes | Vegetable | Seed potatoes, plant 2-4wk before last frost | Hilling needed |
| Hot Peppers | Vegetable | Seed indoors 8-10wk before last frost | Heat lovers, after last frost |
| Sweet Potatoes | Vegetable | Slips, plant 2-3wk after last frost | Long season, needs warm soil |
| Cherry Tomatoes | Vegetable | Seed indoors 6-8wk before last frost | Indeterminate, needs support |
| Melons | Fruit | Seed indoors 3-4wk or direct sow after frost | Space hogs, need heat |

## Tech Stack
- **React + TypeScript** — app framework
- **Vite** — bundler
- **Tailwind CSS** — styling + responsive/mobile
- **CSS Grid** — garden visualization (1 tile = ~1 sq ft)
- **LocalStorage** — persistence (v1)
- **PWA** — installable, offline-capable

## Architecture
```
garden-game/
├── src/
│   ├── components/
│   │   ├── GardenView/        — Full garden: all beds laid out spatially
│   │   ├── BedGrid/           — Single bed rendered as a CSS grid of tiles
│   │   ├── PlantPalette/      — Plant picker sidebar/drawer
│   │   ├── SeasonTimeline/    — Horizontal timeline: seed start → harvest
│   │   ├── PlantCard/         — Detail popup for a plant
│   │   ├── Alerts/            — "What to do this week"
│   │   └── Settings/          — Zone, frost dates config
│   ├── data/
│   │   ├── plants.json        — Plant database
│   │   ├── companions.json    — Companion/enemy rules
│   │   └── zones.json         — Frost dates by zone
│   ├── hooks/
│   │   ├── useGarden.ts       — Garden state (beds, placed plants)
│   │   ├── useCalendar.ts     — Date math: what's active, upcoming
│   │   └── useAlerts.ts       — Smart reminders
│   ├── engine/
│   │   ├── planting-rules.ts  — Companion validation, spacing checks
│   │   └── schedule.ts        — Calculates all key dates from zone + plant data
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── public/
│   └── sprites/               — 16×16 pixel art PNGs
└── package.json
```

---

## Implementation Phases

### Phase 1: Project Setup + Garden Grid
**Goal**: See your actual garden layout on screen with pixel art tiles

- [ ] Scaffold Vite + React + TS + Tailwind
- [ ] Define bed data (dimensions, type, position) in a config file
- [ ] `GardenView` component: renders all 8 beds in a spatial layout
- [ ] `BedGrid` component: renders a single bed as a CSS grid
- [ ] Each tile shows empty soil sprite (16×16 pixel art)
- [ ] Raised beds vs in-ground beds have different border/frame sprites
- [ ] Mobile responsive: beds stack vertically on small screens, scroll horizontally on larger
- [ ] Tap a tile to select it (highlight state)

### Phase 2: Plant Data + Palette
**Goal**: Browse plants and place them in beds

- [ ] Create `plants.json` with all 9 priority plants + real data
  - Days to maturity, spacing, sun needs, water needs
  - Companion/enemy lists
  - Start method (indoor seed, direct sow, transplant, sets, slips)
  - Weeks before/after last frost for each action
  - Zone compatibility
- [ ] `PlantPalette` component: scrollable list/grid of plants with sprites
- [ ] Tap plant in palette → tap tile in bed → plant placed
- [ ] Plant sprite replaces soil sprite in that tile
- [ ] Tap placed plant to remove it
- [ ] Spacing enforcement: some plants need >1 tile (melons = 4 tiles, etc.)
- [ ] Save/load garden state to LocalStorage

### Phase 3: Smart Feedback (Companion Planting + Validation)
**Goal**: The garden gives you real-time advice as you plan

- [x] Companion/enemy relationships defined in plant data
- [x] When placing a plant, check adjacent tiles for enemies → red glow
- [x] Check adjacent tiles for companions → green glow
- [x] `PlantCard` popup on tap: shows full detail + why it's conflicting
- [x] Zone warnings: flag plants that are marginal for 6a
- [x] Sun requirement hints per bed (user marks beds as full/partial/shade in settings)

### Phase 4: Season Timeline
**Goal**: See your whole season at a glance, know what to do when

- [ ] `SeasonTimeline` component: horizontal scrollable timeline
- [ ] X-axis = weeks from Jan → Nov (zone 6a growing season)
- [ ] Each placed plant renders a bar:
  - Blue segment = start seeds indoors
  - Yellow segment = transplant/direct sow window
  - Green segment = growing
  - Red/orange segment = harvest window
- [ ] "Today" marker line
- [ ] `Alerts` panel: "This week" action items derived from timeline
  - "Start hot pepper seeds indoors (8 weeks before last frost)"
  - "Order sweet potato slips"
  - "Harden off brassica seedlings"

### Phase 5: Polish + PWA
**Goal**: Feels like a finished app, works on your phone

- [ ] PWA manifest + service worker (vite-plugin-pwa)
- [ ] App icon (pixel art garden sprite)
- [ ] Multiple saved plans ("2026 Spring", "2026 Fall")
- [ ] Settings page: zone, last/first frost date override, bed sun exposure
- [ ] Empty state: onboarding flow that asks zone + bed setup
- [ ] Touch-friendly: large tap targets, swipe between beds on mobile

---

## Future Phases (V2+)
- Achievements & XP system ("First Seed Started", "Full Garden Plan", "Companion Master")
- Succession planting (multiple sow dates for same crop)
- Harvest log (track actual yields)
- Crop rotation memory (year-over-year tracking)
- Seed inventory tracker
- Weather API integration (frost warnings)
- Animated pixel art growth stages
- Export plan as image/PDF
- Fall/winter planning (garlic, cover crops)

---

## Pixel Art Sprite List (V1)
| Sprite | Size | Description |
|--------|------|-------------|
| soil_empty | 16×16 | Brown tilled soil |
| soil_mulched | 16×16 | Mulched bed tile |
| bed_frame_raised | border | Wooden raised bed frame |
| bed_frame_ground | border | Simple ground-level border |
| garlic | 16×16 | Garlic plant top-down |
| onion | 16×16 | Onion plant top-down |
| strawberry | 16×16 | Strawberry plant with fruit |
| broccoli | 16×16 | Brassica head top-down |
| cabbage | 16×16 | Cabbage head top-down |
| kale | 16×16 | Leafy kale top-down |
| potato | 16×16 | Potato plant top-down |
| hot_pepper | 16×16 | Pepper plant with peppers |
| sweet_potato | 16×16 | Sweet potato vine |
| cherry_tomato | 16×16 | Tomato plant with fruits |
| melon | 16×16 | Melon vine with fruit |
| highlight_green | 16×16 | Good companion overlay |
| highlight_red | 16×16 | Bad companion overlay |
| highlight_select | 16×16 | Selected tile overlay |

---

## Key Zone 6a Dates (60068)
| Event | Approximate Date |
|-------|-----------------|
| Last spring frost | April 28 |
| Start brassicas indoors | March 3 |
| Start onions indoors | Feb 17 |
| Start peppers indoors | Feb 17 |
| Start tomatoes indoors | March 17 |
| Plant potatoes | April 7 |
| Transplant brassicas | April 14 |
| Start melons indoors | April 7 |
| Transplant after frost | May 5 |
| Plant sweet potato slips | May 19 |
| First fall frost | October 12 |
| Plant garlic (fall) | October 1–15 |
