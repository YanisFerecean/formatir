import type { Detector } from '../core/context';
import type { MetricPayloads } from '../types';
import { fieldsIn, valueLength } from '../core/dom';

export const formIdOf = (el: Element | null, fallback = 'form'): string =>
  (el &&
    (el.getAttribute('data-formatir-form') ||
      el.id ||
      el.getAttribute('name'))) ||
  fallback;

/** Field counts for the form - lengths and validity flags only, never values. */
export function formProgress(root: ParentNode): {
  fields: number;
  filled: number;
  valid: boolean;
} {
  const fields = fieldsIn(root);
  let filled = 0;
  let valid = true;
  for (const f of fields) {
    if (valueLength(f) > 0) filled++;
    // Reading `validity` does not fire `invalid` events - `checkValidity()` would.
    if (f.validity && !f.validity.valid) valid = false;
  }
  return { fields: fields.length, filled, valid };
}

/**
 * Drop-off: the session ends (page hidden or unloaded) without a submit. The
 * last touched field is reported as the abandonment anchor.
 */
export const dropOff: Detector = (ctx) => {
  const report = (reason: MetricPayloads['form_dropoff']['reason']): void => {
    const state = ctx.state;
    if (state.submitted || state.dropped || !state.lastField) return;
    state.dropped = true;
    const { fields, filled } = formProgress(ctx.root);
    ctx.emit('form_dropoff', {
      formId: formIdOf(ctx.root instanceof Element ? ctx.root : document.querySelector('form')),
      lastField: state.lastField,
      durationMs: Date.now() - state.startedAt,
      fields,
      filled,
      progress: fields ? filled / fields : 0,
      reason,
    });
  };

  ctx.on<SubmitEvent>(
    document,
    'submit',
    (e) => {
      const form = e.target as Element | null;
      if (!form || !ctx.watches(form)) return;
      const { fields, filled, valid } = formProgress(form as ParentNode);
      // A `noValidate` form submits even when it is invalid - such an attempt is
      // recorded, but it must not count as a completed session.
      ctx.state.submitted = valid;
      ctx.emit('form_submit', {
        formId: formIdOf(form),
        durationMs: Date.now() - ctx.state.startedAt,
        fields,
        filled,
        valid,
      });
    },
    true,
  );

  ctx.on(window, 'pagehide', () => report('pagehide'));
  ctx.on(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') report('hidden');
  });

  // Exposed through `formatir.reportDropoff()` for SPA route changes.
  ctx.hooks.dropoff = () => report('manual');
};
