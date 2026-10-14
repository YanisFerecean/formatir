import type { FrustrationLevel } from 'formatir';
import { LEVEL_META } from '../lib/format';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({
  score,
  level,
  events,
}: {
  score: number;
  level: FrustrationLevel;
  events: number;
}) {
  const meta = LEVEL_META[level];
  const offset = CIRCUMFERENCE * (1 - Math.min(score, 100) / 100);

  return (
    <div
      className="flex items-center gap-4"
      data-testid="score"
      data-score={score}
      data-level={level}
    >
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={meta.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-neutral-900">{score}</div>
            <div className="text-[10px] text-neutral-500">of 100</div>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-neutral-500">Frustration score</p>
        <p className="mt-1 text-lg font-bold" style={{ color: meta.color }}>
          {meta.label}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
          {events} events captured · weighted signals, saturating at 100.
        </p>
      </div>
    </div>
  );
}
