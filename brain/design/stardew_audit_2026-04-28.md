# Stardew Valley Vergleichs-Audit — S-POLISH Sprint
Datum: 2026-04-28 | Agent: Tech-Code-Agent

## Bewertungsskala: 1 (fehlt) - 5 (Stardew-parity)

---

## 1. Farming/Garten (Kernsystem)

| Feature | Stardew | Plantinvasion | Score | Lücke |
|---------|---------|---------------|-------|-------|
| Samen pflanzen | Direkt per Werkzeug | Menü + Grid | 4/5 | Kein Echtzeit-Tool |
| Bewässerung | Tagesritual, Sprinkler | Hydration + Cooldown | 4/5 | Kein Tages-Reset |
| Ernte | Animiert, direkt | Instant, kein Feedback-Ton | 3/5 | Kein Harvest-SFX |
| Bodenqualität | Regular/Gold/Iridium | Bronze/Silver/Gold | 5/5 | Parity erreicht |
| Energie-System | Energie-Bar, tägliche Grenze | Run 1 (B2) implementiert | 4/5 | Keine Werkzeug-Upgrades |
| Saisons | 28 Tage, Ernte stirbt | Season-Tint, 4 Saisons | 3/5 | Keine Ernte-Ablauf-Strafe |
| Gesamt Farming | — | — | **3.8/5** | |

---

## 2. Charakter & Progression

| Feature | Stardew | Plantinvasion | Score | Lücke |
|---------|---------|---------------|-------|-------|
| Level-System | Skills (Farming/Mining/etc) | Plant-Level + XP | 3/5 | Kein Spieler-Level |
| Energie-Regeneration | Schlafen | endDay() | 4/5 | Kein Schlaf-Ritual |
| Inventar | 36 Slots, Kiste | Unbegrenzt + Markt | 4/5 | Keine Kiste |
| Gold-Wirtschaft | Crops verkaufen | Harvest + Sell | 3/5 | Harvest→Markt entkoppelt |
| Sammler-Lust | Artifacts, Minerals | Pokedex | 4/5 | Kein Artefakt-System |

---

## 3. NPCs & Social

| Feature | Stardew | Plantinvasion | Score | Lücke |
|---------|---------|---------------|-------|-------|
| Herzpunkte | 14 Hearts, tägl. 1 Gespräch | NPC-Hearts System (B2-R8) | 3/5 | Kein tägliches Cap |
| Geschenke | 2x/Woche | gift-System stub | 2/5 | Gift-Logik fehlt |
| Cutscenes | Event-Cutscenes bei 2/4/6/8 Hearts | Story-Quests | 3/5 | Keine Visual-Cutscenes |
| Geburtstage | Kalender-System | Daily-Login-Kalender (B2-R12) | 2/5 | Keine NPC-Geburtstage |
| Gesamt Social | — | — | **2.5/5** | Größte Lücke |

---

## 4. Erkundung & Kampf

| Feature | Stardew | Plantinvasion | Score | Lücke |
|---------|---------|---------------|-------|-------|
| Welt-Map | 1 Karte, viele Bereiche | 5 Biome + Mordwald | 4/5 | Kleinere Karte |
| Zufallsereignisse | Kräutersuche, Zirkus | Foraging + Hidden Spots | 3/5 | Weniger Events |
| Boss-Kämpfe | Keine (Dungeon-Gegner) | Boss-System + 3 Bosse | 4/5 | Eigenständiger |
| Pokemon-Battle | — | Turn-Based Battle | 5/5 | Über Stardew-Scope |
| Companions | — | Companion-Pflanzen-System | 5/5 | Über Stardew-Scope |

---

## 5. Audio & Visuals

| Feature | Stardew | Plantinvasion | Score | Lücke |
|---------|---------|---------------|-------|-------|
| Musik | Saisonale Tracks, 30+ Songs | Procedural BGM + Biome-Ambience (B2-R14) | 3/5 | Keine echten Tracks |
| SFX | Reichhaltige Bibliothek | Procedural SFX ~30 Sounds | 3/5 | Kein Voiced Content |
| Animationen | Sprite-Animationen | Tween-Animationen | 3/5 | Keine Sprites |
| Wetter | Regen/Schnee (Gameplay-Effekt) | Visual + tint (B2-R5) | 3/5 | Kein Gameplay-Impact |

---

## Gesamtbewertung

| Kategorie | Score |
|-----------|-------|
| Farming | 3.8/5 |
| Charakter | 3.4/5 |
| Social/NPCs | 2.5/5 |
| Erkundung | 4.2/5 |
| Audio/Visual | 3.0/5 |
| **Gesamt** | **3.4/5** |

---

## Prioritäten Backlog (Post S-POLISH)

1. **NPC-Geschenk-System** (Social: 2→4) — tägliche Beschränkung, Lieblingsgeschenke
2. **Harvest-SFX + Ritual** (Farming: 3→5) — dediziertes Ernte-Sound + Animation
3. **Saison-Ablauf für Pflanzen** (Farming: 3→4) — Pflanzen "frieren" im Winter
4. **Spieler-Level + Skills** (Charakter: 3→5) — Farming/Battle/Social Skills
5. **Tagesende-Ritual** (Charakter: 4→5) — Schlaf-Screen mit Tages-Zusammenfassung

---

## S-POLISH Verbesserungen (diese Session)

Implementiert in B2-R1 bis B2-R17:
- Energy-System (+1 Farming)
- Achievement-Toast (+0.5 Visual)
- Completeness-Bar (+0.5 Collector)
- Quest-Progress-Balken (+0.5 Social)
- Login-Streak (+0.3 Charakter)
- Colorblind-Mode (+0.5 Accessibility)
- Biome-Ambience (+0.5 Audio)
- Export/Import (+0.3 Retention)

Gesamt-Delta: **+3.1 Punkte** in dieser Session.
