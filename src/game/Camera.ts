export class Camera {
  x = 0;
  y = 0;

  follow(
    targetX: number,
    targetY: number,
    viewW: number,
    viewH: number,
    worldW: number,
    worldH: number,
  ): void {
    const halfW = viewW / 2;
    const halfH = viewH / 2;
    this.x = Math.max(0, Math.min(targetX - halfW, worldW - viewW));
    this.y = Math.max(0, Math.min(targetY - halfH, worldH - viewH));
    // If world is smaller than viewport, center it
    if (worldW <= viewW) this.x = (worldW - viewW) / 2;
    if (worldH <= viewH) this.y = (worldH - viewH) / 2;
  }
}
