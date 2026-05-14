import type { BedConfig, GardenState, GreenhouseConfig } from "../types";
import {
  WORLD_COLS, WORLD_ROWS, GH_COLS, GH_ROWS,
  BED_WORLD_OFFSET_X, BED_WORLD_OFFSET_Y,
  GH_BUILDING_W, GH_BUILDING_H,
  type WorldTile, type TileType, type SceneId,
} from "./types";

function makeTile(type: TileType, walkable: boolean, extra?: Partial<WorldTile>): WorldTile {
  return { type, walkable, ...extra };
}

function grassType(x: number, y: number): TileType {
  const v = ((x * 7 + y * 13) % 3);
  return v === 0 ? "grass" : v === 1 ? "grass2" : "grass3";
}

/** Get the world-space position of an outdoor bed */
export function bedWorldPos(bed: BedConfig): { wx: number; wy: number } {
  return {
    wx: (bed.worldX ?? bed.posX) + BED_WORLD_OFFSET_X,
    wy: (bed.worldY ?? bed.posY) + BED_WORLD_OFFSET_Y,
  };
}

/** Find the greenhouse building position from garden state, or null if none placed */
function getGreenhousePos(garden: GardenState): { gx: number; gy: number } | null {
  if (garden.greenhouseWorldX != null && garden.greenhouseWorldY != null) {
    return { gx: garden.greenhouseWorldX, gy: garden.greenhouseWorldY };
  }
  return null;
}

/** Build the outdoor world tile map */
export function buildOutdoorMap(garden: GardenState): WorldTile[][] {
  const map: WorldTile[][] = [];

  // Fill with grass
  for (let y = 0; y < WORLD_ROWS; y++) {
    map[y] = [];
    for (let x = 0; x < WORLD_COLS; x++) {
      map[y][x] = makeTile(grassType(x, y), true);
    }
  }

  // Place beds
  const outdoorBeds = garden.beds.filter(b => (b.location ?? "outdoor") === "outdoor");
  for (const bed of outdoorBeds) {
    const { wx, wy } = bedWorldPos(bed);

    if (bed.type === "raised") {
      // Wood border around the bed
      for (let x = wx - 1; x <= wx + bed.widthFt; x++) {
        if (inBounds(x, wy - 1, WORLD_COLS, WORLD_ROWS))
          map[wy - 1][x] = makeTile("wood-top", false);
        if (inBounds(x, wy + bed.heightFt, WORLD_COLS, WORLD_ROWS))
          map[wy + bed.heightFt][x] = makeTile("wood-bottom", false);
      }
      for (let y = wy; y < wy + bed.heightFt; y++) {
        if (inBounds(wx - 1, y, WORLD_COLS, WORLD_ROWS))
          map[y][wx - 1] = makeTile("wood-left", false);
        if (inBounds(wx + bed.widthFt, y, WORLD_COLS, WORLD_ROWS))
          map[y][wx + bed.widthFt] = makeTile("wood-right", false);
      }
    }

    // Soil tiles inside the bed
    for (let ty = 0; ty < bed.heightFt; ty++) {
      for (let tx = 0; tx < bed.widthFt; tx++) {
        const wx2 = wx + tx;
        const wy2 = wy + ty;
        if (inBounds(wx2, wy2, WORLD_COLS, WORLD_ROWS)) {
          map[wy2][wx2] = makeTile("soil", true, {
            bedId: bed.id,
            bedTileX: tx,
            bedTileY: ty,
          });
        }
      }
    }
  }

  // Greenhouse building (only if placed)
  const ghPos = getGreenhousePos(garden);
  if (ghPos) {
    const { gx, gy } = ghPos;
    // Roof
    for (let x = gx; x < gx + GH_BUILDING_W; x++) {
      if (inBounds(x, gy, WORLD_COLS, WORLD_ROWS))
        map[gy][x] = makeTile("greenhouse-roof", false);
    }
    // Walls
    for (let y = gy + 1; y < gy + GH_BUILDING_H; y++) {
      for (let x = gx; x < gx + GH_BUILDING_W; x++) {
        if (!inBounds(x, y, WORLD_COLS, WORLD_ROWS)) continue;
        map[y][x] = makeTile("greenhouse-wall", false);
      }
    }
    // Door (center bottom)
    const doorX = gx + Math.floor(GH_BUILDING_W / 2);
    const doorY = gy + GH_BUILDING_H - 1;
    if (inBounds(doorX, doorY, WORLD_COLS, WORLD_ROWS)) {
      map[doorY][doorX] = makeTile("greenhouse-door", true, { doorTarget: "greenhouse" });
    }
    if (inBounds(doorX + 1, doorY, WORLD_COLS, WORLD_ROWS)) {
      map[doorY][doorX + 1] = makeTile("greenhouse-door", true, { doorTarget: "greenhouse" });
    }
  }

  return map;
}

/** Build the greenhouse interior tile map */
export function buildGreenhouseMap(
  garden: GardenState,
  ghConfig: GreenhouseConfig,
): WorldTile[][] {
  const cols = ghConfig.widthTiles || GH_COLS;
  const rows = ghConfig.heightTiles || GH_ROWS;
  const map: WorldTile[][] = [];

  // Fill with floor
  for (let y = 0; y < rows; y++) {
    map[y] = [];
    for (let x = 0; x < cols; x++) {
      map[y][x] = makeTile("greenhouse-floor", true);
    }
  }

  // Glass walls
  for (let x = 0; x < cols; x++) {
    map[0][x] = makeTile("greenhouse-glass-top", false);
  }
  for (let y = 0; y < rows; y++) {
    map[y][0] = makeTile("greenhouse-glass-left", false);
    map[y][cols - 1] = makeTile("greenhouse-glass-right", false);
  }

  // Shelves / grow stations
  const ghBeds = garden.beds.filter(b => b.location === "greenhouse");
  for (const bed of ghBeds) {
    const bx = bed.posX;
    const by = bed.posY;
    for (let ty = 0; ty < bed.heightFt; ty++) {
      for (let tx = 0; tx < bed.widthFt; tx++) {
        const mx = bx + tx;
        const my = by + ty;
        if (mx >= 0 && mx < cols && my >= 0 && my < rows) {
          const tileType: TileType = bed.greenhouseType === "grow-station" ? "station" : "shelf";
          map[my][mx] = makeTile(tileType, true, {
            bedId: bed.id,
            bedTileX: tx,
            bedTileY: ty,
          });
        }
      }
    }
    if (bed.greenhouseType === "grow-station" && bed.hasGrowLight) {
      const lightY = bed.posY - 1;
      if (lightY >= 0) {
        for (let tx = 0; tx < bed.widthFt; tx++) {
          const mx = bx + tx;
          if (mx >= 0 && mx < cols) {
            map[lightY][mx] = makeTile("grow-light", false);
          }
        }
      }
    }
  }

  // Exit door (center bottom)
  const exitX = Math.floor(cols / 2);
  const exitY = rows - 1;
  map[exitY][exitX] = makeTile("exit-door", true, { doorTarget: "outdoor" });
  if (exitX + 1 < cols) {
    map[exitY][exitX + 1] = makeTile("exit-door", true, { doorTarget: "outdoor" });
  }

  return map;
}

/** Get spawn point for entering a scene */
export function getSpawnPoint(scene: SceneId, garden: GardenState, ghConfig?: GreenhouseConfig): { x: number; y: number } {
  if (scene === "greenhouse") {
    const cols = ghConfig?.widthTiles || GH_COLS;
    const rows = ghConfig?.heightTiles || GH_ROWS;
    return { x: Math.floor(cols / 2), y: rows - 2 };
  }
  // Outdoor: in front of greenhouse door if it exists
  const ghPos = getGreenhousePos(garden);
  if (ghPos) {
    return {
      x: ghPos.gx + Math.floor(GH_BUILDING_W / 2),
      y: ghPos.gy + GH_BUILDING_H,
    };
  }
  // Otherwise center of world
  return { x: Math.floor(WORLD_COLS / 2), y: Math.floor(WORLD_ROWS / 2) };
}

/** Get default spawn for first load */
export function getDefaultSpawn(): { x: number; y: number } {
  return {
    x: Math.floor(WORLD_COLS / 2),
    y: Math.floor(WORLD_ROWS / 2),
  };
}

/** Check if a rectangle of tiles is all grass (valid for placement) */
export function canPlaceAt(
  map: WorldTile[][],
  wx: number, wy: number,
  w: number, h: number,
  padding: number,
): boolean {
  for (let y = wy - padding; y < wy + h + padding; y++) {
    for (let x = wx - padding; x < wx + w + padding; x++) {
      if (!inBounds(x, y, map[0]?.length ?? 0, map.length)) return false;
      const tile = map[y][x];
      if (!tile.type.startsWith("grass")) return false;
    }
  }
  return true;
}

function inBounds(x: number, y: number, cols: number, rows: number): boolean {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}
