import { useState } from "react";
import { useGarden } from "./hooks/useGarden";
import { Header } from "./components/Header";
import { GardenView } from "./components/GardenView";
import { PlantPalette } from "./components/PlantPalette";
import { SeasonTimeline } from "./components/SeasonTimeline";
import { Alerts } from "./components/Alerts";
import { Settings } from "./components/Settings";

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
  } = useGarden();

  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        garden={garden}
        onClearAll={clearAll}
        onOpenSettings={() => setShowSettings(true)}
        plans={plans}
        activePlanId={activePlanId}
        onSwitchPlan={switchPlan}
        onAddPlan={addPlan}
        onDeletePlan={removePlan}
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
            />

            {/* Timeline below garden */}
            <div className="mt-4">
              <SeasonTimeline garden={garden} />
            </div>
          </section>

          {/* Right: Alerts */}
          <aside className="lg:w-56 shrink-0 order-3">
            <div className="lg:sticky lg:top-3">
              <Alerts garden={garden} />
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-panel border-t border-text-secondary/20 p-2 text-center">
        <p className="text-[6px] text-text-secondary">
          Tap a plant, then tap a tile to place it. Right-click to remove. Auto-saves.
        </p>
      </footer>

      {showSettings && (
        <Settings
          garden={garden}
          onUpdate={updateGarden}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
