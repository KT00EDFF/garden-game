export const TILE_SIZE = 32;
export const WORLD_COLS = 32;
export const WORLD_ROWS = 24;
export const CHAR_WIDTH = 32;
export const CHAR_HEIGHT = 48;
export const MOVE_DURATION = 0.18; // seconds per tile
export const ANIM_FRAME_DURATION = 0.12; // seconds per walk frame

// Greenhouse interior dimensions
export const GH_COLS = 16;
export const GH_ROWS = 12;

// Offset to place beds in the world (tiles of padding from top-left)
export const BED_WORLD_OFFSET_X = 2;
export const BED_WORLD_OFFSET_Y = 2;

// Greenhouse building position in outdoor world (placed when user builds it)
export const GH_BUILDING_W = 8;
export const GH_BUILDING_H = 3;

export type Direction = "down" | "left" | "right" | "up";
export type SceneId = "outdoor" | "greenhouse";

export interface CharacterState {
  tileX: number;
  tileY: number;
  renderX: number;
  renderY: number;
  direction: Direction;
  walking: boolean;
  animFrame: number;
  animTimer: number;
  moveProgress: number;
  sourceTileX: number;
  sourceTileY: number;
}

export type TileType =
  | "grass" | "grass2" | "grass3"
  | "path"
  | "soil"
  | "wood-top" | "wood-bottom" | "wood-left" | "wood-right"
  | "greenhouse-wall" | "greenhouse-roof" | "greenhouse-door"
  | "greenhouse-floor" | "greenhouse-glass-left" | "greenhouse-glass-right"
  | "greenhouse-glass-top"
  | "shelf" | "station" | "grow-light"
  | "exit-door"
  | "water";

export interface WorldTile {
  type: TileType;
  walkable: boolean;
  bedId?: string;
  bedTileX?: number;
  bedTileY?: number;
  doorTarget?: SceneId;
}

export const DIR_DX: Record<Direction, number> = { left: -1, right: 1, up: 0, down: 0 };
export const DIR_DY: Record<Direction, number> = { left: 0, right: 0, up: -1, down: 1 };

export function createCharacterState(tileX: number, tileY: number): CharacterState {
  return {
    tileX, tileY,
    renderX: tileX * TILE_SIZE,
    renderY: tileY * TILE_SIZE,
    direction: "down",
    walking: false,
    animFrame: 0,
    animTimer: 0,
    moveProgress: 0,
    sourceTileX: tileX,
    sourceTileY: tileY,
  };
}
