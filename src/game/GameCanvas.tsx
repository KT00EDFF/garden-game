import { useRef, useEffect, useCallback } from "react";
import type { GardenState, CharacterConfig, GreenhouseConfig } from "../types";
import {
  TILE_SIZE, WORLD_COLS, WORLD_ROWS,
  MOVE_DURATION, ANIM_FRAME_DURATION,
  DIR_DX, DIR_DY,
  GH_BUILDING_W, GH_BUILDING_H,
  createCharacterState,
  type CharacterState, type SceneId, type WorldTile,
} from "./types";
import { GameLoop } from "./GameLoop";
import { Camera } from "./Camera";
import { InputHandler } from "./InputHandler";
import { CharacterRenderer } from "./CharacterRenderer";
import { WorldRenderer } from "./WorldRenderer";
import { GreenhouseRenderer } from "./GreenhouseRenderer";
import { SceneManager } from "./SceneManager";
import { buildOutdoorMap, buildGreenhouseMap, getSpawnPoint, getDefaultSpawn, canPlaceAt } from "./TileMap";

export interface BuildGhost {
  type: "bed" | "greenhouse";
  bedType?: "raised" | "in-ground";
  width: number;
  height: number;
}

interface GameCanvasProps {
  garden: GardenState;
  characterConfig: CharacterConfig;
  greenhouseConfig: GreenhouseConfig;
  selectedPlantId: string | null;
  onPlacePlant: (bedId: string, tileX: number, tileY: number) => void;
  onRemovePlant: (bedId: string, tileX: number, tileY: number) => void;
  onPlantTap: (bedId: string, tileX: number, tileY: number) => void;
  buildGhost: BuildGhost | null;  onBuildPlace: (worldX: number, worldY: number) => void;
}

export function GameCanvas({
  garden,
  characterConfig,
  greenhouseConfig,
  selectedPlantId,
  onPlacePlant,
  onRemovePlant,
  onPlantTap,
  buildGhost,
  onBuildPlace,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gardenRef = useRef(garden);
  const selectedRef = useRef(selectedPlantId);
  const charConfigRef = useRef(characterConfig);
  const ghConfigRef = useRef(greenhouseConfig);
  const onPlacePlantRef = useRef(onPlacePlant);
  const onRemovePlantRef = useRef(onRemovePlant);
  const onPlantTapRef = useRef(onPlantTap);
  const buildGhostRef = useRef(buildGhost);
  const onBuildPlaceRef = useRef(onBuildPlace);
  const mouseWorldRef = useRef<{ x: number; y: number } | null>(null);
  const hintRef = useRef<{ text: string; worldX: number; worldY: number; until: number } | null>(null);

  // Keep refs in sync via effect
  useEffect(() => {
    gardenRef.current = garden;
    selectedRef.current = selectedPlantId;
    charConfigRef.current = characterConfig;
    ghConfigRef.current = greenhouseConfig;
    onPlacePlantRef.current = onPlacePlant;
    onRemovePlantRef.current = onRemovePlant;
    onPlantTapRef.current = onPlantTap;
    buildGhostRef.current = buildGhost;
    onBuildPlaceRef.current = onBuildPlace;
  });

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    const internalH = 480;
    const internalW = Math.round(internalH * aspect);
    canvas.width = internalW;
    canvas.height = internalH;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const camera = new Camera();
    const input = new InputHandler();
    const charRenderer = new CharacterRenderer();
    const worldRenderer = new WorldRenderer();
    const ghRenderer = new GreenhouseRenderer();

    let currentScene: SceneId = "outdoor";
    const sceneManager = new SceneManager((scene) => {
      currentScene = scene;
      const spawn = getSpawnPoint(scene, gardenRef.current, ghConfigRef.current);
      char.tileX = spawn.x;
      char.tileY = spawn.y;
      char.renderX = spawn.x * TILE_SIZE;
      char.renderY = spawn.y * TILE_SIZE;
      char.sourceTileX = spawn.x;
      char.sourceTileY = spawn.y;
      char.walking = false;
      char.moveProgress = 0;
      rebuildMap();
    });

    const defaultSpawn = getDefaultSpawn();
    const char: CharacterState = createCharacterState(defaultSpawn.x, defaultSpawn.y);
    charRenderer.load(charConfigRef.current.gender, charConfigRef.current.skinTone);

    let outdoorMap: WorldTile[][] = [];
    let greenhouseMap: WorldTile[][] = [];
    let activeMap: WorldTile[][] = [];

    function rebuildMap() {
      outdoorMap = buildOutdoorMap(gardenRef.current);
      greenhouseMap = buildGreenhouseMap(gardenRef.current, ghConfigRef.current);
      activeMap = currentScene === "outdoor" ? outdoorMap : greenhouseMap;
      worldRenderer.invalidateCache();
    }
    rebuildMap();

    let lastGardenJson = JSON.stringify(gardenRef.current.beds) + (gardenRef.current.greenhouseWorldX ?? "") + (gardenRef.current.greenhouseWorldY ?? "");
    let queuedDirection: import("./types").Direction | null = null;

    function setHint(text: string, worldX: number, worldY: number, durationMs = 1800) {
      hintRef.current = { text, worldX, worldY, until: performance.now() + durationMs };
    }

    input.attach(canvas);
    resizeCanvas();

    // Track mouse position for build ghost
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseWorldRef.current = {
        x: (e.clientX - rect.left) * scaleX + camera.x,
        y: (e.clientY - rect.top) * scaleY + camera.y,
      };
    };
    canvas.addEventListener("mousemove", onMouseMove);

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const parentEl = canvas.parentElement;
    if (parentEl) resizeObserver.observe(parentEl);

    // --- Game Update ---
    function update(dt: number) {
      const bedsJson = JSON.stringify(gardenRef.current.beds) + (gardenRef.current.greenhouseWorldX ?? "") + (gardenRef.current.greenhouseWorldY ?? "");
      if (bedsJson !== lastGardenJson) {
        lastGardenJson = bedsJson;
        rebuildMap();
      }

      sceneManager.update(dt);
      if (sceneManager.isTransitioning) return;

      // Character movement
      if (!char.walking) {
        const keyDir = input.getDirection();
        // Keyboard input cancels any queued tap-to-walk step.
        const dir = keyDir ?? queuedDirection;
        if (keyDir) queuedDirection = null;
        if (dir) {
          const dx = DIR_DX[dir];
          const dy = DIR_DY[dir];
          const nx = char.tileX + dx;
          const ny = char.tileY + dy;

          char.direction = dir;

          const mapRows = activeMap.length;
          const mapCols = activeMap[0]?.length ?? 0;
          if (nx >= 0 && nx < mapCols && ny >= 0 && ny < mapRows) {
            const targetTile = activeMap[ny][nx];
            if (targetTile.walkable) {
              if (targetTile.doorTarget) {
                sceneManager.transitionTo(targetTile.doorTarget);
                return;
              }
              char.walking = true;
              char.moveProgress = 0;
              char.sourceTileX = char.tileX;
              char.sourceTileY = char.tileY;
              char.tileX = nx;
              char.tileY = ny;
            }
          }
        }
      }

      if (char.walking) {
        char.moveProgress += dt / MOVE_DURATION;
        if (char.moveProgress >= 1) {
          char.moveProgress = 0;
          char.walking = false;
          char.renderX = char.tileX * TILE_SIZE;
          char.renderY = char.tileY * TILE_SIZE;
          char.sourceTileX = char.tileX;
          char.sourceTileY = char.tileY;
        } else {
          const t = char.moveProgress;
          char.renderX = (char.sourceTileX + (char.tileX - char.sourceTileX) * t) * TILE_SIZE;
          char.renderY = (char.sourceTileY + (char.tileY - char.sourceTileY) * t) * TILE_SIZE;
        }
        char.animTimer += dt;
        if (char.animTimer >= ANIM_FRAME_DURATION) {
          char.animTimer = 0;
          char.animFrame = (char.animFrame + 1) % 4;
        }
      } else {
        char.animFrame = 0;
        char.animTimer = 0;
      }

      // Handle clicks
      const click = input.consumeClick();
      const rightClick = input.consumeRightClick();

      // Consume queued step once we actually move (or the target tile is blocked).
      if (char.walking) queuedDirection = null;

      // Build mode: click places the ghost
      if (click && buildGhostRef.current && currentScene === "outdoor") {
        const ghost = buildGhostRef.current;
        const tileX = Math.floor((click.x + camera.x) / TILE_SIZE);
        const tileY = Math.floor((click.y + camera.y) / TILE_SIZE);
        const gw = ghost.type === "greenhouse" ? GH_BUILDING_W : ghost.width;
        const gh = ghost.type === "greenhouse" ? GH_BUILDING_H : ghost.height;
        const padding = ghost.type === "bed" && ghost.bedType === "raised" ? 1 : 0;
        if (canPlaceAt(activeMap, tileX, tileY, gw, gh, padding)) {
          onBuildPlaceRef.current(tileX, tileY);
        }
      } else {
        handleClick(click, false);
      }
      handleClick(rightClick, true);
    }

    function handleClick(pos: { x: number; y: number } | null, isRightClick: boolean) {
      if (!pos || buildGhostRef.current) return;
      const worldX = pos.x + camera.x;
      const worldY = pos.y + camera.y;
      const tileX = Math.floor(worldX / TILE_SIZE);
      const tileY = Math.floor(worldY / TILE_SIZE);

      const tile = activeMap[tileY]?.[tileX];
      if (!tile) return;

      // Tap-to-walk: tapping a walkable, non-bed tile queues one step toward it.
      // (Right-click is reserved for plant removal; only left-tap moves.)
      if (!tile.bedId && tile.walkable && !isRightClick) {
        const dx = tileX - char.tileX;
        const dy = tileY - char.tileY;
        if (dx === 0 && dy === 0) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          queuedDirection = dx > 0 ? "right" : "left";
        } else {
          queuedDirection = dy > 0 ? "down" : "up";
        }
        return;
      }

      if (!tile.bedId) return;

      if (isRightClick) {
        onRemovePlantRef.current(tile.bedId, tile.bedTileX!, tile.bedTileY!);
      } else if (selectedRef.current) {
        onPlacePlantRef.current(tile.bedId, tile.bedTileX!, tile.bedTileY!);
      } else {
        const planting = gardenRef.current.plantings.find(
          p => p.bedId === tile.bedId && p.tileX === tile.bedTileX && p.tileY === tile.bedTileY
        );
        if (planting) {
          onPlantTapRef.current(tile.bedId, tile.bedTileX!, tile.bedTileY!);
        } else {
          setHint(
            "Pick a plant on the left",
            tileX * TILE_SIZE + TILE_SIZE / 2,
            tileY * TILE_SIZE - 4,
          );
        }
      }
    }

    // --- Game Render ---
    function render() {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      const charCenterX = char.renderX + TILE_SIZE / 2;
      const charCenterY = char.renderY + TILE_SIZE / 2;

      if (currentScene === "outdoor") {
        camera.follow(charCenterX, charCenterY, w, h, WORLD_COLS * TILE_SIZE, WORLD_ROWS * TILE_SIZE);
      } else {
        const ghCfg = ghConfigRef.current;
        camera.follow(charCenterX, charCenterY, w, h, (ghCfg.widthTiles || 16) * TILE_SIZE, (ghCfg.heightTiles || 12) * TILE_SIZE);
      }

      ctx.fillStyle = "#1a3a0e";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

      const g = gardenRef.current;
      if (currentScene === "outdoor") {
        worldRenderer.draw(ctx, activeMap, g, camera.x, camera.y, w, h);
      } else {
        ghRenderer.draw(ctx, activeMap, g, ghConfigRef.current);
      }

      // Draw character
      charRenderer.draw(ctx, char);

      // Draw tile highlight
      const curTile = activeMap[char.tileY]?.[char.tileX];
      if (curTile?.bedId && selectedRef.current) {
        ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(char.tileX * TILE_SIZE + 1, char.tileY * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }

      // Draw build ghost
      if (buildGhostRef.current && currentScene === "outdoor") {
        const ghost = buildGhostRef.current;
        let mx: number;
        let my: number;
        if (mouseWorldRef.current) {
          mx = mouseWorldRef.current.x;
          my = mouseWorldRef.current.y;
        } else {
          // Fallback: place ghost just in front of the character so the user
          // always has a visible preview (e.g. on touch devices, or before
          // the mouse has been moved over the canvas).
          const gw0 = ghost.type === "greenhouse" ? GH_BUILDING_W : ghost.width;
          const gh0 = ghost.type === "greenhouse" ? GH_BUILDING_H : ghost.height;
          const facingDx = DIR_DX[char.direction];
          const facingDy = DIR_DY[char.direction];
          mx = (char.tileX + facingDx) * TILE_SIZE + TILE_SIZE / 2 - (gw0 * TILE_SIZE) / 2;
          my = (char.tileY + facingDy) * TILE_SIZE + TILE_SIZE / 2 - (gh0 * TILE_SIZE) / 2;
        }
        const tileX = Math.floor(mx / TILE_SIZE);
        const tileY = Math.floor(my / TILE_SIZE);
        const gw = ghost.type === "greenhouse" ? GH_BUILDING_W : ghost.width;
        const gh2 = ghost.type === "greenhouse" ? GH_BUILDING_H : ghost.height;
        const padding = ghost.type === "bed" && ghost.bedType === "raised" ? 1 : 0;
        const valid = canPlaceAt(activeMap, tileX, tileY, gw, gh2, padding);

        const px = tileX * TILE_SIZE;
        const py = tileY * TILE_SIZE;
        const pw = gw * TILE_SIZE;
        const ph = gh2 * TILE_SIZE;

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = valid ? "rgba(107, 203, 119, 0.5)" : "rgba(255, 107, 107, 0.5)";
        ctx.fillRect(px, py, pw, ph);

        // Border preview
        if (ghost.type === "bed" && ghost.bedType === "raised") {
          ctx.strokeStyle = valid ? "#A0724E" : "#FF6B6B";
          ctx.lineWidth = 2;
          ctx.strokeRect(px - TILE_SIZE, py - TILE_SIZE, pw + TILE_SIZE * 2, ph + TILE_SIZE * 2);
        } else if (ghost.type === "greenhouse") {
          ctx.strokeStyle = valid ? "#4a9a6a" : "#FF6B6B";
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, pw, ph);
        } else {
          // In-ground
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = valid ? "rgba(240, 230, 211, 0.5)" : "rgba(255, 107, 107, 0.5)";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, pw, ph);
          ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = valid ? "rgba(107, 203, 119, 0.9)" : "rgba(255, 107, 107, 0.9)";
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        const label = ghost.type === "greenhouse" ? "GREENHOUSE" : `${gw}×${gh2} BED`;
        ctx.fillText(label, px + pw / 2, py - 6);
        if (!valid) {
          ctx.fillText("Can't place here", px + pw / 2, py + ph + 12);
        }
      }

      // Floating hint (e.g. "Pick a plant on the left")
      const hint = hintRef.current;
      if (hint) {
        const now = performance.now();
        const remaining = hint.until - now;
        if (remaining <= 0) {
          hintRef.current = null;
        } else {
          const alpha = Math.min(1, remaining / 600);
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.textAlign = "center";
          const padX = 6;
          const padY = 4;
          const metrics = ctx.measureText(hint.text);
          const boxW = Math.ceil(metrics.width) + padX * 2;
          const boxH = 14;
          const bx = hint.worldX - boxW / 2;
          const by = hint.worldY - boxH;
          ctx.globalAlpha = 0.85 * alpha;
          ctx.fillStyle = "#1a3a0e";
          ctx.fillRect(bx, by, boxW, boxH);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "#f0e6d3";
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);
          ctx.fillStyle = "#f0e6d3";
          ctx.fillText(hint.text, hint.worldX, by + boxH - padY);
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();

      sceneManager.drawFade(ctx, w, h);

      // HUD
      ctx.fillStyle = "rgba(240, 230, 211, 0.5)";
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = "left";
      ctx.fillText(currentScene === "outdoor" ? "OUTDOOR" : "GREENHOUSE", 8, 16);

      ctx.fillStyle = "rgba(240, 230, 211, 0.3)";
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = "right";
      if (buildGhostRef.current) {
        ctx.fillText("Click to place / ESC to cancel", w - 8, h - 8);
      } else {
        ctx.fillText("WASD/Arrows to move", w - 8, h - 8);
      }
    }

    const loop = new GameLoop(update, render);
    loop.start();

    return () => {
      loop.stop();
      input.detach();
      canvas.removeEventListener("mousemove", onMouseMove);
      resizeObserver.disconnect();
    };
  }, [resizeCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full"
      style={{ imageRendering: "pixelated", cursor: buildGhost ? "crosshair" : "default" }}
    />
  );
}
