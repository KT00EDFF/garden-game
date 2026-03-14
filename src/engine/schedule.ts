import type { Plant } from "../types";

export interface PlantSchedule {
  startIndoors: Date | null;
  sowOutdoors: Date | null;
  transplant: Date | null;
  harvestStart: Date | null;
  harvestEnd: Date | null;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function calculateSchedule(
  plant: Plant,
  lastFrostDate: string,
  firstFrostDate: string
): PlantSchedule {
  const lastFrost = new Date(lastFrostDate);
  const firstFrost = new Date(firstFrostDate);

  let startIndoors: Date | null = null;
  let sowOutdoors: Date | null = null;
  let transplant: Date | null = null;
  let harvestStart: Date | null = null;

  // Start indoors
  if (plant.startIndoorsWeeksBefore) {
    startIndoors = addWeeks(lastFrost, -plant.startIndoorsWeeksBefore);
  }

  // Direct sow or transplant outdoors
  if (plant.transplantAfterLastFrost) {
    transplant = addWeeks(lastFrost, 1); // 1 week after last frost
    if (plant.directSowWeeksBeforeFrost && plant.directSowWeeksBeforeFrost < 0) {
      // Negative means weeks AFTER frost
      sowOutdoors = addWeeks(lastFrost, -plant.directSowWeeksBeforeFrost);
    }
  } else if (plant.directSowWeeksBeforeFrost) {
    sowOutdoors = addWeeks(lastFrost, -plant.directSowWeeksBeforeFrost);
  }

  // Harvest date from transplant or sow date
  const growStart = transplant || sowOutdoors || startIndoors;
  if (growStart) {
    // If transplanted, count from transplant. If direct sow, count from sow.
    const countFrom = transplant || sowOutdoors || growStart;
    harvestStart = addDays(countFrom, plant.daysToMaturity);
  }

  // Harvest window is ~3 weeks for most crops, capped at first frost
  const harvestEnd = harvestStart
    ? new Date(Math.min(addDays(harvestStart, 21).getTime(), firstFrost.getTime()))
    : null;

  return {
    startIndoors,
    sowOutdoors,
    transplant,
    harvestStart,
    harvestEnd,
  };
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Generate multiple schedules for succession planting.
 * Returns the base schedule plus shifted copies for each succession round.
 */
export function calculateSuccessionSchedules(
  plant: Plant,
  lastFrostDate: string,
  firstFrostDate: string,
  intervalWeeks: number,
  count: number
): { schedule: PlantSchedule; round: number }[] {
  const base = calculateSchedule(plant, lastFrostDate, firstFrostDate);
  const results = [{ schedule: base, round: 0 }];
  const firstFrost = new Date(firstFrostDate);

  for (let i = 1; i <= count; i++) {
    const offset = intervalWeeks * i;
    const shifted: PlantSchedule = {
      startIndoors: base.startIndoors ? addWeeks(base.startIndoors, offset) : null,
      sowOutdoors: base.sowOutdoors ? addWeeks(base.sowOutdoors, offset) : null,
      transplant: base.transplant ? addWeeks(base.transplant, offset) : null,
      harvestStart: base.harvestStart ? addWeeks(base.harvestStart, offset) : null,
      harvestEnd: base.harvestEnd
        ? new Date(Math.min(addWeeks(base.harvestEnd, offset).getTime(), firstFrost.getTime()))
        : null,
    };
    // Skip if the sow/transplant date is past first frost
    const sowDate = shifted.transplant || shifted.sowOutdoors;
    if (sowDate && sowDate > firstFrost) break;
    results.push({ schedule: shifted, round: i });
  }

  return results;
}

export function getWeekActions(
  plants: Plant[],
  lastFrostDate: string,
  firstFrostDate: string
): { plant: Plant; action: string; date: Date }[] {
  const now = new Date();
  const weekFromNow = addDays(now, 7);
  const actions: { plant: Plant; action: string; date: Date }[] = [];

  for (const plant of plants) {
    const schedule = calculateSchedule(plant, lastFrostDate, firstFrostDate);

    if (schedule.startIndoors && schedule.startIndoors >= now && schedule.startIndoors <= weekFromNow) {
      actions.push({ plant, action: "Start seeds indoors", date: schedule.startIndoors });
    }
    if (schedule.sowOutdoors && schedule.sowOutdoors >= now && schedule.sowOutdoors <= weekFromNow) {
      actions.push({ plant, action: "Direct sow outdoors", date: schedule.sowOutdoors });
    }
    if (schedule.transplant && schedule.transplant >= now && schedule.transplant <= weekFromNow) {
      actions.push({ plant, action: "Transplant outdoors", date: schedule.transplant });
    }
    if (schedule.harvestStart && schedule.harvestStart >= now && schedule.harvestStart <= weekFromNow) {
      actions.push({ plant, action: "Begin harvest", date: schedule.harvestStart });
    }
  }

  return actions.sort((a, b) => a.date.getTime() - b.date.getTime());
}
