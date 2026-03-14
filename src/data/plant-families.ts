import type { RotationEntry } from "../types";

const familyMap: Record<string, string> = {
  cherry_tomato: "nightshades",
  hot_pepper: "nightshades",
  potato: "nightshades",
  sweet_potato: "nightshades",
  broccoli: "brassicas",
  cabbage: "brassicas",
  kale: "brassicas",
  cauliflower: "brassicas",
  garlic: "alliums",
  onion: "alliums",
  melon: "cucurbits",
  cucumber: "cucurbits",
  zucchini: "cucurbits",
  strawberry: "berries",
  bush_bean: "legumes",
  pea: "legumes",
  basil: "herbs",
  cilantro: "herbs",
  parsley: "herbs",
  dill: "herbs",
  carrot: "roots",
  beet: "roots",
  radish: "roots",
  sweet_corn: "grasses",
};

export function getPlantFamily(plantId: string): string {
  return familyMap[plantId] || "other";
}

export function checkRotationConflict(
  bedId: string,
  plantId: string,
  history: RotationEntry[]
): { hasConflict: boolean; lastYear?: number; family?: string } {
  const family = getPlantFamily(plantId);
  if (family === "other") return { hasConflict: false };

  const bedHistory = history
    .filter((e) => e.bedId === bedId)
    .sort((a, b) => b.year - a.year);

  for (const entry of bedHistory) {
    const entryFamilies = entry.plantIds.map(getPlantFamily);
    if (entryFamilies.includes(family)) {
      return { hasConflict: true, lastYear: entry.year, family };
    }
  }

  return { hasConflict: false };
}
