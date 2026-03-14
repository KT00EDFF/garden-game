import { useState, useCallback, useEffect } from "react";
import type { GardenState, PlacedPlant } from "../types";
import { loadGarden, saveGarden } from "../data/garden-config";

export function useGarden() {
  const [garden, setGarden] = useState<GardenState>(loadGarden);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  // Auto-save on changes
  useEffect(() => {
    saveGarden(garden);
  }, [garden]);

  const placePlant = useCallback(
    (bedId: string, tileX: number, tileY: number) => {
      if (!selectedPlantId) return;

      setGarden((prev) => {
        // Check if tile is already occupied
        const existing = prev.plantings.find(
          (p) => p.bedId === bedId && p.tileX === tileX && p.tileY === tileY
        );

        if (existing) {
          // Remove existing plant if same type (toggle off), or replace
          if (existing.plantId === selectedPlantId) {
            return {
              ...prev,
              plantings: prev.plantings.filter((p) => p !== existing),
            };
          }
          // Replace with new plant
          return {
            ...prev,
            plantings: [
              ...prev.plantings.filter((p) => p !== existing),
              { plantId: selectedPlantId, bedId, tileX, tileY },
            ],
          };
        }

        // Place new plant
        return {
          ...prev,
          plantings: [
            ...prev.plantings,
            { plantId: selectedPlantId, bedId, tileX, tileY },
          ],
        };
      });
    },
    [selectedPlantId]
  );

  const removePlant = useCallback(
    (bedId: string, tileX: number, tileY: number) => {
      setGarden((prev) => ({
        ...prev,
        plantings: prev.plantings.filter(
          (p) => !(p.bedId === bedId && p.tileX === tileX && p.tileY === tileY)
        ),
      }));
    },
    []
  );

  const getPlantAt = useCallback(
    (bedId: string, tileX: number, tileY: number): PlacedPlant | undefined => {
      return garden.plantings.find(
        (p) => p.bedId === bedId && p.tileX === tileX && p.tileY === tileY
      );
    },
    [garden.plantings]
  );

  const clearBed = useCallback((bedId: string) => {
    setGarden((prev) => ({
      ...prev,
      plantings: prev.plantings.filter((p) => p.bedId !== bedId),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setGarden((prev) => ({
      ...prev,
      plantings: [],
    }));
  }, []);

  return {
    garden,
    selectedPlantId,
    setSelectedPlantId,
    placePlant,
    removePlant,
    getPlantAt,
    clearBed,
    clearAll,
  };
}
