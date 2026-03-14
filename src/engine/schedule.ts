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

/** Frost-tolerant plants that can handle light frost and harvest a few weeks past first frost. */
const FROST_TOLERANT_IDS = ["lettuce", "spinach", "kale"];

/**
 * Calculate a fall planting schedule relative to the FIRST frost date.
 * Plants with "fall" in their seasons count backwards from first frost for sow dates,
 * and frost-tolerant crops get an extended harvest window past first frost.
 */
export function calculateFallSchedule(
  plant: Plant,
  lastFrostDate: string,
  firstFrostDate: string
): PlantSchedule {
  const firstFrost = new Date(firstFrostDate);

  let startIndoors: Date | null = null;
  let sowOutdoors: Date | null = null;
  let transplant: Date | null = null;
  let harvestStart: Date | null = null;

  // For fall crops, sow/transplant dates count back from first frost
  if (plant.startIndoorsWeeksBefore && plant.sowType === "transplant") {
    // Transplant early enough to mature before frost
    // Count back: daysToMaturity + a couple weeks for transplant establishment
    const weeksBeforeFrost = Math.ceil(plant.daysToMaturity / 7) + 2;
    transplant = addWeeks(firstFrost, -weeksBeforeFrost);
    startIndoors = addWeeks(transplant, -plant.startIndoorsWeeksBefore);
  } else if (plant.directSowWeeksBeforeFrost && plant.directSowWeeksBeforeFrost > 0) {
    // Direct sow N weeks before first frost
    sowOutdoors = addWeeks(firstFrost, -plant.directSowWeeksBeforeFrost);
  } else {
    // Fallback: sow based on days to maturity before first frost
    sowOutdoors = addDays(firstFrost, -plant.daysToMaturity - 14);
  }

  // Harvest date: count from transplant/sow date
  const countFrom = transplant || sowOutdoors;
  if (countFrom) {
    harvestStart = addDays(countFrom, plant.daysToMaturity);
  }

  // Harvest window: frost-tolerant crops get 2-3 weeks past first frost
  const frostTolerant = FROST_TOLERANT_IDS.includes(plant.id);
  const harvestEnd = harvestStart
    ? frostTolerant
      ? addDays(firstFrost, 21) // 3 weeks past first frost
      : new Date(Math.min(addDays(harvestStart, 21).getTime(), firstFrost.getTime()))
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
