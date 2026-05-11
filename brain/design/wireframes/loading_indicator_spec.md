# Loading-Indicator Spec — Plantinvasion SplashScene

**Version:** 1.0 (Art-UI R2, 2026-05-11)
**Owner:** Art-UI Agent
**Ziel:** FI-Score "Loading-Indicator-Animation" 3→5
**Implementierung durch:** Tech-Code (SplashScene.ts)
**Aktueller Zustand:** "lade Assets 0%" in plain monospace — kein Character, kein Branding

---

## 1. Problem (aus QA-Audit 2026-05-11)

Aktuell zeigt SplashScene:
- Plain monospace Text "lade Assets 0%" (kein Stil)
- Kein botanisches Branding
- Kein Persönlichkeits-Moment im Loading-State
- Score 3/5 (Stardew zeigt animierte Blätter + Ladeprozentsatz in illustrierter Schrift)

---

## 2. Soll-Zustand (Score 5/5)

### ASCII-Wireframe SplashScene (720x540)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              🌱 Plantinvasion                       │  ← Titel-Logo (existing, polished)
│                                                     │
│         ━━━━━━━━━━━━━━━━━━━━━━━━━━━                 │  ← Ladebalken
│         ████████████▒▒▒▒▒▒▒▒▒▒▒▒ 47%               │  ← grüner Progress
│                                                     │
│           ≋ Biome werden vorbereitet ≋              │  ← Ladetexte rotierend
│                                                     │
│         🌿   🌵   🌸   🌾   🦠                      │  ← Biom-Icons, subtle bounce
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 3. Ladebalken Spec

**Dimensionen:**
- Breite: 320px
- Höhe: 12px
- X: Canvas.Width/2 - 160
- Y: Canvas.Height/2 + 30

**Styling:**
- Hintergrund: `0x2d3a2a` alpha 0.8 (Card Dark), Stroke 1px `#9be36e`
- Fortschritt: `#9be36e` Primary Green, gefüllt entsprechend Prozent
- Eckradius: 6px (Graphics.fillRoundedRect)
- Kein Text im Balken selbst (Prozent steht separat darunter)

**Prozent-Anzeige:**
- Font: monospace 11px
- Farbe: `#9be36e`
- Position: Rechts vom Balken, vertikal zentriert
- Format: "47%" (nur Zahl + Prozentzeichen, kein "lade Assets")

**Animation:**
- Progress-Bar füllt sich von links nach rechts (Phaser.GameObjects.Graphics redraw)
- Bei 100%: kurzer Grün-Flash (alpha 0→0.3→0, 200ms), dann fade-out

---

## 4. Rotierende Ladetexte

**Intervall:** alle 800ms wechselt der Ladetext (fade-crossfade 200ms)
**Font:** monospace 12px, Farbe `#8a6e4a` Earth Brown (gedimmt, nicht dominant)

Texte (DE):
```
"Biome werden vorbereitet..."
"Pflanzen-DNA wird geladen..."
"Gärten werden angelegt..."
"Bestäuber sind unterwegs..."
"Genetische Sequenzen analysiert..."
"Samenbank wird befüllt..."
"Botanopia erwacht..."
```

**Implementierung:** Array, Index via `Math.floor(elapsed / 800) % texts.length`

---

## 5. Biom-Ikon-Reihe

**Position:** y = Canvas.Height/2 + 80 (unter dem Ladebalken)
**Icons:** Phaser.GameObjects.Text mit Unicode-Emojis, 20px, spacing 40px
**Liste:** 🌿 (Wurzelheim) 🌵 (Kaktoria) 🌸 (Verdanto) ❄️ (Frostkamm) 🌊 (Salzbucht)

**Animation:**
- Jedes Icon bounced leicht (y +3 → -3, ease: Sine.InOut, 1200ms, loop)
- Stagger: 200ms zwischen je Icon (ergibt Welleneffekt)
- Alpha 0.6 (gedimmt, nicht dominant)

---

## 6. Fortschritts-Tracking

Phaser's `this.load.on('progress', callback)` liefert Wert 0.0–1.0.

```typescript
this.load.on('progress', (value: number) => {
  const pct = Math.floor(value * 100);
  // Redraw progress bar
  this.drawProgressBar(pct);
  // Percent text
  this.pctText.setText(`${pct}%`);
});
```

**Sonderfall leer (0 Assets):** Balken zeigt sofort 100% und springt direkt weiter (bereits via B-027-Fix gehandhabt).

---

## 7. A11y

- Kein Blink-Rate-Problem (Bounce ist <3Hz, kein Epilepsie-Risiko)
- Kontrast Ladetext `#8a6e4a` auf `#1a2820` Background: Ratio 3.8:1 (WCAG AA für Non-Text)
- Prozent-Text `#9be36e` auf `#1a2820`: Ratio 5.2:1 (WCAG AA ✅)

---

## 8. Tech-Code Handoff

| ID | Aufgabe | Priorität |
|---|---|---|
| SPLASH-01 | Ladebalken 320×12px mit grünem Progress und Stroke ersetzen | HOCH |
| SPLASH-02 | Rotierende Ladetexte (Array + crossfade) | HOCH |
| SPLASH-03 | Biom-Icons Bounce-Welle | MITTEL |
| SPLASH-04 | Prozent-Zahl rechts vom Balken | HOCH |

**Hinweis:** SplashScene hat bereits B-027-Fix mit window.setTimeout. Partikel-System (pollen_dot) läuft. Loading-Indicator-Upgrade ersetzt nur den `this.add.text(..., 'lade Assets 0%')` Teil.
