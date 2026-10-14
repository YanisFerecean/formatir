import type { FrustrationLevel, ScoreOptions } from '../types';
import { clamp } from './util';

/** Signal weights; tuned so a single rage click is noticeable, not fatal. */
export const WEIGHTS: Record<string, number> = {
  rage_click: 18,
  dead_click: 10,
  hesitation: 6,
  validation_error: 9,
  js_error: 14,
  form_dropoff: 20,
  refill: 8,
  correction: 0.4,
  // Signals from `formatir/extras`.
  thrash: 8,
  field_revisit: 3,
  paste_blocked: 10,
  step_back: 5,
};

export interface Scorer {
  add(signal: string, amount?: number): void;
  score(): number;
  level(): FrustrationLevel;
  signals(): Record<string, number>;
}

/**
 * Saturating frustration score: raw weighted signals are mapped through
 * `1 - e^(-raw/saturation)` so the value approaches, but never exceeds, 100.
 */
export function createScorer(options: ScoreOptions = {}): Scorer {
  const weights: Record<string, number> = { ...WEIGHTS, ...options.weights };
  const saturation = options.saturation || 55;
  const [mild, elevated, severe] = options.levels || [20, 40, 65];
  const counts: Record<string, number> = {};
  let raw = 0;

  const score = () => Math.round(100 * (1 - Math.exp(-raw / saturation)));

  return {
    add(signal, amount = 1) {
      counts[signal] = (counts[signal] || 0) + amount;
      raw += (weights[signal] || 0) * amount;
    },
    score,
    level() {
      const s = clamp(score(), 0, 100);
      return s >= severe ? 'severe' : s >= elevated ? 'elevated' : s >= mild ? 'mild' : 'calm';
    },
    signals: () => ({ ...counts }),
  };
}
