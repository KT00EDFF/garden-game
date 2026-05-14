import { useState, useCallback } from "react";
import type { GardenState, CharacterConfig, GreenhouseConfig, BedType } from "../types";
import type { PlanMeta } from "../data/garden-config";
import type { UnlockedAchievement } from "../engine/achievements";
import type { WeatherData } from "../hooks/useWeather";
import { getTotalXP } from "../engine/achievements";
import { GameCanvas, type BuildGhost } from "../game/GameCanvas";
import { PlantPalette } from "./PlantPalette";
import { SeasonTimeline } from "./SeasonTimeline";
import { WeatherPanel } from "./WeatherPanel";
import { Alerts } from "./Alerts";

interface GameScreenProps {
  garden: GardenState;
  characterConfig: CharacterConfig;
  greenhouseConfig: GreenhouseConfig;
  selectedPlantId: string | null;
  onSelectPlant: (id: string | null) => void;
  onPlacePlant: (bedId: string, tileX: number, tileY: number) => void;
  onRemovePlant: (bedId: string, tileX: number, tileY: number) => void;
  onPlantTap: (bedId: string, tileX: number, tileY: number) => void;
  spacingWarning: string | null;
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  refreshWeather: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenHarvestLog: () => void;
  onOpenSeedInventory: () => void;
  onOpenRotation: () => void;
  onOpenBedEditor: () => void;
  onClearAll: () => void;
  plans: PlanMeta[];
  activePlanId: string;
  onSwitchPlan: (id: string) => void;
  onAddPlan: (name: string) => void;
  onDeletePlan: (id: string) => void;
  unlockedAchievements: UnlockedAchievement[];
  onExport: () => void;
  onAddBed: (name: string, type: BedType, width: number, height: number, worldX?: number, worldY?: number, location?: "outdoor" | "greenhouse", greenhouseType?: "shelf" | "grow-station", hasGrowLight?: boolean) => void;
  onPlaceGreenhouse: (worldX: number, worldY: number) => void;
}

type BuildStep = "idle" | "pick-type" | "pick-size" | "placing";

interface PendingBuild {
  buildType: "raised" | "in-ground" | "greenhouse";
  width: number;
  height: number;
  name: string;
}

export function GameScreen({
  garden,
  characterConfig,
  greenhouseConfig,
  selectedPlantId,
  onSelectPlant,
  onPlacePlant,
  onRemovePlant,
  onPlantTap,
  spacingWarning,
  weather,
  weatherLoading,
  weatherError,
  refreshWeather,
  onOpenSettings,
  onOpenAchievements,
  onOpenHarvestLog,
  onOpenSeedInventory,
  onOpenRotation,
  onOpenBedEditor,
  onClearAll,
  plans,
  activePlanId,
  onSwitchPlan,
  onAddPlan,
  onDeletePlan,
  unlockedAchievements,
  onExport,
  onAddBed,
  onPlaceGreenhouse,
}: GameScreenProps) {
  const [buildStep, setBuildStep] = useState<BuildStep>("idle");
  const [pending, setPending] = useState<PendingBuild>({
    buildType: "raised",
    width: 4,
    height: 3,
    name: "",
  });

  const buildGhost: BuildGhost | null = buildStep === "placing" ? {
    type: pending.buildType === "greenhouse" ? "greenhouse" : "bed",
    bedType: pending.buildType === "greenhouse" ? undefined : pending.buildType,
    width: pending.width,
    height: pending.height,
  } : null;

  const handleBuildPlace = useCallback((worldX: number, worldY: number) => {
    if (pending.buildType === "greenhouse") {
      onPlaceGreenhouse(worldX, worldY);
    } else {
      const bedName = pending.name || `${pending.buildType === "raised" ? "Raised" : "In-Ground"} Bed`;
      onAddBed(bedName, pending.buildType, pending.width, pending.height, worldX, worldY);
    }
    setBuildStep("idle");
    setPending({ buildType: "raised", width: 4, height: 3, name: "" });
  }, [pending, onAddBed, onPlaceGreenhouse]);

  const cancelBuild = useCallback(() => {
    setBuildStep("idle");
    setPending({ buildType: "raised", width: 4, height: 3, name: "" });
  }, []);

  const hasGreenhouse = garden.greenhouseWorldX != null;

  // Listen for ESC to cancel build
  // (InputHandler already captures ESC for the canvas, but for overlay we handle it here)

  return (
    <div className="flex flex-col h-screen" onKeyDown={(e) => { if (e.key === "Escape") cancelBuild(); }}>
      {/* Top bar */}
      <header className="bg-panel border-b border-text-secondary/20 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <select
            value={activePlanId}
            onChange={(e) => onSwitchPlan(e.target.value)}
            className="bg-panel-light text-accent text-[7px] border border-text-secondary/30 px-1 py-0.5"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => onAddPlan("New Plan")} className="text-[7px] text-text-secondary hover:text-accent" title="New Plan">+</button>
          {plans.length > 1 && (
            <button onClick={() => onDeletePlan(activePlanId)} className="text-[7px] text-danger hover:text-danger/80" title="Delete Plan">x</button>
          )}
          <span className="text-[7px] text-text-secondary">
            {characterConfig.name}&apos;s Farm
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent text-[7px]">
            {getTotalXP(unlockedAchievements)} XP
          </span>
          <button onClick={onExport} className="text-[7px] text-text-secondary hover:text-accent" title="Export">📸</button>
          <button onClick={onClearAll} className="text-[7px] text-danger hover:text-danger/80" title="Clear All Plants">🗑</button>
          <button onClick={onOpenAchievements} className="text-[7px] text-text-secondary hover:text-accent" title="Achievements">★</button>
          <button onClick={onOpenHarvestLog} className="text-[7px] text-text-secondary hover:text-accent" title="Harvest Log">📋</button>
          <button onClick={onOpenSeedInventory} className="text-[7px] text-text-secondary hover:text-accent" title="Seeds">🌰</button>
          <button onClick={onOpenRotation} className="text-[7px] text-text-secondary hover:text-accent" title="Crop Rotation">🔄</button>
          <button onClick={onOpenBedEditor} className="text-[7px] text-text-secondary hover:text-accent" title="Edit Beds">🛏️</button>
          <button onClick={onOpenSettings} className="text-[7px] text-text-secondary hover:text-accent" title="Settings">⚙</button>
        </div>
      </header>

      {/* Main game area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Plant Palette */}
        <aside className="w-48 shrink-0 overflow-y-auto bg-panel/80 border-r border-text-secondary/20 p-2">
          <PlantPalette
            selectedPlantId={selectedPlantId}
            onSelect={onSelectPlant}
          />
        </aside>

        {/* Center: Canvas + Build bar */}
        <section className="flex-1 flex flex-col relative">
          {spacingWarning && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 p-2 bg-danger/90 border border-danger rounded-sm text-[7px] text-white max-w-xs text-center">
              ⚠ {spacingWarning}
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 relative">
            <GameCanvas
              garden={garden}
              characterConfig={characterConfig}
              greenhouseConfig={greenhouseConfig}
              selectedPlantId={selectedPlantId}
              onPlacePlant={onPlacePlant}
              onRemovePlant={onRemovePlant}
              onPlantTap={onPlantTap}
              buildGhost={buildGhost}
              onBuildPlace={handleBuildPlace}
            />
          </div>

          {/* Build toolbar */}
          <div className="bg-panel border-t border-text-secondary/20 px-3 py-2 flex items-center gap-2 shrink-0">
            {buildStep === "idle" && (
              <>
                <span className="text-[7px] text-text-secondary mr-2">BUILD:</span>
                <button
                  onClick={() => { setBuildStep("pick-size"); setPending(p => ({ ...p, buildType: "raised" })); }}
                  className="text-[7px] px-2 py-1 border border-bed-wood text-bed-wood hover:bg-bed-wood/20"
                >
                  + Raised Bed
                </button>
                <button
                  onClick={() => { setBuildStep("pick-size"); setPending(p => ({ ...p, buildType: "in-ground" })); }}
                  className="text-[7px] px-2 py-1 border border-ground text-ground hover:bg-ground/20"
                >
                  + In-Ground Bed
                </button>
                {!hasGreenhouse && (
                  <button
                    onClick={() => { setPending(p => ({ ...p, buildType: "greenhouse" })); setBuildStep("placing"); }}
                    className="text-[7px] px-2 py-1 border border-success text-success hover:bg-success/20"
                  >
                    + Greenhouse
                  </button>
                )}
                <span className="text-[6px] text-text-secondary ml-auto">
                  {garden.beds.filter(b => (b.location ?? "outdoor") === "outdoor").length} beds
                  {hasGreenhouse ? " | Greenhouse placed" : ""}
                </span>
              </>
            )}

            {buildStep === "pick-size" && (
              <>
                <span className="text-[7px] text-accent mr-2">
                  {pending.buildType === "raised" ? "Raised" : "In-Ground"} Bed:
                </span>
                <label className="text-[6px] text-text-secondary">
                  Name:
                  <input
                    type="text"
                    value={pending.name}
                    onChange={(e) => setPending(p => ({ ...p, name: e.target.value }))}
                    placeholder="Optional"
                    className="settings-input ml-1 w-24 inline-block"
                  />
                </label>
                <label className="text-[6px] text-text-secondary">
                  W:
                  <input
                    type="number"
                    min={1} max={16}
                    value={pending.width}
                    onChange={(e) => setPending(p => ({ ...p, width: Math.max(1, Math.min(16, parseInt(e.target.value) || 1)) }))}
                    className="settings-input ml-1 w-10 inline-block text-center"
                  />
                </label>
                <label className="text-[6px] text-text-secondary">
                  H:
                  <input
                    type="number"
                    min={1} max={10}
                    value={pending.height}
                    onChange={(e) => setPending(p => ({ ...p, height: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) }))}
                    className="settings-input ml-1 w-10 inline-block text-center"
                  />
                </label>
                <span className="text-[6px] text-text-secondary">
                  ({pending.width * pending.height} sq ft)
                </span>
                <button
                  onClick={() => setBuildStep("placing")}
                  className="text-[7px] px-2 py-1 border border-accent text-accent hover:bg-accent/20"
                >
                  Place on Map
                </button>
                <button
                  onClick={cancelBuild}
                  className="text-[7px] px-2 py-1 text-text-secondary hover:text-danger"
                >
                  Cancel
                </button>
              </>
            )}

            {buildStep === "placing" && (
              <>
                <span className="text-[7px] text-accent animate-pulse">
                  Click on the map to place {pending.buildType === "greenhouse" ? "greenhouse" : `${pending.width}x${pending.height} bed`}
                </span>
                <button
                  onClick={cancelBuild}
                  className="text-[7px] px-2 py-1 text-text-secondary hover:text-danger ml-auto"
                >
                  Cancel (ESC)
                </button>
              </>
            )}
          </div>
        </section>

        {/* Right: Weather + Alerts */}
        <aside className="w-48 shrink-0 overflow-y-auto bg-panel/80 border-l border-text-secondary/20 p-2 flex flex-col gap-2">
          <WeatherPanel
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            onRefresh={refreshWeather}
            hasZipCode={!!garden.zipCode}
          />
          <Alerts
            garden={garden}
            frostWarning={!!weather && weather.daily.tempMin.some((t: number) => t <= 32)}
          />
        </aside>
      </main>

      {/* Bottom: Timeline */}
      <footer className="bg-panel border-t border-text-secondary/20 p-2 shrink-0">
        <SeasonTimeline garden={garden} />
      </footer>
    </div>
  );
}
