import { useState, useEffect, useCallback } from "react";
import { useGarden } from "./hooks/useGarden";
import { useWeather } from "./hooks/useWeather";
import { Settings } from "./components/Settings";
import { PlantCard } from "./components/PlantCard";
import { Achievements } from "./components/Achievements";
import { AchievementToast } from "./components/AchievementToast";
import { HarvestLog } from "./components/HarvestLog";
import { SeedInventory } from "./components/SeedInventory";
import { BedEditor } from "./components/BedEditor";
import { CropRotation } from "./components/CropRotation";
import { CharacterCreation } from "./components/CharacterCreation";
import { GameScreen } from "./components/GameScreen";
import { defaultGreenhouseConfig } from "./data/garden-config";
import type { CharacterConfig } from "./types";
import {
  evaluateAchievements,
  loadUnlocked,
  saveUnlocked,
  type Achievement,
  type UnlockedAchievement,
} from "./engine/achievements";

type AppScene = "character-creation" | "game";

function App() {
  const {
    garden,
    selectedPlantId,
    setSelectedPlantId,
    placePlant,
    // placePlantById and movePlant available but not needed until drag support is added
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
    addBed,
    removeBed,
    updateBed,
    reorderBeds,
  } = useGarden();

  const { weather, loading: weatherLoading, error: weatherError, refresh: refreshWeather } = useWeather(garden.zipCode);

  // Mark weatherChecked for achievement when weather loads
  useEffect(() => {
    if (weather && !garden.weatherChecked) {
      updateGarden({ weatherChecked: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather]);

  // Determine initial scene based on whether character exists
  const [scene, setScene] = useState<AppScene>(() =>
    garden.character ? "game" : "character-creation"
  );

  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showHarvestLog, setShowHarvestLog] = useState(false);
  const [showRotation, setShowRotation] = useState(false);
  const [showSeedInventory, setShowSeedInventory] = useState(false);
  const [showBedEditor, setShowBedEditor] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>(loadUnlocked);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  // Evaluate achievements whenever garden changes
  useEffect(() => {
    const { unlocked, newlyUnlocked } = evaluateAchievements(garden, unlockedAchievements);
    if (newlyUnlocked.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnlockedAchievements(unlocked);
      saveUnlocked(unlocked);
      setToastQueue((prev) => [...prev, ...newlyUnlocked]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garden.plantings, garden.beds, garden.exportCount, garden.rotationHistory, garden.seedInventory, garden.weatherChecked]);

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

  const handleCharacterCreation = useCallback((config: CharacterConfig) => {
    updateGarden({ character: config, name: config.name + "'s Farm" });
    setScene("game");
  }, [updateGarden]);

  const handlePlaceGreenhouse = useCallback((worldX: number, worldY: number) => {
    updateGarden({ greenhouseWorldX: worldX, greenhouseWorldY: worldY });
  }, [updateGarden]);

  const characterConfig = garden.character || { gender: "female" as const, skinTone: "light" as const, name: "Farmer" };
  const greenhouseConfig = garden.greenhouse || defaultGreenhouseConfig;

  // --- Character Creation Screen ---
  if (scene === "character-creation") {
    return <CharacterCreation onComplete={handleCharacterCreation} />;
  }

  // --- Game Screen ---
  return (
    <>
      <GameScreen
        garden={garden}
        characterConfig={characterConfig}
        greenhouseConfig={greenhouseConfig}
        selectedPlantId={selectedPlantId}
        onSelectPlant={setSelectedPlantId}
        onPlacePlant={placePlant}
        onRemovePlant={removePlant}
        onPlantTap={(bedId, tileX, tileY) => setInspectedTile({ bedId, tileX, tileY })}
        spacingWarning={spacingWarning}
        weather={weather}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        refreshWeather={refreshWeather}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAchievements={() => setShowAchievements(true)}
        onOpenHarvestLog={() => setShowHarvestLog(true)}
        onOpenSeedInventory={() => setShowSeedInventory(true)}
        onOpenRotation={() => setShowRotation(true)}
        onOpenBedEditor={() => setShowBedEditor(true)}
        onClearAll={clearAll}
        plans={plans}
        activePlanId={activePlanId}
        onSwitchPlan={switchPlan}
        onAddPlan={addPlan}
        onDeletePlan={removePlan}
        unlockedAchievements={unlockedAchievements}
        onExport={() => updateGarden({ exportCount: (garden.exportCount || 0) + 1 })}
        onAddBed={addBed}
        onPlaceGreenhouse={handlePlaceGreenhouse}
      />

      {/* Modal overlays */}
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

      {showBedEditor && (
        <BedEditor
          garden={garden}
          onAddBed={addBed}
          onRemoveBed={removeBed}
          onUpdateBed={updateBed}
          onReorderBeds={reorderBeds}
          onClose={() => setShowBedEditor(false)}
        />
      )}

      {showRotation && (
        <CropRotation
          garden={garden}
          onSaveSnapshot={saveRotationSnapshot}
          onClose={() => setShowRotation(false)}
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
    </>
  );
}

export default App;
