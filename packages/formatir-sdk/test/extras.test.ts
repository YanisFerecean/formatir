import { describe, expect, it, vi } from 'vitest';
import { autofill, funnel, paste, revisits, thrash } from '../src/extras';
import { $, blur, focus, start, type, useDom } from './helpers';

useDom();

const pasteInto = (el: HTMLInputElement, text: string, block = false) => {
  const e = new Event('paste', { bubbles: true, cancelable: true, composed: true });
  if (block) el.addEventListener('paste', (ev) => ev.preventDefault(), { once: true });
  el.dispatchEvent(e);
  if (!e.defaultPrevented) el.value += text;
};

describe('paste', () => {
  it('reports pastes with the length delta, never the content', () => {
    const { of, events } = start({ plugins: [paste()] });
    const input = $<HTMLInputElement>('[name=email]');
    pasteInto(input, 'secret@example.org');
    vi.runAllTimers();
    const [p] = of('paste');
    expect(p?.data).toEqual({ pastes: 1, delta: 18, blocked: false });
    expect(p?.field?.key).toBe('email');
    expect(JSON.stringify(events)).not.toContain('secret');
  });

  it('flags blocked pastes and feeds the score', () => {
    const { of } = start({ plugins: [paste()] });
    pasteInto($<HTMLInputElement>('[name=email]'), 'x', true);
    vi.runAllTimers();
    expect(of('paste')[0]?.data.blocked).toBe(true);
    expect(of('score').pop()?.data.signals.paste_blocked).toBe(1);
  });
});

describe('autofill', () => {
  it('groups browser-filled fields into one event', () => {
    const { of } = start({ plugins: [autofill()] });
    for (const name of ['email', 'name']) {
      const el = $<HTMLInputElement>(`[name=${name}]`);
      const matches = el.matches.bind(el);
      el.matches = (sel: string) => sel === ':autofill' || matches(sel);
      el.value = 'filled';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    vi.advanceTimersByTime(100);
    expect(of('autofill')).toHaveLength(1);
    expect(of('autofill')[0]?.data).toEqual({ count: 2, fields: ['email', 'name'] });
  });

  it('ignores typing', () => {
    const { of } = start({ plugins: [autofill()] });
    type($<HTMLInputElement>('[name=name]'), 'abc');
    vi.advanceTimersByTime(100);
    expect(of('autofill')).toHaveLength(0);
  });
});

describe('revisits', () => {
  it('fires when the user returns to an earlier field', () => {
    const { of } = start({ plugins: [revisits()] });
    const email = $('[name=email]');
    const name = $('[name=name]');
    focus(email);
    blur(email);
    focus(name);
    blur(name);
    expect(of('field_revisit')).toHaveLength(0);
    focus(email);
    expect(of('field_revisit')[0]).toMatchObject({ field: { key: 'email' }, data: { visits: 2 } });
  });
});

describe('funnel', () => {
  it('reports step changes, durations and back navigation', () => {
    const { of, formatir } = start({ plugins: [funnel()] });
    formatir.setStep('personal');
    vi.advanceTimersByTime(5000);
    formatir.setStep('experience');
    vi.advanceTimersByTime(2000);
    formatir.setStep('personal');
    const changes = of('step_change').map((e) => e.data);
    expect(changes[1]).toEqual({ from: 'personal', to: 'experience', durationMs: 5000, back: false, visits: 1 });
    expect(changes[2]).toEqual({ from: 'experience', to: 'personal', durationMs: 2000, back: true, visits: 2 });
    expect(of('score').pop()?.data.signals.step_back).toBe(1);
  });

  it('does not fire when the step is unchanged', () => {
    const { of, formatir } = start({ plugins: [funnel()] });
    formatir.setStep('a');
    formatir.setStep('a');
    expect(of('step_change')).toHaveLength(1);
  });
});

describe('thrash', () => {
  const move = (x: number, y = 100) =>
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));

  it('detects rapid back-and-forth movement', () => {
    const { of } = start({ plugins: [thrash()] });
    for (let i = 0; i < 10; i++) {
      move(i % 2 ? 300 : 100);
      vi.advanceTimersByTime(50);
    }
    expect(of('thrash')).toHaveLength(1);
    expect(of('thrash')[0]?.data.reversals).toBeGreaterThanOrEqual(6);
  });

  it('ignores steady movement', () => {
    const { of } = start({ plugins: [thrash()] });
    for (let i = 0; i < 20; i++) {
      move(i * 20);
      vi.advanceTimersByTime(50);
    }
    expect(of('thrash')).toHaveLength(0);
  });
});

describe('plugins', () => {
  it('are detached by stop()', () => {
    const { of, formatir } = start({ plugins: [revisits()] });
    formatir.stop();
    const email = $('[name=email]');
    focus(email);
    blur(email);
    focus($('[name=name]'));
    focus(email);
    expect(of('field_revisit')).toHaveLength(0);
  });
});
