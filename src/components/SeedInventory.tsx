import { useState } from "react";
import type { GardenState, SeedInventoryItem } from "../types";
import { plantsById, plants } from "../data/plants";

interface SeedInventoryProps {
  garden: GardenState;
  onAddSeed: (item: Omit<SeedInventoryItem, "id">) => void;
  onUpdateSeed: (id: string, updates: Partial<SeedInventoryItem>) => void;
  onRemoveSeed: (id: string) => void;
  onClose: () => void;
}

const UNITS = ["packets", "seeds", "oz", "lbs"];

export function SeedInventory({
  garden,
  onAddSeed,
  onUpdateSeed,
  onRemoveSeed,
  onClose,
}: SeedInventoryProps) {
  const [plantId, setPlantId] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("packets");
  const [source, setSource] = useState("");
  const [expiresYear, setExpiresYear] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(1);

  const seeds = garden.seedInventory || [];
  const currentYear = new Date().getFullYear();
  const plantedIds = new Set(garden.plantings.map((p) => p.plantId));

  // Group seeds by plant
  const grouped = seeds.reduce<Record<string, SeedInventoryItem[]>>(
    (acc, s) => {
      if (!acc[s.plantId]) acc[s.plantId] = [];
      acc[s.plantId].push(s);
      return acc;
    },
    {}
  );

  const uniquePlantIds = new Set(seeds.map((s) => s.plantId));
  const expiringSoon = seeds.filter(
    (s) => s.expiresYear && s.expiresYear <= currentYear
  );

  function handleAdd() {
    if (!plantId || quantity <= 0) return;
    onAddSeed({
      plantId,
      variety: variety.trim() || undefined,
      quantity,
      unit,
      source: source.trim() || undefined,
      expiresYear: expiresYear ? Number(expiresYear) : undefined,
    });
    setVariety("");
    setQuantity(1);
    setUnit("packets");
    setSource("");
    setExpiresYear("");
  }

  function handleEditSave(id: string) {
    onUpdateSeed(id, { quantity: editQty });
    setEditingId(null);
  }

  function isExpiring(s: SeedInventoryItem) {
    return s.expiresYear != null && s.expiresYear <= currentYear;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border-2 border-water/40 rounded-sm p-4 max-w-sm w-full shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] text-water">Seed Inventory</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm px-1"
          >
            x
          </button>
        </div>

        {/* Add seed form */}
        <div className="mb-4 p-2 border border-text-secondary/20 rounded-sm">
          <p className="text-[7px] text-text-secondary mb-2">Add Seed</p>
          <div className="flex flex-col gap-2">
            <select
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="settings-input"
            >
              <option value="">Select plant...</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Variety (optional, e.g. Brandywine)"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              className="settings-input"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="settings-input w-16"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="settings-input flex-1"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Source (optional, e.g. Johnny's Seeds)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="settings-input"
            />
            <input
              type="number"
              placeholder="Expires year (optional, e.g. 2027)"
              value={expiresYear}
              onChange={(e) =>
                setExpiresYear(e.target.value ? Number(e.target.value) : "")
              }
              className="settings-input"
            />
            <button
              onClick={handleAdd}
              disabled={!plantId || quantity <= 0}
              className="py-1.5 bg-water/20 border border-water/40 rounded-sm text-[7px] text-water hover:bg-water/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add Seed
            </button>
          </div>
        </div>

        {/* Seed list */}
        {seeds.length === 0 ? (
          <p className="text-[7px] text-text-secondary text-center py-4">
            No seeds tracked yet. Start building your inventory!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([pid, items]) => {
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
                      ({items.length} entr{items.length > 1 ? "ies" : "y"})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 ml-5">
                    {items.map((seed) => (
                      <div
                        key={seed.id}
                        className={`flex items-center justify-between text-[7px] p-1 rounded-sm ${
                          isExpiring(seed)
                            ? "bg-danger/10 border border-danger/30"
                            : "bg-panel-light/50"
                        }`}
                      >
                        <div className="flex-1 flex items-center gap-1">
                          {/* Planted check */}
                          <span
                            className={`text-[8px] ${
                              plantedIds.has(seed.plantId)
                                ? "text-success"
                                : "text-text-secondary"
                            }`}
                            title={
                              plantedIds.has(seed.plantId)
                                ? "Planted"
                                : "Not yet planted"
                            }
                          >
                            {plantedIds.has(seed.plantId) ? "\u2713" : "\u2014"}
                          </span>
                          <div className="flex-1">
                            {seed.variety && (
                              <span className="text-text-primary">
                                {seed.variety} —{" "}
                              </span>
                            )}
                            {editingId === seed.id ? (
                              <span className="inline-flex items-center gap-0.5">
                                <input
                                  type="number"
                                  min={1}
                                  value={editQty}
                                  onChange={(e) =>
                                    setEditQty(Number(e.target.value))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleEditSave(seed.id);
                                    if (e.key === "Escape")
                                      setEditingId(null);
                                  }}
                                  className="settings-input w-10 text-[7px] inline"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleEditSave(seed.id)}
                                  className="text-success text-[8px]"
                                >
                                  ok
                                </button>
                              </span>
                            ) : (
                              <span
                                className="text-text-primary cursor-pointer hover:underline"
                                onClick={() => {
                                  setEditingId(seed.id);
                                  setEditQty(seed.quantity);
                                }}
                                title="Click to edit quantity"
                              >
                                {seed.quantity} {seed.unit}
                              </span>
                            )}
                            {seed.source && (
                              <span className="text-text-secondary ml-1">
                                from {seed.source}
                              </span>
                            )}
                            {seed.expiresYear && (
                              <span
                                className={`ml-1 ${
                                  isExpiring(seed)
                                    ? "text-danger"
                                    : "text-text-secondary"
                                }`}
                              >
                                {isExpiring(seed)
                                  ? seed.expiresYear < currentYear
                                    ? `expired ${seed.expiresYear}`
                                    : "expires this year"
                                  : `exp ${seed.expiresYear}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveSeed(seed.id)}
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
        {seeds.length > 0 && (
          <div className="mt-3 pt-2 border-t border-text-secondary/20 text-[7px] text-text-secondary text-center">
            {seeds.length} seed{seeds.length > 1 ? "s" : ""} for{" "}
            {uniquePlantIds.size} crop{uniquePlantIds.size > 1 ? "s" : ""}
            {expiringSoon.length > 0 && (
              <span className="text-danger">
                , {expiringSoon.length} expiring soon
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
