import { describe, expect, it, vi } from 'vitest';
import { $, blur, clear, click, focus, hide, key, start, type, useDom } from './helpers';

useDom();

describe('rage_click', () => {
  it('fires on 3 clicks within the window', () => {
    const { of } = start();
    const el = $('#static');
    click(el);
    vi.advanceTimersByTime(100);
    click(el);
    vi.advanceTimersByTime(100);
    click(el);
    const [rage] = of('rage_click');
    expect(rage?.data.count).toBe(3);
    expect(rage?.data.withinMs).toBe(200);
    expect(rage?.data.selector).toContain('div#static');
  });

  it('ignores clicks spread over a longer time', () => {
    const { of } = start();
    const el = $('#static');
    for (let i = 0; i < 3; i++) {
      click(el);
      vi.advanceTimersByTime(400);
    }
    expect(of('rage_click')).toHaveLength(0);
  });

  it('respects custom thresholds', () => {
    const { of } = start({ thresholds: { rageClicks: 5 } });
    for (let i = 0; i < 4; i++) click($('#static'));
    expect(of('rage_click')).toHaveLength(0);
    click($('#static'));
    expect(of('rage_click')).toHaveLength(1);
  });
});

describe('dead_click', () => {
  it('fires when a static element does not react', () => {
    const { of } = start();
    click($('#static'));
    vi.advanceTimersByTime(1000);
    expect(of('dead_click')).toHaveLength(1);
  });

  it('is skipped for interactive elements', () => {
    const { of } = start();
    click($('button'));
    vi.advanceTimersByTime(1000);
    expect(of('dead_click')).toHaveLength(0);
  });
});

describe('hesitation', () => {
  it('measures focus -> first keystroke', () => {
    const { of } = start();
    const input = $<HTMLInputElement>('[name=name]');
    focus(input);
    vi.advanceTimersByTime(4000);
    type(input, 'a');
    const [h] = of('hesitation');
    expect(h?.data).toMatchObject({ ms: 4000, abandoned: false, threshold: 3000 });
    expect(h?.field?.key).toBe('name');
  });

  it('reports abandoned fields', () => {
    const { of } = start();
    const input = $('[name=name]');
    focus(input);
    vi.advanceTimersByTime(3500);
    blur(input);
    expect(of('hesitation')[0]?.data.abandoned).toBe(true);
  });

  it('stays quiet for quick input', () => {
    const { of } = start();
    const input = $<HTMLInputElement>('[name=name]');
    focus(input);
    vi.advanceTimersByTime(500);
    type(input, 'a');
    expect(of('hesitation')).toHaveLength(0);
  });
});

describe('field_effort', () => {
  it('counts keystrokes, corrections and refills', () => {
    const { of, formatir } = start();
    const input = $<HTMLInputElement>('[name=name]');
    focus(input);
    type(input, 'abc');
    key(input, 'Backspace');
    clear(input);
    type(input, 'x');
    blur(input);
    const [effort] = of('field_effort');
    expect(effort?.data).toMatchObject({ keystrokes: 5, corrections: 1, refills: 1, length: 1 });
    expect(formatir.getSnapshot().fields[0]?.key).toBe('name');
  });

  it('never carries the typed value', () => {
    const { events } = start();
    const input = $<HTMLInputElement>('[name=name]');
    focus(input);
    type(input, 'SECRET-VALUE');
    blur(input);
    expect(JSON.stringify(events)).not.toContain('SECRET');
  });

  it('reports constraint validation failures', () => {
    const { of } = start();
    const email = $<HTMLInputElement>('[name=email]');
    email.dispatchEvent(new Event('invalid', { bubbles: false }));
    const [v] = of('validation_error');
    expect(v?.field?.key).toBe('email');
  });
});

describe('form_dropoff / form_submit', () => {
  it('reports the last field when the page is hidden', () => {
    const { of } = start();
    const input = $<HTMLInputElement>('[name=name]');
    focus(input);
    type(input, 'ab');
    hide();
    const [d] = of('form_dropoff');
    expect(d?.data.lastField?.key).toBe('name');
    expect(d?.data.reason).toBe('hidden');
    expect(d?.data.filled).toBe(1);
  });

  it('does not report a drop-off after markSubmitted()', () => {
    const { of, formatir } = start();
    focus($('[name=name]'));
    formatir.markSubmitted();
    hide();
    expect(of('form_dropoff')).toHaveLength(0);
  });

  it('records submits', () => {
    const { of } = start();
    const form = $<HTMLFormElement>('#apply');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(of('form_submit')[0]?.data.formId).toBe('apply');
  });
});

describe('js_error', () => {
  it('captures uncaught errors', () => {
    const { of } = start();
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom', filename: 'app.js', lineno: 3 }));
    expect(of('js_error')[0]?.data).toMatchObject({ message: 'boom', kind: 'error', line: 3 });
  });
});
