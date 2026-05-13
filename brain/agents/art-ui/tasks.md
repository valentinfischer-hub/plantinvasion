# Art-UI Tasks

**Sprint:** S-POLISH (verlängert bis 2026-05-17, D-042)
**Cadence:** täglich 10:00
**Direktive:** 90% Polish. Keine neuen Assets ohne Producer-Freigabe.
**First-Impression-Pflicht:** FTUE-Flow visuell + Tilda-Sprite = Score-Ziel ≥ 4.

---

## REIHENFOLGE VERBINDLICH

### 1. Tilda-Sprite-Idle (FI-Score 2→4, PRIO 1)

- Idle-Breathing-Animation: 4 Frames, Phaser-AnimationManager
- Procedural-Fallback falls PixelLab-Cost-Freeze läuft
- Spec: brain/design/wireframes/ (anlegen wenn nicht vorhanden)
- FTUE-Schritt 1 nutzt Tilda-Sprite — Score-Blocker für FTUE

### 2. Bestäubungs-Animation (FI-Score 2→4, PRIO 1)

- Spec brain/design/wireframes/breeding_animation_spec.md schreiben
- 3 Lagen: Pollen-Arc + Licht-Bloom + Zauber-Glow
- Handoff an Tech-Code nach Spec-Fertigstellung

### 3. Loading-Indicator (FI-Score 3→4, PRIO 2)

- Handoff an Tech-Code bereits erstellt (2026-05-11)
- Wenn Tech-Code nicht implementiert bis 2026-05-14: direkt in SplashScene.ts einbauen
- Option A (Pulsierendes 🌱): Puls-Tween 700ms + Dots-Animation

### 4. FTUE Visual-Assets (abhängig von Tech-Code Phase B)

- sparkle_tiny.png (Pixel-Art, 8x8)
- slot_glow_ring.png (Pixel-Art, 32x32 Ring-Frame)
- movement_hint_arrow.png (Pixel-Art, 16x16, animiert 2 Frames)
- Alle als Fallback-Guard implementieren (fehlendes Asset = kein Crash)

### 5. Wireframes schreiben

- breeding_animation_spec.md ✅ (schreiben)
- battle_ui_spec.md (als nächstes)
- inventory_grid_spec.md

---

## Abgeschlossen (S-POLISH bisher)

- Favicon + Tab-Title (Score 5) ✅
- Title-Screen-Logo Polish (Score 3) ✅
- New-Game-Button Hover+Press (Score 4) ✅
- Pollen-Partikel-Emitter MenuScene ✅
- Style-Guide v1.1 ✅
- UI-Spec v1.1 ✅
- brain/assets/icon.svg ✅

---

## Quality Gates

- PixelLab: nur mit Producer-Freigabe (Budget 5 USD/Session)
- Cloudinary: nur wenn Asset deployed werden soll
- FI-Pflicht: ≥ 1 FI-Item pro Run um ≥ 1 Punkt heben (D-041)
- tsc --noEmit grün nach jedem Code-Edit
