# Plantinvasion Style Guide

**Version:** 1.1 (FI Art-UI R1, 2026-05-11)
**Owner:** Art-UI Agent
**Referenz:** Stardew Valley + Pokemon Rot. Cozy, handcrafted, botanisch.

---

## 1. Farbpalette

| Rolle | Hex | Verwendung |
|---|---|---|
| Primary Green | `#9be36e` | Titel, Haupt-CTA, Rahmen, Bestäubigungs-Akzent |
| Gold / XP | `#fcd95c` | Sekundär-CTA, XP-Indikatoren, Warnungen |
| Warm Orange | `#f4a832` | Diagonal-Petals, Crit-Damage, Tier-3-Akzent |
| Earth Brown | `#8a6e4a` | Subtitles, Boden-Texte, Sekundär-Infos |
| Deep Forest | `#1a2820` | Haupt-Hintergrund, Canvas-BG |
| Card Dark | `#2d3a2a` | Panel-Hintergrundfarbe, Favicon-BG |
| Mineral Blue | `#8eaedd` | Settings-Button, Informations-Texte |
| Pristine White | `#f0f0f0` | Normal-Damage, Dialog-Body-Text |
| Mutation Violet | `#b06aff` | Mutations-Damage-Numbers, Hybrid-Reveal |

### Damage-Farb-Tier
weiss (normal) → `#fcd95c` gelb (super-effektiv) → `#f4a832` orange (crit) → `#ff4444` rot (KO-Hit) → `#b06aff` violett (Mutation)

---

## 2. Typografie

**Aktuelle Font:** `monospace` (System-Fallback)
**Glyph-Pflicht:** ä ö ü ß müssen vorhanden sein (DE-Strings).

### Grössenregel: max 3 Stufen pro Scene

| Stufe | Grösse | Verwendung |
|---|---|---|
| H1 (Titel) | 36px | Scene-Titel, Logo |
| H2 (Section) | 16px | Panel-Titel, Dialog-Titel |
| Body | 11–12px | Fliesstext, Labels, Tooltips |

**Niemals:** 4 verschiedene Schriftgrössen in einer Scene.

### Text-Style-Qualität (ab FI R1 für Titel)
- Stroke: `#1a4a0e`, strokeThickness: 4
- Shadow: offsetX 2, offsetY 3, color `#000000`, blur 8

---

## 3. Spacing

| Name | Wert | Anwendung |
|---|---|---|
| Compact | 8px | Zwischen Label und Wert, enge UI-Elemente |
| Normal | 16px | Button-Innenabstand, Panel-Padding |
| Section | 24px | Zwischen UI-Sektionen, Dialog-Blöcke |

**DE-Headroom-Regel:** Alle Text-Container brauchen +30% Breite-Headroom für DE-Strings (DE ist im Schnitt 30% länger als EN).

---

## 4. Buttons

| Eigenschaft | Wert |
|---|---|
| Breite | 220px |
| Höhe | 44px (WCAG Touch-Target) |
| BG-Idle | `0x000000` alpha 0.65 |
| Stroke-Idle | 2px, Accent-Farbe |
| Hover | scale 1.06, stroke 3px, BG-Tint alpha 0.12 |
| Press | scale 0.96, BG-Tint alpha 0.35 |
| Disabled | alpha 0.4, kein Hover-Effekt |
| Label-Font | monospace 14px |
| Touch-Target | min 44x44px (WCAG AA) |

---

## 5. Animationen

### Tween-Easing-Standards
| Situation | Ease |
|---|---|
| Reveal / Einblend | `Back.Out` |
| Fade-Out | `Cubic.Out` |
| Idle-Float | `Sine.InOut` |
| Button-Hover | `Back.Out` (schnell, 150ms) |
| Bestäubungs-Final | `Back.easeOut` (bouncy) |

### Timing-Standards
| Animation | Dauer |
|---|---|
| Scene-Fade-Out | 200–480ms |
| Button-Hover | 150ms |
| Button-Press | 80ms |
| Title-Reveal | 700ms |
| Damage-Float-Up | 600ms |
| Tagline-Cross-Fade | 400ms pro Seite |

---

## 6. Partikel-System

### Blütenstaub (MenuScene, Hintergrund)
- Textur: `pollen_dot` (dynamisch generiert, 8x8px Kreis)
- Farben: `#fcd95c`, `#9be36e`, `#f4a832`, `#d4f5a0`
- Max Partikel: 30 (60fps-Budget einhalten)
- Frequenz: 1 pro 450ms
- Lebensdauer: 5–9s
- Richtung: aufwärts (speedY -8 bis -22)
- BlendMode: ADD

---

## 7. Icons und Favicon

### Favicon (ab FI R1, 2026-05-11)
- Datei: `public/icon.svg` (512x512 viewBox)
- Motiv: Stilisierte Sonnenblume (Sonnenherz-Spezies)
- 8 Blütenblätter (gelb + orange alternierend), braune Mitte mit Textur-Punkten, Forest-Green Hintergrund
- Fallback: Inline SVG mit gleicher Sonnenblume (für ältere Browser)
- Apple Touch Icon: `/icon.svg` (iOS 14.5+ SVG-Support)
- PWA Manifest: `/manifest.json`

---

## 8. Internationalisierung (D-I18N-DE-EN)

- DE = Source-of-Truth-Sprache
- EN = Auto-Translation (EN-VO erst Open-Beta)
- Button-Label Hard-Limits: max 12 Zeichen DE, max 16 Zeichen EN
- Bei Überschreitung: 2-Zeilen-Layout oder Icon+Tooltip
- Truncation: Ellipsis nach max-Width, Tooltip mit vollem Text
- Sprite-Generierung: kein Text auf Sprites (sprachunabhängig)
- Tutorial-Schilder: zwei Varianten DE+EN bei Bedarf

---

## 9. Accessibility (WCAG AA)

- Mindest-Schriftgrösse Browser: 14px
- Mindest-Schriftgrösse Mobile: 18px
- Kontrast: WCAG AA (4.5:1 für Body, 3:1 für Gross-Text)
- Touch-Targets: min 44x44px
- Findings dokumentiert in `brain/design/a11y_log.md`

---

## 10. NPC-Charakter-Visual-Referenzen

### Tilda Wurzelreich (npc_tilda)
- **Rolle:** Grossmutter-Botanikerin, legendäre Forscherin, vermisst seit 15 Jahren
- **Alter:** 75+ (erscheint im Finale, aber taucht als Flashback/Portrait früh auf)
- **Stil:** Grüner Reise-Mantel mit botanischer Stickerei, silbergraues Haar im Dutt (Holznadel), Leder-Samen-Beutel am Gürtel, getrocknete Sonnenblume als Wanderstab
- **Farbpalette:** Mantel `#3a5a2a`, Haare `#c8c8c8`, Haut `#c4956a`, Beutel `#8a6e4a`
- **Ton:** Warmherzig, weise, leicht gebückt von jahrzehntelanger Feldarbeit
- **Sprite-Priorität:** HOCH (Tilda-Sprite-Idle FI-Score 2→4)
- **PixelLab-Prompt:** in `brain/assets/pixellab_prompts.md`
- **Platzhalter bis Sprite generiert:** `npc_clara`

### Iris Salbeyen (npc_iris)
- **Rolle:** Wandernde Forscherin, taucht in jedem Biom einmal auf, kennt Tilda persönlich
- **Alter:** 65
- **Stil:** Langes graues Haar offen, Drahtbrille, schlichtes grau-grünes Reisekleid, langer Eichenholz-Stab, Ledertasche voller Samen und gepresster Blumen, barfuss
- **Sprite-Priorität:** MITTEL (Akt 2+)
- **Platzhalter bis Sprite generiert:** `npc_anya`

### Anya Schauer (npc_anya) — bereits vorhanden
- **Rolle:** Markt-Händlerin in Wurzelheim, Tildas beste Freundin
- **Sprite:** `npc_anya.png` ✅ (generiert, in Verwendung)

---

## 11. Asset-Naming-Convention

```
assets/sprites/plants/<family>/<species>_<stage>.webp
assets/sprites/tiles/<type>_v<variant>.webp
assets/atlases/<set>_sprint_<n>.webp + .json
public/icon.svg
public/manifest.json
```

ASCII-only für Dateinamen (Cross-Platform Best Practice).
