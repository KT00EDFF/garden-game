import { useState, useCallback } from "react";
import type { GardenState } from "../types";
import { BedGrid } from "./BedGrid";

interface GardenViewProps {
  garden: GardenState;
  selectedPlantId: string | null;
  onTileClick: (bedId: string, tileX: number, tileY: number) => void;
  onTileRightClick: (bedId: string, tileX: number, tileY: number) => void;
  onPlantTap: (bedId: string, tileX: number, tileY: number) => void;
  onMovePlant?: (
    fromBedId: string,
    fromX: number,
    fromY: number,
    toBedId: string,
    toX: number,
    toY: number
  ) => void;
  onPlacePlantById?: (plantId: string, bedId: string, tileX: number, tileY: number) => void;
}

export function GardenView({
  garden,
  selectedPlantId,
  onTileClick,
  onTileRightClick,
  onPlantTap,
  onMovePlant,
  onPlacePlantById,
}: GardenViewProps) {
  const totalPlantings = garden.plantings.length;
  const totalTiles = garden.beds.reduce((sum, b) => sum + b.widthFt * b.heightFt, 0);

  const [isDragging, setIsDragging] = useState(false);
  const [dragSource, setDragSource] = useState<{ bedId: string; tileX: number; tileY: number } | null>(null);

  const handleDragStart = useCallback((bedId: string, tileX: number, tileY: number) => {
    setIsDragging(true);
    setDragSource({ bedId, tileX, tileY });
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragSource(null);
  }, []);

  const handleDrop = useCallback(
    (bedId: string, tileX: number, tileY: number) => {
      if (dragSource && onMovePlant) {
        onMovePlant(dragSource.bedId, dragSource.tileX, dragSource.tileY, bedId, tileX, tileY);
      }
      setIsDragging(false);
      setDragSource(null);
    },
    [dragSource, onMovePlant]
  );

  const handleDragOver = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_bedId: string, _tileX: number, _tileY: number) => {
      // Could add hover-state tracking here in the future
    },
    []
  );

  const bedGridProps = (bed: typeof garden.beds[0]) => ({
    key: bed.id,
    bed,
    plantings: garden.plantings,
    selectedPlantId,
    onTileClick,
    onTileRightClick,
    zone: garden.zone,
    lastFrostDate: garden.lastFrostDate,
    firstFrostDate: garden.firstFrostDate,
    rotationHistory: garden.rotationHistory,
    onPlantTap,
    isDragging,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDrop: handleDrop,
    onPaletteDrop: onPlacePlantById,
    onDragOver: handleDragOver,
  });

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
        {/* Small raised beds (area <= 6) */}
        {garden.beds.filter((b) => b.type === "raised" && b.widthFt * b.heightFt <= 6).length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {garden.beds
              .filter((b) => b.type === "raised" && b.widthFt * b.heightFt <= 6)
              .map((bed) => (
                <BedGrid {...bedGridProps(bed)} />
              ))}
          </div>
        )}

        {/* Medium raised beds (area 7-20) */}
        {garden.beds.filter((b) => b.type === "raised" && b.widthFt * b.heightFt > 6 && b.widthFt * b.heightFt <= 20).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {garden.beds
              .filter((b) => b.type === "raised" && b.widthFt * b.heightFt > 6 && b.widthFt * b.heightFt <= 20)
              .map((bed) => (
                <BedGrid {...bedGridProps(bed)} />
              ))}
          </div>
        )}

        {/* Large raised beds (area > 20) */}
        {garden.beds
          .filter((b) => b.type === "raised" && b.widthFt * b.heightFt > 20)
          .map((bed) => (
            <BedGrid {...bedGridProps(bed)} />
          ))}

        {/* In-ground beds stacked */}
        {garden.beds.filter((b) => b.type === "in-ground").length > 0 && (
          <div className="flex flex-col gap-3">
            {garden.beds
              .filter((b) => b.type === "in-ground")
              .map((bed) => (
                <BedGrid {...bedGridProps(bed)} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
