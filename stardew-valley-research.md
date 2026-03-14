# Stardew Valley — Complete Technical & Design Research

## The Creator: Eric "ConcernedApe" Barone

- Graduated from University of Washington Tacoma in 2011 (CS degree)
- Couldn't find a job, so started building Stardew Valley in **2012** to practice C# and pad his resume
- Worked **10+ hours/day, 7 days/week for 4.5 years** — entirely solo
- He was the **sole programmer, designer, artist, animator, writer, and music composer**
- Self-taught in pixel art and music (used Reason Studios with stock sounds and a QWERTY keyboard for note entry — no formal music training)
- Released **February 26, 2016**. Has sold **50+ million copies**
- Since 2019, he's had a small team helping, but the core game was entirely one person

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Language** | C# |
| **Original Framework** | Microsoft XNA Framework |
| **Current Framework** | MonoGame (migrated 2021) |
| **Runtime** | .NET 6 (post-migration) |
| **Content Pipeline** | XNB binary format (from XNA Content Pipeline) |
| **Modding API** | SMAPI (Stardew Modding API) — open source, C#/.NET |
| **Platforms** | PC, Mac, Linux, Switch, PS4/5, Xbox, iOS, Android |

Barone originally chose XNA (which he later called "totally outdated") because when development started (~2012), MonoGame was still immature. He migrated to MonoGame to futureproof the game and allow mods to access >4GB RAM. He donated **$125,000** + ongoing monthly support to MonoGame.

---

## Rendering Pipeline

The rendering is deceptively simple but effective. From GPU frame capture analysis:

1. **Screen Clear** — standard clear pass
2. **Ground/Terrain Pass** — tiled geometry representing the game world grid. Each grid cell has UV coordinates mapping into a bound spritesheet. Snow/rain animation works by cycling which texture cell is sampled per frame
3. **Object/Entity Pass** — distance-sorted rendering by Y-axis position (objects higher on screen = "further away" = drawn first). No depth buffer needed — pure painter's algorithm
4. **Weather Pass** — full-screen additive blending. Snow textures use dark grey backgrounds (not black) so additive blending creates a natural haze effect (`D3DBLENDOP_ADD`)
5. **UI/HUD Pass** — standard overlay

### Key Rendering Details
- **Tile size**: 16×16 pixels
- **Frame render time**: <2ms — extremely lightweight
- **Character rendering**: Instead of pre-generating sprite sheets for customized characters, the engine **composites the character chunk-by-chunk every frame** from all possible option spritesheets kept in memory. This avoids runtime texture generation at the cost of memory
- **Sprite sheets**: Maps reference one or more tilesheets; each tile has a sprite index pointing to its position in the spritesheet
- **Draw order**: Y-sorted painter's algorithm eliminates need for depth buffer
- **No shaders**: Minimal GPU shader usage — almost all visual work is sprite blitting and additive blending

---

## Game Loop & Tick System

- **Update loop**: Runs at **~60 ticks/second** (60 FPS target)
- **In-game time**: Uses **10-minute ticks** with a default interval of **700ms per tick**
- **Day structure**: Player wakes up → performs actions → must sleep by 2:00 AM. Each day is one full cycle of seasons/calendar
- **Seasons**: 4 seasons × 28 days = 112 days per year

---

## World & Map System

- Maps use a **tile-based grid system** with multiple layers
- Each layer has tiles placed in a grid with properties (passable/blocked, special logic, sprite index)
- Maps are stored as data files referencing tilesheets
- **No procedural world generation** — the farm layouts and town maps are hand-designed. Some elements like mine floors and the randomized farm cave have procedural elements
- The map format is compatible with **Tiled** (the open-source map editor), making it accessible to modders
- Multiple map layers allow for ground, buildings, objects, and front (above-player) elements

---

## NPC System

- NPCs follow **schedule-based pathfinding** — each NPC has defined routes based on season, day of week, weather, and relationship status
- NPCs use pathfinding algorithms to navigate between schedule waypoints
- Dialogue changes based on friendship level, season, weather, and story progress
- 30+ unique NPCs, each with distinct personalities, gift preferences, heart events, and daily routines

---

## Content & Data Pipeline

- Assets stored in **XNB binary format** (Microsoft XNA Content Pipeline)
- Data files use space-delimited and slash-delimited string formats
- Example recipe format: `name: "ingredientList/field/itemsToProduce/bigCraftable/condition"`
- Items referenced by object index from `Data/Objects.xnb`
- Modern modding has moved away from direct XNB editing to **Content Patcher** (SMAPI-based), which patches data at runtime without replacing files

---

## Modding Architecture (SMAPI)

- **SMAPI** (Stardew Modding API) is the primary mod framework
- Mods are compiled C# DLLs that hook into game events
- SMAPI rewrites mod bytecode at load time for cross-platform compatibility (Linux/Mac/Windows)
- Event-driven API: mods subscribe to game events (tick updates, item placement, menu opens, etc.)
- SMAPI provides safe access to decompiled game internals
- Huge modding community — thousands of mods on Nexus Mods

---

## Multiplayer

- Added in 2018 (v1.3), supports **1–8 players**
- **Host-authoritative architecture**: one player hosts, others are "farmhands"
- Connection via LAN, IP address, or Steam/GOG invite codes
- Custom netcode with binary serialization (`Netcode.NetRef`, `NetDictionary`, etc.)
- Farmhands cannot access the world when host is offline
- Split-screen support on consoles

---

## Audio & Music

- **91 tracks** composed entirely by Barone
- Created in **Reason Studios** using only stock sounds
- No formal music training — all intuitive, based on how seasons "felt"
- Soundtrack released September 2016
- Two live concert tours: *Festival of Seasons* (chamber orchestra, 2023) and *Symphony of Seasons* (35-piece orchestra, 2024)

---

## Core Game Systems

| System | Details |
|---|---|
| **Farming** | Till → plant → water → harvest. Sprinklers automate watering. Crops are seasonal. |
| **Mining** | 120-floor mines + Skull Cavern. Deeper = better ores. Procedural floor layouts. |
| **Fishing** | Skill-based minigame with timing mechanic. Fish vary by season/weather/location/time. |
| **Combat** | Real-time melee/ranged. Weapons don't use energy. Swords, clubs, daggers each have unique mechanics. |
| **Foraging** | Seasonal items spawn in the world. Leveling unlocks crafting recipes. |
| **5 skill trees** | Each has profession choices at levels 5 and 10 that specialize your playstyle. |
| **Relationships** | Gift-giving, heart events, marriage (12 candidates), friendship with all NPCs. |
| **Community Center** | Central progression goal — complete bundles to restore the center and unlock areas. |

---

## Design Philosophy

- **No fail states** — you can't lose, only progress slower
- **Player-driven goals** — the game never forces a path
- **Satisfying feedback loops** — every action yields visible progress
- **Dense content** — secrets, Easter eggs, and hidden mechanics reward exploration
- **Cozy aesthetic** — 16-bit SNES-inspired pixel art with modern smoothness and lighting
- **Inspired by Harvest Moon** — Barone felt the series had stagnated and wanted to make the game he wished existed

---

## Key Takeaways for Game Development

1. **Tile-based 2D is powerful** — Stardew proves a 16×16 tile grid with sprite sheets can create a world people spend thousands of hours in
2. **Y-sorted painter's algorithm** is sufficient for top-down 2D — no need for depth buffers
3. **Data-driven design** — items, recipes, schedules, and dialogue are all defined in external data files, not hardcoded
4. **Compositing over pre-rendering** — character customization works by layering sprite parts at runtime rather than pre-generating every combination
5. **Additive blending for weather** — simple but effective technique for atmospheric effects
6. **Tick-based time** — game time advances in discrete steps, making simulation deterministic and debuggable
7. **MonoGame/C#** is a proven stack for indie 2D games with professional results

---

## Sources

- GPU Frame Capture Analysis: http://www.hlsl.co.uk/blog/2018/7/19/what-can-we-learn-from-gpu-frame-captures-stardew-valley
- Stardew Valley Wiki: https://stardewvalleywiki.com/
- Stardew Valley Modding Wiki: https://stardewvalleywiki.com/Modding:Editing_XNB_files
- SMAPI GitHub: https://github.com/Pathoschild/SMAPI
- Stardew Valley Skills: https://stardewvalleywiki.com/Skills
