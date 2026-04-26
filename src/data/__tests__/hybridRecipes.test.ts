import { describe, it, expect } from 'vitest';
import {
  HYBRID_RECIPES,
  HYBRID_SPECIES,
  findRecipe,
  type HybridRecipe
} from '../hybridRecipes';

/**
 * Hybrid-Reveal ist heiliger Pfad. Diese Tests sichern die Recipe-Lookup-Logik
 * (Reihenfolge-Unabhaengigkeit, Mutation-Boni, Recipe-zu-Spezies-Mapping)
 * vor jedem Refactor ab.
 */
describe('hybridRecipes', () => {
  describe('HYBRID_RECIPES Datenstruktur', () => {
    it('hat genau 10 Recipes (V0.1 Spec)', () => {
      expect(HYBRID_RECIPES).toHaveLength(10);
    });

    it('jedes Recipe hat genau 2 verschiedene Eltern-Slugs', () => {
      for (const r of HYBRID_RECIPES) {
        expect(r.parents).toHaveLength(2);
        expect(r.parents[0]).not.toBe(r.parents[1]);
      }
    });

    it('jedes Recipe hat einen nicht-leeren childSlug', () => {
      for (const r of HYBRID_RECIPES) {
        expect(r.childSlug).toBeTruthy();
        expect(typeof r.childSlug).toBe('string');
        expect(r.childSlug.length).toBeGreaterThan(0);
      }
    });

    it('keine zwei Recipes haben identisches Eltern-Paar (auch nicht reversed)', () => {
      const seen = new Set<string>();
      for (const r of HYBRID_RECIPES) {
        const key = [...r.parents].sort().join('|');
        expect(seen.has(key), `Doppeltes Paar: ${key}`).toBe(false);
        seen.add(key);
      }
    });

    it('keine zwei Recipes erzeugen denselben childSlug', () => {
      const slugs = HYBRID_RECIPES.map((r) => r.childSlug);
      const unique = new Set(slugs);
      expect(unique.size).toBe(slugs.length);
    });

    it('mutationBonus ist optional und im Bereich [0, 0.2]', () => {
      for (const r of HYBRID_RECIPES) {
        if (r.mutationBonus !== undefined) {
          expect(r.mutationBonus).toBeGreaterThanOrEqual(0);
          expect(r.mutationBonus).toBeLessThanOrEqual(0.2);
        }
      }
    });
  });

  describe('findRecipe', () => {
    it('findet Recipe in der angegebenen Reihenfolge', () => {
      const recipe = findRecipe('sunflower', 'rose');
      expect(recipe).toBeDefined();
      expect(recipe!.childSlug).toBe('sun-rose');
    });

    it('findet Recipe in umgekehrter Reihenfolge (Reihenfolgen-Symmetrie)', () => {
      const a = findRecipe('rose', 'sunflower');
      const b = findRecipe('sunflower', 'rose');
      expect(a).toBeDefined();
      expect(a).toEqual(b);
    });

    it('liefert undefined fuer unbekannte Eltern-Kombinationen', () => {
      expect(findRecipe('foo', 'bar')).toBeUndefined();
      expect(findRecipe('sunflower', 'sunflower')).toBeUndefined();
    });

    it('liefert undefined fuer Self-Crossing eines Hybrid-Eltern-Slugs', () => {
      expect(findRecipe('lavender', 'lavender')).toBeUndefined();
    });

    it('findet alle 10 Recipes per Round-Trip', () => {
      for (const r of HYBRID_RECIPES) {
        const fwd = findRecipe(r.parents[0], r.parents[1]);
        const rev = findRecipe(r.parents[1], r.parents[0]);
        expect(fwd?.childSlug).toBe(r.childSlug);
        expect(rev?.childSlug).toBe(r.childSlug);
      }
    });

    it('findRecipe ist case-sensitive (slugs sind kanonisch lowercase)', () => {
      expect(findRecipe('SUNFLOWER', 'rose')).toBeUndefined();
      expect(findRecipe('Sunflower', 'Rose')).toBeUndefined();
    });
  });

  describe('Recipe-Mutation-Boni (heiliger Pfad)', () => {
    it('sun-rose bekommt 5 Prozent Mutation-Bonus', () => {
      const r = findRecipe('sunflower', 'rose');
      expect(r?.mutationBonus).toBe(0.05);
    });

    it('fang-orchid bekommt 10 Prozent Mutation-Bonus', () => {
      const r = findRecipe('venus-flytrap', 'orchid');
      expect(r?.mutationBonus).toBe(0.10);
    });

    it('sun-pitcher bekommt 10 Prozent Mutation-Bonus', () => {
      const r = findRecipe('sundew', 'pitcher-plant');
      expect(r?.mutationBonus).toBe(0.10);
    });

    it('rose-saguaro bekommt 5 Prozent Mutation-Bonus', () => {
      const r = findRecipe('saguaro', 'desert-rose');
      expect(r?.mutationBonus).toBe(0.05);
    });

    it('mint-lavender hat keinen expliziten Mutation-Bonus', () => {
      const r = findRecipe('lavender', 'mint');
      expect(r?.mutationBonus).toBeUndefined();
    });
  });

  describe('HYBRID_SPECIES <-> HYBRID_RECIPES Konsistenz', () => {
    it('jeder Recipe-childSlug hat eine HYBRID_SPECIES-Definition', () => {
      const speciesSlugs = new Set(HYBRID_SPECIES.map((s) => s.slug));
      for (const r of HYBRID_RECIPES) {
        expect(speciesSlugs.has(r.childSlug), `Fehlende Species-Def fuer ${r.childSlug}`).toBe(true);
      }
    });

    it('jede HYBRID_SPECIES hat ein zugehoeriges HYBRID_RECIPE', () => {
      const recipeSlugs = new Set(HYBRID_RECIPES.map((r) => r.childSlug));
      for (const s of HYBRID_SPECIES) {
        expect(recipeSlugs.has(s.slug), `Verwaiste Hybrid-Species ${s.slug}`).toBe(true);
      }
    });

    it('alle Hybrid-Spezies sind isStarter=false', () => {
      for (const s of HYBRID_SPECIES) {
        expect(s.isStarter).toBe(false);
      }
    });

    it('alle Hybrid-Spezies haben Rarity 3 oder hoeher (Hybriden sind nicht common)', () => {
      for (const s of HYBRID_SPECIES) {
        expect(s.rarity).toBeGreaterThanOrEqual(3);
      }
    });

    it('alle Hybrid-Spezies haben Stat-Bias-Werte definiert (auch negative erlaubt fuer Glaskanonen)', () => {
      for (const s of HYBRID_SPECIES) {
        expect(typeof s.atkBias).toBe('number');
        expect(typeof s.defBias).toBe('number');
        expect(typeof s.spdBias).toBe('number');
        expect(s.atkBias).toBeGreaterThanOrEqual(-20);
        expect(s.atkBias).toBeLessThanOrEqual(40);
        expect(s.defBias).toBeGreaterThanOrEqual(-20);
        expect(s.defBias).toBeLessThanOrEqual(40);
        expect(s.spdBias).toBeGreaterThanOrEqual(-20);
        expect(s.spdBias).toBeLessThanOrEqual(40);
      }
    });

    it('Summe der Stat-Bias einer Hybrid-Spezies ist nicht negativ (Hybriden sind im Schnitt staerker)', () => {
      for (const s of HYBRID_SPECIES) {
        const sum = s.atkBias + s.defBias + s.spdBias;
        expect(sum, 'Hybrid ' + s.slug + ' hat Bias-Sum ' + sum).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Type-Sicherheit', () => {
    it('HybridRecipe-Type erlaubt parents-Tuple und optionalen mutationBonus', () => {
      const r: HybridRecipe = {
        parents: ['a', 'b'],
        childSlug: 'a-b'
      };
      expect(r.mutationBonus).toBeUndefined();
      const r2: HybridRecipe = {
        parents: ['c', 'd'],
        childSlug: 'c-d',
        mutationBonus: 0.1
      };
      expect(r2.mutationBonus).toBe(0.1);
    });
  });
});
