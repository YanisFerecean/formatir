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
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <span className="font-mono text-[11px] text-neutral-600">
          {caption ?? 'terminal'}
        </span>
        <button type="button" onClick={copy} className="btn btn-ghost btn-mini">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="scroll-thin overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed text-neutral-800">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      {description ? <p className="mt-2 text-sm text-neutral-600">{description}</p> : null}
    </div>
  );
}

export function Logo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="4" fill="#171717" />
      <path d="M10 9.5h12M10 16h8M10 22.5h5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
