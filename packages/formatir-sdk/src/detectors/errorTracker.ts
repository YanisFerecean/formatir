import type { Detector } from '../core/context';
import { targetOf } from '../core/dom';
import { cut, redact, stripQuery } from '../core/util';

/** With `errorScope: 'root'`, errors this soon after an interaction in the root count. */
const RECENT_MS = 2000;
const INTERACTIONS = ['click', 'input', 'keydown', 'focusin', 'submit'];

/**
 * Uncaught client-side errors and unhandled promise rejections, tagged with the
 * field the user was last working on.
 */
export const errorTracker: Detector = (ctx) => {
  let reentrant = false;
  let touchedAt = -Infinity;

  const scoped = ctx.opts.errorScope === 'root';
  if (scoped) {
    // Capture phase on document runs before the page's own handlers, so an
    // error thrown by a submit or click handler already sees the interaction.
    for (const type of INTERACTIONS) {
      ctx.on(
        document,
        type,
        (e: Event) => {
          if (ctx.watches(targetOf(e))) touchedAt = Date.now();
        },
        true,
      );
    }
  }

  /** Is the user working in the root right now? */
  const inForm = (): boolean =>
    !scoped || Date.now() - touchedAt <= RECENT_MS || ctx.watches(document.activeElement);

  const report = (
    message: unknown,
    kind: 'error' | 'unhandledrejection',
    source?: string,
    line?: number,
    column?: number,
  ): void => {
    if (reentrant || !inForm()) return;
    reentrant = true;
    const scrub = ctx.opts.redactErrors;
    let text = cut(message, 300) || 'unknown error';
    if (scrub) {
      text = redact(text);
      if (source) source = stripQuery(source);
    }
    try {
      ctx.emit(
        'js_error',
        {
          message: text,
          source: source ? cut(source, 200) : undefined,
          line,
          column,
          kind,
        },
        ctx.state.lastField,
      );
    } finally {
      reentrant = false;
    }
  };

  ctx.on<ErrorEvent>(window, 'error', (e) => {
    // Resource load failures have no `message`; keep them out of the stream.
    if (!e.message) return;
    report(e.message, 'error', e.filename, e.lineno, e.colno);
  });

  ctx.on<PromiseRejectionEvent>(window, 'unhandledrejection', (e) => {
    const r = e.reason as { message?: string } | string | undefined;
    report(
      typeof r === 'object' && r && r.message ? r.message : r,
      'unhandledrejection',
    );
  });
};
