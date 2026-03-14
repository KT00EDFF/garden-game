import type { GardenState } from "../types";

interface HeaderProps {
  garden: GardenState;
  onClearAll: () => void;
}

export function Header({ garden, onClearAll }: HeaderProps) {
  const now = new Date();
  const lastFrost = new Date(garden.lastFrostDate);
  const firstFrost = new Date(garden.firstFrostDate);
  const daysToLastFrost = Math.ceil(
    (lastFrost.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysToFirstFrost = Math.ceil(
    (firstFrost.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  let seasonMessage = "";
  if (daysToLastFrost > 0) {
    seasonMessage = `${daysToLastFrost} days until last frost`;
  } else if (daysToFirstFrost > 0) {
    seasonMessage = `Growing season! ${daysToFirstFrost} days until first frost`;
  } else {
    seasonMessage = "Season's over — plan for next year!";
  }

  return (
    <header className="bg-panel border-b border-text-secondary/20 p-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <div>
            <h1 className="text-[12px] text-accent m-0 leading-tight">
              Garden Planner
            </h1>
            <p className="text-[7px] text-text-secondary m-0">
              Zone {garden.zone} — {seasonMessage}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearAll}
            className="text-[7px] text-danger bg-danger/10 border border-danger/30 px-2 py-1 rounded-sm hover:bg-danger/20 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </header>
  );
}
