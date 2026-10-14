import { describe, expect, it } from 'vitest';
import type { FormatirInstance } from '../src';
import { formatir } from '../src/svelte';

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
});
