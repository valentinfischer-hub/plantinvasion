# Sprint-DoD-Spec: FTUE Phase A — State + Persistence

**Sprint:** S-POLISH (verlängert bis 2026-05-17, D-042)
**Erstellt:** 2026-05-13 (Producer-Release)
**Assigniert:** Tech-Code
**Tier:** Tier-2 (FI-Critical Polish)
**Estimate:** 0.5h

---

## Pre-Conditions

- brain/design/ftue_spec.md vorhanden (Design-Balance, 507 Zeilen) ✅
- FTUEManager.reset() für QA-Testing ohne Save löschen nötig ✅
- T-088/T-089 (permadeath) blockt NICHT ✅ (bestätigt Tech-Code Response 2026-05-11)

---

## Items

### 1. FTUEState-Interface

**File:** `src/types/ftue.ts` (NEU)

```typescript
export interface FTUEState {
  step1Complete: boolean
  step2Complete: boolean
  step3Complete: boolean
  step4Complete: boolean
  step5Complete: boolean
  ftueComplete: boolean
  ftueStartedAt: number  // timestamp ms
}
```

### 2. Save-Migration

**File:** `src/data/storage.ts`

- Bestehende Saves erhalten alle FTUE-Flags = `true` (Spieler hat FTUE bereits erlebt)
- Migration idempotent (kein Re-Trigger wenn Flags bereits gesetzt)

### 3. FTUEManager-Singleton

**File:** `src/managers/FTUEManager.ts` (NEU)

- `getState(): FTUEState`
- `markStepComplete(step: 1|2|3|4|5): void`
- `isComplete(): boolean`
- `reset(): void` — für QA-Testing (setzt alle Flags auf false ohne Save zu löschen)
- Persistiert sofort nach jedem markStepComplete in localStorage via saveGame()

---

## Acceptance Criteria

- [ ] FTUEState-Interface exportiert aus `src/types/ftue.ts`
- [ ] Bestehende Saves erhalten nach Migration alle ftue-Flags = true
- [ ] FTUEManager.reset() setzt alle Flags auf false und persistiert
- [ ] FTUEManager.getState() gibt korrekte Werte nach Reload zurück
- [ ] Keine Console-Errors bei FTUEManager-Init

---

## Tests

- [ ] Vitest: reset() → getState() → alle false
- [ ] Vitest: markStepComplete(1) → step1Complete = true, andere = false
- [ ] Vitest: markStepComplete(1..5) → isComplete() = true
- [ ] Vitest: Save-Migration-Test: SaveState ohne ftueState → nach Migration alle true

---

## Files

| File | Aktion |
|---|---|
| src/types/ftue.ts | NEU |
| src/managers/FTUEManager.ts | NEU |
| src/data/storage.ts | EDIT — Migration + FTUEState einbinden |
| src/types/index.ts | EDIT — FTUEState re-exportieren |

---

## Nächster Schritt nach Phase A

Phase B: FTUE-Schritt-1-Dialog (Tilda-Begrüssung) in OverworldScene — separater Spec folgt nach Phase-A-Completion.

---

## Commit-Prefix

`feat(ftue): Phase A — FTUEState + FTUEManager + Save-Migration`
