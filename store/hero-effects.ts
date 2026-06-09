// Système Taverne — moteur d'effets des héros assignés.
// Agrège les compétences (skill + passive) des héros dans les slots et expose
// des multiplicateurs prêts à brancher dans getBps, la livraison, les trajets, etc.
// Voir heroes-config.ts (stats/compétences) et menaces-config.ts (raids).

import { GameState } from './types';
import { getHero, skillAt, statAt, SkillType, Rarity } from './heroes-config';

export const HERO_SLOTS = 3; // nombre de slots d'équipage

export interface HeroBuffs {
  cargo: number;    // +fraction bananes/voyage
  speed: number;    // fraction de réduction de durée (durée ×(1-speed))
  double: number;   // chance de livrer ×2
  stock: number;    // +fraction capacité de stock
  bps: number;      // +fraction BPS global
  crit: number;     // chance de livrer ×3
  multi: number;    // +N zones desservies par voyage
  offline: number;  // +fraction gains hors-ligne
  discount: number; // fraction de réduction du coût des transports
  synergy: number;  // +fraction BPS par héros épique+ assigné
  atk: number;      // somme ATK de l'équipage (raids)
  def: number;      // somme DEF de l'équipage (raids)
  epicCount: number;// nb de héros épique+ assignés
}

const ZERO: HeroBuffs = {
  cargo: 0, speed: 0, double: 0, stock: 0, bps: 0, crit: 0,
  multi: 0, offline: 0, discount: 0, synergy: 0, atk: 0, def: 0, epicCount: 0,
};

function addSkill(buffs: HeroBuffs, type: SkillType, value: number) {
  switch (type) {
    case 'cargo':    buffs.cargo    += value; break;
    case 'speed':    buffs.speed    += value; break;
    case 'double':   buffs.double   += value; break;
    case 'stock':    buffs.stock    += value; break;
    case 'bps':      buffs.bps      += value; break;
    case 'crit':     buffs.crit     += value; break;
    case 'multi':    buffs.multi    += value; break;
    case 'offline':  buffs.offline  += value; break;
    case 'discount': buffs.discount += value; break;
    case 'synergy':  buffs.synergy  += value; break;
  }
}

/** Agrège les buffs de tous les héros assignés (slots). */
export function computeHeroBuffs(state: GameState): HeroBuffs {
  const slots = state.heroSlots ?? [];
  if (slots.every(s => !s)) return ZERO;

  const buffs: HeroBuffs = { ...ZERO };
  for (const heroId of slots) {
    if (!heroId) continue;
    const hero  = getHero(heroId);
    const level = state.heroLevels[heroId] ?? 0;
    if (!hero || level <= 0) continue;

    buffs.atk += statAt(hero.atk, level);
    buffs.def += statAt(hero.def, level);
    if (hero.rarity >= 3) buffs.epicCount += 1;

    addSkill(buffs, hero.skill.type, skillAt(hero.skill, level));
    if (hero.passive) addSkill(buffs, hero.passive.type, skillAt(hero.passive, level));
  }
  return buffs;
}

// ── Multiplicateurs dérivés (1 = neutre) ──

/** +BPS global : compétence bps + synergie par héros épique+ assigné. */
export function heroBpsMult(state: GameState): number {
  const b = computeHeroBuffs(state);
  return 1 + b.bps + b.synergy * b.epicCount;
}

/** Bananes livrées/voyage : cargaison + espérance des chances double (×2) et crit (×3). */
export function heroDeliveryMult(state: GameState): number {
  const b = computeHeroBuffs(state);
  return 1 + b.cargo + b.double + 2 * b.crit;
}

/** Durée de trajet (plancher à 30 % de la durée). */
export function heroDurationMult(state: GameState): number {
  const b = computeHeroBuffs(state);
  return Math.max(0.3, 1 - b.speed);
}

/** Capacité de stock des zones. */
export function heroStockMult(state: GameState): number {
  return 1 + computeHeroBuffs(state).stock;
}

/** Gains hors-ligne. */
export function heroOfflineMult(state: GameState): number {
  return 1 + computeHeroBuffs(state).offline;
}

/** Coût d'achat/amélioration des transports (≥ 0). */
export function heroDiscountMult(state: GameState): number {
  return Math.max(0, 1 - computeHeroBuffs(state).discount);
}

/** Nombre de zones supplémentaires desservies par voyage. */
export function heroMultiZones(state: GameState): number {
  return Math.floor(computeHeroBuffs(state).multi);
}

// ── Niveau des héros ──

const LEVELUP_BASE: Record<Rarity, number> = {
  1: 10_000, 2: 50_000, 3: 250_000, 4: 1_000_000,
};

/** Coût bananes pour passer un héros de `level` à `level+1`. */
export function getHeroLevelUpCost(rarity: Rarity, level: number): number {
  return Math.floor(LEVELUP_BASE[rarity] * Math.pow(1.15, Math.max(0, level - 1)));
}
