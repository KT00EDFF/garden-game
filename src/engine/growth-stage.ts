import { plantsById } from "../data/plants";
import { calculateSchedule } from "./schedule";

export type GrowthStage = "seed" | "sprout" | "growing" | "mature" | "harvest" | "dormant";

/**
 * Determine the current growth stage of a plant based on today's date
 * and the plant's calculated schedule.
 */
export function getGrowthStage(
  plantId: string,
  lastFrostDate: string,
  firstFrostDate: string
): GrowthStage {
  const plant = plantsById[plantId];
  if (!plant) return "dormant";

  const schedule = calculateSchedule(plant, lastFrostDate, firstFrostDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const { startIndoors, sowOutdoors, transplant, harvestStart, harvestEnd } = schedule;

  // The earliest sow/start date
  const firstActivity = startIndoors || sowOutdoors;

  // If we have no schedule at all, treat as dormant
  if (!firstActivity && !transplant) return "dormant";

  // Before any activity begins: seed
  if (firstActivity && now < firstActivity) return "seed";

  // After harvest ends: dormant
  if (harvestEnd && now > harvestEnd) return "dormant";

  // During harvest window
  if (harvestStart && harvestEnd && now >= harvestStart && now <= harvestEnd) return "harvest";

  // The "growing period" starts at transplant or sowOutdoors (whichever is the outdoor start)
  const growStart = transplant || sowOutdoors;

  // Between startIndoors and the outdoor start: sprout
  if (startIndoors && growStart && now >= startIndoors && now < growStart) return "sprout";

  // Between startIndoors/sowOutdoors and transplant for direct-start: sprout
  if (firstActivity && !growStart && now >= firstActivity) {
    // No outdoor date — use startIndoors as both start and grow
    // Fall through to growing logic with firstActivity as growStart
  }

  // Growing period: from growStart (or firstActivity) to harvestStart
  const effectiveGrowStart = growStart || firstActivity;
  if (effectiveGrowStart && harvestStart && now >= effectiveGrowStart && now < harvestStart) {
    const totalGrowDays = harvestStart.getTime() - effectiveGrowStart.getTime();
    const elapsedDays = now.getTime() - effectiveGrowStart.getTime();
    const progress = totalGrowDays > 0 ? elapsedDays / totalGrowDays : 1;

    if (progress < 0.4) return "growing";
    return "mature";
  }

  // Fallback
  return "dormant";
}
