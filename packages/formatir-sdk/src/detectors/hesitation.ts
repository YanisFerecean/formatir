import type { Detector } from '../core/context';

/**
 * Hesitation: the gap between focusing a field and the first keystroke. A field
 * that is left without any input is reported as `abandoned`.
 */
export const hesitation: Detector = (ctx) => {
  const threshold = ctx.opts.thresholds.hesitationMs;

  const report = (ms: number, abandoned: boolean): void => {
    const focus = ctx.state.focus;
    if (!focus || ms < threshold) return;
    const stats = ctx.stats(focus.el);
    stats.hesitationMs = Math.max(stats.hesitationMs, ms);
    ctx.emit('hesitation', { ms, threshold, abandoned }, focus.ref);
  };

  // First keystroke after focus.
  ctx.on<Event>(
    document,
    'input',
    () => {
      const focus = ctx.state.focus;
      if (!focus || focus.typed) return;
      focus.typed = true;
      report(Date.now() - focus.at, false);
    },
    true,
  );

  // Left without typing at all.
  ctx.on<FocusEvent>(
    document,
    'focusout',
    () => {
      const focus = ctx.state.focus;
      if (!focus || focus.typed) return;
      report(Date.now() - focus.at, true);
    },
    true,
  );
};
