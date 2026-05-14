import { CHAR_WIDTH, CHAR_HEIGHT, TILE_SIZE, type Direction, type CharacterState } from "./types";
import { getCharacterSheet } from "./ProceduralSprites";

const DIR_ROW: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };

export class CharacterRenderer {
  private sheet: HTMLCanvasElement | null = null;

  load(gender: "male" | "female", skinTone: "light" | "dark"): void {
    this.sheet = getCharacterSheet(gender, skinTone);
  }

  draw(ctx: CanvasRenderingContext2D, char: CharacterState): void {
    if (!this.sheet) return;

    const row = DIR_ROW[char.direction];
    const frame = char.animFrame % 4;
    const sx = frame * CHAR_WIDTH;
    const sy = row * CHAR_HEIGHT;

    // Character is drawn centered on tile, offset up since char is taller than a tile
    const dx = char.renderX;
    const dy = char.renderY - (CHAR_HEIGHT - TILE_SIZE);

    ctx.drawImage(
      this.sheet,
      sx, sy, CHAR_WIDTH, CHAR_HEIGHT,
      dx, dy, CHAR_WIDTH, CHAR_HEIGHT,
    );
  }
}
