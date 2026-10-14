import { describe, expect, it, vi } from 'vitest';
import { createScorer } from '../src/core/score';
import { init } from '../src';
import { $, click, start, useDom } from './helpers';

useDom();

describe('score', () => {
  it('saturates below 100', () => {
    const s = createScorer();
    for (let i = 0; i < 100; i++) s.add('rage_click');
    expect(s.score()).toBeLessThanOrEqual(100);
    expect(s.level()).toBe('severe');
  });

  it('maps levels', () => {
    const s = createScorer();
    expect(s.level()).toBe('calm');
    s.add('rage_click');
    expect(s.score()).toBe(Math.round(100 * (1 - Math.exp(-18 / 55))));
    expect(s.level()).toBe('mild');
  });

  it('emits score events when the value changes', () => {
    const { of } = start();
    for (let i = 0; i < 3; i++) click($('#static'));
    expect(of('score').pop()?.data.signals.rage_click).toBe(1);
  });
});

describe('instance', () => {
  it('starts a session', () => {
    const { formatir } = start();
    expect(formatir.enabled).toBe(true);
    expect(formatir.sessionId).toMatch(/^fmt_/);
  });

  it('honours sampleRate', () => {
    const { formatir, events } = start({ sampleRate: 0 });
    expect(formatir.enabled).toBe(false);
    expect(events).toHaveLength(0);
  });

  it('re-init destroys the previous instance', () => {
    const a = start();
    init({ transport: 'none' });
    click($('#static'));
    vi.advanceTimersByTime(1000);
    expect(a.of('dead_click')).toHaveLength(0);
  });

  it('track() emits custom events', () => {
    const { of, formatir } = start();
    formatir.track('cv_uploaded', { sizeKb: 812 });
    expect(of('custom')[0]?.data).toEqual({ name: 'cv_uploaded', sizeKb: 812 });
  });

  it('setStep() tags events', () => {
    const { of, formatir } = start();
    formatir.setStep('experience');
    formatir.track('x');
    expect(of('custom')[0]?.step).toBe('experience');
  });

  it('ignores opted-out subtrees', () => {
    document.body.insertAdjacentHTML('beforeend', '<div data-formatir-ignore><p id="p">x</p></div>');
    const { of } = start();
    for (let i = 0; i < 3; i++) click($('#p'));
    expect(of('rage_click')).toHaveLength(0);
  });
});

describe('score options', () => {
  it('merges custom weights', () => {
    const s = createScorer({ weights: { rage_click: 0, custom: 55 } });
    s.add('rage_click');
    expect(s.score()).toBe(0);
    s.add('custom');
    expect(s.score()).toBe(63);
  });

  it('supports saturation and level bounds', () => {
    const s = createScorer({ saturation: 18, levels: [10, 50, 90] });
    s.add('rage_click');
    expect(s.score()).toBe(63);
    expect(s.level()).toBe('elevated');
  });

  it('is wired through init()', () => {
    const { of, formatir } = start({ score: { weights: { custom: 100 } } });
    formatir.track('x');
    expect(of('score').pop()?.data.score).toBeGreaterThan(80);
  });
});

describe('reportValidationError', () => {
  it('resolves a field name to the rendered field', () => {
    const { of, formatir } = start();
    formatir.reportValidationError('email', 'required');
    expect(of('validation_error')[0]?.field).toMatchObject({ key: 'email', type: 'email', form: 'apply' });
  });

  it('accepts names that are not rendered', () => {
    const { of, formatir } = start();
    formatir.reportValidationError('address.zip', 'too_small');
    expect(of('validation_error')[0]?.field).toMatchObject({ key: 'address.zip', type: 'custom' });
    expect(formatir.getSnapshot().fields[0]?.validationErrors).toBe(1);
  });
});
