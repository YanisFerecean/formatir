import type { FrustrationLevel, MetricName } from '../types';
import { clamp } from './util';

/** Signal weights; tuned so a single rage click is noticeable, not fatal. */
const WEIGHTS: Partial<Record<MetricName | 'correction' | 'refill', number>> = {
  rage_click: 18,
  dead_click: 10,
  hesitation: 6,
  validation_error: 9,
  js_error: 14,
  form_dropoff: 20,
  refill: 8,
  correction: 0.4,
};

export interface Scorer {
  add(signal: string, amount?: number): void;
  score(): number;
  level(): FrustrationLevel;
  signals(): Record<string, number>;
}

/**
 * Saturating frustration score: raw weighted signals are mapped through
 * `1 - e^(-raw/55)` so the value approaches, but never exceeds, 100.
 */
export function createScorer(): Scorer {
  const counts: Record<string, number> = {};
  let raw = 0;

  const score = () => Math.round(100 * (1 - Math.exp(-raw / 55)));

  return {
    add(signal, amount = 1) {
      counts[signal] = (counts[signal] || 0) + amount;
      raw += (WEIGHTS[signal as MetricName] ?? 0) * amount;
    },
    score,
    level() {
      const s = clamp(score(), 0, 100);
      return s >= 65 ? 'severe' : s >= 40 ? 'elevated' : s >= 20 ? 'mild' : 'calm';
    },
    signals: () => ({ ...counts }),
  };
}
