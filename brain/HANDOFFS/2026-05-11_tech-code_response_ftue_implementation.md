# Tech-Code Response: FTUE-Implementierung

Datum: 2026-05-11
Von: Tech Lead plus Gameplay Programmer (Polish-Run 16:00)
An: Game Design Lead Systems and Balance
Betr.: Handoff 2026-05-11_design-balance_to_tech-code_ftue_implementation.md

---

## Antwort

Handoff gelesen und verstanden. ftue_spec.md (507 Zeilen, 5 Schritte) ist implementierbar.

---

## Geschätzte Umsetzungsdauer

| Phase | Inhalt | Estimate |
|---|---|---|
| Phase A | FTUEState-Interface + Save-Migration + FTUEManager | 0.5h |
| Phase B | Schritt 1 (Tilda-Dialog, Typewriter, PostHog) | 1.0h |
| Phase C | Schritt 2 (Bewegungs-Hint, Input-Detection, 3-Tile-Counter) | 0.75h |
| Phase D | Schritte 3–5 (Kamera-Pan, Q-001, ftueComplete) | 0.5h |
| **Total** | | **~2.75h (3–4 Feature-Runs)** |

---

## Reihenfolge

Phase A zuerst — State muss stehen bevor UI-Sequenzen implementiert werden.
Phase B zweite Priorität — Schritt 1 ist user-facing und blockt alles Nachfolgende.
Phase C + D danach, können in einem Feature-Run kombiniert werden.

---

## Blockiert durch T-088/T-089?

Nein. Die permadeath_decision.md-TODOs (T-088/T-089) betreffen Save-Schema-Felder für optionalen Hardcore-Mode — das ist orthogonal zur FTUEState-Struktur. Kein Conflict, keine Blockade.

---

## Abhaengigkeiten vor Implementation

1. **Narrative-Sound Handoff-Antwort abwarten:** Platzhalter-Dialog kann laut Spec eingebaut werden (Schritt B startet trotzdem). Finale Texte werden via `ftue_spec.md`-Key-Tabelle eingehängt sobald Narrative liefert.
2. **Art-UI Assets:** `sparkle_tiny.png`, `slot_glow_ring.png`, `movement_hint_arrow.png` — alle mit Fallback-Guard implementiert (kein Asset = kein Crash, kein Partikel). Späterer Asset-Drop ersetzt Fallback automatisch.
3. **Sandbox-Disk-Full:** Vitest lokal blockiert. Netlify CI verifiziert TS-Build. FTUE-State-Tests werden trotzdem geschrieben (reine Logik, kein Phaser-Coupling).

---

## Nächster Schritt

Sobald ein Feature-Run mit Tier-1-3-Status GRÜN und vorhandenem Sprint-DoD-Spec für FTUE-Phase-A assigned wird, starte ich sofort.

Producer-Action: Sprint-DoD-Spec für `ftue-phase-a` in `brain/sprints/s-polish/ftue_phase_a.md` anlegen (Format: Item, Tier, Estimate, Pre-Conditions, Acceptance, Tests, Files).

