import { useState } from "react";
import type { PlacedPlant, SunRequirement, SuccessionPlan } from "../types";
import { plantsById } from "../data/plants";
import {
  getCompanionDetails,
  checkZoneCompatibility,
  type CompanionDetail,
} from "../engine/planting-rules";

interface PlantCardProps {
  placed: PlacedPlant;
  plantings: PlacedPlant[];
  bedSun: SunRequirement;
  zone: string;
  succession?: SuccessionPlan;
  onRemove: () => void;
  onClose: () => void;
  onSetSuccession: (plantId: string, intervalWeeks: number, count: number) => void;
  onRemoveSuccession: (plantId: string) => void;
}

export function PlantCard({
  placed,
  plantings,
  bedSun,
  zone,
  succession,
  onRemove,
  onClose,
  onSetSuccession,
  onRemoveSuccession,
}: PlantCardProps) {
  const [showSuccession, setShowSuccession] = useState(false);
  const [intervalWeeks, setIntervalWeeks] = useState(succession?.intervalWeeks ?? 2);
  const [successionCount, setSuccessionCount] = useState(succession?.count ?? 3);
  const plant = plantsById[placed.plantId];
  if (!plant) return null;

  const companions = getCompanionDetails(
    placed.plantId,
    placed.bedId,
    placed.tileX,
    placed.tileY,
    plantings
  );
  const goodNeighbors = companions.filter((c) => c.status === "good");
  const badNeighbors = companions.filter((c) => c.status === "bad");

  const sunMismatch =
    plant.sunRequirement === "full" && (bedSun === "shade" || bedSun === "partial");

  const zoneStatus = checkZoneCompatibility(placed.plantId, zone);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border-2 border-text-secondary/40 rounded-sm p-4 max-w-xs w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 flex items-center justify-center rounded-sm text-xl"
              style={{ backgroundColor: plant.color }}
            >
              {plant.emoji}
            </span>
            <div>
              <h3 className="text-[11px] text-text font-bold">{plant.name}</h3>
              <span className="text-[7px] text-text-secondary capitalize">
                {plant.category} &middot; {plant.sowType}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text text-sm px-1"
          >
            x
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-[7px] text-text-secondary">
          <div>
            <span className="block text-text text-[8px]">{plant.daysToMaturity}d</span>
            maturity
          </div>
          <div>
            <span className="block text-text text-[8px]">{plant.spacingInches}"</span>
            spacing
          </div>
          <div>
            <span className="block text-text text-[8px] capitalize">{plant.sunRequirement}</span>
            sun
          </div>
        </div>

        {/* Warnings */}
        {(badNeighbors.length > 0 || sunMismatch || zoneStatus !== "ok") && (
          <div className="flex flex-col gap-1 mb-3">
            {badNeighbors.length > 0 && (
              <Warning
                color="red"
                text={`Conflicts with nearby: ${formatNeighborNames(badNeighbors)}`}
              />
            )}
            {sunMismatch && (
              <Warning
                color="orange"
                text={`Needs full sun but this bed is ${bedSun}`}
              />
            )}
            {zoneStatus === "marginal" && (
              <Warning
                color="orange"
                text={`Marginal for zone ${zone} (hardiness ${plant.hardinessZones[0]}-${plant.hardinessZones[1]})`}
              />
            )}
            {zoneStatus === "incompatible" && (
              <Warning
                color="red"
                text={`Not suited for zone ${zone} (needs zones ${plant.hardinessZones[0]}-${plant.hardinessZones[1]})`}
              />
            )}
          </div>
        )}

        {/* Good companions nearby */}
        {goodNeighbors.length > 0 && (
          <div className="mb-3 p-2 bg-success/10 border border-success/30 rounded-sm text-[7px]">
            <span className="text-success">Good neighbors:</span>{" "}
            <span className="text-text">{formatNeighborNames(goodNeighbors)}</span>
          </div>
        )}

        {/* Known companions & enemies */}
        <div className="mb-3 text-[7px] text-text-secondary">
          {plant.companions.length > 0 && (
            <p>
              <span className="text-success">Friends:</span>{" "}
              {plant.companions.join(", ")}
            </p>
          )}
          {plant.enemies.length > 0 && (
            <p>
              <span className="text-danger">Enemies:</span>{" "}
              {plant.enemies.join(", ")}
            </p>
          )}
        </div>

        {/* Notes */}
        <p className="text-[7px] text-text-secondary italic mb-3">{plant.notes}</p>

        {/* Succession planting */}
        <div className="mb-3 border border-text-secondary/20 rounded-sm p-2">
          <button
            onClick={() => setShowSuccession(!showSuccession)}
            className="w-full flex items-center justify-between text-[7px] text-text-primary"
          >
            <span>Succession Planting</span>
            <span className="text-[6px] text-text-secondary">
              {succession
                ? `Every ${succession.intervalWeeks}wk x${succession.count}`
                : "Off"}
            </span>
          </button>
          {showSuccession && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[7px]">
                <label className="text-text-secondary">Every</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={intervalWeeks}
                  onChange={(e) => setIntervalWeeks(Number(e.target.value))}
                  className="settings-input w-12 text-center"
                />
                <label className="text-text-secondary">weeks</label>
                <label className="text-text-secondary ml-1">x</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={successionCount}
                  onChange={(e) => setSuccessionCount(Number(e.target.value))}
                  className="settings-input w-12 text-center"
                />
                <label className="text-text-secondary">rounds</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSetSuccession(placed.plantId, intervalWeeks, successionCount);
                    setShowSuccession(false);
                  }}
                  className="flex-1 py-1 bg-success/20 border border-success/40 rounded-sm text-[7px] text-success hover:bg-success/30"
                >
                  {succession ? "Update" : "Enable"}
                </button>
                {succession && (
                  <button
                    onClick={() => {
                      onRemoveSuccession(placed.plantId);
                      setShowSuccession(false);
                    }}
                    className="py-1 px-2 bg-danger/20 border border-danger/40 rounded-sm text-[7px] text-danger hover:bg-danger/30"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="w-full py-1.5 bg-danger/20 border border-danger/40 rounded-sm text-[8px] text-danger hover:bg-danger/30 transition-colors"
        >
          Remove from bed
        </button>
      </div>
    </div>
  );
}

function Warning({ color, text }: { color: "red" | "orange"; text: string }) {
  const classes =
    color === "red"
      ? "bg-danger/10 border-danger/30 text-danger"
      : "bg-accent/10 border-accent/30 text-accent";
  return (
    <div className={`p-1.5 border rounded-sm text-[7px] ${classes}`}>
      {text}
    </div>
  );
}

function formatNeighborNames(neighbors: CompanionDetail[]): string {
  const names = [...new Set(neighbors.map((n) => n.neighborName))];
  return names.join(", ");
}
