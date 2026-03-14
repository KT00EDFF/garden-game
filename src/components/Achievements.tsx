import {
  achievements,
  getTotalXP,
  getMaxXP,
  type UnlockedAchievement,
} from "../engine/achievements";

interface AchievementsProps {
  unlocked: UnlockedAchievement[];
  onClose: () => void;
}

export function Achievements({ unlocked, onClose }: AchievementsProps) {
  const unlockedIds = new Set(unlocked.map((u) => u.id));
  const totalXP = getTotalXP(unlocked);
  const maxXP = getMaxXP();
  const pct = Math.round((totalXP / maxXP) * 100);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border-2 border-accent/40 rounded-sm p-4 max-w-sm w-full shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] text-accent">Achievements</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-sm px-1"
          >
            x
          </button>
        </div>

        {/* XP bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[7px] text-text-secondary mb-1">
            <span>{totalXP} XP</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-panel-light rounded-full overflow-hidden border border-text-secondary/20">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[6px] text-text-secondary mt-1">
            {unlocked.length}/{achievements.length} unlocked
          </p>
        </div>

        {/* Achievement list */}
        <div className="flex flex-col gap-2">
          {achievements.map((ach) => {
            const isUnlocked = unlockedIds.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-2 p-2 rounded-sm border ${
                  isUnlocked
                    ? "bg-accent/10 border-accent/30"
                    : "bg-panel-light/50 border-text-secondary/10 opacity-50"
                }`}
              >
                <span className="text-lg w-7 text-center">
                  {isUnlocked ? ach.emoji : "?"}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[8px] font-bold ${
                      isUnlocked ? "text-accent" : "text-text-secondary"
                    }`}
                  >
                    {ach.name}
                  </p>
                  <p className="text-[6px] text-text-secondary">
                    {ach.description}
                  </p>
                </div>
                <span
                  className={`text-[7px] shrink-0 ${
                    isUnlocked ? "text-accent" : "text-text-secondary"
                  }`}
                >
                  {ach.xp} XP
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
