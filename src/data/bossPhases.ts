/**
 * Boss Multi-Phase System (V0.2, 2026-04-28).
 * Erweitert BossDef um Phase-Transitions: bei bestimmten HP-Schwellen
 * wechselt der Boss in eine neue Phase mit anderen Moves und Stats-Boosts.
 *
 * Reine Daten - kein Phaser-Import. Berechnung erfolgt in Hilfsfunktionen.
 */

export interface BossPhase {
  /** Identifikator der Phase (0 = normal, 1 = enraged, 2 = desperation usw.) */
  phase: number;
  /** HP-Anteil in [0..1] unter dem diese Phase aktiv wird. */
  hpThreshold: number;
  /** Zusaetzliche Move-Slugs die in dieser Phase freigeschaltet werden. */
  specialMoveSlugs: string[];
  /** Multiplikatoren relativ zur Basis-ATK/DEF/SPD (additive auf bisherige Werte). */
  atkBoost: number;
  defBoost: number;
  spdBoost: number;
  /** Anzeige-Text der beim Phasenwechsel ausgespielt wird. */
  phaseText: string[];
  /** HP-Anteil den der Boss beim Phasenwechsel zurueckheilt (0 = kein Heal). */
  healFraction: number;
}

export interface BossPhaseProfile {
  bossId: string;
  phases: BossPhase[];
}

/**
 * Phase-Profile fuer alle Multi-Phase-Bosses.
 * Einphasige Bosses (Schimmelpilz, Mangroven-Tyrann, Pitcher) brauchen kein Profil.
 */
export const BOSS_PHASE_PROFILES: BossPhaseProfile[] = [
  {
    bossId: 'magmus-rex',
    phases: [
      {
        phase: 1,
        hpThreshold: 0.5,
        specialMoveSlugs: ['sun-blaze', 'dragon-bloom'],
        atkBoost: 25,
        defBoost: 0,
        spdBoost: 10,
        phaseText: [
          'Magmus Rex: BRAAAANNNN! (Flammen schlagen aus den Bluetenkoepfen!)',
          'Pyra (per Funk): Phase 2 - Deckung nehmen!',
        ],
        healFraction: 0,
      },
      {
        phase: 2,
        hpThreshold: 0.2,
        specialMoveSlugs: ['sun-beam'],
        atkBoost: 50,
        defBoost: 15,
        spdBoost: 0,
        phaseText: [
          'Magmus Rex: ICH. BRENNE. EWIG!!!',
          'Pyra: Er ist ausser Kontrolle! Nutz alles was du hast!',
        ],
        healFraction: 0.15,
      },
    ],
  },
  {
    bossId: 'frostmother-glaziella',
    phases: [
      {
        phase: 1,
        hpThreshold: 0.5,
        specialMoveSlugs: ['frost-rest', 'leaf-shield'],
        atkBoost: 20,
        defBoost: 30,
        spdBoost: -5,
        phaseText: [
          'Frostmutter Glaziella: Hueh hueh hueh... nun zeige ich dir echten Frost!',
          'Glaziella haellt inne und huellt sich in Eiskristalle!',
        ],
        healFraction: 0.1,
      },
      {
        phase: 2,
        hpThreshold: 0.15,
        specialMoveSlugs: ['sap-strike'],
        atkBoost: 40,
        defBoost: 50,
        spdBoost: -15,
        phaseText: [
          'Frostmutter Glaziella: Tilda... Tilda... TIIIILDAAA!',
          'Morag: Vorsicht - letzter Desperations-Angriff!',
        ],
        healFraction: 0,
      },
    ],
  },
  {
    bossId: 'verodynicus-final',
    phases: [
      {
        phase: 1,
        hpThreshold: 0.66,
        specialMoveSlugs: ['star-pollen', 'dragon-bloom'],
        atkBoost: 20,
        defBoost: 10,
        spdBoost: 15,
        phaseText: [
          'Verodynicus: Du bist staerker als erwartet! Ich schalte Phase 2 frei!',
          'Verodynicus injiziert sich Mutagen - seine Konturen leuchten!',
        ],
        healFraction: 0.1,
      },
      {
        phase: 2,
        hpThreshold: 0.33,
        specialMoveSlugs: ['toxic-vine', 'sun-blaze'],
        atkBoost: 50,
        defBoost: 30,
        spdBoost: 25,
        phaseText: [
          'Verodynicus: ICH BIN DIE EVOLUTION!',
          'Tilda (per Funk): Bleib ruhig! Er verliert die Kontrolle!',
        ],
        healFraction: 0.05,
      },
      {
        phase: 3,
        hpThreshold: 0.1,
        specialMoveSlugs: ['dragon-bloom'],
        atkBoost: 100,
        defBoost: 0,
        spdBoost: 50,
        phaseText: [
          'Verodynicus: Alles... oder nichts!',
          'Iris: Das ist sein letzter Angriff - block alles!',
        ],
        healFraction: 0,
      },
    ],
  },
];

/** Gibt das Phase-Profil fuer eine Boss-ID zurueck. undefined = einphasig. */
export function getBossPhaseProfile(bossId: string): BossPhaseProfile | undefined {
  return BOSS_PHASE_PROFILES.find((p) => p.bossId === bossId);
}

/**
 * Ermittelt welche Phase aktiviert werden soll basierend auf aktuellem HP-Anteil.
 * Gibt null zurueck wenn keine neue Phase getriggert wird.
 *
 * @param bossId - Boss-ID
 * @param hpFraction - Aktueller HP-Anteil in [0..1]
 * @param currentPhase - Bereits aktive Phase (0 = keine)
 */
export function resolveNextPhase(
  bossId: string,
  hpFraction: number,
  currentPhase: number
): BossPhase | null {
  const profile = getBossPhaseProfile(bossId);
  if (!profile) return null;

  // Suche die hoechste Phase die noch nicht aktiv ist und deren Schwelle unterschritten wurde
  const candidates = profile.phases
    .filter((p) => p.phase > currentPhase && hpFraction <= p.hpThreshold)
    .sort((a, b) => b.phase - a.phase);

  return candidates[0] ?? null;
}

/**
 * Berechnet die kumulativen Stat-Boosts aller bisherigen Phasen.
 * (Phasen 1..currentPhase werden addiert)
 */
export function cumulativePhaseBoosts(
  bossId: string,
  currentPhase: number
): { atkBoost: number; defBoost: number; spdBoost: number } {
  const profile = getBossPhaseProfile(bossId);
  if (!profile || currentPhase === 0) return { atkBoost: 0, defBoost: 0, spdBoost: 0 };

  const activePhaseDefs = profile.phases.filter((p) => p.phase <= currentPhase);
  return activePhaseDefs.reduce(
    (acc, p) => ({
      atkBoost: acc.atkBoost + p.atkBoost,
      defBoost: acc.defBoost + p.defBoost,
      spdBoost: acc.spdBoost + p.spdBoost,
    }),
    { atkBoost: 0, defBoost: 0, spdBoost: 0 }
  );
}

/**
 * Gibt alle Move-Slugs zurueck die in Phase 0 bis currentPhase verbuegbar sind.
 * (Basis-Moves des Bosses plus Phase-Moves)
 */
export function getAvailableMovesForPhase(
  baseMoves: string[],
  bossId: string,
  currentPhase: number
): string[] {
  const profile = getBossPhaseProfile(bossId);
  if (!profile || currentPhase === 0) return baseMoves;

  const phaseExtraMoves = profile.phases
    .filter((p) => p.phase <= currentPhase)
    .flatMap((p) => p.specialMoveSlugs);

  // Deduplizieren, max 6 Moves (Pokemon-analogie: 4, aber Bosses koennen mehr haben)
  const all = [...baseMoves, ...phaseExtraMoves];
  return [...new Set(all)];
}
