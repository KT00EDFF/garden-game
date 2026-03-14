import type { GardenState } from "../types";
import { plantsById } from "../data/plants";
import { calculateSchedule, calculateSuccessionSchedules, formatDate } from "../engine/schedule";

interface SeasonTimelineProps {
  garden: GardenState;
}

export function SeasonTimeline({ garden }: SeasonTimelineProps) {
  // Get unique planted plant IDs
  const plantedIds = [...new Set(garden.plantings.map((p) => p.plantId))];

  if (plantedIds.length === 0) {
    return (
      <div className="p-3 bg-panel rounded-sm border border-text-secondary/20">
        <h2 className="text-[10px] text-accent uppercase tracking-wider mb-2">
          Season Timeline
        </h2>
        <p className="text-[8px] text-text-secondary">
          Place plants in your beds to see the timeline.
        </p>
      </div>
    );
  }

  // Timeline spans Jan 1 to Nov 30
  const year = new Date().getFullYear();
  const timelineStart = new Date(year, 0, 1);
  const timelineEnd = new Date(year, 10, 30);
  const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);

  const lastFrost = new Date(garden.lastFrostDate);
  const firstFrost = new Date(garden.firstFrostDate);

  function dateToPercent(date: Date): number {
    const days = (date.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  }

  // Month markers
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

  return (
    <div className="p-3 bg-panel rounded-sm border border-text-secondary/20">
      <h2 className="text-[10px] text-accent uppercase tracking-wider mb-3">
        Season Timeline
      </h2>

      {/* Month headers */}
      <div className="relative h-4 mb-1">
        {months.map((month, i) => (
          <span
            key={month}
            className="absolute text-[6px] text-text-secondary"
            style={{ left: `${(i / 11) * 100}%` }}
          >
            {month}
          </span>
        ))}
      </div>

      {/* Frost date markers */}
      <div className="relative h-2 bg-panel-light rounded-sm mb-2">
        {/* Growing season highlight */}
        <div
          className="absolute h-full bg-success/15 rounded-sm"
          style={{
            left: `${dateToPercent(lastFrost)}%`,
            width: `${dateToPercent(firstFrost) - dateToPercent(lastFrost)}%`,
          }}
        />
        {/* Last frost line */}
        <div
          className="absolute h-full w-[2px] bg-water"
          style={{ left: `${dateToPercent(lastFrost)}%` }}
          title={`Last frost: ${formatDate(lastFrost)}`}
        />
        {/* First frost line */}
        <div
          className="absolute h-full w-[2px] bg-danger"
          style={{ left: `${dateToPercent(firstFrost)}%` }}
          title={`First frost: ${formatDate(firstFrost)}`}
        />
        {/* Today marker */}
        <div
          className="absolute h-full w-[2px] bg-accent"
          style={{ left: `${dateToPercent(new Date())}%` }}
          title="Today"
        />
      </div>

      <div className="flex items-center gap-3 text-[6px] text-text-secondary mb-3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-water inline-block" /> Last frost
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-danger inline-block" /> First frost
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-accent inline-block" /> Today
        </span>
      </div>

      {/* Plant bars */}
      <div className="flex flex-col gap-1.5">
        {plantedIds.map((plantId) => {
          const plant = plantsById[plantId];
          if (!plant) return null;

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

          const count = garden.plantings.filter((p) => p.plantId === plantId).length;

          return (
            <div key={plantId} className="flex items-center gap-2">
              <div className="w-20 flex items-center gap-1 shrink-0">
                <span className="text-sm">{plant.emoji}</span>
                <span className="text-[7px] text-text-primary truncate">
                  {plant.name}
                </span>
                <span className="text-[6px] text-text-secondary">
                  x{count}
                  {succession ? ` (${schedules.length}s)` : ""}
                </span>
              </div>
              <div className="relative flex-1 h-3 bg-panel-light rounded-sm">
                {schedules.map(({ schedule, round }) => {
                  const opacity = round === 0 ? 1 : 0.5 + 0.5 / (round + 1);
                  return (
                    <div key={round} style={{ opacity }}>
                      {/* Start indoors bar */}
                      {schedule.startIndoors && schedule.transplant && (
                        <div
                          className="absolute h-full bg-water/60 rounded-sm"
                          style={{
                            left: `${dateToPercent(schedule.startIndoors)}%`,
                            width: `${Math.max(0.5, dateToPercent(schedule.transplant) - dateToPercent(schedule.startIndoors))}%`,
                          }}
                          title={`${round > 0 ? `Round ${round + 1}: ` : ""}Start indoors: ${formatDate(schedule.startIndoors)}`}
                        />
                      )}
                      {/* Growing bar */}
                      {(schedule.transplant || schedule.sowOutdoors) && schedule.harvestStart && (
                        <div
                          className="absolute h-full bg-success/60 rounded-sm"
                          style={{
                            left: `${dateToPercent((schedule.transplant || schedule.sowOutdoors)!)}%`,
                            width: `${Math.max(0.5, dateToPercent(schedule.harvestStart) - dateToPercent((schedule.transplant || schedule.sowOutdoors)!))}%`,
                          }}
                          title={`${round > 0 ? `Round ${round + 1}: ` : ""}Growing: ${formatDate((schedule.transplant || schedule.sowOutdoors)!)} - ${formatDate(schedule.harvestStart)}`}
                        />
                      )}
                      {/* Harvest bar */}
                      {schedule.harvestStart && schedule.harvestEnd && (
                        <div
                          className="absolute h-full bg-accent/60 rounded-sm"
                          style={{
                            left: `${dateToPercent(schedule.harvestStart)}%`,
                            width: `${Math.max(0.5, dateToPercent(schedule.harvestEnd) - dateToPercent(schedule.harvestStart))}%`,
                          }}
                          title={`${round > 0 ? `Round ${round + 1}: ` : ""}Harvest: ${formatDate(schedule.harvestStart)} - ${formatDate(schedule.harvestEnd)}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[6px] text-text-secondary mt-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-water/60 inline-block" /> Indoors
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-success/60 inline-block" /> Growing
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-accent/60 inline-block" /> Harvest
        </span>
      </div>
    </div>
  );
}
