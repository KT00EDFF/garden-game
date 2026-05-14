import type { GardenState } from "../types";
import { TILE_SIZE, WORLD_COLS, WORLD_ROWS, type WorldTile } from "./types";
import { getTileSprite, getGrassVariants } from "./ProceduralSprites";
import { BedRenderer } from "./BedRenderer";
import { PlantRenderer } from "./PlantRenderer";

export class WorldRenderer {
  private bedRenderer = new BedRenderer();
  private plantRenderer = new PlantRenderer();
  private bgCache: HTMLCanvasElement | null = null;
  private lastBedHash = "";

  /** Render the full outdoor scene */
  draw(
    ctx: CanvasRenderingContext2D,
    tileMap: WorldTile[][],
    garden: GardenState,
    _camX: number,
    _camY: number,
    viewW: number,
    viewH: number,
  ): void {
    // Compute visible tile range
    const startCol = Math.max(0, Math.floor(_camX / TILE_SIZE) - 1);
    const startRow = Math.max(0, Math.floor(_camY / TILE_SIZE) - 1);
    const endCol = Math.min(WORLD_COLS, Math.ceil((_camX + viewW) / TILE_SIZE) + 1);
    const endRow = Math.min(WORLD_ROWS, Math.ceil((_camY + viewH) / TILE_SIZE) + 1);

    // Draw background tiles (cached)
    this.drawBackground(ctx, tileMap, startCol, startRow, endCol, endRow);

    // Draw beds with ¾ perspective
    const outdoorBeds = garden.beds.filter(b => (b.location ?? "outdoor") === "outdoor");
    for (const bed of outdoorBeds) {
      this.bedRenderer.draw(ctx, bed, true);
    }

    // Draw plants on top of beds
    for (const bed of outdoorBeds) {
      this.plantRenderer.drawBedPlants(ctx, bed, garden.plantings, garden, true);
    }
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    tileMap: WorldTile[][],
    startCol: number, startRow: number,
    endCol: number, endRow: number,
  ): void {
    // Check if we need to rebuild bg cache
    const bedHash = JSON.stringify(
      tileMap.slice(startRow, endRow).map(r => r.slice(startCol, endCol).map(t => t.type))
    );

    if (this.bgCache && this.lastBedHash === bedHash) {
      // Use cached background
      ctx.drawImage(this.bgCache, 0, 0);
      return;
    }

    // Pre-generate grass variants
    const grassVariants = getGrassVariants(16);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const tile = tileMap[y]?.[x];
        if (!tile) continue;

        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Draw base tile
        if (tile.type === "grass" || tile.type === "grass2" || tile.type === "grass3") {
          const variant = grassVariants[(x * 7 + y * 13) % grassVariants.length];
          ctx.drawImage(variant, px, py);
        } else if (tile.type === "path") {
          ctx.drawImage(getTileSprite("path"), px, py);
        } else if (tile.type === "soil") {
          // Soil is drawn by BedRenderer
          continue;
        } else if (tile.type.startsWith("wood-")) {
          // Wood borders drawn by BedRenderer
          continue;
        } else {
          // Greenhouse building tiles
          ctx.drawImage(getTileSprite(tile.type), px, py);
        }
      }
    }

    this.lastBedHash = bedHash;
  }

  /** Invalidate cached background (call when beds change) */
  invalidateCache(): void {
    this.bgCache = null;
    this.lastBedHash = "";
  }
}
