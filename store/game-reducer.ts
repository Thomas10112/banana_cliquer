import { UPGRADES } from './upgrades-config';
import { ZONES, getZoneDelivery, getZoneMaxStock, getZoneUpgradeCost, getWhaleCost, WHALE_TRIP_DURATION } from './zones-config';
import { GameAction, GameState, WhaleTrip } from './types';

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
  boosterUnlocked: false,
  boosterLastUsed: -9999,
  comboUnlocked: false,
};

export function getUpgradeCost(id: string, count: number): number {
  const config = UPGRADES.find(u => u.id === id);
  if (!config) return Infinity;
  return Math.floor(config.baseCost * Math.pow(1.15, count));
}

export function getBps(state: GameState): number {
  const base = UPGRADES.reduce((total, config) => {
    const count = state.upgrades[config.id] ?? 0;
    return total + config.baseBps * count;
  }, 0);

  const zoneMult = ZONES
    .filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.bpsMultiplier)
    .reduce((m, z) => m + (z.bonus.bpsMultiplier ?? 0), 1);

  return base * zoneMult;
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

    case 'TICK': {
      const newTime     = state.playTimeSeconds + action.delta;
      const boosterMult = state.playTimeSeconds < state.boosterLastUsed + 120 ? 3 : 1;
      const produced    = getBps(state) * action.delta * action.weatherMultiplier * boosterMult;

      // Traitement des baleines
      const completed = state.activeWhales.filter(w => w.startedAt + w.duration <= newTime);
      const ongoing   = state.activeWhales.filter(w => w.startedAt + w.duration > newTime);
      const newStocks = { ...state.zoneStocks };
      const newTrips:  WhaleTrip[] = [];

      // Zones déjà ciblées par les baleines en cours + les nouvelles
      const usedToZones = new Set([...ongoing.map(w => w.toZoneId)]);

      for (const trip of completed) {
        const destLevel = state.zoneLevels[trip.toZoneId] ?? 0;
        if (destLevel >= 1) {
          const delivery = getZoneDelivery(destLevel);
          const maxStock = getZoneMaxStock(destLevel);
          const curStock = newStocks[trip.toZoneId] ?? 0;
          newStocks[trip.toZoneId] = Math.min(curStock + delivery, maxStock);
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
            duration:   WHALE_TRIP_DURATION + Math.random() * 20 - 10, // ±10s
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
        duration:   WHALE_TRIP_DURATION + Math.random() * 20 - 10,
      };
      return {
        ...state,
        bananas: state.bananas - cost,
        whalesOwned: state.whalesOwned + 1,
        activeWhales: [...state.activeWhales, trip],
      };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      if (state.unlockedAchievements.includes(action.id)) return state;
      return { ...state, unlockedAchievements: [...state.unlockedAchievements, action.id] };
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
      return { ...state, claimedQuests: [...state.claimedQuests, action.id] };
    }

    case 'ACTIVATE_BOOSTER': {
      if (!state.boosterUnlocked) return state;
      if (state.playTimeSeconds < state.boosterLastUsed + 600) return state;
      return { ...state, boosterLastUsed: state.playTimeSeconds };
    }

    case 'GRANDE_MIGRATION': {
      const newTotal      = state.totalMigrations + 1;
      const migDoneInAge  = (newTotal - 1) % 3; // 0=1ère, 1=2ème, 2=3ème migration de l'âge
      const newAge        = Math.floor(newTotal / 3);

      return {
        ...INITIAL_STATE,
        currentAge:           newAge,
        totalMigrations:      newTotal,
        playTimeSeconds:      state.playTimeSeconds,
        unlockedAchievements: state.unlockedAchievements,
        heritageBpc:          state.heritageBpc + 1,
        boosterUnlocked:      state.boosterUnlocked || migDoneInAge >= 1,
        boosterLastUsed:      state.boosterLastUsed,
        comboUnlocked:        state.comboUnlocked    || migDoneInAge >= 2,
      };
    }

    case 'LOAD_SAVE':
      return { ...INITIAL_STATE, ...action.payload };

    default:
      return state;
  }
}
