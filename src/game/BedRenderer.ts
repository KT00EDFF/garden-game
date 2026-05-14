import type { BedConfig } from "../types";
import { TILE_SIZE } from "./types";
import { getTileSprite } from "./ProceduralSprites";
import { bedWorldPos } from "./TileMap";

export class BedRenderer {
  /** Draw a raised or in-ground bed in ¾ aerial view */
  draw(ctx: CanvasRenderingContext2D, bed: BedConfig, isOutdoor: boolean): void {
    const { wx, wy } = isOutdoor
      ? bedWorldPos(bed)
      : { wx: bed.posX, wy: bed.posY };

    const px = wx * TILE_SIZE;
    const py = wy * TILE_SIZE;
    const pw = bed.widthFt * TILE_SIZE;
    const ph = bed.heightFt * TILE_SIZE;

    if (bed.type === "raised") {
      this.drawRaisedBed(ctx, px, py, pw, ph);
    } else {
      this.drawInGroundBed(ctx, px, py, pw, ph);
    }

    // Soil tiles inside
    const soilSprite = getTileSprite("soil");
    for (let ty = 0; ty < bed.heightFt; ty++) {
      for (let tx = 0; tx < bed.widthFt; tx++) {
        ctx.drawImage(soilSprite, px + tx * TILE_SIZE, py + ty * TILE_SIZE);
      }
    }
  }

  private drawRaisedBed(
    ctx: CanvasRenderingContext2D,
    px: number, py: number, pw: number, ph: number,
  ): void {
    const T = TILE_SIZE;

    // Wood border sprites
    const woodTop = getTileSprite("wood-top");
    const woodBottom = getTileSprite("wood-bottom");
    const woodLeft = getTileSprite("wood-left");
    const woodRight = getTileSprite("wood-right");

    // Top border
    for (let x = -1; x <= Math.floor(pw / T); x++) {
      ctx.drawImage(woodTop, px + x * T, py - T);
    }
    // Bottom border (with ¾ perspective depth)
    for (let x = -1; x <= Math.floor(pw / T); x++) {
      ctx.drawImage(woodBottom, px + x * T, py + ph);
    }
    // Left border
    for (let y = 0; y < Math.floor(ph / T); y++) {
      ctx.drawImage(woodLeft, px - T, py + y * T);
    }
    // Right border
    for (let y = 0; y < Math.floor(ph / T); y++) {
      ctx.drawImage(woodRight, px + pw, py + y * T);
    }

    // Shadow beneath the bed (¾ view depth)
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(px - T + 4, py + ph + T, pw + T * 2 - 8, 6);
  }

  private drawInGroundBed(
    ctx: CanvasRenderingContext2D,
    px: number, py: number, pw: number, ph: number,
  ): void {
    // Dashed outline for in-ground beds
    ctx.strokeStyle = "rgba(240, 230, 211, 0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
    ctx.setLineDash([]);
  }
}
