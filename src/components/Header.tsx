import { useState } from "react";
import type { GardenState } from "../types";
import type { PlanMeta } from "../data/garden-config";

interface HeaderProps {
  garden: GardenState;
  onClearAll: () => void;
  onOpenSettings: () => void;
  plans: PlanMeta[];
  activePlanId: string;
  onSwitchPlan: (planId: string) => void;
  onAddPlan: (name: string) => void;
  onDeletePlan: (planId: string) => void;
}

export function Header({
  garden,
  onClearAll,
  onOpenSettings,
  plans,
  activePlanId,
  onSwitchPlan,
  onAddPlan,
  onDeletePlan,
}: HeaderProps) {
  const [showPlanMenu, setShowPlanMenu] = useState(false);
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

  function handleNewPlan() {
    const name = prompt("Plan name:");
    if (name?.trim()) {
      onAddPlan(name.trim());
    }
    setShowPlanMenu(false);
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
          {/* Plan switcher */}
          <div className="relative">
            <button
              onClick={() => setShowPlanMenu(!showPlanMenu)}
              className="text-[7px] text-text-primary bg-panel-light border border-text-secondary/30 px-2 py-1 rounded-sm hover:border-accent transition-colors flex items-center gap-1"
            >
              <span className="truncate max-w-[80px]">{garden.name}</span>
              <span className="text-[6px]">▼</span>
            </button>
            {showPlanMenu && (
              <div className="absolute right-0 top-full mt-1 bg-panel border border-text-secondary/30 rounded-sm shadow-xl z-40 min-w-[140px]">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`flex items-center justify-between px-2 py-1.5 text-[7px] hover:bg-panel-light cursor-pointer ${
                      plan.id === activePlanId ? "text-accent" : "text-text-primary"
                    }`}
                  >
                    <span
                      className="flex-1 truncate"
                      onClick={() => {
                        onSwitchPlan(plan.id);
                        setShowPlanMenu(false);
                      }}
                    >
                      {plan.name}
                      {plan.id === activePlanId ? " ●" : ""}
                    </span>
                    {plans.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${plan.name}"?`)) {
                            onDeletePlan(plan.id);
                          }
                        }}
                        className="text-danger/60 hover:text-danger ml-2 text-[8px]"
                        title="Delete plan"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                <div className="border-t border-text-secondary/20">
                  <button
                    onClick={handleNewPlan}
                    className="w-full text-left px-2 py-1.5 text-[7px] text-accent hover:bg-panel-light"
                  >
                    + New Plan
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onOpenSettings}
            className="text-[7px] text-text-secondary border border-text-secondary/30 px-2 py-1 rounded-sm hover:bg-panel-light hover:text-text-primary transition-colors"
          >
            Settings
          </button>
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
