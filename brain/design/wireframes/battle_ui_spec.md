# Battle-UI Spec — Plantinvasion

**Version:** 1.0 (Art-UI R2, 2026-05-11)
**Owner:** Art-UI Agent
**Ziel:** FI-Score "BattleScene" 3→4 (Stardew-Vergleich aus QA-Audit)
**Implementierung durch:** Tech-Code

---

## 1. Battle-Screen Layout (720x540 Canvas)

```
┌─────────────────────────────────────────────────────┐
│  [Biom-Hintergrund, animiert: Wind/Partikel]        │  ← depth 0
│                                                     │
│  ┌──────────────────┐    ┌──────────────────┐       │
│  │  GEGNER-PFLANZE  │    │  SPIELER-PFLANZE │       │
│  │  [Sprite 80x80]  │    │  [Sprite 80x80]  │       │  ← depth 5
│  │                  │    │ [Idle-Breathing] │       │
│  └──────────────────┘    └──────────────────┘       │
│                                                     │
│  Gegner:                         Spieler:           │
│  Atropa belladonna               Rosa canina        │  ← depth 6
│  ████████████▒▒▒▒  HP 68/100    ████████████████ HP │
│  [StatusEffekte: ☀️ 🌧️]          [StatusEffekte]    │
│                                                     │
│─────────────────────────────────────────────────────│
│                                                     │
│  Was tut Rosa canina?                               │  ← Dialog-Box, depth 7
│                                                     │
│  [⚔️  Angriff]   [🌿 Fähigkeit]   [🌱 Item]  [🏃 Fliehen] │  ← Buttons
│                                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Info-Panel BG
└─────────────────────────────────────────────────────┘
```

---

## 2. HP-Balken Spec

| State | Farbe | Schwelle |
|---|---|---|
| Voll | `#9be36e` Primary Green | 67-100% |
| Mittel | `#fcd95c` Gold | 34-66% |
| Kritisch | `#ff4444` Rot | 1-33% |
| Leer | `#1a2820` Deep Forest | 0% |

**Animation bei Schaden:** HP-Balken animiert über 400ms (ease: Linear).
**Shake-Effekt:** Bei kritischem Treffer Balken kurz rot blinken (alpha 1→0.3→1, 200ms × 3).

---

## 3. Damage-Number Float-Up Spec

**Bereits implementiert (Score 2, R02).** Upgrade auf Score 4:

| Schaden-Typ | Farbe | Grösse | Animation |
|---|---|---|---|
| Normal | `#f0f0f0` Weiss | 16px | Float up 40px, fade, 600ms |
| Super-effektiv | `#fcd95c` Gold | 20px | Float up 60px, scale 1.0→1.3→1.0, fade |
| Kritisch | `#f4a832` Orange | 24px | Float up 80px, scale 1.0→1.5→1.0, shake, fade |
| KO-Hit | `#ff4444` Rot | 28px | Float up 100px, scale 1.0→2.0→0.8, Screen-Flash |
| Mutation | `#b06aff` Violet | 32px | Float up 80px, Partikel-Burst, slow-fade |
| Heilung | `#9be36e` Grün | 16px | Float DOWN 30px (nicht hoch), fade |

**Implementierungs-Hinweis:** Bestehender Code aus `BattleScene.ts` R02 hat Basisstruktur. Diese Spec erweitert Farb-Tier und Motion.

---

## 4. Battle-Button Layout (Phaser-Implementierung)

```
Bereich: y=420 bis y=480 (60px Höhe)
Canvas-Breite: 720px

[Angriff]     [Fähigkeit]   [Item]    [Fliehen]
x=60          x=220         x=380     x=540
Breite: 140px je
Höhe: 44px (WCAG Touch-Target)
Abstand: 20px je
```

**Button-States (konsistent mit Style Guide §4):**
- Idle: BG `0x000000` alpha 0.65, Stroke 2px Accent-Farbe
- Hover: scale 1.04, Stroke 3px
- Press: scale 0.96
- Disabled: alpha 0.35 (z.B. "Fliehen" bei bestimmten Boss-Encountern)

---

## 5. Status-Effekte Visualisierung

**Position:** Unter dem Pflanzennamen, rechts vom HP-Balken
**Icons:** 12x12px, je mit Tooltip bei Hover

| Status | Icon | Farbe | Beschreibung |
|---|---|---|---|
| Verbrennung | 🔥 | `#f4a832` | -5 HP/Runde |
| Vergiftung | 💜 | `#b06aff` | -8 HP/Runde, beschleunigt |
| Sonnenschutz | ☀️ | `#fcd95c` | +10% Heilung |
| Bewurzelt | 🌱 | `#9be36e` | Flucht blockiert |
| Erschöpft | 💤 | `#8eaedd` | Angriff -20% |

**Animation:** Aktive Status-Icons pulsieren langsam (alpha 1→0.6→1, 2000ms loop).

---

## 6. Victory / Defeat Screens

### Victory (bereits teilweise implementiert — Score 3)

```
┌─────────────────────────────────────────────┐
│                                             │
│          🎉 SIEG! 🎉                        │  ← Titel, gold, scale 0→1.2→1
│                                             │
│  Rosa canina hat gewonnen!                  │
│                                             │
│  XP: +42     ────────────────── Level Up?  │
│  Coins: +15  Münzen-Fall-Animation          │
│                                             │
│  [Konfetti-Regen von oben, 3s]              │  ← Bereits implementiert ✅
│                                             │
│  Loot:  [Samen-Icon]  Atropa-Samen ×1      │
│                                             │
│  [Weiter]                                   │
└─────────────────────────────────────────────┘
```

**Upgrade zu Score 4:** Münzen-Fall-Animation (10-15 Coin-Sprites fallen von oben, bouncing).

### Defeat

```
┌─────────────────────────────────────────────┐
│                                             │
│          🌿 Pflanze erschöpft...            │  ← lila Text, fade-in
│                                             │
│  Rosa canina muss sich erholen.             │
│  Sie kehrt in den Garten zurück.            │
│                                             │
│  [Zum Garten]    [Nochmal]                  │
└─────────────────────────────────────────────┘
```

---

## 7. Tech-Code Handoff-Punkte

| ID | Aufgabe | Priorität | FI-Impact |
|---|---|---|---|
| BATTLE-01 | Damage-Number Farb-Tier komplett implementieren | HOCH | Score 2→4 |
| BATTLE-02 | HP-Balken Shake bei kritischem Treffer | MITTEL | Score 3→4 |
| BATTLE-03 | Münzen-Fall-Animation im Victory-Screen | MITTEL | Score 3→4 |
| BATTLE-04 | Status-Effekt-Icons mit Pulse-Animation | NIEDRIG | Qualität |
| BATTLE-05 | Biom-Hintergrund-Animation (Wind-Partikel) | NIEDRIG | Score 3→4 |

**Hinweis Biom-Hintergrund:** Gleiche Partikel wie OverworldScene Ambient-System, nur weniger dicht (5-8 Partikel statt 15).
