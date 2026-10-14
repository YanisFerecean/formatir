import type { Plugin } from '../core/context';
import { fieldRef, isField, targetOf, valueLength } from '../core/dom';

/**
 * Paste: how often a field receives pasted content and whether the page blocks
 * pasting (a classic frustration source for IBAN or e-mail confirmation
 * fields). The clipboard is never read - only the change in value length.
 */
export const paste = (): Plugin => (ctx) => {
  const counts: Record<string, number> = {};

  ctx.on<ClipboardEvent>(
    document,
    'paste',
    (e) => {
      const el = targetOf(e);
      if (!isField(el) || !ctx.watches(el)) return;
      const ref = fieldRef(el, ctx.state.step);
      const before = valueLength(el);
      const pastes = (counts[ref.key] = (counts[ref.key] || 0) + 1);

      // Page handlers run after this capture listener; judge once they are done.
      ctx.timer(() => {
        const blocked = e.defaultPrevented;
        if (blocked) ctx.signal('paste_blocked');
        ctx.emit('paste', { pastes, delta: valueLength(el) - before, blocked }, ref);
      }, 0);
    },
    true,
  );
};
