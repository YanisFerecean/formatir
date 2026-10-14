import type { Plugin } from '../core/context';
import { targetOf } from '../core/dom';

export interface ThrashOptions {
  /** Direction changes needed inside the window. Default 6. */
  reversals?: number;
  /** Window in ms. Default 1000. */
  windowMs?: number;
  /** Moves shorter than this (px) are jitter and ignored. Default 4. */
  minMovePx?: number;
}

/**
 * Mouse thrash: rapid back-and-forth pointer movement, a common sign of
 * confusion or impatience. One event per burst, then a 2 s cool-down.
 */
export const thrash =
  (options: ThrashOptions = {}): Plugin =>
  (ctx) => {
    const need = options.reversals || 6;
    const win = options.windowMs || 1000;
    const min = options.minMovePx || 4;
    let flips: number[] = [];
    let x = -1;
    let y = -1;
    let dx = 0;
    let dy = 0;
    let quietUntil = 0;

    const turn = (delta: number, dir: number, t: number): number => {
      if (Math.abs(delta) < min) return dir;
      const next = delta > 0 ? 1 : -1;
      if (dir && next !== dir) flips.push(t);
      return next;
    };

    ctx.on<MouseEvent>(
      document,
      'mousemove',
      (e) => {
        if (!ctx.watches(targetOf(e))) return;
        const t = Date.now();
        if (x >= 0) {
          dx = turn(e.clientX - x, dx, t);
          dy = turn(e.clientY - y, dy, t);
        }
        x = e.clientX;
        y = e.clientY;
        flips = flips.filter((f) => t - f <= win);
        if (flips.length < need || t < quietUntil) return;
        ctx.emit('thrash', { reversals: flips.length, withinMs: t - flips[0]! });
        flips = [];
        quietUntil = t + 2000;
      },
      true,
    );
  };
