import type { Detector } from '../core/context';
import { isElement, isField, fieldRef, selectorOf } from '../core/dom';

interface Hit {
  x: number;
  y: number;
  t: number;
  el: Element;
}

/**
 * Rage click: >= N clicks within a short window, on the same element or within
 * a small radius. Fires as soon as the burst crosses the threshold, then resets
 * so one long burst produces one event per completed burst.
 */
export const rageClick: Detector = (ctx) => {
  const { rageClicks, rageWindowMs, rageRadiusPx } = ctx.opts.thresholds;
  let hits: Hit[] = [];

  ctx.on<MouseEvent>(
    document,
    'click',
    (e) => {
      const el = e.target;
      if (!isElement(el) || !ctx.watches(el)) return;

      const t = Date.now();
      const x = e.clientX;
      const y = e.clientY;
      hits = hits.filter((h) => t - h.t <= rageWindowMs);
      hits.push({ x, y, t, el });

      const burst = hits.filter(
        (h) => h.el === el || Math.hypot(h.x - x, h.y - y) <= rageRadiusPx,
      );
      if (burst.length < rageClicks) return;

      const first = burst[0]!;
      ctx.emit(
        'rage_click',
        {
          count: burst.length,
          withinMs: t - first.t,
          selector: selectorOf(el),
          x,
          y,
        },
        isField(el) ? fieldRef(el, ctx.state.step) : undefined,
      );
      hits = [];
    },
    true,
  );
};
