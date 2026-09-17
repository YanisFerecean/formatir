import type { Detector } from '../core/context';
import type { FieldStats } from '../types';
import { fieldRef, isField, valueLength } from '../core/dom';

/** Derive a non-PII reason from the browser's ValidityState. */
const VALIDITY: (keyof ValidityState)[] = [
  'valueMissing',
  'typeMismatch',
  'patternMismatch',
  'tooShort',
  'tooLong',
  'rangeUnderflow',
  'rangeOverflow',
  'stepMismatch',
  'badInput',
];

/**
 * Field effort: keystrokes, corrections (Backspace/Delete), refills (a field
 * emptied and filled again) and validation failures - per field, values never
 * read beyond their length.
 */
export const fieldEffort: Detector = (ctx) => {
  const emitEffort = (stats: FieldStats): void => {
    if (!stats.keystrokes && !stats.corrections && !stats.validationErrors) return;
    ctx.emit('field_effort', { ...stats }, { key: stats.key, type: stats.type });
  };

  ctx.on<FocusEvent>(
    document,
    'focusin',
    (e) => {
      const el = e.target as Element | null;
      if (!isField(el) || !ctx.watches(el)) return;
      const stats = ctx.stats(el);
      stats.focusCount++;
      const ref = fieldRef(el, ctx.state.step);
      ctx.state.focus = { el, ref, at: Date.now(), typed: false };
      ctx.state.lastField = ref;
      ctx.emit('field_focus', { focusCount: stats.focusCount }, ref);
    },
    true,
  );

  ctx.on<KeyboardEvent>(
    document,
    'keydown',
    (e) => {
      const el = e.target as Element | null;
      if (!isField(el) || !ctx.watches(el)) return;
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      ctx.stats(el).corrections++;
      ctx.signal('correction');
    },
    true,
  );

  const onValueChange = (e: Event): void => {
    const el = e.target as Element | null;
    if (!isField(el) || !ctx.watches(el)) return;
    const stats = ctx.stats(el);
    const len = valueLength(el);
    if (e.type === 'input') stats.keystrokes++;
    stats.changed = true;

    if (stats.length > 0 && len === 0) {
      ctx.state.emptied.add(stats.key);
    } else if (len > 0 && ctx.state.emptied.delete(stats.key)) {
      stats.refills++;
      ctx.signal('refill');
    }
    stats.length = len;
    ctx.state.lastField = { key: stats.key, type: stats.type, step: ctx.state.step };
  };

  ctx.on(document, 'input', onValueChange, true);
  ctx.on(document, 'change', onValueChange, true);

  // Native constraint validation (fires on submit and on checkValidity()).
  ctx.on<Event>(
    document,
    'invalid',
    (e) => {
      const el = e.target as Element | null;
      if (!isField(el) || !ctx.watches(el)) return;
      const stats = ctx.stats(el);
      stats.validationErrors++;
      const v = (el as HTMLInputElement).validity;
      const reason = VALIDITY.find((k) => v && v[k]) || 'invalid';
      ctx.emit('validation_error', { reason }, fieldRef(el, ctx.state.step));
    },
    true,
  );

  ctx.on<FocusEvent>(
    document,
    'focusout',
    (e) => {
      const el = e.target as Element | null;
      if (!isField(el) || !ctx.watches(el)) return;
      const stats = ctx.stats(el);
      const focus = ctx.state.focus;
      const dwell = focus && focus.el === el ? Date.now() - focus.at : 0;
      stats.timeFocusedMs += dwell;
      ctx.emit(
        'field_blur',
        { timeFocusedMs: dwell, length: stats.length, changed: stats.changed },
        fieldRef(el, ctx.state.step),
      );
      emitEffort(stats);
      ctx.state.focus = undefined;
    },
    true,
  );
};
