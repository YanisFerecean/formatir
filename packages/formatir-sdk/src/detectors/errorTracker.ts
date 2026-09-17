import type { Detector } from '../core/context';
import { cut } from '../core/util';

/**
 * Uncaught client-side errors and unhandled promise rejections, tagged with the
 * field the user was last working on.
 */
export const errorTracker: Detector = (ctx) => {
  let reentrant = false;

  const report = (
    message: unknown,
    kind: 'error' | 'unhandledrejection',
    source?: string,
    line?: number,
    column?: number,
  ): void => {
    if (reentrant) return;
    reentrant = true;
    try {
      ctx.emit(
        'js_error',
        {
          message: cut(message, 300) || 'unknown error',
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
