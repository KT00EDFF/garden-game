import type { BedConfig, PlacedPlant, RotationEntry, SunRequirement } from "../types";
import { plantsById } from "../data/plants";
import { getTileCompanionStatus, checkZoneCompatibility } from "../engine/planting-rules";
import { checkRotationConflict } from "../data/plant-families";
import { getGrowthStage } from "../engine/growth-stage";
import { getStageVisuals } from "../data/growth-sprites";

interface BedGridProps {
  bed: BedConfig;
  plantings: PlacedPlant[];
  selectedPlantId: string | null;
  zone?: string;
  lastFrostDate?: string;
  firstFrostDate?: string;
  rotationHistory?: RotationEntry[];
  onTileClick: (bedId: string, tileX: number, tileY: number) => void;
  onTileRightClick: (bedId: string, tileX: number, tileY: number) => void;
  onPlantTap: (bedId: string, tileX: number, tileY: number) => void;
}

const sunIcons: Record<SunRequirement, string> = {
  full: "☀️",
  partial: "⛅",
  shade: "🌥️",
};

export function BedGrid({
  bed,
  plantings,
  selectedPlantId,
  zone = "6a",
  lastFrostDate,
  firstFrostDate,
  rotationHistory = [],
  onTileClick,
  onTileRightClick,
  onPlantTap,
}: BedGridProps) {
  const bedPlantings = plantings.filter((p) => p.bedId === bed.id);
  const isRaised = bed.type === "raised";
  const bedSun = bed.sunExposure || "full";

  // Check if selected plant has a sun mismatch with this bed
  const selectedPlant = selectedPlantId ? plantsById[selectedPlantId] : null;
  const sunMismatch =
    selectedPlant &&
    ((selectedPlant.sunRequirement === "full" && bedSun === "shade") ||
     (selectedPlant.sunRequirement === "full" && bedSun === "partial"));

  const tiles: React.ReactNode[] = [];
  for (let y = 0; y < bed.heightFt; y++) {
    for (let x = 0; x < bed.widthFt; x++) {
      const placed = bedPlantings.find((p) => p.tileX === x && p.tileY === y);
      const plant = placed ? plantsById[placed.plantId] : null;

      // Growth stage visuals
      const stage = plant && lastFrostDate && firstFrostDate
        ? getGrowthStage(placed!.plantId, lastFrostDate, firstFrostDate)
        : null;
      const stageVisuals = stage && plant
        ? getStageVisuals(stage, plant.emoji)
        : null;
      const growthAnimClass = stage === "sprout" || stage === "growing"
        ? "animate-growth"
        : stage === "harvest"
        ? "animate-harvest"
        : "";

      // Sun warning for placed plant
      const placedSunWarn =
        plant &&
        ((plant.sunRequirement === "full" && bedSun === "shade") ||
         (plant.sunRequirement === "full" && bedSun === "partial"));

      // Zone warning for placed plant
      const zoneStatus = placed ? checkZoneCompatibility(placed.plantId, zone) : "ok";

      const rotationResult = placed
        ? checkRotationConflict(bed.id, placed.plantId, rotationHistory)
        : { hasConflict: false };

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
            aspect-square flex items-center justify-center text-lg relative
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
            ...(stageVisuals ? { opacity: stageVisuals.opacity } : {}),
          }}
          title={
            plant
              ? `${plant.name}${placedSunWarn ? " ⚠ Needs more sun!" : ""}${zoneStatus !== "ok" ? ` ⚠ ${zoneStatus} for zone ${zone}` : ""} — Tap to inspect`
              : selectedPlantId
              ? `Place ${plantsById[selectedPlantId]?.name}${sunMismatch ? " (sun warning)" : ""}`
              : "Select a plant first"
          }
          onClick={() => {
            if (plant && !selectedPlantId) {
              onPlantTap(bed.id, x, y);
            } else {
              onTileClick(bed.id, x, y);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onTileRightClick(bed.id, x, y);
          }}
        >
          {plant && stageVisuals && (
            <>
              <span
                className={`drop-shadow-md ${growthAnimClass}`}
                style={{
                  fontSize: bed.widthFt > 10 ? "14px" : "18px",
                  transform: `scale(${stageVisuals.scale})`,
                  display: "inline-block",
                }}
              >
                {stageVisuals.emoji}
              </span>
              <span
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: stageVisuals.bgTint }}
              />
            </>
          )}
          {plant && !stageVisuals && (
            <span className="drop-shadow-md" style={{ fontSize: bed.widthFt > 10 ? "14px" : "18px" }}>
              {plant.emoji}
            </span>
          )}
          {placedSunWarn && (
            <span className="absolute -top-0.5 -right-0.5 text-[8px]">⚠️</span>
          )}
          {!placedSunWarn && zoneStatus !== "ok" && (
            <span className="absolute -top-0.5 -right-0.5 text-[8px]">
              {zoneStatus === "incompatible" ? "❌" : "⚠️"}
            </span>
          )}
          {rotationResult.hasConflict && (
            <span
              className="absolute -bottom-0.5 -left-0.5 text-[8px]"
              title={`Same family (${rotationResult.family}) was here in ${rotationResult.lastYear}`}
            >
              🔄
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
        <span className="text-[7px] text-text-secondary flex items-center gap-1">
          <span>{sunIcons[bedSun]}</span>
          {bed.widthFt}x{bed.heightFt}ft
          {bed.type === "in-ground" ? " (ground)" : ""}
        </span>
      </div>
      {sunMismatch && (
        <div className="text-[6px] text-accent px-1">
          ⚠ {selectedPlant?.name} wants full sun — this bed is {bedSun}
        </div>
      )}
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
