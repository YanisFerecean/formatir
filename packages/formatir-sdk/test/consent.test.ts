import { afterEach, describe, expect, it, vi } from 'vitest';
import { OPT_OUT_KEY } from '../src/core/runtime';
import { $, click, start, useDom } from './helpers';

useDom();
afterEach(() => localStorage.clear());

const rage = () => {
  for (let i = 0; i < 3; i++) click($('#static'));
};

describe('consent', () => {
  it('waits for start() with autoStart: false', () => {
    const { formatir, of, events } = start({ autoStart: false });
    expect(formatir.active).toBe(false);
    rage();
    expect(events).toHaveLength(0);
    formatir.start();
    expect(formatir.active).toBe(true);
    expect(of('session_start')).toHaveLength(1);
    rage();
    expect(of('rage_click')).toHaveLength(1);
  });

  it('stop() pauses collection and start() resumes without a new session_start', () => {
    const { formatir, of } = start();
    formatir.stop();
    rage();
    expect(of('rage_click')).toHaveLength(0);
    formatir.start();
    rage();
    expect(of('rage_click')).toHaveLength(1);
    expect(of('session_start')).toHaveLength(1);
  });

  it('optOut() persists and wins over autoStart', () => {
    const first = start();
    first.formatir.optOut();
    expect(localStorage.getItem(OPT_OUT_KEY)).toBe('1');
    expect(first.formatir.getSnapshot().queued).toBe(0);

    const second = start();
    expect(second.formatir.active).toBe(false);
    second.formatir.start();
    expect(second.formatir.active).toBe(false);

    second.formatir.optIn();
    expect(second.formatir.active).toBe(true);
    expect(localStorage.getItem(OPT_OUT_KEY)).toBeNull();
  });

  it('stop() clears pending dead-click timers', () => {
    const { formatir, of } = start();
    click($('#static'));
    formatir.stop();
    vi.advanceTimersByTime(2000);
    expect(of('dead_click')).toHaveLength(0);
  });
});
