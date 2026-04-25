# Biom: Magmabluete (Vulkan-Pyrophyt)

## Vibe und Konzept
Aktiver Vulkan-Hang mit fliessenden Lava-Adern, Asche-Boden und feuerresistenten Pflanzen (Pyrophyten). Atmosphaere zwischen Hawaii Volcanoes National Park und Mordor. Im Kontrast zum kalten Frostkamm steht Magmabluete fuer extreme Hitze und beschleunigtes Wachstum durch vulkanische Mineralien.

Lore-Anker: Pflanzen die hier wachsen haben sich an Hitze angepasst und gedeihen sogar besser durch Mineral-reiche Asche. Der Vulkan ist saisonal aktiv. Spieler kann Aschen sammeln als Premium-Duenger fuer Heimat-Garten.

## Tile-Aesthetik
- **Boden**: schwarz-grauer Asche-Boden mit gluehenden Adern (animiert via tween orange-rot)
- **Lava-Tiles**: fliessend, animierte Magma mit Rot-Orange-Gelb-Gradient. Damage-Tile (siehe Mechanik unten)
- **Felsen**: dunkle Basalt-Saeulen, schwarz mit gelegentlichen Glut-Rissen
- **Atmospheric Effects**: Hitze-Wabern (Phaser-Shader), gelegentliche Aschepartikel von oben, glimmender Funkenflug
- **Tile-Palette**: 4 Asche-Boden-Tiles, 3 Lava-Tiles, 3 Basalt-Felsen, 2 verkohlte-Stumpf-Tiles

## Hitze-Damage-Mechanik (NEU)
Lava-Tiles geben dem Spieler bei Beruehrung 5 HP Damage und nimmt 10% Plant-Hydration vom aktiven Pokedex-Pflanzen. Visualisiert mit kurzem rot-Flicker und SFX (Sizzle).

Pyrophyt-Spezies sind immun gegen Lava-Damage (Player-immun gilt nicht, nur Plant-Hydration-Reduction wird umgangen).

Unterschied zu Frostkamm-Frost-Damage (analog): Lava ist instant Damage on Touch, Frost ist over-Time waehrend Aufenthalt.

## Encounter-Pool (5 Pflanzen)
Echte Pyrophyten und feuerresistente Pflanzen.

| Slug | Wissenschaftlich | Common | Rarity | Stat-Bias | Pref-Biom | Falsches Biom |
|------|------------------|--------|--------|-----------|-----------|---------------|
| fire-lily | Cyrtanthus ventricosus | Fire Lily | 3 | atk +20 / def -10 / spd +5 | magmabluete | frostkamm, salzbucht |
| banksia | Banksia attenuata | Banksia | 3 | atk +5 / def +20 / spd -10 | magmabluete, kaktoria | mordwald |
| serotinous-pine | Pinus contorta | Lodgepole Pine | 4 | atk +10 / def +25 / spd -10 | magmabluete, frostkamm | mordwald |
| protea | Protea cynaroides | King Protea | 4 | atk +15 / def +10 / spd 0 | magmabluete, kaktoria | frostkamm |
| eucalyptus | Eucalyptus regnans | Mountain Ash | 5 | atk +25 / def +5 / spd +0 | magmabluete | salzbucht |

Encounter-Frequenz: Mittel (8% pro Schritt). Wild-Levels: 25-40. Encounter sind ATK-lastig mit Burn-Effekten.

### Spezial-Encounter
- **Eucalyptus regnans** spawnt nur in der innersten Krater-Region nach Boss-Quest-Completion.

## NPC-Konzept
- **Vulkan-Schmied Ignis**: lebt in Lava-Beschuetzter Schmiede. Bietet "Hitze-Verstaerkungen" (Item-Upgrades) gegen Vulkangestein.
- **Asche-Sammlerin Cinder**: wandernde NPC die Asche-Items kauft. Asche ist als Duenger-Item fuer Garden-Spieler attraktiv (+1.5x Wachstum fuer 1h auf eine ausgewaehlte Pflanze).

## Saisonalitaet
- Vulkan hat 3 Phasen: Ruhend (75% der Zeit), Aktiv (20%, mehr Lava-Spawns), Eruption (5%, Boss-Trigger)
- Phase wird per Real-Time-Tag-Cycle wechselnd, optional Save-Trigger via Quest

## Items im Loot-Pool
- Vulkan-Asche (Duenger, +1.5x Wachstum 1h auf eine Pflanze)
- Magma-Splitter (Crafting fuer Stat-Boost-Items)
- Pyrolyse-Knospe (Lure-Item, zieht ATK-lastige Encounter an)
- Phoenix-Same (extrem rar, 0.5% Drop, Zucht-Trigger fuer Endgame-Pflanze)

## Boss-Konzept "Magmaherz Eucalyptus Inferno"
- Level 65 Boss in der innersten Krater-Region
- Multi-Phase-Battle: Phase 1 = ATK-Sturm, Phase 2 = Heal-Trick mit Lava-Wellen, Phase 3 = One-More-Time-Burst
- Drop: "Phoenix-Brand-Same" als Trophaee fuer Pokedex-Vervollstaendigung
- Trigger: Player muss zuerst alle 5 Pyrophyt-Spezies einmal gefangen haben

## Sub-Region: Schwefel-Quelle
Heisse Quelle mit Schwefel-Geysiren. Healing-Effekt auf Spieler (+20 HP per 5 Sekunden Aufenthalt). Spawn-Pool fuer einzigartige "Sulfur-Lily" Mutation.

## Pflanz-Plot (S-09 Feature)
Wenn der Spieler in S-09 Outdoor-Plots in Magmabluete pflanzen kann, sind Pyrophyt-Pflanzen dort 1.4x preferred plus zusaetzlich +30% bloomCycle-Geschwindigkeit (Vulkan-Mineralien).

## Tile-Render-Implementation
- Asche-Tiles: Static-Render-To-Texture, einmal beim Scene-Start
- Lava-Tiles: animiert mit GPU-Shader oder einfacher tween auf Sprite-Tint, als Sprite-Layer ueber dem statischen Background
- Hitze-Wabern: Post-Process-Shader optional, fallback ist subtile Sprite-Skalierung

## Verweise
- Implementation: `src/data/maps/magmabluete.ts` (geplant)
- Encounter-Pool: `src/data/encounters.ts` (extend)
- Boss-Battle: separate `src/scenes/BossBattleScene.ts` (Phase 9)
