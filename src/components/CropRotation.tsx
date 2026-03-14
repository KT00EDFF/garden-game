import { useState } from "react";
import type { GardenState, RotationEntry } from "../types";
import { plantsById } from "../data/plants";
import { getPlantFamily, checkRotationConflict } from "../data/plant-families";

interface CropRotationProps {
  garden: GardenState;
  onSaveSnapshot: (year: number) => void;
  onClose: () => void;
}

export function CropRotation({
  garden,
  onSaveSnapshot,
  onClose,
}: CropRotationProps) {
  const currentYear = new Date().getFullYear();
  const history = garden.rotationHistory || [];
  const years = [...new Set(history.map((e) => e.year))].sort((a, b) => b - a);

  const [snapshotYear, setSnapshotYear] = useState(currentYear);

  const currentBedPlants = new Map<string, Set<string>>();
  for (const p of garden.plantings) {
    if (!currentBedPlants.has(p.bedId)) currentBedPlants.set(p.bedId, new Set());
    currentBedPlants.get(p.bedId)!.add(p.plantId);
  }

  function handleSave() {
    onSaveSnapshot(snapshotYear);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border-2 border-accent/40 rounded-sm p-4 max-w-md w-full shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] text-accent">Crop Rotation</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm px-1"
          >
            x
          </button>
        </div>

        <div className="mb-4 p-2 border border-text-secondary/20 rounded-sm">
          <p className="text-[7px] text-text-secondary mb-2">Save year snapshot</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={snapshotYear}
              onChange={(e) => setSnapshotYear(Number(e.target.value))}
              className="settings-input w-20"
              min={2020}
              max={2099}
            />
            <button
              onClick={handleSave}
              disabled={garden.plantings.length === 0}
              className="flex-1 py-1.5 bg-accent/20 border border-accent/40 rounded-sm text-[7px] text-accent hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Year Snapshot
            </button>
          </div>
          {years.includes(snapshotYear) && (
            <p className="text-[6px] text-accent mt-1">
              This will overwrite the existing {snapshotYear} snapshot.
            </p>
          )}
        </div>

        <div className="mb-3">
          <p className="text-[8px] text-text-primary mb-2">Current Plan</p>
          {garden.beds.map((bed) => {
            const bedPlants = currentBedPlants.get(bed.id);
            if (!bedPlants || bedPlants.size === 0) return null;
            const plantIds = Array.from(bedPlants);
            return (
              <div key={bed.id} className="mb-2">
                <p className="text-[7px] text-text-secondary">{bed.name}</p>
                <div className="flex flex-wrap gap-1 ml-2 mt-0.5">
                  {plantIds.map((pid) => {
                    const plant = plantsById[pid];
                    if (!plant) return null;
                    const conflict = checkRotationConflict(bed.id, pid, history);
                    return (
                      <span
                        key={pid}
                        className={`text-[7px] px-1.5 py-0.5 rounded-sm border ${
                          conflict.hasConflict
                            ? "border-danger/50 bg-danger/10 text-danger"
                            : "border-text-secondary/20 bg-panel-light text-text-primary"
                        }`}
                      >
                        {plant.emoji} {plant.name}
                        {conflict.hasConflict && (
                          <span className="ml-0.5 text-[6px]">
                            (was here {conflict.lastYear})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {garden.plantings.length === 0 && (
            <p className="text-[7px] text-text-secondary text-center py-2">
              No plants placed yet.
            </p>
          )}
        </div>

        {years.length > 0 && (
          <div>
            <p className="text-[8px] text-text-primary mb-2">History</p>
            {years.map((year) => {
              const yearEntries = history.filter((e) => e.year === year);
              return (
                <div key={year} className="mb-3">
                  <p className="text-[8px] text-accent mb-1">{year}</p>
                  {yearEntries.map((entry) => {
                    const bed = garden.beds.find((b) => b.id === entry.bedId);
                    return (
                      <div key={entry.bedId} className="mb-1.5 ml-2">
                        <p className="text-[7px] text-text-secondary">
                          {bed?.name || entry.bedId}
                        </p>
                        <div className="flex flex-wrap gap-1 ml-2 mt-0.5">
                          {entry.plantIds.map((pid) => {
                            const plant = plantsById[pid];
                            const family = getPlantFamily(pid);
                            return (
                              <span
                                key={pid}
                                className="text-[7px] px-1.5 py-0.5 rounded-sm border border-text-secondary/20 bg-panel-light text-text-primary"
                              >
                                {plant?.emoji || "?"} {plant?.name || pid}
                                {family !== "other" && (
                                  <span className="text-[6px] text-text-secondary ml-0.5">
                                    ({family})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {years.length === 0 && (
          <p className="text-[7px] text-text-secondary text-center py-2">
            No history yet. Save a snapshot to start tracking rotation.
          </p>
        )}
      </div>
    </div>
  );
}
