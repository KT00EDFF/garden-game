import type { GardenState, GreenhouseConfig } from "../types";
import { TILE_SIZE, type WorldTile } from "./types";
import { getTileSprite } from "./ProceduralSprites";
import { PlantRenderer } from "./PlantRenderer";

export class GreenhouseRenderer {
  private plantRenderer = new PlantRenderer();

  draw(
    ctx: CanvasRenderingContext2D,
    tileMap: WorldTile[][],
    garden: GardenState,
    ghConfig: GreenhouseConfig,
  ): void {
    const cols = ghConfig.widthTiles || 16;
    const rows = ghConfig.heightTiles || 12;

    // Draw all tiles
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = tileMap[y]?.[x];
        if (!tile) continue;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        ctx.drawImage(getTileSprite(tile.type), px, py);
      }
    }

    // Draw plants on greenhouse beds (shelves/stations)
    const ghBeds = garden.beds.filter(b => b.location === "greenhouse");
    for (const bed of ghBeds) {
      this.plantRenderer.drawBedPlants(ctx, bed, garden.plantings, garden, false);
    }

    // Draw "GREENHOUSE" label at top
    ctx.fillStyle = "rgba(240, 230, 211, 0.6)";
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText("GREENHOUSE", (cols * TILE_SIZE) / 2, 20);

    // Draw exit hint at bottom
    ctx.fillStyle = "rgba(240, 230, 211, 0.4)";
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText("EXIT", (cols * TILE_SIZE) / 2, rows * TILE_SIZE - 4);
  }
}
