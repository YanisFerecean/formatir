import { Logo } from './ui';

export function Footer() {
  return (
    <footer className="border-t border-slate-400/10 bg-ink-950/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo className="h-6 w-6" />
          <span className="font-semibold text-slate-300">Formatir</span>
          <span className="chip">MIT</span>
        </div>
        <p className="text-center text-xs sm:text-right">
          Verhaltensanalytik für Webformulare · unter 5 KB gzipped · ohne Abhängigkeiten
        </p>
      </div>
    </footer>
  );
}
