import type { PlacedPlant } from "../types";
import { plantsById } from "../data/plants";

export type CompanionStatus = "good" | "bad" | "neutral";

export function checkCompanion(plantIdA: string, plantIdB: string): CompanionStatus {
  const a = plantsById[plantIdA];
  const b = plantsById[plantIdB];
  if (!a || !b) return "neutral";

  if (a.companions.includes(plantIdB) || b.companions.includes(plantIdA)) {
    return "good";
  }
  if (a.enemies.includes(plantIdB) || b.enemies.includes(plantIdA)) {
    return "bad";
  }

  // Check category-level matches (e.g., "brassica" matches broccoli, cabbage, etc.)
  const brassicas = ["broccoli", "cabbage", "kale", "cauliflower"];
  if (a.enemies.includes("brassica") && brassicas.includes(plantIdB)) return "bad";
  if (b.enemies.includes("brassica") && brassicas.includes(plantIdA)) return "bad";
  if (a.companions.includes("brassica") && brassicas.includes(plantIdB)) return "good";
  if (b.companions.includes("brassica") && brassicas.includes(plantIdA)) return "good";

  return "neutral";
}

export function getNeighborPlantIds(
  bedId: string,
  tileX: number,
  tileY: number,
  plantings: PlacedPlant[]
): string[] {
  const neighbors: string[] = [];
  const offsets = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  for (const [dx, dy] of offsets) {
    const neighbor = plantings.find(
      (p) => p.bedId === bedId && p.tileX === tileX + dx && p.tileY === tileY + dy
    );
    if (neighbor) {
      neighbors.push(neighbor.plantId);
    }
  }

  return neighbors;
}

export function getTileCompanionStatus(
  plantId: string,
  bedId: string,
  tileX: number,
  tileY: number,
  plantings: PlacedPlant[]
): CompanionStatus {
  const neighbors = getNeighborPlantIds(bedId, tileX, tileY, plantings);
  if (neighbors.length === 0) return "neutral";

  let hasBad = false;
  let hasGood = false;

  for (const neighborId of neighbors) {
    const status = checkCompanion(plantId, neighborId);
    if (status === "bad") hasBad = true;
    if (status === "good") hasGood = true;
  }

  // Bad takes priority
  if (hasBad) return "bad";
  if (hasGood) return "good";
  return "neutral";
}
