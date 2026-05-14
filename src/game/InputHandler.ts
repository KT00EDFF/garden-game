import type { Direction } from "./types";

/** Touch is treated as a long-press right-click once this threshold is reached. */
const LONG_PRESS_MS = 500;
/** Movement greater than this many CSS pixels turns a touch into a drag (not a tap). */
const TAP_MOVE_THRESHOLD_PX = 16;

export class InputHandler {
  private keysDown = new Set<string>();
  private _clickPos: { x: number; y: number } | null = null;
  private _rightClickPos: { x: number; y: number } | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private touchStart: { x: number; y: number; clientX: number; clientY: number; t: number } | null = null;
  private longPressTimer: number | null = null;
  private longPressFired = false;

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
    this._clickPos = this.canvasPos(e.clientX, e.clientY);
  };
  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (!this.canvas) return;
    this._rightClickPos = this.canvasPos(e.clientX, e.clientY);
  };

  private canvasPos(clientX: number, clientY: number): { x: number; y: number } | null {
    if (!this.canvas) return null;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const pos = this.canvasPos(t.clientX, t.clientY);
    if (!pos) return;
    this.touchStart = { x: pos.x, y: pos.y, clientX: t.clientX, clientY: t.clientY, t: performance.now() };
    this.longPressFired = false;
    this.clearLongPressTimer();
    this.longPressTimer = window.setTimeout(() => {
      if (!this.touchStart) return;
      this._rightClickPos = { x: this.touchStart.x, y: this.touchStart.y };
      this.longPressFired = true;
    }, LONG_PRESS_MS);
    // Don't preventDefault here — let click events still fire on bed tiles
    // so the system click handler (used for plant-card popups) works too.
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.touchStart || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - this.touchStart.clientX;
    const dy = t.clientY - this.touchStart.clientY;
    if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD_PX) {
      // Treat as drag — cancel pending tap/long-press
      this.touchStart = null;
      this.clearLongPressTimer();
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    this.clearLongPressTimer();
    if (!this.touchStart) return;
    const duration = performance.now() - this.touchStart.t;
    const wasLongPress = this.longPressFired;
    const pos = { x: this.touchStart.x, y: this.touchStart.y };
    this.touchStart = null;
    this.longPressFired = false;
    // Short tap → click. Long press was already dispatched as right-click via the timer.
    if (!wasLongPress && duration < LONG_PRESS_MS) {
      this._clickPos = pos;
      // Suppress the synthetic mouse "click" that some browsers fire after touchend
      // to avoid duplicate handling.
      e.preventDefault();
    }
  };

  private onTouchCancel = () => {
    this.clearLongPressTimer();
    this.touchStart = null;
    this.longPressFired = false;
  };

  private clearLongPressTimer(): void {
    if (this.longPressTimer != null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("click", this.onClick);
    canvas.addEventListener("contextmenu", this.onContextMenu);
    canvas.addEventListener("touchstart", this.onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", this.onTouchMove, { passive: true });
    canvas.addEventListener("touchend", this.onTouchEnd);
    canvas.addEventListener("touchcancel", this.onTouchCancel);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.clearLongPressTimer();
    if (this.canvas) {
      this.canvas.removeEventListener("click", this.onClick);
      this.canvas.removeEventListener("contextmenu", this.onContextMenu);
      this.canvas.removeEventListener("touchstart", this.onTouchStart);
      this.canvas.removeEventListener("touchmove", this.onTouchMove);
      this.canvas.removeEventListener("touchend", this.onTouchEnd);
      this.canvas.removeEventListener("touchcancel", this.onTouchCancel);
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
