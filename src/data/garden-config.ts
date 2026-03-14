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

export function loadGarden(): GardenState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // corrupted data, reset
    }
  }
  return defaultGardenState;
}

export function saveGarden(state: GardenState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
