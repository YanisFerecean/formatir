# Claude Code Prompt: User Behavior Analytics Tool "Formatir"

Du agierst als leitender Software-Architekt und Tooling-Spezialist. Deine Aufgabe ist es, eine vollumfängliche, verhaltensbasierte Verhaltensanalytik-Lösung namens **Formatir** für Webformulare und Bewerbungsprozesse zu entwickeln, zu testen und zu veröffentlichen.

## 1. Systemanforderungen & Architektur

### A. Formatir-SDK (`packages/formatir-sdk`)
- Erstelle ein extrem leichtgewichtiges (<5KB gzipped), abhängigkeitsfreies TypeScript SDK namens **Formatir** für alle gängigen Formulararten (Standard HTML, React, Vue, Single-Page Applications).
- Implementiere folgende Verhaltensdetektoren in Formatir:
  1. **Rage Click Detector**: Erkennt >= 3 schnelle Klicks innerhalb von 500 ms auf demselben Element/Radius.
  2. **Dead Click Detector**: Erkennt Klicks auf statische, nicht-interaktive Elemente.
  3. **Hesitation Time Detector**: Misst die Zeitspanne zwischen dem Fokus eines Feldes und der ersten Tastatureingabe (Schwellenwert > 3000 ms).
  4. **Field Effort & Refill Detector**: Zählt Korrekturversuche (Backspace/Delete), Feld-Refills und Formularvalidierungsfehler.
  5. **Form Drop-off Detector**: Identifiziert das letzte interagierte Feld vor einem Seitenwechsel oder Abbruch.
  6. **Error Tracker**: Erfasst ungefangene clientseitige JavaScript-Laufzeitfehler im Kontext der aktuellen Formular-Session.
- **Privacy by Design**: Keine Erfassung von Klartexten / PII (Personally Identifiable Information). Nur Metadaten (Längen, Zähler, Zeitdifferenzen, Feld-IDs/Namen).
- **Öffentliche API**: Exportiere eine saubere API mit `Formatir.init(options)`, Event-Observer `formatir.on(metric, callback)` sowie automatischem Datenversand via `navigator.sendBeacon`.

### B. Showcase- & Demo-Website (`apps/showcase`)
- Baue eine interaktive Webanwendung mit Vite, React und TailwindCSS im Monorepo, um **Formatir** zu demonstrieren.
- Simuliere ein realistisches, mehrstufiges Bewerbungsformular (Persönliche Daten -> Lebenslauf & Berufserfahrung -> Zusatzfragen -> Review & Absenden).
- Integriere ein Live-Dashboard (Telemetry Side-Panel), das alle von Formatir generierten Verhaltensmetriken, Frustrations-Scores und Warnungen in Echtzeit visualisiert.
- Biete eine prägnante Entwickler-Dokumentation zur Einbindung des Formatir-SDKs direkt auf der Landingpage.

### C. Git-Governance & Claude Code Konfiguration
- Erstelle die Konfigurationsdatei `.claude/settings.json` im Projektverzeichnis, um sicherzustellen, dass Claude Code keine Autorenschafts- oder Co-Author-Hinweise in Commits oder PRs einfügt:
```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  }
}
```
- Initialisiere das Git-Repository und führe saubere, modulare Commits nach dem Standard "Conventional Commits" durch (z. B. `feat: ...`, `fix: ...`, `docs: ...`).
- Achte auf eine strikte `.gitignore`-Datei (Ausschluss von `node_modules`, `dist`, `.env`).

### D. Automatisierte Workflows (GitHub Pages & npm)
- Erstelle `.github/workflows/deploy-pages.yml` für das automatische Deployment des Showcase-Dists auf GitHub Pages via `actions/upload-pages-artifact@v3` und `actions/deploy-pages@v4`. Setze die erforderlichen Permissions (`pages: write`, `id-token: write`).
- Konfiguriere `base` in `apps/showcase/vite.config.ts` passend für GitHub Pages Unterpfade (`/<repository-name>/`).
- Erstelle `.github/workflows/publish-npm.yml` für das Veröffentlichen des Formatir-SDKs auf npm mit `npm publish --provenance` über OIDC Trusted Publishers.

---

## 2. Schritt-für-Schritt Ausführungsplan

1. **Claude Settings anlegen**: Erstelle die Datei `.claude/settings.json` mit den leeren Attribution-Eigenschaften (`"commit": ""`, `"pr": ""`).
2. **Monorepo-Setup**: Initialisiere die Workspace-Struktur mit root `package.json` und `pnpm-workspace.yaml`.
3. **Formatir SDK-Entwicklung**: Entwickle das SDK in `packages/formatir-sdk` inklusive TypeScript-Builds (ESM/CJS).
4. **Showcase-App**: Entwickle die Showcase-App in `apps/showcase` und verlinke das Formatir SDK lokal über den Workspace.
5. **Git & CI/CD**: Initialisiere Git, erstelle die GitHub Actions Workflows und committe den Code sauber im Conventional-Commit-Format.
6. **Build-Test**: Führe `pnpm build` aus, um die Fehlerfreiheit aller Builds zu überprüfen.

Führe diese Schritte nun vollständig im lokalen Arbeitsverzeichnis aus.
