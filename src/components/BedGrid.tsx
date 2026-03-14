import type { BedConfig, PlacedPlant } from "../types";
import { plantsById } from "../data/plants";
import { getTileCompanionStatus } from "../engine/planting-rules";

interface BedGridProps {
  bed: BedConfig;
  plantings: PlacedPlant[];
  selectedPlantId: string | null;
  onTileClick: (bedId: string, tileX: number, tileY: number) => void;
  onTileRightClick: (bedId: string, tileX: number, tileY: number) => void;
}

export function BedGrid({
  bed,
  plantings,
  selectedPlantId,
  onTileClick,
  onTileRightClick,
}: BedGridProps) {
  const bedPlantings = plantings.filter((p) => p.bedId === bed.id);
  const isRaised = bed.type === "raised";

  const tiles: React.ReactNode[] = [];
  for (let y = 0; y < bed.heightFt; y++) {
    for (let x = 0; x < bed.widthFt; x++) {
      const placed = bedPlantings.find((p) => p.tileX === x && p.tileY === y);
      const plant = placed ? plantsById[placed.plantId] : null;

      // Check companion status for placed plants
      let companionClass = "";
      if (placed) {
        const status = getTileCompanionStatus(
          placed.plantId,
          bed.id,
          x,
          y,
          plantings
        );
        if (status === "good") companionClass = "ring-2 ring-green-400";
        if (status === "bad") companionClass = "ring-2 ring-red-400 animate-pulse";
      }

      // Preview companion status when hovering with selected plant
      let previewClass = "";
      if (!placed && selectedPlantId) {
        const previewStatus = getTileCompanionStatus(
          selectedPlantId,
          bed.id,
          x,
          y,
          plantings
        );
        if (previewStatus === "good") previewClass = "hover:ring-2 hover:ring-green-400/50";
        if (previewStatus === "bad") previewClass = "hover:ring-2 hover:ring-red-400/50";
      }

      tiles.push(
        <button
          key={`${x}-${y}`}
          className={`
            aspect-square flex items-center justify-center text-lg
            transition-all duration-100
            ${plant
              ? `${companionClass}`
              : `hover:brightness-125 ${previewClass}`
            }
            ${selectedPlantId && !plant ? "cursor-crosshair" : "cursor-pointer"}
          `}
          style={{
            backgroundColor: plant ? plant.color : isRaised ? "#8B6914" : "#6B5B3A",
            imageRendering: "pixelated",
          }}
          title={plant ? `${plant.name} - Right click to remove` : selectedPlantId ? `Place ${plantsById[selectedPlantId]?.name}` : "Select a plant first"}
          onClick={() => onTileClick(bed.id, x, y)}
          onContextMenu={(e) => {
            e.preventDefault();
            onTileRightClick(bed.id, x, y);
          }}
        >
          {plant && (
            <span className="drop-shadow-md" style={{ fontSize: bed.widthFt > 10 ? "14px" : "18px" }}>
              {plant.emoji}
            </span>
          )}
        </button>
      );
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[8px] text-text-secondary uppercase tracking-wider">
          {bed.name}
        </span>
        <span className="text-[7px] text-text-secondary">
          {bed.widthFt}x{bed.heightFt}ft
          {bed.type === "in-ground" ? " (ground)" : ""}
        </span>
      </div>
      <div
        className={`
          grid gap-[2px] p-1
          ${isRaised
            ? "border-2 border-bed-wood bg-bed-wood-dark rounded-sm shadow-lg shadow-black/30"
            : "border-2 border-ground-dark border-dashed bg-ground-dark/50 rounded-sm"
          }
        `}
        style={{
          gridTemplateColumns: `repeat(${bed.widthFt}, 1fr)`,
        }}
      >
        {tiles}
      </div>
    </div>
  );
}
