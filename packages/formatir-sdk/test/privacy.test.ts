import { describe, expect, it, vi } from 'vitest';
import { redact, stripQuery } from '../src/core/util';
import { start, useDom } from './helpers';

useDom();

describe('redact', () => {
  it('removes e-mails and digit runs', () => {
    expect(redact('Invalid email jane.doe@example.org given')).toBe('Invalid email [redacted] given');
    expect(redact('call +49 170 1234567 now')).toBe('call [redacted] now');
    expect(redact('IBAN DE12 3456 7890 1234 5678 90')).toBe('IBAN DE[redacted]');
    expect(redact('line 12 failed')).toBe('line 12 failed');
  });

  it('strips query strings', () => {
    expect(stripQuery('https://a.b/app.js?token=abc#x')).toBe('https://a.b/app.js');
  });
});

function fireError(message: string, filename = 'https://cdn.test/app.js?sig=secret') {
  window.dispatchEvent(new ErrorEvent('error', { message, filename, lineno: 1 }));
}

describe('js_error redaction', () => {
  it('is on by default', () => {
    const { of } = start();
    fireError('User max@mustermann.de not found');
    const [e] = of('js_error');
    expect(e?.data.message).toBe('User [redacted] not found');
    expect(e?.data.source).toBe('https://cdn.test/app.js');
  });

  it('can be disabled', () => {
    const { of } = start({ redactErrors: false });
    fireError('User max@mustermann.de not found');
    expect(of('js_error')[0]?.data.message).toContain('max@mustermann.de');
  });
});

describe('beforeSend', () => {
  const sent = () => {
    const fetchMock = vi.fn((_url: string, _init: RequestInit) => Promise.resolve(new Response(null)));
    vi.stubGlobal('fetch', fetchMock);
    return () =>
      fetchMock.mock.calls.flatMap(([, init]) => JSON.parse(init.body as string).events) as {
        type: string;
        data: Record<string, unknown>;
      }[];
  };

  it('can drop and rewrite events', () => {
    const events = sent();
    const { formatir, of } = start({
      endpoint: '/c',
      transport: 'fetch',
      beforeSend: (e) => {
        if (e.type === 'custom' && e.data.name === 'drop') return null;
        if (e.type === 'custom') return { ...e, data: { ...e.data, rewritten: true } };
        return e;
      },
    });
    formatir.track('drop');
    formatir.track('keep');
    formatir.flush();
    const custom = events().filter((e) => e.type === 'custom');
    expect(custom).toEqual([expect.objectContaining({ data: { name: 'keep', rewritten: true } })]);
    // Local listeners still see everything.
    expect(of('custom')).toHaveLength(2);
  });

  it('drops the event when the hook throws', () => {
    const events = sent();
    const { formatir } = start({
      endpoint: '/c',
      transport: 'fetch',
      beforeSend: () => {
        throw new Error('nope');
      },
    });
    formatir.track('x');
    formatir.flush();
    expect(events()).toHaveLength(0);
  });
});
