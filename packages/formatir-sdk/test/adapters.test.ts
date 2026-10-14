import { describe, expect, it } from 'vitest';
import {
  createErrorReporter,
  flattenErrors,
  formatirOnInvalid,
  reportErrors,
} from '../src/react-hook-form';
import { reportZodError, withFormatir } from '../src/zod';
import { start, useDom } from './helpers';

useDom();

const rhfErrors = {
  email: { type: 'required', message: 'Please enter max@example.org', ref: {} },
  address: { zip: { type: 'pattern', message: 'x' } },
  jobs: [undefined, { title: { type: 'minLength', message: 'x' } }],
  root: { serverError: { type: '500', message: 'x' } },
};

describe('formatir/react-hook-form', () => {
  it('flattens nested errors and field arrays', () => {
    expect(flattenErrors(rhfErrors)).toEqual([
      ['email', 'required'],
      ['address.zip', 'pattern'],
      ['jobs.1.title', 'minLength'],
      ['root.serverError', '500'],
    ]);
  });

  it('reports types, never messages', () => {
    const { of, formatir, events } = start();
    expect(reportErrors(formatir, rhfErrors)).toBe(4);
    expect(of('validation_error').map((e) => [e.field?.key, e.data.reason])).toContainEqual(['email', 'required']);
    expect(of('validation_error')[0]?.field?.type).toBe('email'); // resolved to the rendered input
    expect(JSON.stringify(events)).not.toContain('max@example.org');
  });

  it('chains onInvalid handlers', () => {
    const { of, formatir } = start();
    let chained = false;
    formatirOnInvalid(formatir, () => (chained = true))({ name: { type: 'required' } });
    expect(chained).toBe(true);
    expect(of('validation_error')).toHaveLength(1);
  });

  it('createErrorReporter only reports new or changed errors', () => {
    const { of, formatir } = start();
    const report = createErrorReporter(formatir);
    report({ email: { type: 'required' } });
    report({ email: { type: 'required' } });
    report({ email: { type: 'pattern' } });
    report({});
    report({ email: { type: 'pattern' } });
    expect(of('validation_error').map((e) => e.data.reason)).toEqual(['required', 'pattern', 'pattern']);
  });

  it('tolerates a missing instance', () => {
    expect(reportErrors(null, rhfErrors)).toBe(4);
  });
});

describe('formatir/zod', () => {
  const zodError = {
    issues: [
      { path: ['address', 'zip'], code: 'invalid_format', message: 'secret 12345' },
      { path: [], code: 'custom', message: 'x' },
    ],
  };

  it('reports issue codes by path', () => {
    const { of, formatir } = start();
    reportZodError(formatir, zodError);
    expect(of('validation_error').map((e) => [e.field?.key, e.data.reason])).toEqual([
      ['address.zip', 'invalid_format'],
      ['form', 'custom'],
    ]);
  });

  it('withFormatir wraps safeParse and safeParseAsync', async () => {
    const { of, formatir } = start();
    const schema = {
      kind: 'object',
      safeParse: (data: unknown) =>
        data ? ({ success: true, data } as const) : ({ success: false, error: zodError } as const),
      safeParseAsync: async (data: unknown) => schema.safeParse(data),
    };
    const tracked = withFormatir(formatir, schema);
    expect(tracked.kind).toBe('object');
    expect(tracked.safeParse({ ok: 1 }).success).toBe(true);
    expect(tracked.safeParse(null).success).toBe(false);
    await tracked.safeParseAsync(null);
    expect(of('validation_error')).toHaveLength(4);
  });
});
