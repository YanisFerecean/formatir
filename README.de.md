# Formatir

[English](README.md) · **Deutsch**

[![npm](https://img.shields.io/npm/v/formatir?color=7c3aed)](https://www.npmjs.com/package/formatir)
[![CI](https://github.com/YanisFerecean/formatir/actions/workflows/ci.yml/badge.svg)](https://github.com/YanisFerecean/formatir/actions/workflows/ci.yml)
[![Pages](https://github.com/YanisFerecean/formatir/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/YanisFerecean/formatir/actions/workflows/deploy-pages.yml)
[![license](https://img.shields.io/npm/l/formatir?color=64748b)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-34d399)](CONTRIBUTING.md)

**Live-Demo: [yanisferecean.github.io/formatir](https://yanisferecean.github.io/formatir/)** ·
**npm: [`formatir`](https://www.npmjs.com/package/formatir)**

> Verhaltensbasierte Analytik für Webformulare und Bewerbungsprozesse.
> Ein abhängigkeitsfreies TypeScript-SDK (Kern **~5,5 KB gzipped**) plus interaktive Showcase-App.

Conversion-Zahlen zeigen, **dass** ein Formular scheitert. Formatir zeigt, **woran**:
Rage Clicks, tote Klicks, Zögern, Korrekturschleifen, Abbruchfelder und
JavaScript-Fehler - in Echtzeit und ohne eine einzige Klartext-Eingabe zu erfassen.

## Monorepo

```
.
├── packages/formatir-sdk   # das SDK (npm-Paket "formatir", ESM + CJS + IIFE)
├── apps/showcase           # Vite + React + Tailwind Demo mit Live-Dashboard
├── .changeset              # ausstehende Release-Notes (Changesets)
└── .github                 # CI, Pages-Deployment, npm-Publish, Vorlagen, Dependabot
```

| Paket                   | Beschreibung                                                         |
| ----------------------- | -------------------------------------------------------------------- |
| `packages/formatir-sdk` | Detektoren, Frustrations-Score, Transport, Bindings und Collector. [Doku](packages/formatir-sdk/README.md) |
| `apps/showcase`         | Mehrstufiges Bewerbungsformular mit Telemetrie-Panel, Testszenarien und Entwicklerdoku. |

### Einstiegspunkte

| Import                     | Inhalt                                                          |
| -------------------------- | --------------------------------------------------------------- |
| `formatir`                 | Kern-SDK: sechs Detektoren, Score, Consent, Transport, Plugins   |
| `formatir/extras`          | Optionale Detektoren: paste, autofill, revisits, funnel, thrash  |
| `formatir/react`           | `FormatirProvider` und Hooks                                     |
| `formatir/vue`             | Vue-Plugin und Composables                                       |
| `formatir/svelte`          | `use:formatir`-Action                                            |
| `formatir/react-hook-form` | Validierungsfehler aus React Hook Form melden                    |
| `formatir/zod`             | Zod-Issues melden                                                |
| `formatir/server`          | Collector-Handler (Fetch-API), `parseBatch`, Node-Adapter        |
| `formatir/schema.json`     | JSON-Schema des Batch-Formats                                    |

## Schnellstart

```bash
npm i formatir   # das SDK in ein bestehendes Projekt

# oder dieses Monorepo:
pnpm install     # pnpm >= 10, Node >= 20.19
pnpm build       # SDK bauen (inkl. Größenbudgets), danach die Showcase-App
pnpm dev         # Showcase auf http://localhost:5173
```

Weitere Skripte:

| Skript                  | Wirkung                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `pnpm build`            | Baut alle Workspaces in topologischer Reihenfolge.              |
| `pnpm dev`              | Dev-Server; das SDK ist auf seinen Quellcode gealiast (HMR).    |
| `pnpm preview`          | Lokale Vorschau des Produktions-Builds.                         |
| `pnpm test`             | Vitest-Suite des SDK (happy-dom).                               |
| `pnpm typecheck`        | `tsc --noEmit` über alle Pakete (nach `pnpm build`).            |
| `pnpm size`             | Gzip-/Brotli-Größe aller Einstiegspunkte gegen ihre Budgets.    |
| `pnpm changeset`        | Änderung für den Changelog beschreiben.                         |
| `pnpm version-packages` | Version erhöhen und Changelog schreiben (Maintainer).           |

## Die sechs Kern-Detektoren

| Metrik         | Auslöser                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| `rage_click`   | >= 3 Klicks in 500 ms auf dasselbe Element oder im 32-px-Radius                 |
| `dead_click`   | Klick auf ein statisches Element ohne sichtbare Reaktion (1000 ms)              |
| `hesitation`   | > 3000 ms zwischen Fokus und erster Eingabe - oder Feld ohne Eingabe verlassen  |
| `field_effort` | Anschläge, Korrekturen, Refills und Validierungsfehler pro Feld                 |
| `form_dropoff` | Seite wird ohne Absenden verlassen; meldet das zuletzt berührte Feld            |
| `js_error`     | Ungefangene Fehler und Promise-Rejections in der Formular-Session               |

Dazu kommen `session_start`, `field_focus`, `field_blur`, `validation_error`,
`form_submit`, `score` und `custom` - und über `formatir/extras` `paste`,
`autofill`, `field_revisit`, `step_change` und `thrash`.

Felder tragen neben `key` und `type` auch das umgebende Formular (`form`), damit
mehrere Formulare auf einer Seite getrennt bleiben. Nachträglich eingefügte
Felder und Felder in offenen Shadow Roots werden ebenfalls erfasst.

## Integration

```ts
import { Formatir } from 'formatir';
import { funnel, paste } from 'formatir/extras';

const formatir = Formatir.init({
  endpoint: '/api/formatir',
  appId: 'careers-portal',
  root: '#application-form',
  autoStart: false,                 // auf Consent warten
  plugins: [paste(), funnel()],
});

consent.onAccept(() => formatir.optIn());

formatir.on('form_dropoff', (event) => {
  console.warn('Abbruch bei', event.data.lastField?.key);
});
```

Weitere Möglichkeiten im Überblick:

- **Frameworks:** `FormatirProvider` und Hooks (`formatir/react`), Plugin und
  Composables (`formatir/vue`), `use:formatir` (`formatir/svelte`).
- **Validierung:** `formatirOnInvalid()` für React Hook Form, `withFormatir()`
  für Zod - gemeldet wird nur der Fehlertyp, nie die Meldung.
- **Collector:** `createHandler({ onBatch })` aus `formatir/server` läuft auf
  Node, Deno, Bun, Cloudflare Workers und Hono; `toNodeListener()` für Express.
- **Mehrere Instanzen:** `Formatir.create({ root: '#newsletter' })`.
- **Score anpassen:** `score: { weights, saturation, levels }`.
- **Offline:** nicht zugestellte Batches landen in `localStorage` und werden
  beim nächsten Start bzw. bei `online` erneut gesendet.
- **Eigene Detektoren:** `plugins: [meinPlugin]`.

Die vollständige API-, Options-, Binding- und Collector-Dokumentation (auf
Englisch) steht in [`packages/formatir-sdk/README.md`](packages/formatir-sdk/README.md).

### Die Demo testen (Menschen, E2E-Suites, KI-Agenten)

Die Live-Demo (auf Englisch) enthält einen Abschnitt **Test scenarios**, der
zeigt, wie sich jede Metrik auslösen lässt, und veröffentlicht dieselbe
Anleitung als [`/llms.txt`](https://yanisferecean.github.io/formatir/llms.txt).
Auf der Seite ist `window.formatir` die Instanz, `window.formatirEvents` das
vollständige Event-Log, und für jedes Event wird ein `formatir:event`
DOM-Event ausgelöst; das Telemetrie-Panel stellt seinen Zustand über
`data-testid`- und `data-*`-Attribute bereit. Szenarien und `llms.txt` werden
aus `apps/showcase/src/data/scenarios.ts` erzeugt.

## Privacy by Design

Formatir liest nie, **was** jemand tippt - nur `value.length`, Zähler und
Zeitdifferenzen. Klickziele werden als strukturelle Selektoren beschrieben,
Browser-Validierungstexte bewusst ignoriert (sie können die Eingabe enthalten),
`js_error`-Meldungen von E-Mail-Adressen und Ziffernfolgen bereinigt, und
`data-formatir-ignore` nimmt ganze Teilbäume aus der Messung heraus. Consent
ist eingebaut (`autoStart: false`, `optIn()`, `optOut()`), und mit
`beforeSend` lässt sich jedes Event umschreiben oder verwerfen, bevor es den
Browser verlässt.

## Deployment

* **GitHub Pages** - `.github/workflows/deploy-pages.yml` baut den Showcase und
  veröffentlicht `apps/showcase/dist`. Der Base-Pfad wird in
  `apps/showcase/vite.config.ts` aus `GITHUB_REPOSITORY` abgeleitet
  (`/<repository-name>/`) und lässt sich mit `VITE_BASE` überschreiben.
  Einmalig nötig: *Settings -> Pages -> Source: GitHub Actions*.
* **npm** - `.github/workflows/publish-npm.yml` veröffentlicht das SDK bei einem
  GitHub-Release mit `npm publish --provenance` über OIDC. Es wird **kein**
  `NPM_TOKEN` benötigt, sondern ein Trusted Publisher auf npmjs.com.
  Ablauf: PRs mit Changesets mergen -> `pnpm version-packages` -> committen ->
  GitHub-Release veröffentlichen.

## Wartung

Dependabot öffnet wöchentlich PRs für npm-Pakete und monatlich für GitHub
Actions. Grüne PRs können gemergt werden. TypeScript-Major-Updates werden
ignoriert, bis tsup TypeScript 7 unterstützt - Details in
[CONTRIBUTING.md](CONTRIBUTING.md#dependencies).

## Mitwirken

Beiträge sind willkommen! Lies [CONTRIBUTING.md](CONTRIBUTING.md) und halte dich
an den [Code of Conduct](CODE_OF_CONDUCT.md). Sicherheitslücken bitte über
[SECURITY.md](SECURITY.md) melden, nicht als öffentliches Issue.

## Lizenz

[MIT](LICENSE)
