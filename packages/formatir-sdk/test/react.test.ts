import { act, createElement, useRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FormatirEvent, FormatirInstance, FormatirSnapshot } from '../src';
import {
  FormatirProvider,
  useFormatir,
  useFormatirEvent,
  useFormatirInstance,
  useFormatirSnapshot,
} from '../src/react';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (node: ReactNode) => act(() => root.render(node));

describe('formatir/react', () => {
  it('provides an instance and destroys it on unmount', () => {
    let seen: FormatirInstance | null = null;
    const Probe = () => {
      seen = useFormatir();
      return null;
    };
    render(createElement(FormatirProvider, { transport: 'none' }, createElement(Probe)));
    expect(seen).not.toBeNull();
    const instance = seen!;
    expect(instance.active).toBe(true);
    const count = instance.getSnapshot().events;
    act(() => root.unmount());
    root = createRoot(host);
    expect(instance.active).toBe(false);
    instance.track('after');
    expect(instance.getSnapshot().events).toBe(count);
  });

  it('useFormatirEvent subscribes with the latest listener', () => {
    const got: string[] = [];
    let instance: FormatirInstance | null = null;
    const Probe = ({ tag }: { tag: string }) => {
      instance = useFormatir();
      useFormatirEvent('custom', (e: FormatirEvent<'custom'>) => got.push(`${tag}:${e.data.name}`));
      return null;
    };
    const tree = (tag: string) =>
      createElement(FormatirProvider, { transport: 'none' }, createElement(Probe, { tag }));
    render(tree('a'));
    act(() => instance!.track('one'));
    render(tree('b'));
    act(() => instance!.track('two'));
    expect(got).toEqual(['a:one', 'b:two']);
  });

  it('useFormatirSnapshot re-renders on events', () => {
    let snap: FormatirSnapshot | null = null;
    let instance: FormatirInstance | null = null;
    const Probe = () => {
      instance = useFormatir();
      snap = useFormatirSnapshot();
      return null;
    };
    render(createElement(FormatirProvider, { transport: 'none' }, createElement(Probe)));
    const before = snap!.events;
    act(() => instance!.track('x'));
    expect(snap!.events).toBe(before + 1);
  });

  it('accepts a ref as root', () => {
    let instance: FormatirInstance | null = null;
    const Form = () => {
      const ref = useRef<HTMLFormElement>(null);
      instance = useFormatirInstance({ transport: 'none', root: ref });
      return createElement('form', { ref, id: 'f' }, createElement('input', { name: 'a' }));
    };
    render(createElement(Form));
    const events: string[] = [];
    instance!.on('field_focus', (e) => void events.push(e.field!.key));
    const outside = document.createElement('input');
    outside.name = 'outside';
    document.body.appendChild(outside);
    for (const el of [host.querySelector('input')!, outside]) {
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    }
    outside.remove();
    expect(events).toEqual(['a']);
  });
});
