import { Logo } from './ui';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo className="h-6 w-6" />
          <span className="font-semibold text-neutral-700">Formatir</span>
          <span className="chip">MIT</span>
        </div>
        <p className="text-center text-xs sm:text-right">
          Behaviour analytics for web forms · core ~5.5 KB gzipped · zero dependencies
        </p>
      </div>
    </footer>
  );
}
