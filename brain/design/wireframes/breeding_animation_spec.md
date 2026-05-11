# Breeding-Animation Spec — Plantinvasion

**Version:** 1.0 (Art-UI R2, 2026-05-11)
**Owner:** Art-UI Agent
**Ziel:** FI-Score "Erste Bestäubungs-Animation" 2→4, FI-Score "Erster Hybrid-Reveal-Stinger" 1→3
**Implementierung durch:** Tech-Code (Phaser Tweens + Particle Emitter)
**Showcase-Priorität:** KRITISCH — Züchtungs-UI ist das Schaufenster des Spiels

---

## 1. Übersicht Breeding-Flow

```
User klickt "Kreuzen"
         |
         v
[Phase 1: Auswahl-Bestätigung] 200ms
Parent A  +  Parent B blinken grün (scale 1.12 → 1.0, ease: Back.Out)
         |
         v
[Phase 2: Bestäubungs-Flug] 600ms
Pollen-Partikel sprühen von Parent A → Parent B
Bogen-Kurve (quadratic bezier), 8-12 Partikel, Farbe: Primary Green #9be36e
         |
         v
[Phase 3: Befruchtungs-Burst] 400ms
Parent B: radiale Partikel-Explosion (Pollen + Herzchen), scale 1.2 → 1.0
Screen-Edge Vignette: kurz grün aufleuchten (alpha 0→0.15→0, 400ms)
         |
         v
[Phase 4: Samen-Entstehung] 800ms
Neues Seed-Icon materialisiert in der Mitte (scale 0→1.1→1.0, ease: Elastic.Out)
Goldener Gloss-Sweep von links → rechts über Seed-Icon (250ms, ADD-BlendMode)
         |
         v
[Phase 5: Hybrid-Reveal-Stinger] 1200ms (NUR wenn Hybride entstanden)
Schwarzer Vignette-Flash (alpha 0→0.4→0, 300ms)
Hybrid-Name tippt sich ein — Buchstabe für Buchstabe (30ms je Zeichen)
Partikel-Regen von oben (20 Partikel, Farbe: Mutation Violet #b06aff)
"NEUE SPEZIES!" Text-Banner fährt von links ein (ease: Expo.Out, 400ms)
Screen-Shake (amplitude: 2px, duration: 200ms, frequency: 30Hz)
```

**Gesamtdauer (Basis-Cross ohne Hybrid):** ~2000ms
**Gesamtdauer (Hybrid-Reveal):** ~3200ms
**Abbruch:** ESC oder Klick ausserhalb unterbricht ab Phase 4 (niemals mitten in Phase 2)

---

## 2. Pollen-Partikel Spec (Phase 2)

```typescript
// Phaser Particle Emitter Config
{
  key: 'pollen_dot',          // 4x4px, Farbe #9be36e, mit Alpha-Gradient
  quantity: 10,
  lifespan: 600,
  speed: { min: 80, max: 140 },
  scale: { start: 0.8, end: 0.1 },
  alpha: { start: 1, end: 0 },
  blendMode: Phaser.BlendModes.ADD,
  // Bogen-Simulation via follow-Emitter auf Bezier-Tween:
  // Tween bewegt Emitter-Position von parentA zu parentB auf Bogen
  gravityY: -40,              // leicht aufschwingend
  rotate: { min: 0, max: 360 }
}
```

**Partikel-Asset:** 4x4px gelb-grüner Dot mit weissem Core. Bereits im System als `pollen_dot` (MenuScene Partikel). Wiederverwenden.

---

## 3. Hybrid-Reveal Stinger Detail (Phase 5)

**Trigger-Bedingung:** `crossResult.isHybrid === true` (gameStore)
**Farbe:** Mutation Violet `#b06aff` für alle Hybrid-UI-Elemente

### ASCII-Wireframe Hybrid-Reveal Screen

```
┌─────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← schwarze Vignette alpha 0.4
│                                 │
│         ✨ NEUE SPEZIES! ✨     │  ← violet Banner, slide-in von links
│                                 │
│    ┌───────────────────────┐    │
│    │   [Hybrid-Sprite]     │    │  ← 64x64, scale 0→1, Elastic.Out
│    │   [Name tippt sich]   │    │  ← Buchstabe für Buchstabe
│    │   [Eltern: A × B]     │    │  ← klein, #f0f0f0 40% alpha
│    └───────────────────────┘    │
│                                 │
│       ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓     │  ← violet Partikel-Regen
│                                 │
│    [Zur Sammlung] [Nochmal]     │  ← Buttons erscheinen nach 1200ms
└─────────────────────────────────┘
```

**Sound-Cue (für Narrative-Sound-Agent):**
- Phase 2 Start: `sfx_pollinate` (soft whoosh, 300ms)
- Phase 3 Burst: `sfx_burst_soft` (bubble pop, 200ms)
- Phase 5 Hybrid: `sfx_hybrid_reveal` (ascending chime, 800ms)

---

## 4. Punnett-Square Visual (Züchtungsmenü vor dem Cross)

**Trigger:** Klick auf "Kreuzen" öffnet zuerst Punnett-Preview-Modal

### ASCII-Wireframe Punnett-Modal

```
┌──────────────────────────────────────┐
│  Kreuzungs-Vorschau                  │  ← H2 16px
│                                      │
│  [Pflanze A]      ×      [Pflanze B] │  ← Sprites 48x48
│  Helianthus anna.   Rosa canina      │
│                                      │
│  Gene-Tabelle:                       │
│  ┌─────┬───────────┬───────────┐     │
│  │     │  B-Gen1   │  B-Gen2   │     │
│  ├─────┼───────────┼───────────┤     │
│  │ A-G1│ ██ 75%    │ ░░ 25%    │     │
│  ├─────┼───────────┼───────────┤     │
│  │ A-G2│ ░░ 25%    │ ██ 75%    │     │
│  └─────┴───────────┴───────────┘     │
│                                      │
│  Hybrid-Chance: 12%  ─────────►      │
│  Mutation-Chance: 3% ─►              │
│                                      │
│  Kosten: 50 Coins                    │
│  [Abbrechen]          [Kreuzen!]     │  ← Primary CTA rechts
└──────────────────────────────────────┘
```

**Farb-Codierung Punnett-Zellen:**
- Dominant-Merkmal: `#9be36e` grün, voll
- Rezessiv: `#8a6e4a` braun, 40% alpha
- Hybrid-Outcome: `#fcd95c` gold, gepunktet

---

## 5. Tech-Code Handoff-Punkte

| ID | Aufgabe | Priorität |
|---|---|---|
| BREED-01 | Pollen-Partikel-Bogen-Tween (Bezier-Emitter) | HOCH |
| BREED-02 | Hybrid-Reveal Banner slide-in + Partikel-Regen | HOCH |
| BREED-03 | Buchstabe-für-Buchstabe Namensreveal | MITTEL |
| BREED-04 | Punnett-Square-Modal mit Gen-Tabelle | MITTEL |
| BREED-05 | Screen-Shake beim Hybrid-Reveal | NIEDRIG |
| BREED-06 | ESC-Abbruch ab Phase 4 | NIEDRIG |

**60fps-Budget:** Partikel max 20 gleichzeitig. Burst-Phase: max 30ms-Spike erlaubt (einmaliges Event).

---

## 6. A11y-Anforderungen

- Hybrid-Reveal-Animation: `prefers-reduced-motion` respektieren (Fallback: statischer Toast statt Animation)
- Punnett-Square: alle Prozente zusätzlich als Text (nicht nur Balkenbreite)
- Screen-Shake: abschaltbar via Settings "Barrierefreier Modus"
