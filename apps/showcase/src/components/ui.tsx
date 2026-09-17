import { useCallback, useState, type ReactNode } from 'react';

export function Badge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`chip ${className}`}>{children}</span>;
}

export function CodeBlock({
  code,
  caption,
  className = '',
}: {
  code: string;
  caption?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      },
      () => setCopied(false),
    );
  }, [code]);

  return (
    <div className={`panel-tight overflow-hidden ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-400/10 px-3 py-2">
        <span className="font-mono text-[11px] tracking-wide text-slate-400">
          {caption ?? 'terminal'}
        </span>
        <button type="button" onClick={copy} className="btn btn-ghost btn-mini">
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
      <pre className="scroll-thin overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed text-slate-200">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

export function Stat({
  value,
  label,
  accent = 'text-brand-300',
}: {
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <div className="panel-tight px-4 py-3">
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-50 sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-sm text-slate-400">{description}</p> : null}
    </div>
  );
}

export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="url(#formatir-logo)" />
      <path
        d="M10 9.5h12M10 16h8M10 22.5h5"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="23" cy="22.5" r="3.2" fill="#67e8f9" />
      <defs>
        <linearGradient id="formatir-logo" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
