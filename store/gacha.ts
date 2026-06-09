// Système Taverne — moteur de gacha (recrutement de héros).
import { HEROES, Rarity } from './heroes-config';

export const PULL_COST_SINGLE = 100;
export const PULL_COST_TEN = 900;        // -1 tirage offert sur 10
export const PITY_THRESHOLD = 50;        // légendaire garanti au 50e tirage sans légendaire
export const FRAGMENTS_PER_DUP = 1;      // doublon → fragments

export interface PullResult {
  heroId: string;
  rarity: Rarity;
  isNew: boolean;
}

export interface GachaOutcome {
  results: PullResult[];
  heroLevels: Record<string, number>;
  heroFragments: Record<string, number>;
  gachaPity: number;
}

/** Tire une rareté selon les taux : 60/30/8/2 %. */
function rollRarity(): Rarity {
  const r = Math.random();
  if (r < 0.02) return 4;
  if (r < 0.10) return 3;
  if (r < 0.40) return 2;
  return 1;
}

function pickHero(rarity: Rarity): string {
  const pool = HEROES.filter(h => h.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

/** Coût d'un tirage de `count` (1 ou 10). */
export function pullCost(count: number): number {
  return count >= 10 ? PULL_COST_TEN : PULL_COST_SINGLE;
}

/**
 * Effectue `count` tirages. Pur côté logique mais utilise Math.random
 * (accepté, comme les routes de baleines). Renvoie les résultats + les maps mises à jour.
 */
export function rollGacha(
  count: number,
  heroLevels: Record<string, number>,
  heroFragments: Record<string, number>,
  gachaPity: number,
): GachaOutcome {
  // 1) Raretés (avec pity légendaire)
  const rarities: Rarity[] = [];
  let pity = gachaPity;
  for (let i = 0; i < count; i++) {
    pity++;
    let rarity: Rarity;
    if (pity >= PITY_THRESHOLD) {
      rarity = 4;
    } else {
      rarity = rollRarity();
    }
    if (rarity === 4) pity = 0;
    rarities.push(rarity);
  }
  // 2) Garantie ⭐⭐+ sur un tirage de 10
  if (count >= 10 && !rarities.some(r => r >= 2)) {
    rarities[rarities.length - 1] = 2;
  }

  // 3) Attribution (nouveau héros niv. 1, ou doublon → fragments)
  const levels = { ...heroLevels };
  const frags  = { ...heroFragments };
  const results: PullResult[] = [];
  for (const rarity of rarities) {
    const heroId = pickHero(rarity);
    const owned  = (levels[heroId] ?? 0) > 0;
    if (owned) {
      frags[heroId] = (frags[heroId] ?? 0) + FRAGMENTS_PER_DUP;
      results.push({ heroId, rarity, isNew: false });
    } else {
      levels[heroId] = 1;
      results.push({ heroId, rarity, isNew: true });
    }
  }

  return { results, heroLevels: levels, heroFragments: frags, gachaPity: pity };
}
