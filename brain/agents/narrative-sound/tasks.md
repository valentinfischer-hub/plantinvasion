# Narrative-Sound Tasks

**Sprint:** S-POLISH (verlängert bis 2026-05-17, D-042)
**Cadence:** alle 2 Tage 14:00
**Direktive:** 90% Polish bestehender Sounds + Dialoge. Kein neuer Inhalt.
**First-Impression-Pflicht:** Heimatdorf-BGM + FTUE Tilda-Dialog = Priorität 1.
**Polish-Anteil messen:** Am Run-Ende Prozent in Log schreiben.

---

## REIHENFOLGE VERBINDLICH

### 1. Heimatdorf-Wurzelheim-BGM — Tone.js Placeholder (SOFORT, D-044)

**FI-Score-Ziel:** 1 → 3
**Entscheid:** D-044 (2026-05-13, Producer-Release) — Suno 503 gestern, Placeholder jetzt.

- Tone.js-Synth-Loop: warm, ruhig, 8-Takt, Biom-Charakter Wurzelheim (Garten-Atmosphäre)
- Vorbild: Struktur wie titleBgm.ts aber wärmer (Sinus + leichter Reverb, kein Distort)
- Volume: -18 dB gegen Master-Bus, loop = true, fade-in 2s beim Betreten des Bioms
- Datei: `src/audio/bgm/wurzelheimBgm.ts` (Tone.js, kein Asset-Load)
- Integration in OverworldScene: bei Zone-Enter `wurzelheimBgm.start()`, bei Zone-Exit `fade(0, 1s)`
- Commit: `feat(audio): wurzelheim-bgm tone.js placeholder (FI: 1→3)`

### 2. FTUE Tilda-Dialog — Antwort an Design-Balance

**Handoff:** brain/HANDOFFS/2026-05-11_design-balance_to_narrative-sound_ftue_dialog.md
**Auftrag:** Finale 3 DE-Sätze + EN-Übersetzungsvorschlag + VO-Casting-Notiz

Antwort-File: `brain/HANDOFFS/2026-05-13_narrative-sound_to_design-balance_ftue_dialog_response.md`

Anforderungen:
- Exakt 3 Sätze, max. 12 Wörter pro Satz
- Satz 2: Hook (Geheimnis andeuten)
- Ton: warm, geheimnisvoll, kein Pathos
- Platzhalter aus Handoff übernehmen oder besser machen

### 3. SFX-Layering bestehender Action-SFX (Polish, PRIO 2)

- Säen, Giessen, Ernten, Kreuzen/Bestäuben, Battle-Hit, Level-Up
- Min. 2 Layer pro SFX (Body + Detail)
- Tool: jsfxr (https://sfxr.me/) — kostenlos, kein API-Risk
- Format: OGG max 64kbps, `assets/audio/sfx/<context>_<layer>_<variant>.ogg`
- Stand laut FI-Audit: Erster Bestäubungs-SFX 4/5, Erste 5 SFX 4/5 — weiter polieren

### 4. Ambient-Loops (PRIO 3, wenn Schritt 1+2 erledigt)

- Verdanto, Kaktoria, Frostkamm, Salzbucht: je ein Tone.js-Placeholder
- Nach Wurzelheim-Pattern (Schritt 1)

### 5. Audio-Library-Inventur

- `brain/audio/library.md` mit Lizenz-Status pro Sample
- Nur wenn Zeit übrig nach Schritt 1+2

---

## Abgeschlossen (S-POLISH bisher)

- Title-BGM (FI-Score 4/5) ✅
- Erster Bestäubungs-SFX (FI-Score 4/5) ✅
- Erster Hybrid-Reveal-Stinger (FI-Score 4/5) ✅
- Erste 5 SFX (FI-Score 4/5) ✅

---

## Quality Gates

- Keine neuen Quests, Charaktere, Codex-Einträge, Dialoge ausser explizit erlaubt
- Tone.js-Placeholder sind erlaubt als Polish (kein API-Cost-Risk)
- Polish-Anteil ≥ 90% pro Run dokumentieren
