import { useState, useCallback, useEffect } from "react";
import type { GardenState, PlacedPlant } from "../types";
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
  };
}
