// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { init } from '../src';

describe('without a DOM (SSR)', () => {
  it('creates a disabled instance whose API is safe to call', () => {
    const formatir = init({ root: '#application-form', endpoint: '/c' });
    expect(formatir.enabled).toBe(false);
    expect(formatir.active).toBe(false);
    formatir.start();
    formatir.setStep('a');
    formatir.track('x');
    formatir.reportValidationError('email');
    expect(formatir.getSnapshot().sessionId).toBe(formatir.sessionId);
    formatir.optOut();
    formatir.optIn();
    formatir.flush();
    formatir.destroy();
  });
});
