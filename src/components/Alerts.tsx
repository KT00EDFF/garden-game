import type { GardenState } from "../types";
import { plantsById } from "../data/plants";
import { calculateSchedule, calculateSuccessionSchedules, formatDate } from "../engine/schedule";

interface AlertsProps {
  garden: GardenState;
  frostWarning?: boolean;
}

interface Action {
  emoji: string;
  plantName: string;
  action: string;
  date: Date;
  urgency: "now" | "soon" | "upcoming";
}

export function Alerts({ garden, frostWarning }: AlertsProps) {
  const plantedIds = [...new Set(garden.plantings.map((p) => p.plantId))];
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const fourWeeks = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

  const actions: Action[] = [];

  for (const plantId of plantedIds) {
    const plant = plantsById[plantId];
    if (!plant) continue;

    const succession = (garden.successions || []).find(
      (s) => s.plantId === plantId
    );

    const schedules = succession
      ? calculateSuccessionSchedules(
          plant,
          garden.lastFrostDate,
          garden.firstFrostDate,
          succession.intervalWeeks,
          succession.count
        )
      : [{ schedule: calculateSchedule(plant, garden.lastFrostDate, garden.firstFrostDate), round: 0 }];

    for (const { schedule, round } of schedules) {
      const roundLabel = round > 0 ? ` (round ${round + 1})` : "";
      const checks: { date: Date | null; action: string }[] = [
        { date: schedule.startIndoors, action: `Start seeds indoors${roundLabel}` },
        { date: schedule.sowOutdoors, action: `Direct sow outdoors${roundLabel}` },
        { date: schedule.transplant, action: `Transplant outdoors${roundLabel}` },
        { date: schedule.harvestStart, action: `Begin harvesting${roundLabel}` },
      ];

      for (const check of checks) {
        if (!check.date) continue;

        let urgency: Action["urgency"] | null = null;
        if (check.date <= now) {
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          if (check.date >= twoWeeksAgo) urgency = "now";
        } else if (check.date <= twoWeeks) {
          urgency = "now";
        } else if (check.date <= fourWeeks) {
          urgency = "soon";
        } else {
          const eightWeeks = new Date(now.getTime() + 56 * 24 * 60 * 60 * 1000);
          if (check.date <= eightWeeks) urgency = "upcoming";
        }

        if (urgency) {
          actions.push({
            emoji: plant.emoji,
            plantName: plant.name,
            action: check.action,
            date: check.date,
            urgency,
          });
        }
      }
    }
  }

  // Sort: now first, then soon, then upcoming, within each group by date
  actions.sort((a, b) => {
    const urgencyOrder = { now: 0, soon: 1, upcoming: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.date.getTime() - b.date.getTime();
  });

  // Frost warning for frost-sensitive plants
  const frostSensitiveIds = ["cherry_tomato", "hot_pepper", "melon", "sweet_potato"];
  const frostPlants = frostWarning
    ? [...new Set(garden.plantings.map((p) => p.plantId))]
        .filter((id) => frostSensitiveIds.includes(id))
        .map((id) => plantsById[id]?.name)
        .filter(Boolean)
    : [];

  if (frostWarning && frostPlants.length > 0) {
    actions.unshift({
      emoji: "\u2744\uFE0F",
      plantName: "Frost Alert",
      action: `FROST WARNING — protect ${frostPlants.join(", ")}`,
      date: new Date(),
      urgency: "now",
    });
  }

  if (actions.length === 0) {
    return (
      <div className="p-3 bg-panel rounded-sm border border-text-secondary/20">
        <h2 className="text-[10px] text-accent uppercase tracking-wider mb-2">
          Action Items
        </h2>
        <p className="text-[8px] text-text-secondary">
          {plantedIds.length === 0
            ? "Place plants to see what needs doing."
            : "Nothing coming up in the next 8 weeks."}
        </p>
      </div>
    );
  }

  const urgencyStyles = {
    now: "border-l-danger bg-danger/10",
    soon: "border-l-accent bg-accent/10",
    upcoming: "border-l-text-secondary bg-panel-light",
  };

  const urgencyLabels = {
    now: "NOW",
    soon: "SOON",
    upcoming: "LATER",
  };

  return (
    <div className="p-3 bg-panel rounded-sm border border-text-secondary/20">
      <h2 className="text-[10px] text-accent uppercase tracking-wider mb-2">
        Action Items
      </h2>
      <div className="flex flex-col gap-1">
        {actions.map((action, i) => (
          <div
            key={`${action.plantName}-${action.action}-${i}`}
            className={`flex items-center gap-2 p-1.5 border-l-2 rounded-r-sm ${urgencyStyles[action.urgency]}`}
          >
            <span className="text-sm">{action.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] text-text-primary">
                {action.action}: <span className="text-accent">{action.plantName}</span>
              </div>
              <div className="text-[7px] text-text-secondary">
                {formatDate(action.date)}
              </div>
            </div>
            <span
              className={`text-[6px] font-bold px-1 py-0.5 rounded-sm ${
                action.urgency === "now"
                  ? "text-danger bg-danger/20"
                  : action.urgency === "soon"
                  ? "text-accent bg-accent/20"
                  : "text-text-secondary bg-panel"
              }`}
            >
              {urgencyLabels[action.urgency]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
