import { useState, useRef, useEffect } from "react";
import type { CharacterConfig } from "../types";
import { getCharacterSheet } from "../game/ProceduralSprites";
import { CHAR_WIDTH, CHAR_HEIGHT } from "../game/types";

interface Props {
  onComplete: (config: CharacterConfig) => void;
}

export function CharacterCreation({ onComplete }: Props) {
  const [gender, setGender] = useState<"male" | "female">("female");
  const [skinTone, setSkinTone] = useState<"light" | "dark">("light");
  const [name, setName] = useState("");
  const previewRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const frameRef = useRef(0);

  // Animate the character preview
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    let running = true;
    let lastTime = 0;
    let frameTimer = 0;
    let frame = 0;

    const draw = (time: number) => {
      if (!running) return;
      const dt = lastTime ? (time - lastTime) / 1000 : 0;
      lastTime = time;

      frameTimer += dt;
      if (frameTimer >= 0.2) {
        frameTimer = 0;
        frame = (frame + 1) % 4;
        frameRef.current = frame;
      }

      const sheet = getCharacterSheet(gender, skinTone);
      const scale = 3;
      canvas.width = CHAR_WIDTH * scale;
      canvas.height = CHAR_HEIGHT * scale;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw walking-down animation
      ctx.drawImage(
        sheet,
        frame * CHAR_WIDTH, 0, CHAR_WIDTH, CHAR_HEIGHT,
        0, 0, CHAR_WIDTH * scale, CHAR_HEIGHT * scale,
      );

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [gender, skinTone]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onComplete({ gender, skinTone, name: name.trim() });
  };

  return (
    <div className="fixed inset-0 bg-bg-dark flex items-center justify-center z-50">
      <div className="bg-panel border-2 border-accent p-6 max-w-md w-full mx-4"
        style={{ boxShadow: "0 0 40px rgba(255, 215, 0, 0.15)" }}>
        <h1 className="text-accent text-center text-sm mb-6">
          CREATE YOUR FARMER
        </h1>

        {/* Gender selection */}
        <div className="mb-4">
          <p className="text-[8px] text-text-secondary mb-2">Character:</p>
          <div className="flex gap-3">
            <button
              onClick={() => setGender("female")}
              className={`flex-1 p-2 border-2 text-[8px] ${
                gender === "female"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-text-secondary/30 text-text-secondary hover:border-text-primary"
              }`}
            >
              Female
            </button>
            <button
              onClick={() => setGender("male")}
              className={`flex-1 p-2 border-2 text-[8px] ${
                gender === "male"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-text-secondary/30 text-text-secondary hover:border-text-primary"
              }`}
            >
              Male
            </button>
          </div>
        </div>

        {/* Skin tone */}
        <div className="mb-4">
          <p className="text-[8px] text-text-secondary mb-2">Skin Tone:</p>
          <div className="flex gap-3">
            <button
              onClick={() => setSkinTone("light")}
              className={`flex-1 p-2 border-2 text-[8px] ${
                skinTone === "light"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-text-secondary/30 text-text-secondary hover:border-text-primary"
              }`}
            >
              <span className="inline-block w-3 h-3 mr-1" style={{ background: "#f5c4a1" }} />
              Light
            </button>
            <button
              onClick={() => setSkinTone("dark")}
              className={`flex-1 p-2 border-2 text-[8px] ${
                skinTone === "dark"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-text-secondary/30 text-text-secondary hover:border-text-primary"
              }`}
            >
              <span className="inline-block w-3 h-3 mr-1" style={{ background: "#8b6040" }} />
              Dark
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="flex justify-center my-6">
          <div className="bg-bg/50 border border-text-secondary/20 p-3">
            <canvas
              ref={previewRef}
              style={{ imageRendering: "pixelated" }}
            />
            <p className="text-[6px] text-text-secondary text-center mt-1">
              Live Preview
            </p>
          </div>
        </div>

        {/* Name input */}
        <div className="mb-6">
          <label className="block text-[8px] text-text-secondary mb-2">
            Farm Name:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your farm name..."
            className="settings-input"
            maxLength={24}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {/* Start button */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className={`w-full p-3 text-[9px] border-2 transition-colors ${
            name.trim()
              ? "border-accent text-accent hover:bg-accent/20 cursor-pointer"
              : "border-text-secondary/30 text-text-secondary/50 cursor-not-allowed"
          }`}
        >
          Start Your Farm
        </button>

        {/* Quick tips */}
        <div className="mt-5 pt-4 border-t border-text-secondary/20">
          <p className="text-[7px] text-accent mb-2">GETTING STARTED</p>
          <ul className="text-[7px] text-text-secondary space-y-1 leading-relaxed">
            <li>• Move with arrow keys or WASD</li>
            <li>• Build beds and a greenhouse from the bottom toolbar</li>
            <li>• Pick a plant on the left, click a bed tile to plant it</li>
            <li>• Right-click a plant to remove it; left-click to inspect</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
