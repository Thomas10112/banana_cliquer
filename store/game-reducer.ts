import { UPGRADES } from './upgrades-config';
import { QUESTS } from './quests-config';
import { SIDE_QUESTS } from './side-quests-config';
import { ZONES, getZoneDelivery, getZoneMaxStock, getZoneUpgradeCost, getWhaleCost, WHALE_TRIP_DURATION } from './zones-config';
import { getTransportCargoMult, getTransportSpeedMult, getTransportUpgradeCost, TRANSPORT_MAX_LEVEL } from './transport-config';
import { rollGacha, pullCost } from './gacha';
import {
  HERO_SLOTS, heroBpsMult, heroDeliveryMult, heroDurationMult, heroStockMult,
  heroDiscountMult, heroMultiZones, computeHeroBuffs, getHeroLevelUpCost,
} from './hero-effects';
import { getHero, HERO_MAX_LEVEL } from './heroes-config';
import { MENACES } from './menaces-config';
import { GameAction, GameState, WhaleTrip, RaidEntry } from './types';
import { AGES } from './ages-config';

const RAID_CHANCE = 0.25;     // proba d'embuscade par voyage livré
const RAID_LOG_MAX = 20;      // taille max du journal de raids

// Accélérateur (×3) — budget de boost et recharge
export const BOOSTER_DURATION = 180; // 3 min de ×3 par charge
export const BOOSTER_COOLDOWN = 300; // 5 min de recharge une fois le budget épuisé

export const INITIAL_STATE: GameState = {
  bananas: 0,
  totalBananas: 0,
  bananasPerClick: 1,
  upgrades: {},
  playTimeSeconds: 0,
  claimedQuests: [],
  currentAge: 0,
  totalMigrations: 0,
  unlockedAchievements: [],
  zoneLevels: {},
  zoneStocks: {},
  activeWhales: [],
  whalesOwned: 0,
  heritageBpc: 0,
  heritageBps: 0,
  boosterUnlocked: false,
  boosterActive: false,
  boosterRemaining: BOOSTER_DURATION,
  boosterCooldownUntil: 0,
  comboUnlocked: false,
  lastSavedAt: 0,
  autoClickLevel: 0,
  totalClicks: 0,
  claimedSideQuests: [],
  crewTokens: 0,
  gachaPity: 0,
  heroLevels: {},
  heroFragments: {},
  transportLevels: {},
  heroSlots: Array(HERO_SLOTS).fill(null),
  lastPull: null,
  raidLog: [],
};

/** Résout une embuscade pour une cargaison livrée. Renvoie le delta (±bananes) + l'entrée de journal. */
function resolveRaid(state: GameState, delivery: number, atTime: number, seed: string): { delta: number; entry: RaidEntry } {
  const { atk, def } = computeHeroBuffs(state);
  const pool = MENACES.filter(menace => state.currentAge >= menace.minAge);
  const menace = pool[Math.floor(Math.random() * pool.length)];
  const won = atk >= menace.basePower;
  let delta: number;
  if (won) {
    delta = Math.floor(delivery * menace.lootBonus * Math.min(2, menace.basePower > 0 ? atk / menace.basePower : 2));
  } else {
    const mitigation = menace.basePower / (menace.basePower + def);
    delta = -Math.floor(delivery * menace.lossPct * mitigation);
  }
  return {
    delta,
    entry: { id: `raid_${seed}`, menaceId: menace.id, won, delta, at: atTime },
  };
}

export function getUpgradeCost(id: string, count: number): number {
  const config = UPGRADES.find(u => u.id === id);
  if (!config) return Infinity;
  return Math.floor(config.baseCost * Math.pow(1.15, count));
}

export function getBpc(state: GameState): number {
  const zoneClick = ZONES
    .filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.clickBonus)
    .reduce((sum, z) => sum + (z.bonus.clickBonus ?? 0), 0);
  return state.bananasPerClick + (state.heritageBpc ?? 0) + zoneClick;
}

export function getBps(state: GameState): number {
  const base = UPGRADES.reduce((total, config) => {
    const count = state.upgrades[config.id] ?? 0;
    return total + config.baseBps * count;
  }, 0);

  const zoneMult = ZONES
    .filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.bpsMultiplier)
    .reduce((m, z) => m + (z.bonus.bpsMultiplier ?? 0), 1);

  return (base * zoneMult + (state.heritageBps ?? 0)) * heroBpsMult(state);
}

function pickRandomRoute(zoneLevels: Record<string, number>, excludeFrom?: string): { from: string; to: string } | null {
  const conquered = Object.keys(zoneLevels).filter(id => (zoneLevels[id] ?? 0) >= 1);
  if (conquered.length < 2) return null;
  const fromPool = excludeFrom ? conquered.filter(id => id !== excludeFrom) : conquered;
  if (fromPool.length === 0) return null;
  const from = fromPool[Math.floor(Math.random() * fromPool.length)];
  const toPool = conquered.filter(id => id !== from);
  if (toPool.length === 0) return null;
  const to = toPool[Math.floor(Math.random() * toPool.length)];
  return { from, to };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'CLICK': {
      const zoneClick = ZONES
        .filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.clickBonus)
        .reduce((sum, z) => sum + (z.bonus.clickBonus ?? 0), 0);
      const comboMult = state.comboUnlocked ? (action.comboMultiplier ?? 1) : 1;
      const gained = (state.bananasPerClick + state.heritageBpc + zoneClick) * comboMult;
      return {
        ...state,
        bananas: state.bananas + gained,
        totalBananas: state.totalBananas + gained,
        totalClicks: state.totalClicks + 1,
      };
    }

    case 'BUY_UPGRADE': {
      const config = UPGRADES.find(u => u.id === action.id);
      const count  = state.upgrades[action.id] ?? 0;
      if (config?.maxCount !== undefined && count >= config.maxCount) return state;
      const cost = getUpgradeCost(action.id, count);
      if (state.bananas < cost) return state;
      return {
        ...state,
        bananas: state.bananas - cost,
        upgrades: { ...state.upgrades, [action.id]: count + 1 },
      };
    }

    case 'BUY_UPGRADE_BULK': {
      const config = UPGRADES.find(u => u.id === action.id);
      if (!config) return state;
      const count = state.upgrades[action.id] ?? 0;
      const maxBuy = config.maxCount !== undefined ? config.maxCount - count : action.quantity;
      const qty = Math.min(action.quantity, maxBuy);
      if (qty <= 0) return state;
      let totalCost = 0;
      for (let i = 0; i < qty; i++) totalCost += getUpgradeCost(action.id, count + i);
      if (state.bananas < totalCost) return state;
      return {
        ...state,
        bananas: state.bananas - totalCost,
        upgrades: { ...state.upgrades, [action.id]: count + qty },
      };
    }

    case 'TICK': {
      const newTime     = state.playTimeSeconds + action.delta;
      // Accélérateur : consomme le budget tant qu'actif ; recharge à plein une fois le cooldown écoulé
      let boosterActive        = state.boosterActive;
      let boosterRemaining     = state.boosterRemaining;
      let boosterCooldownUntil = state.boosterCooldownUntil;
      const boosterMult        = boosterActive ? 3 : 1;
      if (boosterActive) {
        boosterRemaining = Math.max(0, boosterRemaining - action.delta);
        if (boosterRemaining <= 0) {
          boosterActive        = false;
          boosterRemaining     = 0;
          boosterCooldownUntil = newTime + BOOSTER_COOLDOWN; // recharge seulement quand le budget est épuisé
        }
      } else if (boosterCooldownUntil > 0 && newTime >= boosterCooldownUntil) {
        boosterCooldownUntil = 0;
        boosterRemaining     = BOOSTER_DURATION; // budget rechargé à plein
      }

      const produced    = getBps(state) * action.delta * action.weatherMultiplier * boosterMult;

      // Traitement des baleines
      const completed = state.activeWhales.filter(w => w.startedAt + w.duration <= newTime);
      const ongoing   = state.activeWhales.filter(w => w.startedAt + w.duration > newTime);
      const newStocks = { ...state.zoneStocks };
      const newTrips:  WhaleTrip[] = [];

      // Buffs Taverne : cargaison, stock, vitesse, multi-zone, raids
      const tLevel       = state.transportLevels[state.currentAge] ?? 0;
      const cargoMult    = getTransportCargoMult(tLevel) * heroDeliveryMult(state);
      const stockMult    = heroStockMult(state);
      const durMult      = getTransportSpeedMult(tLevel) * heroDurationMult(state);
      const extraZones   = heroMultiZones(state);
      const raidsEnabled = state.currentAge >= 3 && (state.heroSlots ?? []).some(Boolean);
      const newRaids: RaidEntry[] = [];

      const deposit = (zoneId: string, amount: number) => {
        const level = state.zoneLevels[zoneId] ?? 0;
        if (level < 1 || amount <= 0) return;
        const maxStock = Math.floor(getZoneMaxStock(level) * stockMult);
        newStocks[zoneId] = Math.min((newStocks[zoneId] ?? 0) + amount, maxStock);
      };

      // Zones déjà ciblées par les baleines en cours + les nouvelles
      const usedToZones = new Set([...ongoing.map(w => w.toZoneId)]);

      for (const trip of completed) {
        const destLevel = state.zoneLevels[trip.toZoneId] ?? 0;
        if (destLevel >= 1) {
          let delivery = Math.floor(getZoneDelivery(destLevel) * cargoMult);
          // Embuscade ? Résolue par l'ATK/DEF de l'équipage assigné.
          if (raidsEnabled && Math.random() < RAID_CHANCE) {
            const { delta, entry } = resolveRaid(state, delivery, newTime, `${trip.id}_${newRaids.length}`);
            delivery = Math.max(0, delivery + delta);
            newRaids.push(entry);
          }
          deposit(trip.toZoneId, delivery);
          // Héros multi-zone : dessert aussi quelques autres zones conquises
          if (extraZones > 0) {
            const others = Object.keys(state.zoneLevels).filter(id => id !== trip.toZoneId && (state.zoneLevels[id] ?? 0) >= 1);
            for (let i = 0; i < extraZones && i < others.length; i++) {
              deposit(others[i], Math.floor(getZoneDelivery(state.zoneLevels[others[i]]) * cargoMult));
            }
          }
        }
        // Nouvelle route : préfère les zones pas encore ciblées
        const conquered = Object.keys(state.zoneLevels).filter(id => (state.zoneLevels[id] ?? 0) >= 1);
        const fresh = conquered.filter(id => id !== trip.toZoneId && !usedToZones.has(id));
        const pool  = fresh.length > 0 ? fresh : conquered.filter(id => id !== trip.toZoneId);
        if (pool.length > 0) {
          const to = pool[Math.floor(Math.random() * pool.length)];
          usedToZones.add(to);
          newTrips.push({
            id: `${trip.id}_r`,
            fromZoneId: trip.toZoneId,
            toZoneId:   to,
            startedAt:  newTime + Math.random() * 10, // stagger 0-10s
            duration:   (WHALE_TRIP_DURATION + Math.random() * 20 - 10) * durMult, // ±10s
          });
        }
      }

      return {
        ...state,
        bananas: state.bananas + produced,
        totalBananas: state.totalBananas + produced,
        playTimeSeconds: newTime,
        zoneStocks: newStocks,
        activeWhales: [...ongoing, ...newTrips],
        raidLog: newRaids.length > 0 ? [...newRaids.reverse(), ...state.raidLog].slice(0, RAID_LOG_MAX) : state.raidLog,
        boosterActive,
        boosterRemaining,
        boosterCooldownUntil,
      };
    }

    case 'CONQUER_ZONE': {
      if ((state.zoneLevels[action.id] ?? 0) >= 1) return state;
      const zone = ZONES.find(z => z.id === action.id);
      if (!zone || state.bananas < zone.cost) return state;
      return {
        ...state,
        bananas: state.bananas - zone.cost,
        zoneLevels: { ...state.zoneLevels, [action.id]: 1 },
      };
    }

    case 'UPGRADE_ZONE': {
      const lvl = state.zoneLevels[action.id] ?? 0;
      if (lvl < 1 || lvl >= 3) return state;
      const zone = ZONES.find(z => z.id === action.id);
      if (!zone) return state;
      const cost = getZoneUpgradeCost(zone, lvl);
      if (state.bananas < cost) return state;
      return {
        ...state,
        bananas: state.bananas - cost,
        zoneLevels: { ...state.zoneLevels, [action.id]: lvl + 1 },
      };
    }

    case 'HARVEST_ZONE': {
      const stock = state.zoneStocks[action.id] ?? 0;
      if (stock <= 0) return state;
      return {
        ...state,
        bananas: state.bananas + stock,
        totalBananas: state.totalBananas + stock,
        zoneStocks: { ...state.zoneStocks, [action.id]: 0 },
      };
    }

    case 'BUY_WHALE': {
      const cost = getWhaleCost(state.whalesOwned);
      if (state.bananas < cost) return state;
      const conquered   = Object.keys(state.zoneLevels).filter(id => (state.zoneLevels[id] ?? 0) >= 1);
      if (conquered.length < 2) return state;
      const usedTo      = new Set(state.activeWhales.map(w => w.toZoneId));
      const fromPool    = conquered;
      const from        = fromPool[Math.floor(Math.random() * fromPool.length)];
      const freshTo     = conquered.filter(id => id !== from && !usedTo.has(id));
      const toPool      = freshTo.length > 0 ? freshTo : conquered.filter(id => id !== from);
      if (toPool.length === 0) return state;
      const to          = toPool[Math.floor(Math.random() * toPool.length)];
      const stagger     = state.whalesOwned * 8; // décale le départ selon l'ordre d'achat
      const trip: WhaleTrip = {
        id: `w${state.whalesOwned}_${Math.floor(state.playTimeSeconds)}`,
        fromZoneId: from,
        toZoneId:   to,
        startedAt:  state.playTimeSeconds + stagger,
        duration:   (WHALE_TRIP_DURATION + Math.random() * 20 - 10) * getTransportSpeedMult(state.transportLevels[state.currentAge] ?? 0) * heroDurationMult(state),
      };
      return {
        ...state,
        bananas: state.bananas - cost,
        whalesOwned: state.whalesOwned + 1,
        activeWhales: [...state.activeWhales, trip],
      };
    }

    case 'UPGRADE_TRANSPORT': {
      const age   = state.currentAge;
      const level = state.transportLevels[age] ?? 0;
      if (level >= TRANSPORT_MAX_LEVEL) return state;
      const cost = Math.floor(getTransportUpgradeCost(level) * heroDiscountMult(state));
      if (state.bananas < cost) return state;
      return {
        ...state,
        bananas: state.bananas - cost,
        transportLevels: { ...state.transportLevels, [age]: level + 1 },
      };
    }

    case 'PULL_GACHA': {
      const cost = pullCost(action.count);
      if (state.crewTokens < cost) return state;
      const out = rollGacha(action.count, state.heroLevels, state.heroFragments, state.gachaPity);
      return {
        ...state,
        crewTokens:    state.crewTokens - cost,
        heroLevels:    out.heroLevels,
        heroFragments: out.heroFragments,
        gachaPity:     out.gachaPity,
        lastPull:      out.results,
      };
    }

    case 'CLEAR_PULL': {
      if (state.lastPull === null) return state;
      return { ...state, lastPull: null };
    }

    case 'ADD_TOKENS': {
      return { ...state, crewTokens: state.crewTokens + action.amount };
    }

    case 'LEVEL_UP_HERO': {
      const hero  = getHero(action.id);
      const level = state.heroLevels[action.id] ?? 0;
      if (!hero || level < 1 || level >= HERO_MAX_LEVEL) return state;
      const cost = getHeroLevelUpCost(hero.rarity, level);
      if (state.bananas < cost) return state;
      return {
        ...state,
        bananas:    state.bananas - cost,
        heroLevels: { ...state.heroLevels, [action.id]: level + 1 },
      };
    }

    case 'ASSIGN_HERO': {
      if ((state.heroLevels[action.heroId] ?? 0) < 1) return state;          // doit être possédé
      if (action.slot < 0 || action.slot >= HERO_SLOTS) return state;
      const slots = Array.from({ length: HERO_SLOTS }, (_, i) => state.heroSlots[i] ?? null);
      // Un héros ne peut occuper qu'un slot : on le retire d'un éventuel slot précédent
      const existing = slots.indexOf(action.heroId);
      if (existing >= 0) slots[existing] = null;
      slots[action.slot] = action.heroId;
      return { ...state, heroSlots: slots };
    }

    case 'UNASSIGN_HERO': {
      if (action.slot < 0 || action.slot >= HERO_SLOTS) return state;
      const slots = Array.from({ length: HERO_SLOTS }, (_, i) => state.heroSlots[i] ?? null);
      slots[action.slot] = null;
      return { ...state, heroSlots: slots };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      if (state.unlockedAchievements.includes(action.id)) return state;
      return { ...state, unlockedAchievements: [...state.unlockedAchievements, action.id] };
    }

    case 'UNLOCK_ACHIEVEMENTS_BATCH': {
      const newIds = action.ids.filter(id => !state.unlockedAchievements.includes(id));
      if (newIds.length === 0) return state;
      return { ...state, unlockedAchievements: [...state.unlockedAchievements, ...newIds] };
    }

    case 'COLLECT_GOLDEN': {
      const bonus = Math.max(50, Math.floor(state.totalBananas * 0.05));
      return {
        ...state,
        bananas: state.bananas + bonus,
        totalBananas: state.totalBananas + bonus,
      };
    }

    case 'CLAIM_QUEST': {
      if (state.claimedQuests.includes(action.id)) return state;
      const quest  = QUESTS.find(q => q.id === action.id);
      const reward = quest?.reward ?? 0;
      return {
        ...state,
        claimedQuests: [...state.claimedQuests, action.id],
        bananas:       state.bananas + reward,
        totalBananas:  state.totalBananas + reward,
      };
    }

    case 'CLAIM_SIDE_QUEST': {
      if (state.claimedSideQuests.includes(action.id)) return state;
      const quest  = SIDE_QUESTS.find(q => q.id === action.id);
      if (!quest || !quest.check(state)) return state;
      return {
        ...state,
        claimedSideQuests: [...state.claimedSideQuests, action.id],
        bananas:           state.bananas + quest.reward,
        totalBananas:      state.totalBananas + quest.reward,
      };
    }

    case 'ACTIVATE_BOOSTER': {
      if (!state.boosterUnlocked) return state;
      if (state.boosterActive) return state;
      if (state.boosterCooldownUntil > 0) return state; // en recharge
      if (state.boosterRemaining <= 0) return state;     // budget vide
      return { ...state, boosterActive: true };
    }

    case 'DEACTIVATE_BOOSTER': {
      if (!state.boosterActive) return state;
      // Stop manuel = pause : on garde le budget restant, AUCUNE recharge déclenchée
      return { ...state, boosterActive: false };
    }

    case 'GRANDE_MIGRATION': {
      // Pas de migration au-delà de celles définies pour l'âge (dernier âge : 2 puis fin du jeu)
      const ageMigrations = AGES[state.currentAge]?.migrations;
      if (!ageMigrations || state.totalMigrations % 3 >= ageMigrations.length) return state;
      const newTotal      = state.totalMigrations + 1;
      const migDoneInAge  = (newTotal - 1) % 3;
      const newAge        = Math.floor(newTotal / 3);
      const bpsBonus      = Math.floor(getBps(state) * 0.10);

      return {
        ...INITIAL_STATE,
        currentAge:           newAge,
        totalMigrations:      newTotal,
        playTimeSeconds:      state.playTimeSeconds,
        unlockedAchievements: state.unlockedAchievements,
        heritageBpc:          state.heritageBpc + 1,
        heritageBps:          state.heritageBps + bpsBonus,
        boosterUnlocked:      state.boosterUnlocked || migDoneInAge >= 1,
        // booster: budget rechargé à plein après une migration (défauts INITIAL_STATE)
        comboUnlocked:        migDoneInAge === 2 ? false : (state.comboUnlocked || migDoneInAge >= 1),
        totalClicks:          state.totalClicks,
        claimedSideQuests:    state.claimedSideQuests,
        // Taverne — persistant à travers les migrations (+ bonus jetons de migration)
        crewTokens:           state.crewTokens + 300,
        gachaPity:            state.gachaPity,
        heroLevels:           state.heroLevels,
        heroFragments:        state.heroFragments,
        transportLevels:      state.transportLevels,
        heroSlots:            state.heroSlots,
      };
    }

    case 'UPGRADE_AUTO_CLICK': {
      if (state.autoClickLevel >= 3) return state;
      const costs = [100, 1000, 10000];
      const cost  = costs[state.autoClickLevel];
      if (state.bananas < cost) return state;
      return {
        ...state,
        bananas: state.bananas - cost,
        autoClickLevel: state.autoClickLevel + 1,
      };
    }

    case 'ADD_OFFLINE_GAINS':
      return {
        ...state,
        bananas: state.bananas + action.amount,
        totalBananas: state.totalBananas + action.amount,
      };

    case 'LOAD_SAVE':
      // lastPull est transient : jamais restauré (sinon la modale de tirage se rouvre au lancement)
      return { ...INITIAL_STATE, ...action.payload, lastPull: null };

    default:
      return state;
  }
}
