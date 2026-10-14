import { afterEach, beforeEach, vi } from 'vitest';
import { init, getInstance } from '../src';
import type { FormatirEvent, FormatirOptions, MetricName } from '../src';

export const FORM = `
  <form id="apply">
    <input name="email" type="email" required />
    <input name="name" type="text" />
    <textarea name="motivation"></textarea>
    <button type="submit">Send</button>
  </form>
  <div id="static">Just text</div>
`;

/** Fresh DOM + fake clock for every test; destroys the last instance. */
export function useDom(html = FORM): void {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'] });
    document.body.innerHTML = html;
  });
  afterEach(() => {
    getInstance()?.destroy();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });
}

/** Start an instance that records every event locally. */
export function start(options: FormatirOptions = {}) {
  const events: FormatirEvent[] = [];
  const formatir = init({ transport: 'none', flushIntervalMs: 0, ...options });
  formatir.on('*', (e) => void events.push(e));
  const of = <K extends MetricName>(type: K): FormatirEvent<K>[] =>
    events.filter((e) => e.type === type) as FormatirEvent<K>[];
  return { formatir, events, of };
}

export const $ = <T extends Element = HTMLElement>(sel: string): T =>
  document.querySelector(sel) as unknown as T;

export function click(el: Element, x = 10, y = 10, detail = 1): void {
  el.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true, clientX: x, clientY: y, detail }),
  );
}

export function focus(el: Element): void {
  el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
}

export function blur(el: Element): void {
  el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
}

/** Simulate typing: sets the value and fires one `input` per character. */
export function type(el: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  for (const ch of text) {
    el.value += ch;
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }
}

export function key(el: Element, k: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true }));
}

export function clear(el: HTMLInputElement | HTMLTextAreaElement): void {
  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

export function hide(): void {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
}
