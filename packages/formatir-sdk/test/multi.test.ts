import { describe, expect, it, vi } from 'vitest';
import { create, init } from '../src';
import type { FormatirEvent } from '../src';
import { $, focus, hide, type, useDom } from './helpers';

useDom(`
  <form id="apply"><input name="email" /></form>
  <form name="newsletter"><input name="email" /></form>
  <input name="outside" form="apply" />
`);

describe('per-form attribution', () => {
  it('tags field refs with the enclosing form', () => {
    const events: FormatirEvent[] = [];
    init({ transport: 'none', onEvent: (e) => void events.push(e) });
    focus($('form[name=newsletter] input'));
    focus($('[name=outside]'));
    const forms = events.filter((e) => e.type === 'field_focus').map((e) => e.field?.form);
    expect(forms).toEqual(['newsletter', 'apply']);
  });

  it('reports the drop-off for the form the user was in', () => {
    const events: FormatirEvent[] = [];
    init({ transport: 'none', onEvent: (e) => void events.push(e) });
    const input = $<HTMLInputElement>('form[name=newsletter] input');
    focus(input);
    type(input, 'a');
    hide();
    const drop = events.find((e) => e.type === 'form_dropoff') as FormatirEvent<'form_dropoff'>;
    expect(drop.data.formId).toBe('newsletter');
  });
});

describe('create()', () => {
  it('runs independent instances side by side', () => {
    const a: string[] = [];
    const b: string[] = [];
    const one = create({ root: '#apply', transport: 'none', onEvent: (e) => void a.push(e.type) });
    const two = create({ root: 'form[name=newsletter]', transport: 'none', onEvent: (e) => void b.push(e.type) });
    // init() must not destroy instances it did not create.
    init({ transport: 'none' });
    focus($('#apply input'));
    expect(a).toContain('field_focus');
    expect(b).not.toContain('field_focus');
    expect(one.sessionId).not.toBe(two.sessionId);
    one.destroy();
    two.destroy();
    vi.runAllTimers();
  });
});
