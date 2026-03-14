import { useState, useCallback, useEffect } from "react";
import type { GardenState, PlacedPlant, SeedInventoryItem, BedType, BedConfig } from "../types";
import {
  loadGarden,
  saveGarden,
  listPlans,
  createPlan,
  deletePlan,
  getActivePlanId,
  setActivePlanId,
  type PlanMeta,
} from "../data/garden-config";
import { checkSpacingConflict } from "../engine/planting-rules";

function initState(): { garden: GardenState; planId: string } {
  const plans = listPlans();
  if (plans.length === 0) {
    // First run — create default plan
    const id = createPlan("My Garden 2026");
    return { garden: loadGarden(id), planId: id };
  }
  const activeId = getActivePlanId() || plans[0].id;
  setActivePlanId(activeId);
  return { garden: loadGarden(activeId), planId: activeId };
}

export function useGarden() {
  const [{ garden: initialGarden, planId: initialPlanId }] = useState(initState);
  const [garden, setGarden] = useState<GardenState>(initialGarden);
  const [activePlanId, setActivePlan] = useState(initialPlanId);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [spacingWarning, setSpacingWarning] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanMeta[]>(listPlans);

  // Auto-save on changes
  useEffect(() => {
    saveGarden(garden, activePlanId);
    // Keep plan name in sync
    setPlans(listPlans());
  }, [garden, activePlanId]);

  const placePlant = useCallback(
    (bedId: string, tileX: number, tileY: number) => {
      if (!selectedPlantId) return;
      setSpacingWarning(null);

      setGarden((prev) => {
        const existing = prev.plantings.find(
          (p) => p.bedId === bedId && p.tileX === tileX && p.tileY === tileY
        );

        if (existing) {
          if (existing.plantId === selectedPlantId) {
            return {
              ...prev,
              plantings: prev.plantings.filter((p) => p !== existing),
            };
          }
        }

        const conflict = checkSpacingConflict(
          selectedPlantId,
          bedId,
          tileX,
          tileY,
          existing ? prev.plantings.filter((p) => p !== existing) : prev.plantings
        );
        if (conflict) {
          setSpacingWarning(`Too close to ${conflict}! Needs more spacing.`);
          return prev;
        }

        const newPlantings = existing
          ? prev.plantings.filter((p) => p !== existing)
          : prev.plantings;

        return {
          ...prev,
          plantings: [
            ...newPlantings,
            { plantId: selectedPlantId, bedId, tileX, tileY },
          ],
        };
      });
    },
    [selectedPlantId]
  );

  const placePlantById = useCallback(
    (plantId: string, bedId: string, tileX: number, tileY: number) => {
      setSpacingWarning(null);

      setGarden((prev) => {
        const existing = prev.plantings.find(
          (p) => p.bedId === bedId && p.tileX === tileX && p.tileY === tileY
        );

        if (existing) {
          if (existing.plantId === plantId) {
            return prev; // Same plant — no-op for palette drop
          }
        }

        const conflict = checkSpacingConflict(
          plantId,
          bedId,
          tileX,
          tileY,
          existing ? prev.plantings.filter((p) => p !== existing) : prev.plantings
        );
        if (conflict) {
          setSpacingWarning(`Too close to ${conflict}! Needs more spacing.`);
          return prev;
        }

        const newPlantings = existing
          ? prev.plantings.filter((p) => p !== existing)
          : prev.plantings;

        return {
          ...prev,
          plantings: [
            ...newPlantings,
            { plantId, bedId, tileX, tileY },
          ],
        };
      });
    },
    []
  );

  const movePlant = useCallback(
    (
      fromBedId: string,
      fromX: number,
      fromY: number,
      toBedId: string,
      toX: number,
      toY: number
    ) => {
      setSpacingWarning(null);

      setGarden((prev) => {
        const source = prev.plantings.find(
          (p) => p.bedId === fromBedId && p.tileX === fromX && p.tileY === fromY
        );
        if (!source) return prev;

        const dest = prev.plantings.find(
          (p) => p.bedId === toBedId && p.tileX === toX && p.tileY === toY
        );

        // Same tile — no-op
        if (source === dest) return prev;

        // Check spacing conflict at destination for the source plant
        const otherPlantings = prev.plantings.filter(
          (p) => p !== source && p !== dest
        );
        const conflict = checkSpacingConflict(
          source.plantId,
          toBedId,
          toX,
          toY,
          otherPlantings
        );
        if (conflict) {
          setSpacingWarning(`Too close to ${conflict}! Needs more spacing.`);
          return prev;
        }

        // If destination has a plant, also check spacing for the swap
        if (dest) {
          const swapConflict = checkSpacingConflict(
            dest.plantId,
            fromBedId,
            fromX,
            fromY,
            otherPlantings
          );
          if (swapConflict) {
            setSpacingWarning(
              `Swap blocked: ${swapConflict} too close! Needs more spacing.`
            );
            return prev;
          }
        }

        // Perform the move (or swap)
        const updated = prev.plantings.map((p) => {
          if (p === source) {
            return { ...p, bedId: toBedId, tileX: toX, tileY: toY };
          }
          if (p === dest) {
            return { ...p, bedId: fromBedId, tileX: fromX, tileY: fromY };
          }
          return p;
        });

        return { ...prev, plantings: updated };
      });
    },
    []
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

  const updateGarden = useCallback((updates: Partial<GardenState>) => {
    setGarden((prev) => ({ ...prev, ...updates }));
  }, []);

  const setSuccession = useCallback(
    (plantId: string, intervalWeeks: number, count: number) => {
      setGarden((prev) => {
        const successions = prev.successions || [];
        const existing = successions.findIndex((s) => s.plantId === plantId);
        const updated = [...successions];
        const plan = {
          id: `succ-${plantId}`,
          plantId,
          intervalWeeks,
          count,
        };
        if (existing >= 0) {
          updated[existing] = plan;
        } else {
          updated.push(plan);
        }
        return { ...prev, successions: updated };
      });
    },
    []
  );

  const removeSuccession = useCallback((plantId: string) => {
    setGarden((prev) => ({
      ...prev,
      successions: (prev.successions || []).filter((s) => s.plantId !== plantId),
    }));
  }, []);

  const addHarvest = useCallback(
    (plantId: string, quantity: string, notes?: string) => {
      setGarden((prev) => ({
        ...prev,
        harvests: [
          ...(prev.harvests || []),
          {
            id: `harvest-${Date.now()}`,
            plantId,
            date: new Date().toISOString().split("T")[0],
            quantity,
            notes,
          },
        ],
      }));
    },
    []
  );

  const removeHarvest = useCallback((harvestId: string) => {
    setGarden((prev) => ({
      ...prev,
      harvests: (prev.harvests || []).filter((h) => h.id !== harvestId),
    }));
  }, []);

  const switchPlan = useCallback((planId: string) => {
    setActivePlanId(planId);
    setActivePlan(planId);
    setGarden(loadGarden(planId));
    setSelectedPlantId(null);
    setSpacingWarning(null);
  }, []);

  const addPlan = useCallback((name: string) => {
    const id = createPlan(name);
    setActivePlan(id);
    setGarden(loadGarden(id));
    setPlans(listPlans());
    setSelectedPlantId(null);
  }, []);

  const saveRotationSnapshot = useCallback((year: number) => {
    setGarden((prev) => {
      const bedPlantMap = new Map<string, Set<string>>();
      for (const p of prev.plantings) {
        if (!bedPlantMap.has(p.bedId)) bedPlantMap.set(p.bedId, new Set());
        bedPlantMap.get(p.bedId)!.add(p.plantId);
      }
      const newEntries = Array.from(bedPlantMap.entries()).map(
        ([bedId, plantIds]) => ({
          year,
          bedId,
          plantIds: Array.from(plantIds),
        })
      );
      const existing = (prev.rotationHistory || []).filter(
        (e) => e.year !== year
      );
      return {
        ...prev,
        rotationHistory: [...existing, ...newEntries],
      };
    });
  }, []);

  const addSeed = useCallback(
    (item: Omit<SeedInventoryItem, "id">) => {
      setGarden((prev) => ({
        ...prev,
        seedInventory: [
          ...(prev.seedInventory || []),
          { ...item, id: `seed-${Date.now()}` },
        ],
      }));
    },
    []
  );

  const updateSeed = useCallback(
    (id: string, updates: Partial<SeedInventoryItem>) => {
      setGarden((prev) => ({
        ...prev,
        seedInventory: (prev.seedInventory || []).map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }));
    },
    []
  );

  const removeSeed = useCallback((id: string) => {
    setGarden((prev) => ({
      ...prev,
      seedInventory: (prev.seedInventory || []).filter((s) => s.id !== id),
    }));
  }, []);

  const addBed = useCallback(
    (name: string, type: BedType, width: number, height: number) => {
      setGarden((prev) => ({
        ...prev,
        beds: [
          ...prev.beds,
          {
            id: `bed-${Date.now()}`,
            name,
            type,
            widthFt: width,
            heightFt: height,
            posX: 0,
            posY: 0,
            sunExposure: "full" as const,
          },
        ],
      }));
    },
    []
  );

  const removeBed = useCallback((bedId: string) => {
    setGarden((prev) => ({
      ...prev,
      beds: prev.beds.filter((b) => b.id !== bedId),
      plantings: prev.plantings.filter((p) => p.bedId !== bedId),
    }));
  }, []);

  const updateBed = useCallback(
    (bedId: string, updates: Partial<BedConfig>) => {
      setGarden((prev) => ({
        ...prev,
        beds: prev.beds.map((b) =>
          b.id === bedId ? { ...b, ...updates } : b
        ),
      }));
    },
    []
  );

  const reorderBeds = useCallback((fromIndex: number, toIndex: number) => {
    setGarden((prev) => {
      const beds = [...prev.beds];
      const [moved] = beds.splice(fromIndex, 1);
      beds.splice(toIndex, 0, moved);
      return { ...prev, beds };
    });
  }, []);

  const removePlan = useCallback((planId: string) => {
    deletePlan(planId);
    const remaining = listPlans();
    setPlans(remaining);
    if (planId === activePlanId && remaining.length > 0) {
      switchPlan(remaining[0].id);
    }
  }, [activePlanId, switchPlan]);

  return {
    garden,
    selectedPlantId,
    setSelectedPlantId,
    placePlant,
    placePlantById,
    movePlant,
    removePlant,
    getPlantAt,
    clearBed,
    clearAll,
    updateGarden,
    spacingWarning,
    plans,
    activePlanId,
    switchPlan,
    addPlan,
    removePlan,
    setSuccession,
    removeSuccession,
    addHarvest,
    removeHarvest,
    saveRotationSnapshot,
    addSeed,
    updateSeed,
    removeSeed,
    addBed,
    removeBed,
    updateBed,
    reorderBeds,
  };
}
