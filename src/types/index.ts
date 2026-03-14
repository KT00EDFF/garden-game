export type PlantCategory = "vegetable" | "fruit" | "flower" | "herb";
export type SunRequirement = "full" | "partial" | "shade";
export type SowType = "transplant" | "direct" | "sets" | "slips" | "bare-root" | "cloves";
export type Season = "spring" | "summer" | "fall" | "winter";

export interface Plant {
  id: string;
  name: string;
  category: PlantCategory;
  emoji: string; // placeholder until pixel art sprites
  daysToMaturity: number;
  spacingInches: number;
  sunRequirement: SunRequirement;
  hardinessZones: [number, number]; // [min, max]
  startIndoorsWeeksBefore: number | null; // weeks before last frost, null if direct sow
  transplantAfterLastFrost: boolean;
  directSowWeeksBeforeFrost: number | null; // negative = after frost
  companions: string[];
  enemies: string[];
  sowType: SowType;
  seasons: Season[];
  color: string; // tile bg color until we have sprites
  notes: string;
}

export type BedType = "raised" | "in-ground";

export interface BedConfig {
  id: string;
  name: string;
  type: BedType;
  widthFt: number;
  heightFt: number;
  posX: number; // position in garden layout grid
  posY: number;
  sunExposure?: SunRequirement;
}

export interface PlacedPlant {
  plantId: string;
  bedId: string;
  tileX: number;
  tileY: number;
}

export interface SuccessionPlan {
  id: string;
  plantId: string;
  intervalWeeks: number;
  count: number; // number of additional sowings after the first
}

export interface HarvestEntry {
  id: string;
  plantId: string;
  date: string; // ISO date
  quantity: string; // freeform: "2 lbs", "12 tomatoes", etc.
  notes?: string;
}

export interface RotationEntry {
  year: number;
  bedId: string;
  plantIds: string[];
}

export interface GardenState {
  name: string;
  zone: string;
  zipCode: string;
  lastFrostDate: string; // ISO date
  firstFrostDate: string; // ISO date
  beds: BedConfig[];
  plantings: PlacedPlant[];
  successions?: SuccessionPlan[];
  harvests?: HarvestEntry[];
  rotationHistory?: RotationEntry[];
  exportCount?: number;
}
