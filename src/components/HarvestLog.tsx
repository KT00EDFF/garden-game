import { useState } from "react";
import type { GardenState, HarvestEntry } from "../types";
import { plantsById, plants } from "../data/plants";

interface HarvestLogProps {
  garden: GardenState;
  onAddHarvest: (plantId: string, quantity: string, notes?: string) => void;
  onRemoveHarvest: (harvestId: string) => void;
  onClose: () => void;
}

export function HarvestLog({
  garden,
  onAddHarvest,
  onRemoveHarvest,
  onClose,
}: HarvestLogProps) {
  const [plantId, setPlantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const harvests = garden.harvests || [];
  const plantedIds = [...new Set(garden.plantings.map((p) => p.plantId))];

  // Group harvests by plant
  const grouped = harvests.reduce<Record<string, HarvestEntry[]>>((acc, h) => {
    if (!acc[h.plantId]) acc[h.plantId] = [];
    acc[h.plantId].push(h);
    return acc;
  }, {});

  function handleAdd() {
    if (!plantId || !quantity.trim()) return;
    onAddHarvest(plantId, quantity.trim(), notes.trim() || undefined);
    setQuantity("");
    setNotes("");
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border-2 border-success/40 rounded-sm p-4 max-w-sm w-full shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] text-success">Harvest Log</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm px-1"
          >
            x
          </button>
        </div>

        {/* Add harvest form */}
        <div className="mb-4 p-2 border border-text-secondary/20 rounded-sm">
          <p className="text-[7px] text-text-secondary mb-2">Log a harvest</p>
          <div className="flex flex-col gap-2">
            <select
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="settings-input"
            >
              <option value="">Select plant...</option>
              {plantedIds.map((id) => {
                const plant = plantsById[id];
                return plant ? (
                  <option key={id} value={id}>
                    {plant.emoji} {plant.name}
                  </option>
                ) : null;
              })}
              {/* Also allow logging plants not currently placed */}
              {plants
                .filter((p) => !plantedIds.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.name} (not planted)
                  </option>
                ))}
            </select>
            <input
              type="text"
              placeholder="Quantity (e.g. 2 lbs, 12 peppers)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="settings-input"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="settings-input"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!plantId || !quantity.trim()}
              className="py-1.5 bg-success/20 border border-success/40 rounded-sm text-[7px] text-success hover:bg-success/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add Harvest
            </button>
          </div>
        </div>

        {/* Harvest entries */}
        {harvests.length === 0 ? (
          <p className="text-[7px] text-text-secondary text-center py-4">
            No harvests logged yet. Start picking!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([pid, entries]) => {
              const plant = plantsById[pid];
              if (!plant) return null;
              return (
                <div key={pid}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">{plant.emoji}</span>
                    <span className="text-[8px] text-text-primary font-bold">
                      {plant.name}
                    </span>
                    <span className="text-[6px] text-text-secondary">
                      ({entries.length} harvest{entries.length > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 ml-5">
                    {entries
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between text-[7px] p-1 bg-panel-light/50 rounded-sm"
                        >
                          <div className="flex-1">
                            <span className="text-text-primary">
                              {entry.quantity}
                            </span>
                            {entry.notes && (
                              <span className="text-text-secondary ml-1">
                                — {entry.notes}
                              </span>
                            )}
                            <span className="text-text-secondary ml-1">
                              ({entry.date})
                            </span>
                          </div>
                          <button
                            onClick={() => onRemoveHarvest(entry.id)}
                            className="text-danger/60 hover:text-danger text-[8px] ml-1 px-1"
                          >
                            x
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {harvests.length > 0 && (
          <div className="mt-3 pt-2 border-t border-text-secondary/20 text-[7px] text-text-secondary text-center">
            Total: {harvests.length} harvest{harvests.length > 1 ? "s" : ""} across{" "}
            {Object.keys(grouped).length} crop{Object.keys(grouped).length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
