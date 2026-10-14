import type { Plugin } from '../core/context';

/**
 * Step funnel: one `step_change` event per `setStep()` with the time spent on
 * the previous step and whether the user went back to an earlier one.
 */
export const funnel = (): Plugin => (ctx) => {
  const order: string[] = [];
  const visits: Record<string, number> = {};
  let at = Date.now();

  const enter = (step: string | undefined): number => {
    if (!step) return 0;
    if (!visits[step]) order.push(step);
    return (visits[step] = (visits[step] || 0) + 1);
  };
  enter(ctx.state.step);

  ctx.onStep((to, from) => {
    const i = to ? order.indexOf(to) : -1;
    const back = i > -1 && !!from && i < order.indexOf(from);
    const now = Date.now();
    if (back) ctx.signal('step_back');
    ctx.emit('step_change', { from, to, durationMs: now - at, back, visits: enter(to) });
    at = now;
  });
};
