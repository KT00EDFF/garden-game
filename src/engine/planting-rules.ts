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

/**
 * Returns the minimum tile radius a plant needs around itself.
 * spacingInches / 12 gives feet, rounded up. A plant that needs 1 tile
 * has radius 0 (fits in one tile). 24" = 2ft = radius 1, 36" = 3ft = radius 2.
 */
export function getSpacingRadius(plantId: string): number {
  const plant = plantsById[plantId];
  if (!plant) return 0;
  const tiles = Math.ceil(plant.spacingInches / 12);
  return Math.max(0, tiles - 1);
}

/**
 * Check if placing a plant at (tileX, tileY) would violate spacing rules
 * of any nearby plant, or if the placed plant itself needs space that's
 * already occupied by a different plant type.
 * Returns the name of the conflicting plant, or null if OK.
 */
export function checkSpacingConflict(
  plantId: string,
  bedId: string,
  tileX: number,
  tileY: number,
  plantings: PlacedPlant[]
): string | null {
  const myRadius = getSpacingRadius(plantId);
  const bedPlantings = plantings.filter((p) => p.bedId === bedId);

  for (const placed of bedPlantings) {
    // Same plant type stacking is fine (e.g. filling a melon area)
    if (placed.plantId === plantId) continue;

    const dist = Math.max(Math.abs(placed.tileX - tileX), Math.abs(placed.tileY - tileY));
    const theirRadius = getSpacingRadius(placed.plantId);

    // Conflict if within either plant's spacing radius
    const requiredDist = Math.max(myRadius, theirRadius);
    if (dist <= requiredDist) {
      return plantsById[placed.plantId]?.name || placed.plantId;
    }
  }

  return null;
}
