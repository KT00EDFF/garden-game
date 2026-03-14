import { useState } from "react";
import type { BedConfig, BedType, GardenState, SunRequirement } from "../types";

interface BedEditorProps {
  garden: GardenState;
  onAddBed: (name: string, type: BedType, width: number, height: number) => void;
  onRemoveBed: (bedId: string) => void;
  onUpdateBed: (bedId: string, updates: Partial<BedConfig>) => void;
  onReorderBeds: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
}

export function BedEditor({
  garden,
  onAddBed,
  onRemoveBed,
  onUpdateBed,
  onReorderBeds,
  onClose,
}: BedEditorProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleAdd() {
    if (garden.beds.length >= 20) return;
    const num = garden.beds.length + 1;
    onAddBed(`Raised Bed ${num}`, "raised", 4, 3);
  }

  function handleDelete(bed: BedConfig) {
    const plantCount = garden.plantings.filter((p) => p.bedId === bed.id).length;
    if (plantCount > 0 && confirmDelete !== bed.id) {
      setConfirmDelete(bed.id);
      return;
    }
    onRemoveBed(bed.id);
    setConfirmDelete(null);
  }

  const sunOptions: { val: SunRequirement; label: string; icon: string }[] = [
    { val: "full", label: "Full", icon: "☀️" },
    { val: "partial", label: "Part", icon: "⛅" },
    { val: "shade", label: "Shade", icon: "🌥️" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-panel border border-text-secondary/30 rounded-sm p-4 w-full max-w-lg mx-3 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] text-accent uppercase tracking-wider">
            Manage Beds ({garden.beds.length}/20)
          </h2>
          <button
            onClick={onClose}
            className="text-[10px] text-text-secondary hover:text-text-primary"
          >
            X
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
          {garden.beds.map((bed, index) => {
            const plantCount = garden.plantings.filter(
              (p) => p.bedId === bed.id
            ).length;
            const isConfirming = confirmDelete === bed.id;

            return (
              <div
                key={bed.id}
                className="bg-panel-light border border-text-secondary/20 rounded-sm p-2 flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => index > 0 && onReorderBeds(index, index - 1)}
                      disabled={index === 0}
                      className="text-[6px] text-text-secondary hover:text-text-primary disabled:opacity-30 leading-none"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() =>
                        index < garden.beds.length - 1 &&
                        onReorderBeds(index, index + 1)
                      }
                      disabled={index === garden.beds.length - 1}
                      className="text-[6px] text-text-secondary hover:text-text-primary disabled:opacity-30 leading-none"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Name input */}
                  <input
                    type="text"
                    value={bed.name}
                    onChange={(e) =>
                      onUpdateBed(bed.id, { name: e.target.value })
                    }
                    className="settings-input flex-1 min-w-0"
                    placeholder="Bed name"
                  />

                  {/* Type toggle */}
                  <button
                    onClick={() =>
                      onUpdateBed(bed.id, {
                        type: bed.type === "raised" ? "in-ground" : "raised",
                      })
                    }
                    className={`text-[6px] px-1.5 py-0.5 rounded-sm border whitespace-nowrap ${
                      bed.type === "raised"
                        ? "bg-accent/20 border-accent text-accent"
                        : "bg-success/20 border-success text-success"
                    }`}
                  >
                    {bed.type === "raised" ? "Raised" : "In-Ground"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(bed)}
                    className="text-[7px] text-danger/60 hover:text-danger ml-1"
                    title="Delete bed"
                  >
                    x
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Width */}
                  <label className="flex items-center gap-1">
                    <span className="text-[6px] text-text-secondary">W:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bed.widthFt}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(20, Number(e.target.value) || 1));
                        onUpdateBed(bed.id, { widthFt: v });
                      }}
                      className="settings-input w-10 text-center"
                    />
                  </label>

                  {/* Height */}
                  <label className="flex items-center gap-1">
                    <span className="text-[6px] text-text-secondary">H:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={bed.heightFt}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                        onUpdateBed(bed.id, { heightFt: v });
                      }}
                      className="settings-input w-10 text-center"
                    />
                  </label>

                  {/* Sun exposure */}
                  <div className="flex gap-0.5 ml-auto">
                    {sunOptions.map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() =>
                          onUpdateBed(bed.id, { sunExposure: opt.val })
                        }
                        className={`text-[6px] px-1.5 py-0.5 rounded-sm transition-colors ${
                          (bed.sunExposure || "full") === opt.val
                            ? "bg-accent/20 border border-accent text-accent"
                            : "bg-panel border border-transparent text-text-secondary hover:border-text-secondary/30"
                        }`}
                        title={opt.label}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>

                  {/* Tile count */}
                  <span className="text-[6px] text-text-secondary whitespace-nowrap">
                    {bed.widthFt}x{bed.heightFt} ({bed.widthFt * bed.heightFt} tiles)
                  </span>
                </div>

                {/* Delete confirmation */}
                {isConfirming && (
                  <div className="bg-danger/10 border border-danger/30 rounded-sm p-1.5 flex items-center justify-between">
                    <span className="text-[7px] text-danger">
                      This bed has {plantCount} plant{plantCount !== 1 ? "s" : ""}. Delete anyway?
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          onRemoveBed(bed.id);
                          setConfirmDelete(null);
                        }}
                        className="text-[6px] text-bg-dark bg-danger px-1.5 py-0.5 rounded-sm"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[6px] text-text-secondary border border-text-secondary/30 px-1.5 py-0.5 rounded-sm"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-text-secondary/20">
          <button
            onClick={handleAdd}
            disabled={garden.beds.length >= 20}
            className="text-[7px] text-accent border border-accent/30 px-3 py-1.5 rounded-sm hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Add Bed
          </button>
          <button
            onClick={onClose}
            className="text-[7px] text-bg-dark bg-accent px-3 py-1.5 rounded-sm hover:bg-accent/80 font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
