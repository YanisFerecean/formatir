import type { Plugin } from '../core/context';
import { fieldKey, isField, targetOf, type FieldElement } from '../core/dom';

const AUTOFILL = [':autofill', ':-webkit-autofill'];

/** Browser-filled right now? Unsupported pseudo-classes throw - skip those. */
function autofilled(el: FieldElement): boolean {
  for (const sel of AUTOFILL) {
    try {
      if (el.matches(sel)) return true;
    } catch {
      /* selector not supported */
    }
  }
  return false;
}

/**
 * Autofill: fields the browser filled in for the user. Explains fields with
 * a value but no effort. Fields filled in one go are reported as one event.
 */
export const autofill = (): Plugin => (ctx) => {
  const seen = new Set<string>();
  let burst: string[] = [];
  let keyAt = 0;

  ctx.on(document, 'keydown', () => (keyAt = Date.now()), true);

  ctx.on<InputEvent>(
    document,
    'input',
    (e) => {
      const el = targetOf(e);
      if (!isField(el) || !ctx.watches(el)) return;
      const replaced = e.inputType === 'insertReplacementText' && Date.now() - keyAt > 100;
      if (!replaced && !autofilled(el)) return;

      const key = fieldKey(el);
      if (seen.has(key)) return;
      seen.add(key);
      if (!burst.length) {
        ctx.timer(() => {
          ctx.emit('autofill', { count: burst.length, fields: burst });
          burst = [];
        }, 100);
      }
      burst.push(key);
    },
    true,
  );
};
