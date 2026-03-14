import { useState, useEffect, useCallback } from "react";
import { useGarden } from "./hooks/useGarden";
import { useWeather } from "./hooks/useWeather";
import { Header } from "./components/Header";
import { GardenView } from "./components/GardenView";
import { PlantPalette } from "./components/PlantPalette";
import { SeasonTimeline } from "./components/SeasonTimeline";
import { Alerts } from "./components/Alerts";
import { WeatherPanel } from "./components/WeatherPanel";
import { Settings } from "./components/Settings";
import { PlantCard } from "./components/PlantCard";
import { Onboarding } from "./components/Onboarding";
import { Achievements } from "./components/Achievements";
import { AchievementToast } from "./components/AchievementToast";
import { HarvestLog } from "./components/HarvestLog";
import { SeedInventory } from "./components/SeedInventory";
import { CropRotation } from "./components/CropRotation";
import {
  evaluateAchievements,
  loadUnlocked,
  saveUnlocked,
  getTotalXP,
  type Achievement,
  type UnlockedAchievement,
} from "./engine/achievements";

const ONBOARDING_KEY = "garden-game-onboarded";

function App() {
  const {
    garden,
    selectedPlantId,
    setSelectedPlantId,
    placePlant,
    removePlant,
    clearAll,
    updateGarden,
    spacingWarning,
    plans,
    activePlanId,
    switchPlan,
    addPlan,
    removePlan,
    setSuccession,
    removeSuccession,
    addHarvest,
    removeHarvest,
    saveRotationSnapshot,
    addSeed,
    updateSeed,
    removeSeed,
  } = useGarden();

  const { weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } = useWeather(garden.zipCode);

  // Mark weatherChecked for achievement when weather loads
  useEffect(() => {
    if (weather && !garden.weatherChecked) {
      updateGarden({ weatherChecked: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather]);

  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showHarvestLog, setShowHarvestLog] = useState(false);
  const [showRotation, setShowRotation] = useState(false);
  const [showSeedInventory, setShowSeedInventory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>(loadUnlocked);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  // Evaluate achievements whenever garden changes
  useEffect(() => {
    const { unlocked, newlyUnlocked } = evaluateAchievements(garden, unlockedAchievements);
    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(unlocked);
      saveUnlocked(unlocked);
      setToastQueue((prev) => [...prev, ...newlyUnlocked]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garden.plantings, garden.exportCount, garden.rotationHistory, garden.seedInventory, garden.weatherChecked]);

  const dismissToast = useCallback(() => {
    setToastQueue((prev) => prev.slice(1));
  }, []);
  const [inspectedTile, setInspectedTile] = useState<{
    bedId: string;
    tileX: number;
    tileY: number;
  } | null>(null);

  const inspectedPlanting = inspectedTile
    ? garden.plantings.find(
        (p) =>
          p.bedId === inspectedTile.bedId &&
          p.tileX === inspectedTile.tileX &&
          p.tileY === inspectedTile.tileY
      )
    : undefined;

  const inspectedBed = inspectedTile
    ? garden.beds.find((b) => b.id === inspectedTile.bedId)
    : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        garden={garden}
        onClearAll={clearAll}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAchievements={() => setShowAchievements(true)}
        onOpenHarvestLog={() => setShowHarvestLog(true)}
        onOpenSeedInventory={() => setShowSeedInventory(true)}
        onOpenRotation={() => setShowRotation(true)}
        seedCount={(garden.seedInventory || []).length}
        totalXP={getTotalXP(unlockedAchievements)}
        harvestCount={(garden.harvests || []).length}
        plans={plans}
        activePlanId={activePlanId}
        onSwitchPlan={switchPlan}
        onAddPlan={addPlan}
        onDeletePlan={removePlan}
        onExport={() =>
          updateGarden({ exportCount: (garden.exportCount || 0) + 1 })
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-3">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Plant Palette */}
          <aside className="lg:w-56 shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-3">
              <PlantPalette
                selectedPlantId={selectedPlantId}
                onSelect={setSelectedPlantId}
              />
            </div>
          </aside>

          {/* Center: Garden Grid */}
          <section className="flex-1 order-1 lg:order-2">
            {spacingWarning && (
              <div className="mb-2 p-2 bg-danger/10 border border-danger/30 rounded-sm text-[8px] text-danger">
                ⚠ {spacingWarning}
              </div>
            )}
            <GardenView
              garden={garden}
              selectedPlantId={selectedPlantId}
              onTileClick={placePlant}
              onTileRightClick={removePlant}
              onPlantTap={(bedId, tileX, tileY) =>
                setInspectedTile({ bedId, tileX, tileY })
              }
            />

            {/* Timeline below garden */}
            <div className="mt-4">
              <SeasonTimeline garden={garden} />
            </div>
          </section>

          {/* Right: Weather + Alerts */}
          <aside className="lg:w-56 shrink-0 order-3">
            <div className="lg:sticky lg:top-3 flex flex-col gap-3">
              <WeatherPanel
                weather={weather}
                loading={weatherLoading}
                error={weatherError}
                onRefresh={refreshWeather}
                hasZipCode={!!garden.zipCode}
              />
              <Alerts
                garden={garden}
                frostWarning={!!weather && weather.daily.tempMin.some((t) => t <= 32)}
              />
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-panel border-t border-text-secondary/20 p-2 text-center">
        <p className="text-[6px] text-text-secondary">
          Tap a plant, then tap a tile to place it. Tap a placed plant to inspect. Right-click to remove. Auto-saves.
        </p>
      </footer>

      {showSettings && (
        <Settings
          garden={garden}
          onUpdate={updateGarden}
          onClose={() => setShowSettings(false)}
        />
      )}

      {toastQueue.length > 0 && (
        <AchievementToast
          key={toastQueue[0].id}
          achievement={toastQueue[0]}
          onDone={dismissToast}
        />
      )}

      {showAchievements && (
        <Achievements
          unlocked={unlockedAchievements}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {showHarvestLog && (
        <HarvestLog
          garden={garden}
          onAddHarvest={addHarvest}
          onRemoveHarvest={removeHarvest}
          onClose={() => setShowHarvestLog(false)}
        />
      )}

      {showSeedInventory && (
        <SeedInventory
          garden={garden}
          onAddSeed={addSeed}
          onUpdateSeed={updateSeed}
          onRemoveSeed={removeSeed}
          onClose={() => setShowSeedInventory(false)}
        />
      )}

      {showRotation && (
        <CropRotation
          garden={garden}
          onSaveSnapshot={saveRotationSnapshot}
          onClose={() => setShowRotation(false)}
        />
      )}

      {showOnboarding && (
        <Onboarding
          onComplete={() => {
            localStorage.setItem(ONBOARDING_KEY, "1");
            setShowOnboarding(false);
          }}
        />
      )}

      {inspectedPlanting && inspectedBed && (
        <PlantCard
          placed={inspectedPlanting}
          plantings={garden.plantings}
          bedSun={inspectedBed.sunExposure || "full"}
          zone={garden.zone}
          succession={(garden.successions || []).find(
            (s) => s.plantId === inspectedPlanting.plantId
          )}
          onRemove={() => {
            removePlant(
              inspectedPlanting.bedId,
              inspectedPlanting.tileX,
              inspectedPlanting.tileY
            );
            setInspectedTile(null);
          }}
          onClose={() => setInspectedTile(null)}
          onSetSuccession={setSuccession}
          onRemoveSuccession={removeSuccession}
        />
      )}
    </div>
  );
}

export default App;
