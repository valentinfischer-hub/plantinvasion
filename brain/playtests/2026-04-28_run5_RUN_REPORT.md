# Run 5 Report - 2026-04-28 (QA-Run)

**Run-Typ:** QA-Run (Browser-Smoke + Netlify-Audit)
**Tests:** 688/688 GRUEN, 40 Suiten (unveraendert)

## Browser-Smoke plantinvasion.netlify.app

### Tier-1: Boot
- Console-Errors: 0
- Phaser v3.90.0 WebGL startet korrekt
- Boot-Zeit: ca. 6s (innerhalb Budget)
- Ergebnis: PASS

### Netlify-Audit
- Deploy-ID: 69f0b202e36d220008e67932
- Deploy-State: ready
- Deploy-Zeit: 21 Sekunden
- Secret-Scan: 0 Matches aus 289 gescannten Dateien
- Framework: Vite
- Ergebnis: PASS

### Bundle-Build
- Status: NICHT TESTBAR (Root-Filesystem 100% voll im Workspace)
- Letzter bekannter Stand: ca. 1.7MB total
- Schaetzung nach Adds: ca. 1.72MB (im Budget)

## ESLint Gesamt-Sweep
- src/ komplett: 0 Errors, 0 Warnings

## QA-Befunde (keine Blocker)
- SOFT: Netlify hat neue Commits (950b729, 2c22c3f) noch nicht deployed
- SOFT: Bundle-Audit nicht lokal pruefbar wegen Disk-Mangel
