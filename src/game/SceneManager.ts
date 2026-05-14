import type { SceneId } from "./types";

export type TransitionState = "none" | "fading-out" | "fading-in";

const FADE_DURATION = 0.3; // seconds

export class SceneManager {
  scene: SceneId = "outdoor";
  fadeAlpha = 0;
  state: TransitionState = "none";
  private pendingScene: SceneId | null = null;
  private fadeTimer = 0;
  private onSceneChangeFn: ((scene: SceneId) => void) | null;

  constructor(onSceneChange?: (scene: SceneId) => void) {
    this.onSceneChangeFn = onSceneChange ?? null;
  }

  transitionTo(target: SceneId): void {
    if (this.state !== "none" || target === this.scene) return;
    this.pendingScene = target;
    this.state = "fading-out";
    this.fadeTimer = 0;
  }

  update(dt: number): void {
    if (this.state === "none") return;

    this.fadeTimer += dt;

    if (this.state === "fading-out") {
      this.fadeAlpha = Math.min(1, this.fadeTimer / FADE_DURATION);
      if (this.fadeAlpha >= 1) {
        this.scene = this.pendingScene!;
        this.pendingScene = null;
        this.state = "fading-in";
        this.fadeTimer = 0;
        this.onSceneChangeFn?.(this.scene);
      }
    } else if (this.state === "fading-in") {
      this.fadeAlpha = Math.max(0, 1 - this.fadeTimer / FADE_DURATION);
      if (this.fadeAlpha <= 0) {
        this.state = "none";
        this.fadeAlpha = 0;
      }
    }
  }

  drawFade(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.fadeAlpha <= 0) return;
    ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
    ctx.fillRect(0, 0, w, h);
  }

  get isTransitioning(): boolean {
    return this.state !== "none";
  }
}
