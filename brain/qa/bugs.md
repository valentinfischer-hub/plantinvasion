# Plantinvasion Bug-Tracker

## Konvention
- ID-Schema: B-NNN (chronologisch).
- Status: OPEN, IN_PROGRESS, RESOLVED, WONTFIX.
- Bei RESOLVED immer Commit-Hash + Datum.

## Bugs

### B-012 RESOLVED 2026-04-27
**Title:** Saeen-Modal: User wusste nicht warum eine Pflanze nicht eingesaet werden konnte.

**Symptom:**
- Bei vollem Garten zeigte das Modal nach Klick auf einen Seed nur einen generischen Toast "Fehlgeschlagen" oder den vermischten Reason "Kein freier Slot oder unbekannte Spezies".
- User konnte nicht ableiten ob das Inventar leer ist, ob die Spezies fehlt oder ob alle Slots belegt sind.

**Root-Cause:**
- `gameStore.plantSeed` warf einen einzigen Reason-String fuer zwei voellig verschiedene Failure-Faelle (volle Garten vs unbekannte Spezies).
- `GardenScene.openSeedPlantModal` machte keinen Vorab-Check auf freie Slots, oeffnete also das Modal und zeigte den Fehler erst nach Seed-Klick.

**Fix V0.1 (Auto-Slot-Pick, dieser Commit):**
- Neuer Helper `gameStore.getFreeSlotCount(): number`.
- `plantSeed` splittet Reason: "Garten voll. Ernte oder verschiebe Pflanzen." vs "Unbekannte Spezies".
- Modal macht Vorab-Check: bei 0 freien Slots wird Modal gar nicht mehr geoeffnet, stattdessen direkter Toast.
- Modal-Title zeigt jetzt freie Slot-Anzahl: "Pflanze einsaeen (N frei)".
- Auto-Slot-Pick (`findFreeGridSlot`) blieb unveraendert, war bereits aktiv.

**Fix V0.2 (Slot-First-UI, Folge-Run):**
- Geplant: User waehlt zuerst Slot per Klick im Garten, dann erscheint Seed-Auswahl-Modal mit nur den Seeds die in den gewaehlten Slot passen (z.B. Biom-Match).

**Tests:**
- `src/state/__tests__/plantSeed.b012.test.ts` (6 Tests, alle gruen).
- Coverage: `getFreeSlotCount` 100%, `plantSeed` Reason-Branches 100%.

**Hinweis Provenienz:**
- Der referenzierte QA-Critic-Report `brain/agents/qa-critic/critical_2026-04-26_12.md` existierte zum Zeitpunkt des Fix nicht im Repo. Tech-Code hat das Problem im Self-Audit der `GardenScene.openSeedPlantModal`-Sequenz identifiziert. QA-Critic-Doku waere ein Folge-Item.

**Commit:** wird nach Push hier eingetragen.
