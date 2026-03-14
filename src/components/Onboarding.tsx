import { useState } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to Garden Planner",
    body: "Plan your real garden with a pixel art planner. Place plants, check companions, and track your season.",
    hint: "Your beds are already set up — let's get started!",
  },
  {
    title: "Place Plants",
    body: "Pick a plant from the palette on the left, then tap an empty tile in any bed to place it.",
    hint: "Right-click or tap a placed plant to inspect or remove it.",
  },
  {
    title: "Smart Feedback",
    body: "Green glow = good companion nearby. Red pulse = enemy nearby. Tap a placed plant to see exactly why.",
    hint: "Sun and zone warnings appear too.",
  },
  {
    title: "Season Timeline",
    body: "Scroll down to see your full season timeline — when to start seeds, transplant, and harvest.",
    hint: "The Alerts panel on the right shows what to do this week.",
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-panel border-2 border-accent/40 rounded-sm p-5 max-w-sm w-full shadow-xl">
        {/* Step indicator */}
        <div className="flex gap-1 mb-4 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === step ? "bg-accent" : "bg-text-secondary/30"
              }`}
            />
          ))}
        </div>

        <h2 className="text-[10px] text-accent mb-3 text-center">
          {current.title}
        </h2>

        <p className="text-[8px] text-text-primary mb-2 leading-relaxed text-center">
          {current.body}
        </p>

        <p className="text-[7px] text-text-secondary italic mb-4 text-center">
          {current.hint}
        </p>

        <div className="flex gap-2 justify-center">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 text-[7px] text-text-secondary border border-text-secondary/30 rounded-sm hover:border-text-secondary/60"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
            className="px-4 py-1.5 text-[7px] bg-accent/20 border border-accent/40 text-accent rounded-sm hover:bg-accent/30"
          >
            {isLast ? "Start Planning" : "Next"}
          </button>
        </div>

        {!isLast && (
          <button
            onClick={onComplete}
            className="block mx-auto mt-3 text-[6px] text-text-secondary hover:text-text-primary"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
