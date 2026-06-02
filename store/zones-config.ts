export interface ZoneBonus {
  bpsMultiplier?: number;
  clickBonus?: number;
}

export interface ZoneConfig {
  id: string;
  minAge: number;
  cost: number;
  bonus: ZoneBonus;
}

export function zoneBonusLabel(bonus: ZoneBonus): string {
  const parts: string[] = [];
  if (bonus.bpsMultiplier) parts.push(`+${Math.round(bonus.bpsMultiplier * 100)}% BPS`);
  if (bonus.clickBonus)    parts.push(`+${bonus.clickBonus} 🍌/clic`);
  return parts.join('  ');
}

// Stock capacity par niveau de zone (index = niveau 0-3)
const ZONE_MAX_STOCK = [0, 100, 300, 800];
// Bananes déposées par la baleine à l'arrivée, selon niveau destination
const ZONE_DELIVERY  = [0, 10,  30,  80];

export function getZoneMaxStock(level: number): number {
  return ZONE_MAX_STOCK[Math.max(0, Math.min(3, level))] ?? 0;
}

export function getZoneDelivery(level: number): number {
  return ZONE_DELIVERY[Math.max(0, Math.min(3, level))] ?? 0;
}

export function getZoneUpgradeCost(zone: ZoneConfig, currentLevel: number): number {
  const multipliers = [0, 3, 8]; // niv 1→2 : ×3, niv 2→3 : ×8
  return Math.floor(zone.cost * (multipliers[currentLevel] ?? 0));
}

export function getWhaleCost(owned: number): number {
  return Math.floor(300 * Math.pow(2, owned)); // 300, 600, 1200, 2400...
}

export const WHALE_TRIP_DURATION = 60; // secondes

export const ZONES: ZoneConfig[] = [
  // ── Ère Sauvage (age 0) ───────────────────────────────────────────────────
  { id: 'afrique',   minAge: 0, cost: 50,    bonus: { clickBonus: 0.5 } },
  { id: 'amazonie',  minAge: 0, cost: 200,   bonus: { bpsMultiplier: 0.10 } },
  { id: 'europe',    minAge: 0, cost: 500,   bonus: { bpsMultiplier: 0.15 } },
  { id: 'asie',      minAge: 0, cost: 1000,  bonus: { clickBonus: 0.5 } },
  { id: 'australie', minAge: 0, cost: 2500,  bonus: { bpsMultiplier: 0.20 } },
  { id: 'mammouth',  minAge: 0, cost: 5000,  bonus: { clickBonus: 1 } },

  // ── Ère Agricole (age 1) ─────────────────────────────────────────────────
  { id: 'nil',       minAge: 1, cost: 500,   bonus: { bpsMultiplier: 0.10 } },
  { id: 'flandre',   minAge: 1, cost: 1500,  bonus: { bpsMultiplier: 0.15 } },
  { id: 'andine',    minAge: 1, cost: 3000,  bonus: { clickBonus: 5 } },
  { id: 'orient',    minAge: 1, cost: 7000,  bonus: { bpsMultiplier: 0.20 } },
  { id: 'pacifique', minAge: 1, cost: 15000, bonus: { clickBonus: 8 } },
  { id: 'epices',    minAge: 1, cost: 30000, bonus: { bpsMultiplier: 0.25 } },
];
