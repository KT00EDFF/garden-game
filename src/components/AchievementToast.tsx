import { useEffect, useState } from "react";
import type { Achievement } from "../engine/achievements";

interface AchievementToastProps {
  achievement: Achievement;
  onDone: () => void;
}

export function AchievementToast({ achievement, onDone }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-panel border-2 border-accent rounded-sm px-4 py-2 shadow-xl flex items-center gap-3">
        <span className="text-xl">{achievement.emoji}</span>
        <div>
          <p className="text-[8px] text-accent font-bold">
            Achievement Unlocked!
          </p>
          <p className="text-[7px] text-text-primary">{achievement.name}</p>
          <p className="text-[6px] text-text-secondary">
            +{achievement.xp} XP
          </p>
        </div>
      </div>
    </div>
  );
}
