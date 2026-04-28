import { describe, it, expect } from 'vitest';
import {
  ENERGY_MAX,
  ENERGY_COST,
  canAffordEnergy,
  spendEnergy,
  regenEnergy,
  energyLabel,
  energyColor,
} from '../EnergySystem';

describe('EnergySystem', () => {
  describe('Konstanten', () => {
    it('ENERGY_MAX ist 100', () => {
      expect(ENERGY_MAX).toBe(100);
    });
    it('Kosten sind Stardew-balanciert', () => {
      expect(ENERGY_COST.sow).toBe(1);
      expect(ENERGY_COST.water).toBe(2);
      expect(ENERGY_COST.cross).toBe(8);
      expect(ENERGY_COST.harvest).toBe(1);
      expect(ENERGY_COST.forage).toBe(4);
      expect(ENERGY_COST.booster).toBe(3);
    });
  });

  describe('canAffordEnergy', () => {
    it('gibt true zurück wenn genug Energie', () => {
      expect(canAffordEnergy(100, 'sow')).toBe(true);
      expect(canAffordEnergy(8, 'cross')).toBe(true);
      expect(canAffordEnergy(2, 'water')).toBe(true);
    });
    it('gibt false zurück wenn Energie zu gering', () => {
      expect(canAffordEnergy(0, 'sow')).toBe(false);
      expect(canAffordEnergy(7, 'cross')).toBe(false);
      expect(canAffordEnergy(1, 'water')).toBe(false);
    });
    it('gibt false zurück bei genau 0', () => {
      expect(canAffordEnergy(0, 'harvest')).toBe(false);
    });
  });

  describe('spendEnergy', () => {
    it('zieht korrekte Kosten ab', () => {
      expect(spendEnergy(100, 'sow')).toBe(99);
      expect(spendEnergy(100, 'water')).toBe(98);
      expect(spendEnergy(100, 'cross')).toBe(92);
      expect(spendEnergy(100, 'harvest')).toBe(99);
    });
    it('geht nicht unter 0', () => {
      expect(spendEnergy(5, 'cross')).toBe(0);
      expect(spendEnergy(0, 'sow')).toBe(0);
    });
    it('simluiert 20-30 Säen-Aktionen vor leer', () => {
      // Mit sow (-1) und water (-2) abwechselnd: 33 Runden = 99 Energie
      let energy = ENERGY_MAX;
      let rounds = 0;
      while (energy >= ENERGY_COST.sow + ENERGY_COST.water) {
        energy = spendEnergy(energy, 'sow');
        energy = spendEnergy(energy, 'water');
        rounds++;
      }
      expect(rounds).toBeGreaterThanOrEqual(25);
      expect(rounds).toBeLessThanOrEqual(35);
    });
  });

  describe('regenEnergy', () => {
    it('regeneriert vollständig nach dem Schlafen', () => {
      expect(regenEnergy(0)).toBe(100);
      expect(regenEnergy(50)).toBe(100);
    });
    it('geht nicht über ENERGY_MAX', () => {
      expect(regenEnergy(100)).toBe(100);
      expect(regenEnergy(95)).toBe(100);
    });
    it('ermöglicht partielle Regeneration', () => {
      expect(regenEnergy(0, 30)).toBe(30);
      expect(regenEnergy(80, 30)).toBe(100); // cap bei max
    });
  });

  describe('energyLabel', () => {
    it('gibt korrektes Label zurück', () => {
      expect(energyLabel(100)).toBe('100/100');
      expect(energyLabel(0)).toBe('0/100');
      expect(energyLabel(75)).toBe('75/100');
    });
  });

  describe('energyColor', () => {
    it('gibt grün bei > 50%', () => {
      expect(energyColor(100)).toBe(0x4caf50);
      expect(energyColor(51)).toBe(0x4caf50);
    });
    it('gibt gelb bei 20-50%', () => {
      expect(energyColor(50)).toBe(0xffc107);
      expect(energyColor(21)).toBe(0xffc107);
    });
    it('gibt rot bei < 20%', () => {
      expect(energyColor(20)).toBe(0xf44336);
      expect(energyColor(0)).toBe(0xf44336);
    });
  });
});
