import { describe, expect, it } from 'vitest';
import type { FormatirInstance } from '../src';
import { formatir } from '../src/svelte';
import { revisits } from '../src/extras';

describe('formatir/svelte', () => {
  it('observes the node and cleans up on destroy', () => {
    document.body.innerHTML = '<form><input name="a" /></form><input name="b" />';
    const form = document.querySelector('form')!;
    let instance: FormatirInstance | null = null;
    const action = formatir(form, { transport: 'none', onInstance: (i) => (instance = i) });
    const keys: string[] = [];
    instance!.on('field_focus', (e) => void keys.push(e.field!.key));
    for (const el of document.querySelectorAll('input')) {
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    }
    expect(keys).toEqual(['a']);
    action.destroy();
    expect(instance!.active).toBe(false);
  });

  it('forwards the other options to the instance', () => {
    document.body.innerHTML = '<form><input name="a" /><input name="b" /></form>';
    const form = document.querySelector('form')!;
    let instance: FormatirInstance | null = null;
    const events: string[] = [];
    const action = formatir(form, {
      transport: 'none',
      sessionId: 'fixed-session',
      plugins: [revisits()],
      onEvent: (e) => void events.push(e.type),
      onInstance: (i) => (instance = i),
    });
    expect(instance!.sessionId).toBe('fixed-session');
    const [a, b] = [...form.querySelectorAll('input')];
    a!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    a!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    b!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    a!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(events).toContain('field_revisit');
    action.destroy();
  });

  it('always observes its own node, even when a root is passed', () => {
    document.body.innerHTML = '<form id="mine"><input name="a" /></form><form id="other"><input name="b" /></form>';
    let instance: FormatirInstance | null = null;
    const keys: string[] = [];
    // `root` is not part of the typed params, but plain-JS callers may pass it.
    const params = { transport: 'none', root: '#other', onInstance: (i: FormatirInstance) => (instance = i) };
    const action = formatir(document.querySelector('#mine')!, params as Parameters<typeof formatir>[1]);
    instance!.on('field_focus', (e) => void keys.push(e.field!.key));
    for (const el of document.querySelectorAll('input')) {
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    }
    expect(keys).toEqual(['a']);
    action.destroy();
  });

  it('destroy() is safe to call twice', () => {
    document.body.innerHTML = '<form></form>';
    const action = formatir(document.querySelector('form')!, { transport: 'none' });
    action.destroy();
    expect(() => action.destroy()).not.toThrow();
  });
});
