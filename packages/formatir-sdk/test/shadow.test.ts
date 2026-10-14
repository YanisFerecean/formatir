import { describe, expect, it, vi } from 'vitest';
import { $, blur, click, focus, start, type, useDom } from './helpers';

useDom(`<form id="apply"><div id="host"></div></form><div data-formatir-ignore><div id="ignored-host"></div></div>`);

function shadowInput(hostSel: string): HTMLInputElement {
  const root = $(hostSel).attachShadow({ mode: 'open' });
  root.innerHTML = '<input name="iban" /><span class="static">label</span>';
  return root.querySelector('input')!;
}

describe('shadow DOM', () => {
  it('tracks fields inside open shadow roots', () => {
    const input = shadowInput('#host');
    const { of } = start({ root: '#apply' });
    focus(input);
    type(input, 'abc');
    blur(input);
    expect(of('field_focus')[0]?.field?.key).toBe('iban');
    expect(of('field_effort')[0]?.data.keystrokes).toBe(3);
  });

  it('honours data-formatir-ignore on a shadow host ancestor', () => {
    const input = shadowInput('#ignored-host');
    const { of } = start();
    focus(input);
    expect(of('field_focus')).toHaveLength(0);
  });

  it('reports rage clicks on the inner element', () => {
    const input = shadowInput('#host');
    const span = input.getRootNode().lastChild as Element;
    const { of } = start();
    for (let i = 0; i < 3; i++) click(span);
    expect(of('rage_click')[0]?.data.selector).toContain('span.static');
  });

  it('sees reactions inside the shadow root, so the click is not dead', async () => {
    const input = shadowInput('#host');
    const span = input.getRootNode().lastChild as HTMLElement;
    const { of } = start();
    click(span);
    vi.advanceTimersByTime(50);
    span.className = 'static open';
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    expect(of('dead_click')).toHaveLength(0);
  });
});

describe('dynamic fields', () => {
  it('tracks fields added after init()', () => {
    const { of } = start({ root: '#apply' });
    $('#apply').insertAdjacentHTML('beforeend', '<input name="late" />');
    const late = $<HTMLInputElement>('[name=late]');
    focus(late);
    type(late, 'x');
    blur(late);
    expect(of('field_effort')[0]?.field?.key).toBe('late');
  });
});
