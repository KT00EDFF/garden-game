import type { GrowthStage } from "../engine/growth-stage";

interface StageVisuals {
  emoji: string;
  scale: number;
  opacity: number;
  bgTint: string;
}

interface StageDefaults {
  emoji: string | null; // null means use plant's own emoji
  scale: number;
  opacity: number;
  bgTint: string;
}

const stageDefaults: Record<GrowthStage, StageDefaults> = {
  seed: {
    emoji: "·",
    scale: 0.5,
    opacity: 0.5,
    bgTint: "rgba(139, 105, 20, 0.25)", // brown tint
  },
  sprout: {
    emoji: "🌱",
    scale: 0.7,
    opacity: 0.8,
    bgTint: "rgba(144, 238, 144, 0.15)", // light green tint
  },
  growing: {
    emoji: null,
    scale: 0.85,
    opacity: 0.9,
    bgTint: "rgba(76, 175, 80, 0.15)", // green tint
  },
  mature: {
    emoji: null,
    scale: 1.0,
    opacity: 1.0,
    bgTint: "rgba(46, 125, 50, 0.2)", // darker green tint
  },
  harvest: {
    emoji: null,
    scale: 1.0,
    opacity: 1.0,
    bgTint: "rgba(255, 215, 0, 0.2)", // golden tint
  },
  dormant: {
    emoji: "🥀",
    scale: 0.6,
    opacity: 0.4,
    bgTint: "rgba(158, 158, 158, 0.2)", // gray tint
  },
};

export function getStageVisuals(stage: GrowthStage, plantEmoji: string): StageVisuals {
  const defaults = stageDefaults[stage];
  return {
    emoji: defaults.emoji ?? plantEmoji,
    scale: defaults.scale,
    opacity: defaults.opacity,
    bgTint: defaults.bgTint,
  };
}
