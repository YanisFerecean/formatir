import { describe, expect, it, vi } from 'vitest';
import { $, click, focus, start, useDom } from './helpers';

useDom(`
  <header><p id="outside">Hero text</p></header>
  <section id="card"><div id="steps">1 2 3</div><form id="apply"><input name="email" /></form></section>
`);

const rage = (el: Element) => {
  for (let i = 0; i < 3; i++) click(el);
};

describe('root', () => {
  it('ignores clicks and fields outside the root', () => {
    const { of } = start({ root: '#card' });
    rage($('#outside'));
    click($('#outside'));
    vi.advanceTimersByTime(1000);
    expect(of('rage_click')).toHaveLength(0);
    expect(of('dead_click')).toHaveLength(0);

    rage($('#steps'));
    expect(of('rage_click')).toHaveLength(1);
  });

  it('follows a selector root when the element is replaced', () => {
    const { of } = start({ root: '#card' });
    $('#card').remove();
    document.body.insertAdjacentHTML('beforeend', '<section id="card"><input name="again" /></section>');
    focus($('[name=again]'));
    expect(of('field_focus')[0]?.field?.key).toBe('again');
  });

  it('tracks nothing while the selector matches no element', () => {
    const { of } = start({ root: '#card' });
    $('#card').remove();
    document.body.insertAdjacentHTML('beforeend', '<input name="stray" />');
    focus($('[name=stray]'));
    rage($('#outside'));
    expect(of('field_focus')).toHaveLength(0);
    expect(of('rage_click')).toHaveLength(0);
  });

  it('keeps an element root fixed', () => {
    const { of } = start({ root: $('#apply') });
    rage($('#steps'));
    expect(of('rage_click')).toHaveLength(0);
    focus($('[name=email]'));
    expect(of('field_focus')).toHaveLength(1);
  });
});
