# Formatir

[![npm](https://img.shields.io/npm/v/formatir?color=7c3aed)](https://www.npmjs.com/package/formatir)
[![CI](https://github.com/YanisFerecean/formatir/actions/workflows/ci.yml/badge.svg)](https://github.com/YanisFerecean/formatir/actions/workflows/ci.yml)
[![Pages](https://github.com/YanisFerecean/formatir/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/YanisFerecean/formatir/actions/workflows/deploy-pages.yml)
[![license](https://img.shields.io/npm/l/formatir?color=64748b)](LICENSE)

**Live-Demo: [yanisferecean.github.io/formatir](https://yanisferecean.github.io/formatir/)** ·
**npm: [`formatir`](https://www.npmjs.com/package/formatir)**

> Verhaltensbasierte Analytik für Webformulare und Bewerbungsprozesse.
> Ein abhängigkeitsfreies TypeScript-SDK (**4,5 KB gzipped**) plus interaktive Showcase-App.

Conversion-Zahlen zeigen, **dass** ein Formular scheitert. Formatir zeigt, **woran**:
Rage Clicks, tote Klicks, Zögern, Korrekturschleifen, Abbruchfelder und
JavaScript-Fehler - in Echtzeit und ohne eine einzige Klartext-Eingabe zu erfassen.

## Monorepo

```
.
├── packages/formatir-sdk   # das SDK (npm-Paket "formatir", ESM + CJS + IIFE)
├── apps/showcase           # Vite + React + Tailwind Demo mit Live-Dashboard
├── .github/workflows       # CI, GitHub Pages Deployment, npm Publish
└── .claude/settings.json   # keine Attribution in Commits / PRs
```

| Paket                   | Beschreibung                                      |
| ----------------------- | ------------------------------------------------- |
| `packages/formatir-sdk`  | Sechs Verhaltensdetektoren, Frustrations-Score, Beacon-Transport. [Details](packages/formatir-sdk/README.md) |
| `apps/showcase`          | Mehrstufiges Bewerbungsformular mit Telemetrie-Panel und Entwicklerdoku. |

## Schnellstart

```bash
npm i formatir   # das SDK in ein bestehendes Projekt

# oder dieses Monorepo:
pnpm install     # pnpm >= 10, Node >= 20.19
pnpm build       # SDK bauen (inkl. Größenbudget), danach die Showcase-App
pnpm dev         # Showcase auf http://localhost:5173
```

Weitere Skripte:

| Skript           | Wirkung                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `pnpm build`     | Baut alle Workspaces in topologischer Reihenfolge.                 |
| `pnpm dev`       | Dev-Server; das SDK ist auf seinen Quellcode gealiast (HMR).       |
| `pnpm preview`   | Lokale Vorschau des Produktions-Builds.                            |
| `pnpm typecheck` | `tsc --noEmit` über alle Pakete.                                   |
| `pnpm size`      | Gzip-/Brotli-Größe des SDK-Bundles gegen das 5-KB-Budget.          |

## Die sechs Detektoren

| Metrik             | Auslöser                                                                  |
| ------------------ | ------------------------------------------------------------------------- |
| `rage_click`       | >= 3 Klicks in 500 ms auf dasselbe Element oder im 32-px-Radius            |
| `dead_click`       | Klick auf ein statisches Element ohne sichtbare Reaktion (1000 ms)         |
| `hesitation`       | > 3000 ms zwischen Fokus und erster Eingabe - oder Feld ohne Eingabe verlassen |
| `field_effort`     | Anschläge, Korrekturen, Refills und Validierungsfehler pro Feld            |
| `form_dropoff`     | Seite wird ohne Absenden verlassen; meldet das zuletzt berührte Feld       |
| `js_error`         | Ungefangene Fehler und Promise-Rejections in der Formular-Session          |

Dazu kommen `session_start`, `field_focus`, `field_blur`, `validation_error`,
`form_submit`, `score` und `custom`.

## Integration

```ts
import { Formatir } from 'formatir';

const formatir = Formatir.init({
  endpoint: '/api/formatir',
  appId: 'careers-portal',
  root: '#application-form',
});

formatir.on('form_dropoff', (event) => {
  console.warn('Abbruch bei', event.data.lastField?.key);
});
```

Die vollständige API-, Options- und Transport-Dokumentation steht in
[`packages/formatir-sdk/README.md`](packages/formatir-sdk/README.md).

## Privacy by Design

Formatir liest nie, **was** jemand tippt - nur `value.length`, Zähler und
Zeitdifferenzen. Klickziele werden als strukturelle Selektoren beschrieben,
Browser-Validierungstexte bewusst ignoriert (sie können die Eingabe enthalten),
und `data-formatir-ignore` nimmt ganze Teilbäume aus der Messung heraus.

## Deployment

* **GitHub Pages** - `.github/workflows/deploy-pages.yml` baut den Showcase und
  veröffentlicht `apps/showcase/dist` über `upload-pages-artifact@v3` und
  `deploy-pages@v4`. Der Base-Pfad wird in `apps/showcase/vite.config.ts` aus
  `GITHUB_REPOSITORY` abgeleitet (`/<repository-name>/`) und lässt sich mit
  `VITE_BASE` überschreiben. Einmalig nötig: *Settings -> Pages -> Source:
  GitHub Actions*.
* **npm** - `.github/workflows/publish-npm.yml` veröffentlicht das SDK bei einem
  GitHub-Release mit `npm publish --provenance` über OIDC. Es wird **kein**
  `NPM_TOKEN` benötigt, sondern ein Trusted Publisher auf npmjs.com
  (*Package -> Settings -> Trusted Publisher -> GitHub Actions*, Workflow
  `publish-npm.yml`).

## Lizenz

[MIT](LICENSE)
