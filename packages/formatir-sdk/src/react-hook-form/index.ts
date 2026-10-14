/**
 * React Hook Form adapter - reports RHF validation errors as
 * `validation_error` events. Only the error `type` (`required`, `pattern`,
 * ...) is sent, never the message.
 *
 * ```tsx
 * import { formatirOnInvalid } from 'formatir/react-hook-form';
 *
 * <form onSubmit={handleSubmit(onValid, formatirOnInvalid(formatir))}>
 * ```
 */
import type { FormatirInstance } from 'formatir';

/** Structural view of RHF's `FieldErrors` - no dependency on the library. */
export type FieldErrorsLike = { [name: string]: unknown };

type Target = FormatirInstance | null | undefined;

const META = new Set(['type', 'message', 'ref', 'types']);

/** `[fieldPath, errorType]` pairs; nested objects and field arrays use RHF's dot paths. */
export function flattenErrors(errors: FieldErrorsLike, prefix = ''): [string, string][] {
  const out: [string, string][] = [];
  for (const key of Object.keys(errors)) {
    const value = errors[key];
    if (!value || typeof value !== 'object') continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const { type } = value as { type?: unknown };
    if (typeof type === 'string') out.push([path, type]);
    // Field arrays and nested objects carry their children as plain keys.
    const children: FieldErrorsLike = {};
    for (const child of Object.keys(value)) {
      if (!META.has(child)) children[child] = (value as FieldErrorsLike)[child];
    }
    out.push(...flattenErrors(children, path));
  }
  return out;
}

/** Report every error once. Returns the number of reported errors. */
export function reportErrors(formatir: Target, errors: FieldErrorsLike): number {
  const list = flattenErrors(errors);
  for (const [path, type] of list) formatir?.reportValidationError(path, type);
  return list.length;
}

/**
 * Build an `onInvalid` handler for `handleSubmit(onValid, onInvalid)`; an
 * existing handler can be chained.
 */
export function formatirOnInvalid<E extends FieldErrorsLike, Ev>(
  formatir: Target,
  next?: (errors: E, event?: Ev) => unknown,
): (errors: E, event?: Ev) => unknown {
  return (errors, event) => {
    reportErrors(formatir, errors);
    return next?.(errors, event);
  };
}

/**
 * Stateful reporter for `mode: 'onBlur' | 'onChange'`: call it with
 * `formState.errors` whenever they change; an error is reported when it
 * appears or its type changes, not on every render.
 *
 * ```tsx
 * const report = useMemo(() => createErrorReporter(formatir), [formatir]);
 * useEffect(() => report(errors), [report, errors, submitCount]);
 * ```
 */
export function createErrorReporter(formatir: Target): (errors: FieldErrorsLike) => void {
  let previous = new Map<string, string>();
  return (errors) => {
    const current = new Map(flattenErrors(errors));
    current.forEach((type, path) => {
      if (previous.get(path) !== type) formatir?.reportValidationError(path, type);
    });
    previous = current;
  };
}
