/**
 * Generates all placeholder pixel-art sprites on offscreen canvases.
 * These can be replaced with real sprite sheets later.
 */

import { TILE_SIZE, CHAR_WIDTH, CHAR_HEIGHT } from "./types";

// --- Helpers ---

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function noise(base: string, variance: number): string {
  // Add slight random color variance to a hex color
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);
  const v = () => Math.floor((Math.random() - 0.5) * variance * 2);
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  return `rgb(${clamp(r + v())},${clamp(g + v())},${clamp(b + v())})`;
}

// --- Tile Sprites ---

const tileCache = new Map<string, HTMLCanvasElement>();

function generateGrassTile(variant: number): HTMLCanvasElement {
  const key = `grass-${variant}`;
  if (tileCache.has(key)) return tileCache.get(key)!;
  const [c, ctx] = makeCanvas(TILE_SIZE, TILE_SIZE);
  // Base green
  const bases = ["#4a8c2a", "#4e9030", "#468828"];
  ctx.fillStyle = bases[variant] || bases[0];
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  // Random grass blades
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(Math.random() * 30) + 1;
    const y = Math.floor(Math.random() * 30) + 1;
    ctx.fillStyle = noise("#5ca03a", 20);
    ctx.fillRect(x, y, 1, 2);
  }
  // Occasional flower
  if (variant === 2 && Math.random() > 0.5) {
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(14, 14, 3, 3);
    ctx.fillStyle = "#fff";
    ctx.fillRect(15, 13, 1, 1);
    ctx.fillRect(13, 15, 1, 1);
    ctx.fillRect(17, 15, 1, 1);
    ctx.fillRect(15, 17, 1, 1);
  }
  tileCache.set(key, c);
  return c;
}

function generateSoilTile(): HTMLCanvasElement {
  if (tileCache.has("soil")) return tileCache.get("soil")!;
  const [c, ctx] = makeCanvas(TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#6b4e1f";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = noise("#7a5a28", 15);
    ctx.fillRect(
      Math.floor(Math.random() * 28) + 2,
      Math.floor(Math.random() * 28) + 2,
      2, 1
    );
  }
  tileCache.set("soil", c);
  return c;
}

function generateWoodTile(side: "top" | "bottom" | "left" | "right"): HTMLCanvasElement {
  const key = `wood-${side}`;
  if (tileCache.has(key)) return tileCache.get(key)!;
  const [c, ctx] = makeCanvas(TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#8B5E3C";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  // Wood grain
  ctx.fillStyle = "#7A4F30";
  if (side === "top" || side === "bottom") {
    for (let y = 4; y < TILE_SIZE; y += 8) {
      ctx.fillRect(0, y, TILE_SIZE, 1);
    }
  } else {
    for (let x = 4; x < TILE_SIZE; x += 8) {
      ctx.fillRect(x, 0, 1, TILE_SIZE);
    }
  }
  // Highlight edge
  ctx.fillStyle = "#A0724E";
  if (side === "top") ctx.fillRect(0, 0, TILE_SIZE, 2);
  if (side === "left") ctx.fillRect(0, 0, 2, TILE_SIZE);
  // Shadow edge
  ctx.fillStyle = "#5C3A20";
  if (side === "bottom") ctx.fillRect(0, TILE_SIZE - 3, TILE_SIZE, 3);
  if (side === "right") ctx.fillRect(TILE_SIZE - 2, 0, 2, TILE_SIZE);
  tileCache.set(key, c);
  return c;
}

function generatePathTile(): HTMLCanvasElement {
  if (tileCache.has("path")) return tileCache.get("path")!;
  const [c, ctx] = makeCanvas(TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#c4a96a";
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = noise("#b89b5e", 15);
    ctx.fillRect(
      Math.floor(Math.random() * 26) + 3,
      Math.floor(Math.random() * 26) + 3,
      3, 2
    );
  }
  tileCache.set("path", c);
  return c;
}

function generateGreenhouseTile(type: string): HTMLCanvasElement {
  if (tileCache.has(type)) return tileCache.get(type)!;
  const [c, ctx] = makeCanvas(TILE_SIZE, TILE_SIZE);
  switch (type) {
    case "greenhouse-roof":
      ctx.fillStyle = "#3a7a5a";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "#4a9a6a";
      for (let x = 0; x < TILE_SIZE; x += 4) {
        ctx.fillRect(x, 0, 2, TILE_SIZE);
      }
      // Highlight
      ctx.fillStyle = "#5ab87a";
      ctx.fillRect(0, 0, TILE_SIZE, 2);
      break;
    case "greenhouse-wall":
      ctx.fillStyle = "#2a5a3a";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "#1a4a2a";
      ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      break;
    case "greenhouse-door":
      ctx.fillStyle = "#6b4e1f";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "#8B6914";
      ctx.fillRect(4, 2, TILE_SIZE - 8, TILE_SIZE - 2);
      // Door handle
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(TILE_SIZE - 10, TILE_SIZE / 2, 2, 2);
      break;
    case "greenhouse-floor":
      ctx.fillStyle = "#8a7a6a";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      // Tile pattern
      ctx.fillStyle = "#7a6a5a";
      ctx.fillRect(0, 0, 15, 15);
      ctx.fillRect(17, 17, 15, 15);
      break;
    case "greenhouse-glass-left":
    case "greenhouse-glass-right":
    case "greenhouse-glass-top":
      ctx.fillStyle = "rgba(100, 200, 150, 0.4)";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "rgba(150, 230, 180, 0.3)";
      ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      // Frame
      ctx.fillStyle = "#5a8a6a";
      if (type === "greenhouse-glass-left") ctx.fillRect(0, 0, 3, TILE_SIZE);
      if (type === "greenhouse-glass-right") ctx.fillRect(TILE_SIZE - 3, 0, 3, TILE_SIZE);
      if (type === "greenhouse-glass-top") ctx.fillRect(0, 0, TILE_SIZE, 3);
      break;
    case "exit-door":
      ctx.fillStyle = "#8a7a6a";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "#6b4e1f";
      ctx.fillRect(6, 0, TILE_SIZE - 12, TILE_SIZE);
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(TILE_SIZE / 2 + 4, TILE_SIZE / 2, 2, 2);
      // Arrow hint
      ctx.fillStyle = "#fff";
      ctx.fillRect(14, TILE_SIZE - 6, 4, 2);
      ctx.fillRect(15, TILE_SIZE - 4, 2, 2);
      break;
    case "shelf":
      ctx.fillStyle = "#8a7a6a"; // floor
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "#8B5E3C"; // shelf top
      ctx.fillRect(0, 4, TILE_SIZE, 8);
      ctx.fillStyle = "#A0724E";
      ctx.fillRect(0, 4, TILE_SIZE, 2);
      // Legs
      ctx.fillStyle = "#6B4430";
      ctx.fillRect(2, 12, 3, 18);
      ctx.fillRect(TILE_SIZE - 5, 12, 3, 18);
      break;
    case "station":
      ctx.fillStyle = "#8a7a6a"; // floor
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "#666"; // metal table top
      ctx.fillRect(0, 8, TILE_SIZE, 6);
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 8, TILE_SIZE, 2);
      // Legs
      ctx.fillStyle = "#555";
      ctx.fillRect(3, 14, 2, 16);
      ctx.fillRect(TILE_SIZE - 5, 14, 2, 16);
      break;
    case "grow-light":
      ctx.fillStyle = "#8a7a6a";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      // Lamp fixture
      ctx.fillStyle = "#aaa";
      ctx.fillRect(8, 2, 16, 4);
      // Purple grow light glow
      ctx.fillStyle = "rgba(200, 100, 255, 0.3)";
      ctx.fillRect(4, 6, 24, 24);
      ctx.fillStyle = "rgba(200, 100, 255, 0.15)";
      ctx.fillRect(0, 6, TILE_SIZE, TILE_SIZE - 6);
      break;
    case "water":
      ctx.fillStyle = "#3a70b0";
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = "#4a90d9";
      ctx.fillRect(4, 8, 8, 2);
      ctx.fillRect(16, 16, 10, 2);
      break;
  }
  tileCache.set(type, c);
  return c;
}

export function getTileSprite(type: string): HTMLCanvasElement {
  switch (type) {
    case "grass": return generateGrassTile(0);
    case "grass2": return generateGrassTile(1);
    case "grass3": return generateGrassTile(2);
    case "soil": return generateSoilTile();
    case "wood-top": return generateWoodTile("top");
    case "wood-bottom": return generateWoodTile("bottom");
    case "wood-left": return generateWoodTile("left");
    case "wood-right": return generateWoodTile("right");
    case "path": return generatePathTile();
    default: return generateGreenhouseTile(type);
  }
}

// --- Character Sprites ---

interface CharColors {
  skin: string;
  skinShadow: string;
  hat: string;
  hatBand: string;
  shirt: string;
  shirtShadow: string;
  pants: string;
  pantsShadow: string;
  hair: string;
  eyes: string;
  boots: string;
}

const SKIN_LIGHT = { skin: "#f5c4a1", skinShadow: "#d4a07a" };
const SKIN_DARK = { skin: "#8b6040", skinShadow: "#6b4530" };
const MALE_COLORS: Omit<CharColors, "skin" | "skinShadow"> = {
  hat: "#c8a84e", hatBand: "#8b6914", shirt: "#4a8c2a", shirtShadow: "#3a7020",
  pants: "#5a4a3a", pantsShadow: "#4a3a2a", hair: "#5a3a20", eyes: "#222", boots: "#3a2a1a",
};
const FEMALE_COLORS: Omit<CharColors, "skin" | "skinShadow"> = {
  hat: "#c8a84e", hatBand: "#d44a6a", shirt: "#4a6a9a", shirtShadow: "#3a5a8a",
  pants: "#5a4a3a", pantsShadow: "#4a3a2a", hair: "#8a4a2a", eyes: "#222", boots: "#3a2a1a",
};

function getCharColors(gender: "male" | "female", skinTone: "light" | "dark"): CharColors {
  const skinColors = skinTone === "light" ? SKIN_LIGHT : SKIN_DARK;
  const genderColors = gender === "male" ? MALE_COLORS : FEMALE_COLORS;
  return { ...skinColors, ...genderColors };
}

/**
 * Draw a single character frame at the given position on a context.
 * direction: 0=down, 1=left, 2=right, 3=up
 * frame: 0-3 (0,2=stand, 1=left step, 3=right step)
 */
function drawCharFrame(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number,
  colors: CharColors,
  dirIdx: number,
  frame: number,
): void {
  const w = CHAR_WIDTH;
  const legOffset = (frame === 1) ? -2 : (frame === 3) ? 2 : 0;
  const isFacing = dirIdx === 0; // facing down (shows face)
  const isBack = dirIdx === 3; // facing up
  const isLeft = dirIdx === 1;
  // dirIdx: 0=down, 1=left, 2=right, 3=up

  // Shadow on ground
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(ox + 6, oy + 44, 20, 4);

  // Boots
  ctx.fillStyle = colors.boots;
  ctx.fillRect(ox + 9 + legOffset, oy + 40, 6, 6);
  ctx.fillRect(ox + 17 - legOffset, oy + 40, 6, 6);

  // Pants
  ctx.fillStyle = colors.pants;
  ctx.fillRect(ox + 9 + legOffset, oy + 34, 6, 8);
  ctx.fillRect(ox + 17 - legOffset, oy + 34, 6, 8);
  // Pants shadow
  ctx.fillStyle = colors.pantsShadow;
  ctx.fillRect(ox + 10 + legOffset, oy + 38, 4, 2);
  ctx.fillRect(ox + 18 - legOffset, oy + 38, 4, 2);
  // Waist
  ctx.fillStyle = colors.pants;
  ctx.fillRect(ox + 9, oy + 32, 14, 4);

  // Shirt/body
  ctx.fillStyle = colors.shirt;
  ctx.fillRect(ox + 8, oy + 18, 16, 16);
  // Shirt shadow
  ctx.fillStyle = colors.shirtShadow;
  ctx.fillRect(ox + 8, oy + 28, 16, 4);

  // Arms
  ctx.fillStyle = colors.shirt;
  const armSwing = (frame === 1) ? 2 : (frame === 3) ? -2 : 0;
  if (!isLeft) {
    ctx.fillRect(ox + 4, oy + 20 + armSwing, 4, 10);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(ox + 4, oy + 28 + armSwing, 4, 3);
  }
  ctx.fillStyle = colors.shirt;
  if (isLeft || isFacing || isBack) {
    ctx.fillRect(ox + w - 8, oy + 20 - armSwing, 4, 10);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(ox + w - 8, oy + 28 - armSwing, 4, 3);
  }

  // Neck
  ctx.fillStyle = colors.skin;
  ctx.fillRect(ox + 12, oy + 15, 8, 4);

  // Head
  ctx.fillStyle = colors.skin;
  ctx.fillRect(ox + 9, oy + 6, 14, 12);
  // Shadow on head
  ctx.fillStyle = colors.skinShadow;
  ctx.fillRect(ox + 9, oy + 14, 14, 3);

  // Face details (only when facing down or side)
  if (isFacing) {
    // Eyes
    ctx.fillStyle = colors.eyes;
    ctx.fillRect(ox + 11, oy + 10, 3, 3);
    ctx.fillRect(ox + 18, oy + 10, 3, 3);
    // Eye whites
    ctx.fillStyle = "#fff";
    ctx.fillRect(ox + 12, oy + 10, 1, 2);
    ctx.fillRect(ox + 19, oy + 10, 1, 2);
    // Mouth
    ctx.fillStyle = colors.skinShadow;
    ctx.fillRect(ox + 14, oy + 14, 4, 1);
  } else if (!isBack) {
    // Side face - one eye
    const eyeX = isLeft ? ox + 10 : ox + 19;
    ctx.fillStyle = colors.eyes;
    ctx.fillRect(eyeX, oy + 10, 3, 3);
    ctx.fillStyle = "#fff";
    ctx.fillRect(eyeX + 1, oy + 10, 1, 2);
  }

  // Hair (shows on back and sides)
  if (isBack) {
    ctx.fillStyle = colors.hair;
    ctx.fillRect(ox + 9, oy + 6, 14, 6);
  }

  // Hat
  ctx.fillStyle = colors.hat;
  ctx.fillRect(ox + 6, oy + 2, 20, 6);
  ctx.fillRect(ox + 9, oy + 0, 14, 4);
  // Hat brim
  ctx.fillStyle = colors.hatBand;
  ctx.fillRect(ox + 6, oy + 6, 20, 2);
  // Hat band
  ctx.fillRect(ox + 9, oy + 4, 14, 2);
}

const charSheetCache = new Map<string, HTMLCanvasElement>();

/**
 * Generate a character sprite sheet: 128×192px
 * 4 rows (down, left, right, up) × 4 columns (walk frames)
 */
export function getCharacterSheet(
  gender: "male" | "female",
  skinTone: "light" | "dark",
): HTMLCanvasElement {
  const key = `${gender}-${skinTone}`;
  if (charSheetCache.has(key)) return charSheetCache.get(key)!;

  const cols = 4;
  const rows = 4;
  const [c, ctx] = makeCanvas(cols * CHAR_WIDTH, rows * CHAR_HEIGHT);
  const colors = getCharColors(gender, skinTone);

  for (let dir = 0; dir < rows; dir++) {
    for (let frame = 0; frame < cols; frame++) {
      drawCharFrame(ctx, frame * CHAR_WIDTH, dir * CHAR_HEIGHT, colors, dir, frame);
    }
  }

  charSheetCache.set(key, c);
  return c;
}

// Pregenerate grass variants (with seeded randomness)
const grassCanvases: HTMLCanvasElement[] = [];
export function getGrassVariants(count: number): HTMLCanvasElement[] {
  if (grassCanvases.length >= count) return grassCanvases;
  // Generate a set of grass tiles with different random seeds
  for (let i = grassCanvases.length; i < count; i++) {
    const [c, ctx] = makeCanvas(TILE_SIZE, TILE_SIZE);
    const green = 130 + (i * 7) % 30;
    ctx.fillStyle = `rgb(${60 + (i * 3) % 20},${green},${30 + (i * 5) % 20})`;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Blades
    for (let j = 0; j < 6; j++) {
      const bx = ((i * 13 + j * 7) % 28) + 2;
      const by = ((i * 11 + j * 5) % 28) + 2;
      ctx.fillStyle = `rgb(${70 + (i * 5 + j) % 25},${green + 15},${35 + (j * 3) % 15})`;
      ctx.fillRect(bx, by, 1, 2);
    }
    grassCanvases.push(c);
  }
  return grassCanvases;
}
