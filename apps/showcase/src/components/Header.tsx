import { VERSION } from 'formatir';
import { Logo } from './ui';

const LINKS = [
  { href: '#demo', label: 'Live demo' },
  { href: '#test-scenarios', label: 'Test scenarios' },
  { href: '#metrics', label: 'Metrics' },
  { href: '#docs', label: 'Docs' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-base font-semibold text-neutral-900">Formatir</span>
          <span className="chip hidden sm:inline-flex">v{VERSION}</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#demo" className="btn btn-primary">
          Try the demo
        </a>
      </div>
    </header>
  );
}
