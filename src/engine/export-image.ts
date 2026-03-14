import type { GardenState } from "../types";
import { plantsById } from "../data/plants";

const CANVAS_WIDTH = 800;
const PADDING = 24;
const BG_COLOR = "#1E3A0E";
const TEXT_COLOR = "#f0e6d3";
const ACCENT_COLOR = "#FFD700";
const SOIL_RAISED = "#8B6914";
const SOIL_INGROUND = "#6B5B3A";
const BORDER_RAISED = "#A0522D";
const BORDER_INGROUND = "#8B7355";
const TILE_SIZE = 36;
const TILE_GAP = 2;

export async function exportGardenAsImage(
  garden: GardenState
): Promise<Blob> {
  // Pre-calculate layout to determine canvas height
  const bedLayouts = garden.beds.map((bed) => {
    const gridW = bed.widthFt * (TILE_SIZE + TILE_GAP) + TILE_GAP;
    const gridH = bed.heightFt * (TILE_SIZE + TILE_GAP) + TILE_GAP;
    return { bed, gridW, gridH };
  });

  // Collect unique planted species for the legend
  const plantedSpecies = new Set<string>();
  for (const p of garden.plantings) {
    plantedSpecies.add(p.plantId);
  }
  const legendItems = Array.from(plantedSpecies)
    .map((id) => plantsById[id])
    .filter(Boolean);

  // Calculate total height
  let y = PADDING;
  // Header section
  y += 28; // garden name
  y += 16; // zone line
  y += 16; // frost dates line
  y += 20; // spacing after header

  // Each bed
  for (const layout of bedLayouts) {
    y += 18; // bed name
    y += 6; // gap
    y += layout.gridH + 4; // grid + border
    y += 20; // spacing between beds
  }

  // Legend
  if (legendItems.length > 0) {
    y += 20; // legend title
    const legendCols = 3;
    const legendRows = Math.ceil(legendItems.length / legendCols);
    y += legendRows * 22;
  }

  y += PADDING; // bottom padding
  const CANVAS_HEIGHT = y;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // --- Header ---
  let curY = PADDING;

  ctx.fillStyle = ACCENT_COLOR;
  ctx.font = "bold 22px sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(garden.name, PADDING, curY);
  curY += 28;

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = "14px sans-serif";
  ctx.fillText(`Zone ${garden.zone}`, PADDING, curY);
  curY += 16;

  ctx.font = "12px sans-serif";
  ctx.fillStyle = TEXT_COLOR;
  const lastFrost = formatDate(garden.lastFrostDate);
  const firstFrost = formatDate(garden.firstFrostDate);
  ctx.fillText(
    `Last frost: ${lastFrost}  ·  First frost: ${firstFrost}`,
    PADDING,
    curY
  );
  curY += 16;

  // Divider
  curY += 6;
  ctx.strokeStyle = ACCENT_COLOR + "44";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, curY);
  ctx.lineTo(CANVAS_WIDTH - PADDING, curY);
  ctx.stroke();
  curY += 14;

  // --- Beds ---
  for (const layout of bedLayouts) {
    const { bed, gridW, gridH } = layout;

    // Bed name and type label
    ctx.fillStyle = ACCENT_COLOR;
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(bed.name, PADDING, curY);

    const typeLabel = bed.type === "raised" ? "Raised" : "In-Ground";
    const nameWidth = ctx.measureText(bed.name).width;
    ctx.fillStyle = TEXT_COLOR + "99";
    ctx.font = "11px sans-serif";
    ctx.fillText(`  (${typeLabel}, ${bed.widthFt}×${bed.heightFt} ft)`, PADDING + nameWidth, curY + 2);
    curY += 18;
    curY += 6;

    // Center grid horizontally
    const gridX = Math.floor((CANVAS_WIDTH - gridW) / 2);

    // Draw border
    if (bed.type === "raised") {
      ctx.strokeStyle = BORDER_RAISED;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = BORDER_INGROUND;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
    }
    ctx.strokeRect(gridX - 2, curY - 2, gridW + 4, gridH + 4);
    ctx.setLineDash([]);

    // Draw tiles
    const soilColor = bed.type === "raised" ? SOIL_RAISED : SOIL_INGROUND;

    for (let ty = 0; ty < bed.heightFt; ty++) {
      for (let tx = 0; tx < bed.widthFt; tx++) {
        const tileX = gridX + TILE_GAP + tx * (TILE_SIZE + TILE_GAP);
        const tileY = curY + TILE_GAP + ty * (TILE_SIZE + TILE_GAP);

        const planting = garden.plantings.find(
          (p) => p.bedId === bed.id && p.tileX === tx && p.tileY === ty
        );

        if (planting) {
          const plant = plantsById[planting.plantId];
          if (plant) {
            // Plant tile background
            ctx.fillStyle = plant.color + "88";
            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

            // Emoji
            ctx.font = "16px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = TEXT_COLOR;
            ctx.fillText(plant.emoji, tileX + TILE_SIZE / 2, tileY + TILE_SIZE / 2 - 4);

            // Name (small, truncated)
            ctx.font = "7px sans-serif";
            ctx.fillStyle = TEXT_COLOR;
            const displayName =
              plant.name.length > 7
                ? plant.name.slice(0, 6) + "…"
                : plant.name;
            ctx.fillText(
              displayName,
              tileX + TILE_SIZE / 2,
              tileY + TILE_SIZE - 4
            );
            ctx.textAlign = "left";
          }
        } else {
          // Empty soil tile
          ctx.fillStyle = soilColor;
          ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

          // Subtle soil texture dots
          ctx.fillStyle = soilColor + "44";
          ctx.fillRect(tileX + 8, tileY + 8, 2, 2);
          ctx.fillRect(tileX + 20, tileY + 16, 2, 2);
          ctx.fillRect(tileX + 14, tileY + 26, 2, 2);
        }
      }
    }

    curY += gridH + 4;
    curY += 20;
  }

  // --- Legend ---
  if (legendItems.length > 0) {
    ctx.fillStyle = ACCENT_COLOR;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Legend", PADDING, curY);
    curY += 20;

    const legendCols = 3;
    const colWidth = Math.floor(
      (CANVAS_WIDTH - PADDING * 2) / legendCols
    );

    for (let i = 0; i < legendItems.length; i++) {
      const plant = legendItems[i];
      const col = i % legendCols;
      const row = Math.floor(i / legendCols);
      const lx = PADDING + col * colWidth;
      const ly = curY + row * 22;

      // Color swatch
      ctx.fillStyle = plant.color;
      ctx.fillRect(lx, ly + 2, 12, 12);

      // Emoji + name
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "12px sans-serif";
      ctx.fillText(`${plant.emoji} ${plant.name}`, lx + 18, ly + 1);
    }
  }

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to export canvas as image"));
      }
    }, "image/png");
  });
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
