# Story-Akt-2 Spec

**Item:** Story-Akt-2 "Verdanto-Erkundet"
**Tier:** 4
**Estimate:** L (60-90 Min)
**Pre-Conditions:**
- `storyAct1.ts` V0.1 live (evaluateAct1Progress + autoSetAct1Flags).
- `OverworldScene.ts` Story-Akt-1-Integration live (diary-entry 1, advancesAct, met_iris flag).
- Vitest 613/613 gruen, TS-strict gruen vor Start.

---

## Acceptance Criteria

1. **evaluateAct2Progress** pure-function in `src/data/storyAct2.ts`: nimmt `flags` + `plants`-Array, gibt `'pending' | 'in-progress' | 'completed'` zurueck. Completed wenn `bromelien_collected >= 3` AND `verdanto_explored` flag gesetzt.

2. **autoSetAct2Flags** pure-function in `src/data/storyAct2.ts`: setzt `verdanto_explored = true` wenn Spieler Verdanto-Zone je besucht hat (`gameStore.getVisitedZones().includes('verdanto')`), und `bromelien_collected` = Anzahl der Bromelien-Samen im Inventar (Slug: `seed-bromelia`).

3. **Quest-Integration**: Neuer Quest-Eintrag in `src/data/quests.ts`:
   - `id: 'act2-bromelien-sammeln'`, `giverId: 'iris-salbeyen'`, Titel/Description auf DE.
   - `goal.type: 'have-item'`, `goal.itemSlug: 'seed-bromelia'`, `goal.count: 3`.
   - `reward.coins: 75`, `reward.items: { 'compost-tea': 2 }`.
   - `requiredFlag: 'met_iris'` (nur sichtbar nach Akt-1-Iris-Dialog).
   - `advancesAct: 2`, `diaryEntry: 2`, `setsFlag: 'verdanto_erkundet'`.

4. **OverworldScene.ts Akt-2-Tick**: analog zum Akt-1-Block in `update()` — `autoSetAct2Flags` aufrufen wenn `currentAct >= 1`, Flags bei Aenderung via `gameStore.setStoryFlag` setzen, `evaluateAct2Progress` pruefen und bei `completed` + `currentAct < 2` via `gameStore.advanceAct(2)` advance + Tagebuch-Entry 2 collecten + Toast.

5. **Achievement "verdanto_erkundet"**: Neuer Eintrag in `src/data/achievements.ts` — slug `verdanto_erkundet`, name `'Verdanto-Erkundet'`, description `'Du hast Verdanto zum ersten Mal erkundet.'`, icon `'leaf'`. Wird via `gameStore.unlockAchievement` getriggert wenn Flag `verdanto_erkundet` gesetzt wird.

6. **Diary-Entry 2**: `src/data/diaryEntries.ts` (oder equivalent) erhaelt Eintrag 2 — Titel `'Verdanto – Land der Bromelien'`, Body ca. 2 Saetze auf DE, unlocked via `collectDiaryEntry(2)`.

---

## Tests (Vitest-Plan)

**Datei:** `src/data/__tests__/storyAct2.test.ts`

- `evaluateAct2Progress`: gibt `pending` wenn keine Flags gesetzt.
- `evaluateAct2Progress`: gibt `in-progress` wenn `verdanto_explored=true` aber `bromelien_collected < 3`.
- `evaluateAct2Progress`: gibt `completed` wenn beide Bedingungen erfuellt.
- `autoSetAct2Flags`: setzt `verdanto_explored` korrekt wenn Zone in visitedZones.
- `autoSetAct2Flags`: setzt `bromelien_collected` korrekt auf Inventar-Count.
- `autoSetAct2Flags`: gibt unveraendertes Objekt zurueck wenn keine Aenderung (referentielle Stabilitaet).
- Edge-Case: `evaluateAct2Progress` mit leeren flags gibt `pending`.

**Datei:** `src/data/__tests__/quests.test.ts` (bestehend erweitern)
- Quest `act2-bromelien-sammeln` existiert in QUESTS-Array.
- Quest hat `requiredFlag: 'met_iris'`.
- Quest reward.coins === 75.

Mindest-Ziel: Gesamt-Test-Count >= 620 (+7 neue Tests).

---

## Files

| Datei | Aktion |
|---|---|
| `src/data/storyAct2.ts` | NEU erstellen |
| `src/data/__tests__/storyAct2.test.ts` | NEU erstellen |
| `src/data/quests.ts` | ERWEITERN (1 neuer Quest-Eintrag) |
| `src/data/achievements.ts` | ERWEITERN (1 neues Achievement) |
| `src/scenes/OverworldScene.ts` | ERWEITERN (Akt-2-Tick in update()) |
| `brain/sprints/S-10/story-akt-2.md` | DIESES DOKUMENT |

---

## Risiken / Notizen

- **Diary-Entries-System:** Je nach Implementierung existiert ggf. kein zentrales `diaryEntries.ts`. In dem Fall Eintrag direkt als String-Literal in `gameStore.collectDiaryEntry(2, 'Verdanto – Land der Bromelien...')` inline. Vor Start pruefen.
- **visitedZones in gameStore:** `getVisitedZones()` Methode muss verfuegbar sein oder alternativ via `gameStore.get().visitedZones`. Vor Start pruefen und ggf. Getter ergaenzen.
- **Time-Box:** Bei >75 Min Stop, Hand-Off-Note schreiben was noch fehlt.

---

*Provenienz: Tech-Code-Agent 12:00-Run 2026-04-28 (S-10 Self-Approval-Window).*
