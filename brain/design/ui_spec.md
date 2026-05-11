# Plantinvasion UI Spec

**Version:** 1.1 (FI Art-UI R1, 2026-05-11)
**Owner:** Art-UI Agent
**Status:** S-POLISH aktiv — FI-Lock D-041 in Kraft

---

## 1. Screen-Flow-Übersicht

```
Browser öffnet
     |
     v
SplashScene (boot-time <1s, FI-Score: 5/5 erreicht)
     |
     v
MenuScene ──── [New Game] ──► OverworldScene (Tutorial Step 0)
     |     └── [Continue] ──► GardenScene / letzte Scene
     |     └── [Settings] ──► SettingsScene
     |     └── [Help]     ──► HelpScene
     |
     v (Onboarding-Modal bei erstem Besuch)
WelcomeModal (3 Slides) → dismiss → bleibt in MenuScene
```

---

## 2. MenuScene (FI-Haupt-Screen)

### Layout-Struktur (Portrait 375x812 Referenz)

```
┌─────────────────────────────┐
│  [Boden-Tile-Pattern α0.45] │  ← 32x32-Grid, 4 Varianten
│                             │
│         [Mondlilie]         │  ← plantY=80, scale 0.85 (oder procedural)
│                             │
│      Plantinvasion          │  ← H1, 36px, Stroke+Shadow, Float-Anim
│   [Tagline rotierend]       │  ← Body 12px, Cross-Fade 4s
│                             │
│  ┌─────────────────────┐    │
│  │    Weiter spielen   │    │  ← 220x44, grün, nur wenn Save existiert
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │   Neues Spiel       │    │  ← 220x44, gold, Pulse-Anim
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │   Einstellungen     │    │  ← 220x44, blau
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │   Hilfe             │    │  ← 220x44, gold
│  └─────────────────────┘    │
│                             │
│  🌻 🌵 🌿  [Showcase-Footer] │  ← fy=height-50, 6 Spezies, scale 0.35
│                             │
│   v0.9 | Datum | Build      │  ← 10px, sehr gedimmt
└─────────────────────────────┘
```

### Partikel-Hintergrundlayer
- `pollen_dot` emitter an (cx, height+10)
- Depth: 1 (unter Titel, über Boden)
- Max 30 Partikel, ADD-BlendMode

### Animationssequenz Timeline
```
0ms    → Hintergrund-Partikel starten
100ms  → Title Reveal (Back.Out, 700ms)
600ms  → Tagline fade-in
800ms  → Buttons staggered entrance (80ms apart)
900ms  → Title Idle-Float beginnt
1400ms → NewGame-Button Pulse-Anim
1500ms → Sweep-Gloss über Title (einmalig, 220ms)
2000ms → Ambient BGM
```

---

## 3. Button-Komponente (makeButton)

### States-Spec

```typescript
// Idle
bg: 0x000000 α0.65, stroke: 2px accent
txt: α0.92

// Hover (pointerover)
scale: 1.06 (150ms Back.Out)
bg: accent-tint α0.12, stroke: 3px
sfx: dialogAdvance()

// Press (pointerdown)
scale: 0.96 (80ms Cubic.Out)
bg: accent-tint α0.35

// Release (pointerup)
scale: 1.0 (100ms Back.Out)
bg: α0.65 reset
→ onClick()

// Disabled
α: 0.4, no hover/press events
```

### i18n-Padding-Reserve
- Button-Breite 220px deckt DE-Worst-Case ab
- DE-Strings: max 12 Zeichen als Richtwert
- Längere Strings → 2-Zeilen oder Icon+Tooltip

---

## 4. WelcomeModal (Onboarding)

Nur beim ersten Spiel-Start (kein Save). 3-Slide-Tutorial.

```
┌──────────────────────────┐
│  [Titel: 16px gold]      │  ← max 24 Zeichen DE
│                          │
│  [Body: 11px, centered]  │  ← max 120 Zeichen DE pro Slide
│                          │
│     ● ○ ○                │  ← Fortschritts-Dots
│  [Skip]   [Weiter →]     │  ← beide buttons min 44x44px touch
└──────────────────────────┘
Panel: 320x220, #1a2820, stroke #9be36e 3px
```

### Slide-Inhalte
1. "Willkommen in Plantinvasion" — Was ist das Spiel
2. "Cozy plus Strategisch" — Core-Loop
3. "Tipps zum Start" — Keyboard-Shortcuts

---

## 5. FI-Item-Status (Art-UI-Verantwortlich)

| FI-Item | Score vor R1 | Score nach R1 | Änderung |
|---|---|---|---|
| Browser-Tab-Title + Favicon | 2 | 5 | SVG-Sunflower-Icon, Apple-Touch, Manifest |
| Title-Screen-Logo | 2 | 3 | Stroke+Shadow, Sweep-Gloss, Blütenstaub-Partikel |
| New-Game-Button Hover+Press | 2 | 4 | Korrekte Hover/Press-States in makeButton |
| Loading-Indicator-Animation | 3 | 3 | Kein Fortschritt diesen Run |
| Tilda-Sprite-Idle | 2 | 2 | Kein Fortschritt diesen Run |
| Erste Bestäubungs-Animation | 2 | 2 | Kein Fortschritt diesen Run |

---

## 6. a11y-Checkliste (Stand 2026-05-11)

| Item | Status | Notiz |
|---|---|---|
| Button Touch-Target 44x44px | ✅ | makeButton: 220x44 |
| Font Body min 12px Browser | ✅ | 11-12px Körpertext |
| Kontrast Primary Green auf Dunkel | ✅ | #9be36e auf #1a2820 ca. 7:1 |
| Kontrast Gold auf Dunkel | ✅ | #fcd95c auf #1a2820 ca. 9:1 |
| Disabled-State erkennbar | ✅ | α0.4 in makeButton |
| Keyboard-Navigation | ⚠️ | Tab-Focus noch nicht vollständig |
| Screen-Reader-Support | ❌ | Phaser-Canvas nicht SR-zugänglich (Known Limitation) |

---

## 7. Wireframe-Bibliothek (Ordner brain/design/wireframes/)

| File | Inhalt | Status |
|---|---|---|
| `breeding_animation_spec.md` | Bestäubungs-Animation-Easing-Spec für Tech-Code | pending |
| `battle_ui_spec.md` | Damage-Numbers, Reihenfolge-Anzeige, Timer | pending |
| `inventory_grid_spec.md` | Grid-Layout, Slot-Grösse, Drag-and-Drop | pending |

---

## 8. Tutorial-UI-Spec (Basis)

Tutorial-Schritte 0–5 werden als Overlay-Tooltips über der Hauptszene gezeigt.

```
┌───────────────────────────┐
│ → [Pointer-Arrow]         │  ← zeigt auf Ziel-Element
│   "Klick auf diesen Slot" │  ← DE-String, max 40 Zeichen
│             [Weiter]      │  ← Touch-Target 44x44
└───────────────────────────┘
BG: #000000 α0.7 Dimmer
Panel: #2d3a2a, stroke #9be36e
```

Drop-Off-Ziel: unter 10% (aktuell nicht gemessen — Tracking ausstehend über PostHog).
