import type { Direction } from "./types";

export class InputHandler {
  private keysDown = new Set<string>();
  private _clickPos: { x: number; y: number } | null = null;
  private _rightClickPos: { x: number; y: number } | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private onKeyDown = (e: KeyboardEvent) => {
    // Don't capture when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    this.keysDown.add(e.key);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.key);
  };
  private onClick = (e: MouseEvent) => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this._clickPos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };
  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this._rightClickPos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("click", this.onClick);
    canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener("click", this.onClick);
      this.canvas.removeEventListener("contextmenu", this.onContextMenu);
    }
    this.canvas = null;
  }

  getDirection(): Direction | null {
    if (this.keysDown.has("ArrowUp") || this.keysDown.has("w") || this.keysDown.has("W")) return "up";
    if (this.keysDown.has("ArrowDown") || this.keysDown.has("s") || this.keysDown.has("S")) return "down";
    if (this.keysDown.has("ArrowLeft") || this.keysDown.has("a") || this.keysDown.has("A")) return "left";
    if (this.keysDown.has("ArrowRight") || this.keysDown.has("d") || this.keysDown.has("D")) return "right";
    return null;
  }

  consumeClick(): { x: number; y: number } | null {
    const pos = this._clickPos;
    this._clickPos = null;
    return pos;
  }

  consumeRightClick(): { x: number; y: number } | null {
    const pos = this._rightClickPos;
    this._rightClickPos = null;
    return pos;
  }
}
