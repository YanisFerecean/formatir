import { Logo } from './ui';

const LINKS = [
  { href: '#demo', label: 'Live-Demo' },
  { href: '#metriken', label: 'Metriken' },
  { href: '#docs', label: 'Dokumentation' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-400/10 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-bold tracking-tight text-slate-50">Formatir</span>
          <span className="chip hidden sm:inline-flex">v0.1.0</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-400/10 hover:text-slate-50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#demo" className="btn btn-primary">
          Demo starten
        </a>
      </div>
    </header>
  );
}
