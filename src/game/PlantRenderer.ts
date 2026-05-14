import type { PlacedPlant, GardenState } from "../types";
import { plants } from "../data/plants";
import { getGrowthStage, type GrowthStage } from "../engine/growth-stage";
import { getStageVisuals } from "../data/growth-sprites";
import { TILE_SIZE } from "./types";
import { bedWorldPos } from "./TileMap";

const plantMap = new Map(plants.map(p => [p.id, p]));

export class PlantRenderer {
  /**
   * Draw all plants for a specific bed.
   * For outdoor beds, positions are world-space.
   * For greenhouse beds, positions are greenhouse-space (posX/posY directly).
   */
  drawBedPlants(
    ctx: CanvasRenderingContext2D,
    bed: { id: string; posX: number; posY: number; widthFt: number; heightFt: number; location?: string; worldX?: number; worldY?: number },
    plantings: PlacedPlant[],
    garden: GardenState,
    isOutdoor: boolean,
  ): void {
    const bedPlants = plantings.filter(p => p.bedId === bed.id);
    if (bedPlants.length === 0) return;

    const { wx, wy } = isOutdoor
      ? bedWorldPos(bed as import("../types").BedConfig)
      : { wx: bed.posX, wy: bed.posY };

    for (const placed of bedPlants) {
      const plant = plantMap.get(placed.plantId);
      if (!plant) continue;

      const px = (wx + placed.tileX) * TILE_SIZE;
      const py = (wy + placed.tileY) * TILE_SIZE;

      // Get growth stage
      let stage: GrowthStage = "mature";
      try {
        stage = getGrowthStage(
          placed.plantId,
          garden.lastFrostDate,
          garden.firstFrostDate,
        );
      } catch {
        // fallback to mature
      }

      const visuals = getStageVisuals(stage, plant.emoji);

      // Background tint
      ctx.fillStyle = visuals.bgTint;
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      // Draw emoji
      ctx.globalAlpha = visuals.opacity;
      const fontSize = Math.floor(TILE_SIZE * visuals.scale * 0.65);
      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(visuals.emoji, px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 1);
      ctx.globalAlpha = 1;
    }
  }

  /** Draw a single plant emoji at a specific pixel position (for previews) */
  drawPlantPreview(
    ctx: CanvasRenderingContext2D,
    plantId: string,
    px: number, py: number,
    size: number,
  ): void {
    const plant = plantMap.get(plantId);
    if (!plant) return;
    ctx.font = `${Math.floor(size * 0.65)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(plant.emoji, px + size / 2, py + size / 2 + 1);
  }
}
