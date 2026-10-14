import { describe, expect, it, vi } from 'vitest';
import { $, click, start, useDom } from './helpers';

useDom(`
  <div id="widget"><button id="chat">Chat</button></div>
  <section id="card"><form id="apply"><input name="email" /><button id="send">Send</button></form></section>
`);

const fail = (message = 'boom') =>
  window.dispatchEvent(new ErrorEvent('error', { message, filename: 'app.js', lineno: 1 }));

describe("errorScope: 'root'", () => {
  it('ignores errors while the user is outside the root', () => {
    const { of } = start({ root: '#card', errorScope: 'root' });
    fail();
    click($('#chat'));
    fail();
    expect(of('js_error')).toHaveLength(0);
  });

  it('reports errors thrown right after an interaction in the root', () => {
    const { of } = start({ root: '#card', errorScope: 'root' });
    $('#send').addEventListener('click', () => fail('submit handler failed'), { once: true });
    click($('#send'));
    expect(of('js_error')[0]?.data.message).toBe('submit handler failed');
  });

  it('reports late errors only within the grace window', () => {
    const { of } = start({ root: '#card', errorScope: 'root' });
    click($('#send'));
    vi.advanceTimersByTime(1500);
    fail('async');
    vi.advanceTimersByTime(1000);
    fail('too late');
    expect(of('js_error').map((e) => e.data.message)).toEqual(['async']);
  });

  it('reports errors while a field in the root has focus', () => {
    const { of } = start({ root: '#card', errorScope: 'root' });
    $<HTMLInputElement>('[name=email]').focus();
    vi.advanceTimersByTime(10_000);
    fail();
    expect(of('js_error')).toHaveLength(1);
  });

  it("keeps reporting every error with the default 'page'", () => {
    const { of } = start({ root: '#card' });
    fail();
    expect(of('js_error')).toHaveLength(1);
  });
});
