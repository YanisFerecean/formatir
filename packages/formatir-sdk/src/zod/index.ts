/**
 * Zod adapter - reports failed parses as `validation_error` events, using the
 * issue `code` (`too_small`, `invalid_format`, ...) as the reason. Messages
 * and input values are never sent. Works with Zod 3 and 4 without importing it.
 *
 * ```ts
 * import { withFormatir } from 'formatir/zod';
 *
 * const result = withFormatir(formatir, ApplicationSchema).safeParse(values);
 * ```
 */
import type { FormatirInstance } from 'formatir';

export interface ZodIssueLike {
  path: ReadonlyArray<PropertyKey>;
  code: string;
}

export interface ZodErrorLike {
  issues: ReadonlyArray<ZodIssueLike>;
}

type Target = FormatirInstance | null | undefined;

type SafeParseResult = { success: true } | { success: false; error: ZodErrorLike };

/** Dot path of an issue (`address.zip`, `jobs.0.title`); `form` for root issues. */
export const issuePath = (issue: ZodIssueLike): string =>
  issue.path.map(String).join('.') || 'form';

/** Report every issue of a `ZodError`. Returns the number of reported issues. */
export function reportZodError(formatir: Target, error: ZodErrorLike): number {
  for (const issue of error.issues) formatir?.reportValidationError(issuePath(issue), issue.code);
  return error.issues.length;
}

/**
 * Wrap a schema so failed `safeParse()` / `safeParseAsync()` calls are
 * reported. Everything else about the schema is unchanged.
 */
export function withFormatir<
  S extends {
    safeParse(data: unknown): SafeParseResult;
    safeParseAsync?(data: unknown): Promise<SafeParseResult>;
  },
>(formatir: Target, schema: S): S {
  const track = <R extends SafeParseResult>(result: R): R => {
    if (!result.success) reportZodError(formatir, result.error);
    return result;
  };
  return new Proxy(schema, {
    get(target, prop, receiver) {
      if (prop === 'safeParse') return (data: unknown) => track(target.safeParse(data));
      if (prop === 'safeParseAsync' && target.safeParseAsync) {
        return (data: unknown) => target.safeParseAsync!(data).then(track);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
