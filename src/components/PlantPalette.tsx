import { useState, useMemo } from "react";
import { plants } from "../data/plants";
import type { PlantCategory } from "../types";

interface PlantPaletteProps {
  selectedPlantId: string | null;
  onSelect: (plantId: string | null) => void;
}

const categories: { value: PlantCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vegetable", label: "Veg" },
  { value: "fruit", label: "Fruit" },
  { value: "herb", label: "Herb" },
  { value: "flower", label: "Flower" },
];

export function PlantPalette({ selectedPlantId, onSelect }: PlantPaletteProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PlantCategory | "all">("all");

  const filtered = useMemo(() => {
    return plants.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, category]);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[10px] text-accent uppercase tracking-wider px-1">
        Plants
      </h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="settings-input"
      />

      {/* Category filter */}
      <div className="flex gap-0.5">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex-1 text-[6px] py-1 rounded-sm transition-colors ${
              category === cat.value
                ? "bg-accent/20 text-accent border border-accent"
                : "bg-panel-light text-text-secondary border border-transparent hover:border-text-secondary/30"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {filtered.map((plant) => {
          const isSelected = selectedPlantId === plant.id;
          return (
            <button
              key={plant.id}
              onClick={() => onSelect(isSelected ? null : plant.id)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-sm
                transition-all duration-100 text-center
                ${isSelected
                  ? "bg-accent/20 border-2 border-accent shadow-md shadow-accent/20"
                  : "bg-panel-light border-2 border-transparent hover:border-text-secondary/30"
                }
              `}
            >
              <span className="text-xl">{plant.emoji}</span>
              <span className="text-[7px] text-text-primary leading-tight">
                {plant.name}
              </span>
              <span className="text-[6px] text-text-secondary">
                {plant.daysToMaturity}d
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-[7px] text-text-secondary text-center py-2">
            No plants found.
          </p>
        )}
      </div>
      {selectedPlantId && (
        <div className="mt-1 p-2 bg-panel-light rounded-sm border border-text-secondary/20">
          <PlantDetail plantId={selectedPlantId} />
        </div>
      )}
    </div>
  );
}

function PlantDetail({ plantId }: { plantId: string }) {
  const plant = plants.find((p) => p.id === plantId);
  if (!plant) return null;

  const spacingLabel =
    plant.spacingInches >= 24
      ? `${plant.spacingInches}" (${Math.ceil(plant.spacingInches / 12)} tiles)`
      : `${plant.spacingInches}"`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{plant.emoji}</span>
        <div>
          <div className="text-[9px] text-accent">{plant.name}</div>
          <div className="text-[7px] text-text-secondary capitalize">{plant.category}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[7px] mt-1">
        <span className="text-text-secondary">Maturity:</span>
        <span>{plant.daysToMaturity} days</span>
        <span className="text-text-secondary">Spacing:</span>
        <span>{spacingLabel}</span>
        <span className="text-text-secondary">Sun:</span>
        <span className="capitalize">{plant.sunRequirement}</span>
        <span className="text-text-secondary">Sow:</span>
        <span className="capitalize">{plant.sowType}</span>
      </div>
      {plant.companions.length > 0 && (
        <div className="text-[7px] mt-1">
          <span className="text-success">Friends: </span>
          <span className="text-text-secondary">{plant.companions.join(", ")}</span>
        </div>
      )}
      {plant.enemies.length > 0 && (
        <div className="text-[7px]">
          <span className="text-danger">Enemies: </span>
          <span className="text-text-secondary">{plant.enemies.join(", ")}</span>
        </div>
      )}
      <div className="text-[7px] text-text-secondary mt-1 italic">
        {plant.notes}
      </div>
    </div>
  );
}
