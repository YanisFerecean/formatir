import type { Detector } from '../core/context';
import { isElement, isInteractive, selectorOf, targetOf } from '../core/dom';

/**
 * Attribute changes a user can actually perceive. Frameworks rewrite structural
 * attributes (`name`, `type`, `id`, ...) on every re-render - counting those as
 * a page reaction would silently disable this detector in any SPA.
 */
const REACTIVE_ATTR = /^(class|style|hidden|disabled|open|checked|value|src|href|aria-)/;

/**
 * Dead click: a click on a static element that produced no observable reaction
 * - no meaningful DOM mutation, no navigation, no focus change, no text
 * selection - within the grace period.
 */
export const deadClick: Detector = (ctx) => {
  const wait = ctx.opts.thresholds.deadClickMs;
  let mutatedAt = 0;

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const node = record.target;
      const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
      // Churn outside the observed root or inside an opted-out subtree (a
      // telemetry panel, a chat widget) is not a reaction to the click.
      if (!el || !ctx.watches(el)) continue;
      if (record.type === 'attributes' && !REACTIVE_ATTR.test(record.attributeName || '')) {
        continue;
      }
      mutatedAt = Date.now();
      return;
    }
  });
  const watch = (node: Node): void =>
    observer.observe(node, { subtree: true, childList: true, attributes: true, characterData: true });
  // Shadow roots are observed lazily, the first time a click lands inside one.
  const shadows = new WeakSet<Node>();
  watch(document.documentElement);
  ctx.cleanup(() => observer.disconnect());

  ctx.on<MouseEvent>(
    document,
    'click',
    (e) => {
      const el = targetOf(e);
      if (!isElement(el) || !ctx.watches(el) || isInteractive(el)) return;
      if (e.detail > 1) return; // part of a double click / selection gesture
      const shadow = el.getRootNode();
      if (shadow !== document && !shadows.has(shadow)) {
        shadows.add(shadow);
        watch(shadow);
      }

      const at = Date.now();
      const url = location.href;
      const active = document.activeElement;
      const x = e.clientX;
      const y = e.clientY;

      ctx.timer(() => {
        if (mutatedAt > at) return; // the page reacted
        if (location.href !== url) return; // navigation happened
        if (document.activeElement !== active) return; // focus moved
        if (getSelection()?.toString()) return; // user was selecting text
        ctx.emit('dead_click', { selector: selectorOf(el), x, y, waitedMs: wait });
      }, wait);
    },
    true,
  );
};
