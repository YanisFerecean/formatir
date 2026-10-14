import type { Plugin } from '../core/context';
import { fieldKey, fieldRef, isField, targetOf } from '../core/dom';

/**
 * Field revisit: the user comes back to a field after having moved on to
 * another one - typically to fix it after an error further down the form.
 */
export const revisits = (): Plugin => (ctx) => {
  const left = new Set<string>();
  let last: string | undefined;

  ctx.on<FocusEvent>(
    document,
    'focusin',
    (e) => {
      const el = targetOf(e);
      if (!isField(el) || !ctx.watches(el)) return;
      const key = fieldKey(el);
      if (key !== last && left.has(key)) {
        const stats = ctx.stats(el);
        ctx.emit(
          'field_revisit',
          { visits: stats.focusCount, length: stats.length, changed: stats.changed },
          fieldRef(el, ctx.state.step),
        );
      }
      last = key;
    },
    true,
  );

  ctx.on<FocusEvent>(
    document,
    'focusout',
    (e) => {
      const el = targetOf(e);
      if (isField(el) && ctx.watches(el)) left.add(fieldKey(el));
    },
    true,
  );
};
