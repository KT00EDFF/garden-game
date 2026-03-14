import { useState } from "react";
import type { GardenState, SunRequirement } from "../types";

interface SettingsProps {
  garden: GardenState;
  onUpdate: (updates: Partial<GardenState>) => void;
  onClose: () => void;
}

export function Settings({ garden, onUpdate, onClose }: SettingsProps) {
  const [name, setName] = useState(garden.name);
  const [zone, setZone] = useState(garden.zone);
  const [zipCode, setZipCode] = useState(garden.zipCode);
  const [lastFrostDate, setLastFrostDate] = useState(garden.lastFrostDate);
  const [firstFrostDate, setFirstFrostDate] = useState(garden.firstFrostDate);

  function handleSave() {
    onUpdate({ name, zone, zipCode, lastFrostDate, firstFrostDate });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-panel border border-text-secondary/30 rounded-sm p-4 w-full max-w-sm mx-3 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] text-accent uppercase tracking-wider">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-[10px] text-text-secondary hover:text-text-primary"
          >
            X
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Garden Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="settings-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Zone">
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="6a"
                className="settings-input"
              />
            </Field>
            <Field label="Zip Code">
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="60068"
                className="settings-input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Last Frost">
              <input
                type="date"
                value={lastFrostDate}
                onChange={(e) => setLastFrostDate(e.target.value)}
                className="settings-input"
              />
            </Field>
            <Field label="First Frost">
              <input
                type="date"
                value={firstFrostDate}
                onChange={(e) => setFirstFrostDate(e.target.value)}
                className="settings-input"
              />
            </Field>
          </div>

          {/* Bed sun exposure */}
          <div className="border-t border-text-secondary/20 pt-3">
            <h3 className="text-[8px] text-accent uppercase tracking-wider mb-2">
              Bed Sun Exposure
            </h3>
            <div className="flex flex-col gap-1.5">
              {garden.beds.map((bed) => (
                <div key={bed.id} className="flex items-center justify-between">
                  <span className="text-[7px] text-text-primary">{bed.name}</span>
                  <SunSelect
                    value={bed.sunExposure || "full"}
                    onChange={(val) => {
                      const updatedBeds = garden.beds.map((b) =>
                        b.id === bed.id ? { ...b, sunExposure: val } : b
                      );
                      onUpdate({ beds: updatedBeds });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="text-[7px] text-text-secondary border border-text-secondary/30 px-3 py-1.5 rounded-sm hover:bg-panel-light"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-[7px] text-bg-dark bg-accent px-3 py-1.5 rounded-sm hover:bg-accent/80 font-bold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[7px] text-text-secondary uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}

function SunSelect({
  value,
  onChange,
}: {
  value: SunRequirement;
  onChange: (val: SunRequirement) => void;
}) {
  const options: { val: SunRequirement; label: string; icon: string }[] = [
    { val: "full", label: "Full", icon: "☀️" },
    { val: "partial", label: "Part", icon: "⛅" },
    { val: "shade", label: "Shade", icon: "🌥️" },
  ];

  return (
    <div className="flex gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.val}
          onClick={() => onChange(opt.val)}
          className={`text-[6px] px-1.5 py-0.5 rounded-sm transition-colors ${
            value === opt.val
              ? "bg-accent/20 border border-accent text-accent"
              : "bg-panel-light border border-transparent text-text-secondary hover:border-text-secondary/30"
          }`}
          title={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
