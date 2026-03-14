import type { BedConfig, GardenState } from "../types";

export const defaultBeds: BedConfig[] = [
  { id: "bed-1", name: "Raised Bed 1", type: "raised", widthFt: 5, heightFt: 3, posX: 0, posY: 0 },
  { id: "bed-2", name: "Raised Bed 2", type: "raised", widthFt: 5, heightFt: 3, posX: 6, posY: 0 },
  { id: "bed-3", name: "Raised Bed 3", type: "raised", widthFt: 8, heightFt: 2, posX: 0, posY: 4 },
  { id: "bed-4", name: "In-Ground 1", type: "in-ground", widthFt: 8, heightFt: 2, posX: 0, posY: 7 },
  { id: "bed-5", name: "In-Ground 2", type: "in-ground", widthFt: 8, heightFt: 2, posX: 0, posY: 10 },
  { id: "bed-6", name: "Raised Bed 4", type: "raised", widthFt: 4, heightFt: 3, posX: 9, posY: 4 },
  { id: "bed-7", name: "Small Bed 1", type: "raised", widthFt: 3, heightFt: 2, posX: 9, posY: 8 },
  { id: "bed-8", name: "Small Bed 2", type: "raised", widthFt: 3, heightFt: 2, posX: 9, posY: 11 },
  { id: "bed-9", name: "In-Ground 3", type: "in-ground", widthFt: 16, heightFt: 2, posX: 0, posY: 13 },
];

export const defaultGardenState: GardenState = {
  name: "My Garden 2026",
  zone: "6a",
  zipCode: "60068",
  lastFrostDate: "2026-04-28",
  firstFrostDate: "2026-10-12",
  beds: defaultBeds,
  plantings: [],
};

const STORAGE_KEY = "garden-game-state";
const PLANS_INDEX_KEY = "garden-game-plans";
const ACTIVE_PLAN_KEY = "garden-game-active-plan";

function planStorageKey(planId: string): string {
  return `${STORAGE_KEY}-${planId}`;
}

export interface PlanMeta {
  id: string;
  name: string;
  createdAt: string;
}

export function listPlans(): PlanMeta[] {
  const raw = localStorage.getItem(PLANS_INDEX_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch { /* fall through */ }
  }
  // Migrate: if old single-plan data exists, wrap it
  const legacy = localStorage.getItem(STORAGE_KEY);
  if (legacy) {
    try {
      const state: GardenState = JSON.parse(legacy);
      const meta: PlanMeta = {
        id: "default",
        name: state.name,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(planStorageKey("default"), legacy);
      localStorage.setItem(PLANS_INDEX_KEY, JSON.stringify([meta]));
      localStorage.setItem(ACTIVE_PLAN_KEY, "default");
      localStorage.removeItem(STORAGE_KEY);
      return [meta];
    } catch { /* fall through */ }
  }
  return [];
}

export function getActivePlanId(): string | null {
  return localStorage.getItem(ACTIVE_PLAN_KEY);
}

export function setActivePlanId(id: string): void {
  localStorage.setItem(ACTIVE_PLAN_KEY, id);
}

export function loadGarden(planId?: string): GardenState {
  const id = planId || getActivePlanId();
  if (id) {
    const raw = localStorage.getItem(planStorageKey(id));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch { /* fall through */ }
    }
  }
  return defaultGardenState;
}

export function saveGarden(state: GardenState, planId?: string): void {
  const id = planId || getActivePlanId() || "default";
  localStorage.setItem(planStorageKey(id), JSON.stringify(state));

  // Update name in index
  const plans = listPlans();
  const idx = plans.findIndex((p) => p.id === id);
  if (idx >= 0) {
    plans[idx].name = state.name;
    localStorage.setItem(PLANS_INDEX_KEY, JSON.stringify(plans));
  }
}

export function createPlan(name: string): string {
  const id = `plan-${Date.now()}`;
  const plans = listPlans();
  plans.push({ id, name, createdAt: new Date().toISOString() });
  localStorage.setItem(PLANS_INDEX_KEY, JSON.stringify(plans));

  const newState: GardenState = { ...defaultGardenState, name };
  localStorage.setItem(planStorageKey(id), JSON.stringify(newState));
  setActivePlanId(id);
  return id;
}

export function deletePlan(planId: string): void {
  const plans = listPlans().filter((p) => p.id !== planId);
  localStorage.setItem(PLANS_INDEX_KEY, JSON.stringify(plans));
  localStorage.removeItem(planStorageKey(planId));

  if (getActivePlanId() === planId) {
    if (plans.length > 0) {
      setActivePlanId(plans[0].id);
    } else {
      localStorage.removeItem(ACTIVE_PLAN_KEY);
    }
  }
}
