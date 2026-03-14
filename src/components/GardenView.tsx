import type { GardenState } from "../types";
import { BedGrid } from "./BedGrid";

interface GardenViewProps {
  garden: GardenState;
  selectedPlantId: string | null;
  onTileClick: (bedId: string, tileX: number, tileY: number) => void;
  onTileRightClick: (bedId: string, tileX: number, tileY: number) => void;
}

export function GardenView({
  garden,
  selectedPlantId,
  onTileClick,
  onTileRightClick,
}: GardenViewProps) {
  const totalPlantings = garden.plantings.length;
  const totalTiles = garden.beds.reduce((sum, b) => sum + b.widthFt * b.heightFt, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] text-accent uppercase tracking-wider">
          {garden.name}
        </h2>
        <span className="text-[8px] text-text-secondary">
          {totalPlantings}/{totalTiles} tiles planted
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Group: Raised beds row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {garden.beds
            .filter((b) => b.id === "bed-1" || b.id === "bed-2")
            .map((bed) => (
              <BedGrid
                key={bed.id}
                bed={bed}
                plantings={garden.plantings}
                selectedPlantId={selectedPlantId}
                onTileClick={onTileClick}
                onTileRightClick={onTileRightClick}
              />
            ))}
        </div>

        {/* Group: Medium beds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {garden.beds
            .filter((b) => ["bed-3", "bed-6"].includes(b.id))
            .map((bed) => (
              <BedGrid
                key={bed.id}
                bed={bed}
                plantings={garden.plantings}
                selectedPlantId={selectedPlantId}
                onTileClick={onTileClick}
                onTileRightClick={onTileRightClick}
              />
            ))}
        </div>

        {/* Group: In-ground beds */}
        <div className="flex flex-col gap-3">
          {garden.beds
            .filter((b) => ["bed-4", "bed-5"].includes(b.id))
            .map((bed) => (
              <BedGrid
                key={bed.id}
                bed={bed}
                plantings={garden.plantings}
                selectedPlantId={selectedPlantId}
                onTileClick={onTileClick}
                onTileRightClick={onTileRightClick}
              />
            ))}
        </div>

        {/* Group: Small raised beds */}
        <div className="grid grid-cols-2 gap-3">
          {garden.beds
            .filter((b) => ["bed-7", "bed-8"].includes(b.id))
            .map((bed) => (
              <BedGrid
                key={bed.id}
                bed={bed}
                plantings={garden.plantings}
                selectedPlantId={selectedPlantId}
                onTileClick={onTileClick}
                onTileRightClick={onTileRightClick}
              />
            ))}
        </div>

        {/* Large in-ground bed */}
        {garden.beds
          .filter((b) => b.id === "bed-9")
          .map((bed) => (
            <BedGrid
              key={bed.id}
              bed={bed}
              plantings={garden.plantings}
              selectedPlantId={selectedPlantId}
              onTileClick={onTileClick}
              onTileRightClick={onTileRightClick}
            />
          ))}
      </div>
    </div>
  );
}
