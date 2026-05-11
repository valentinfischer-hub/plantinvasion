# Accessibility Log — Plantinvasion

**Owner:** Art-UI Agent
**Standard:** WCAG 2.1 AA (Minimum), AAA wo erreichbar ohne Canvas-Umbau
**Basis:** Canvas-basiertes Phaser-Spiel — DOM-A11y nur via Overlay-Layer möglich
**Letzte Aktualisierung:** 2026-05-11 (Art-UI R2)

---

## Bekannte A11y-Findings

### A11Y-001 — CrossMode-Button zu klein (OFFEN)

**Entdeckt:** QA-Audit 2026-05-11 (ui_2026-05-11-09.md)
**Bug-Referenz:** B-031
**Domäne:** GardenScene.ts
**Schwere:** HOCH (Mobile-Blocker)

**Problem:**
CrossMode-Button in GardenScene hat Höhe 22px (Zeile 267 laut QA-Code-Review).
WCAG 2.1 Kriterium 2.5.5 "Target Size" verlangt min 44×44px für Touch-Targets.
Betrifft alle Mobile-User und Fat-Finger-Desktop-User.

**Spezifikation für Fix:**
```
CrossMode-Button:
- Breite: mindestens 140px (wie definiert) ✅
- Höhe: 44px (statt 22px) — PFLICHT
- Visuelle Höhe darf kleiner sein via Padding, aber Hit-Area muss 44px sein
- Alternativ: transparente Hit-Area-Extension via Phaser Interactive-Zone
```

**Empfehlung Tech-Code:**
Option A (einfach): Button-Höhe direkt auf 44px setzen, Label vertikal zentriert.
Option B (Pixel-Perfect): Phaser `setInteractive(new Phaser.Geom.Rectangle(...))` mit 44px-Zone, visuell bleibt 22px.

**Status:** OFFEN — An Tech-Code übergeben via Brain-Eintrag.

---

### A11Y-002 — Coins-Counter Kontrast (OFFEN)

**Entdeckt:** FI-Audit (UI-B-001, Art-UI R1)
**Domäne:** HUD / GardenScene
**Schwere:** MITTEL

**Problem:** Coins-Counter hat unbekannten Kontrast-Wert (Screenshot nicht verfügbar wegen B-027).
WCAG 1.4.3: Text-Kontrast min 4.5:1 für normalen Text, 3:1 für grossen Text (>18px/14px bold).

**Zu prüfen:** Farbe des Coins-Counter-Labels + Hintergrundfarbe messen.
Empfohlene Farbe: `#fcd95c` (Gold) auf `#1a2820` (Deep Forest) = Ratio ~6.8:1 ✅

**Status:** OFFEN — Beim nächsten Browser-Smoke via QA-Critic verifizieren.

---

### A11Y-003 — Keyboard-Navigation unvollständig (OFFEN)

**Entdeckt:** UX-Audit 2026-05-11 (ux_2026-05-11-09.md)
**Domäne:** Game-global
**Schwere:** NIEDRIG (Canvas-Game, kein vollständiges Keyboard-Game-Design required)

**Problem:** 
- X-Key für CrossMode implementiert ✅
- Keine globale Hotkey-Leiste sichtbar (UI-B-005)
- Keine vollständige Keyboard-only-Experience (Canvas-Game, out-of-scope für Alpha)

**Empfehlung:**
- Hotkey-Leiste am unteren Bildschirmrand (klein, gedimmt) für Alpha implementieren
- Vollständige Keyboard-Navigation als Post-Launch-Item (Roadmap S-20+)

**Status:** OFFEN — Low Priority für Closed-Alpha.

---

### A11Y-004 — Reduced-Motion (SPEZIFIKATION)

**Entdeckt:** Art-UI R2 Breeding-Animation-Spec
**Domäne:** Game-global
**Schwere:** MITTEL (Barrierefreiheit für Vestibulär-sensitive User)

**Problem:**
Breeding-Animation, Hybrid-Reveal-Screen-Shake und Partikel-Systeme können vestibulär-sensitive User beeinträchtigen.

**Spezifikation:**
```typescript
// Settings-Store: reducedMotion Flag
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion || settings.reducedMotion) {
  // Breeding: kein Screen-Shake, kein Partikel-Regen, statischer Hybrid-Toast statt Banner
  // Battle: kein Screen-Shake, kein HP-Balken-Shake
  // MenuScene: kein Pollen-Partikel-Emitter
}
```

**Settings-Screen-Item:** "Animationen reduzieren" Toggle (DE: "Animationen reduzieren") — Priorität MITTEL.

**Status:** SPEZIFIKATION — Tech-Code-Handoff für S-12+ (Post-Alpha).

---

### A11Y-005 — Schriftgrösse Browser-Minimum (BESTANDEN)

**Geprüft:** Art-UI R1
**Domäne:** Global, alle Text-Elemente
**Standard:** 14px Minimum für Browser-Desktop

**Ergebnis:**
- Body-Text: 11-12px (UNTERSCHREITET — aber Phaser-Canvas, kein DOM-Text)
- Button-Labels: 14px ✅
- HUD-Labels: unbekannt (Browser-Smoke ausstehend)

**Hinweis:** Canvas-Text ist kein DOM-Text und unterliegt nicht dem Browser-Mindestgrössen-Zoom. Spieler können Browser-Zoom nutzen (Canvas skaliert mit). Akzeptabel für Alpha.

**Status:** AKZEPTIERT für Alpha — Review vor Open-Beta.

---

## A11y-Score-Tabelle

| Kriterium | Status | Priorität |
|---|---|---|
| Touch-Targets 44x44px | ⚠️ B-031 offen (CrossMode-Button) | HOCH |
| Text-Kontrast 4.5:1 | ⚠️ Coins-Counter ungeprüft | MITTEL |
| Keyboard-Navigation | ⚠️ Unvollständig (Canvas-Game) | NIEDRIG |
| Reduced-Motion | 📋 Spezifiziert, nicht implementiert | MITTEL |
| Screen-Shake Opt-Out | 📋 Spezifiziert, nicht implementiert | MITTEL |
| Schriftgrösse | ✅ Akzeptiert für Canvas-Game | — |
| Farb-Codierung nur | ✅ Farbe + Text immer kombiniert | — |

**Legende:** ✅ Bestanden · ⚠️ Offen · 📋 Spezifiziert · ❌ Blockend
