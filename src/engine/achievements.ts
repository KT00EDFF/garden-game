import type { GardenState } from "../types";
import { plantsById } from "../data/plants";
import { getTileCompanionStatus } from "./planting-rules";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  xp: number;
  check: (garden: GardenState) => boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO date
}

const STORAGE_KEY = "garden-game-achievements";

export const achievements: Achievement[] = [
  {
    id: "first_seed",
    name: "First Seed",
    description: "Place your first plant",
    emoji: "🌱",
    xp: 10,
    check: (g) => g.plantings.length >= 1,
  },
  {
    id: "green_thumb",
    name: "Green Thumb",
    description: "Place 10 plants",
    emoji: "👍",
    xp: 25,
    check: (g) => g.plantings.length >= 10,
  },
  {
    id: "garden_packed",
    name: "Garden Packed",
    description: "Place 50 plants",
    emoji: "🌿",
    xp: 50,
    check: (g) => g.plantings.length >= 50,
  },
  {
    id: "full_bed",
    name: "Full Bed",
    description: "Fill every tile in one bed",
    emoji: "🛏️",
    xp: 20,
    check: (g) =>
      g.beds.some((bed) => {
        const totalTiles = bed.widthFt * bed.heightFt;
        const plantedTiles = g.plantings.filter((p) => p.bedId === bed.id).length;
        return totalTiles > 0 && plantedTiles >= totalTiles;
      }),
  },
  {
    id: "full_garden",
    name: "Full Garden",
    description: "Fill every tile in every bed",
    emoji: "🏆",
    xp: 100,
    check: (g) =>
      g.beds.every((bed) => {
        const totalTiles = bed.widthFt * bed.heightFt;
        const plantedTiles = g.plantings.filter((p) => p.bedId === bed.id).length;
        return plantedTiles >= totalTiles;
      }),
  },
  {
    id: "variety_pack",
    name: "Variety Pack",
    description: "Use 5 different plant types",
    emoji: "🎨",
    xp: 30,
    check: (g) => {
      const types = new Set(g.plantings.map((p) => p.plantId));
      return types.size >= 5;
    },
  },
  {
    id: "all_the_things",
    name: "All the Things",
    description: "Use every available plant",
    emoji: "🌈",
    xp: 75,
    check: (g) => {
      const types = new Set(g.plantings.map((p) => p.plantId));
      return types.size >= Object.keys(plantsById).length;
    },
  },
  {
    id: "brassica_boss",
    name: "Brassica Boss",
    description: "Plant all 4 brassicas",
    emoji: "🥦",
    xp: 25,
    check: (g) => {
      const brassicas = ["broccoli", "cabbage", "kale", "cauliflower"];
      const planted = new Set(g.plantings.map((p) => p.plantId));
      return brassicas.every((b) => planted.has(b));
    },
  },
  {
    id: "companion_master",
    name: "Companion Master",
    description: "Have 5+ plants with good companions nearby",
    emoji: "🤝",
    xp: 40,
    check: (g) => {
      let goodCount = 0;
      for (const p of g.plantings) {
        const status = getTileCompanionStatus(
          p.plantId, p.bedId, p.tileX, p.tileY, g.plantings
        );
        if (status === "good") goodCount++;
      }
      return goodCount >= 5;
    },
  },
  {
    id: "no_enemies",
    name: "Peaceful Garden",
    description: "10+ plants with zero enemy conflicts",
    emoji: "☮️",
    xp: 50,
    check: (g) => {
      if (g.plantings.length < 10) return false;
      return g.plantings.every((p) => {
        const status = getTileCompanionStatus(
          p.plantId, p.bedId, p.tileX, p.tileY, g.plantings
        );
        return status !== "bad";
      });
    },
  },
  {
    id: "season_planner",
    name: "Season Planner",
    description: "Plant crops for spring, summer, and fall",
    emoji: "📅",
    xp: 35,
    check: (g) => {
      const seasons = new Set<string>();
      for (const p of g.plantings) {
        const plant = plantsById[p.plantId];
        if (plant) {
          for (const s of plant.seasons) seasons.add(s);
        }
      }
      return seasons.has("spring") && seasons.has("summer") && seasons.has("fall");
    },
  },
  {
    id: "heat_lovers",
    name: "Heat Lovers",
    description: "Plant tomatoes, peppers, and melons together",
    emoji: "🔥",
    xp: 20,
    check: (g) => {
      const planted = new Set(g.plantings.map((p) => p.plantId));
      return planted.has("cherry_tomato") && planted.has("hot_pepper") && planted.has("melon");
    },
  },
];

export function loadUnlocked(): UnlockedAchievement[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUnlocked(unlocked: UnlockedAchievement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
}

/**
 * Evaluate garden state against all achievements.
 * Returns newly unlocked achievement IDs.
 */
export function evaluateAchievements(
  garden: GardenState,
  currentUnlocked: UnlockedAchievement[]
): { unlocked: UnlockedAchievement[]; newlyUnlocked: Achievement[] } {
  const unlockedIds = new Set(currentUnlocked.map((u) => u.id));
  const newlyUnlocked: Achievement[] = [];
  const updatedUnlocked = [...currentUnlocked];

  for (const ach of achievements) {
    if (unlockedIds.has(ach.id)) continue;
    if (ach.check(garden)) {
      updatedUnlocked.push({
        id: ach.id,
        unlockedAt: new Date().toISOString(),
      });
      newlyUnlocked.push(ach);
    }
  }

  return { unlocked: updatedUnlocked, newlyUnlocked };
}

export function getTotalXP(unlocked: UnlockedAchievement[]): number {
  const unlockedIds = new Set(unlocked.map((u) => u.id));
  return achievements
    .filter((a) => unlockedIds.has(a.id))
    .reduce((sum, a) => sum + a.xp, 0);
}

export function getMaxXP(): number {
  return achievements.reduce((sum, a) => sum + a.xp, 0);
}
