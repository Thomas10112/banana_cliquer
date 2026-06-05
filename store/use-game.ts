import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getBpc, getBps, gameReducer, INITIAL_STATE } from './game-reducer';
import { ACHIEVEMENTS } from './achievements-config';
import { getZoneMaxStock } from './zones-config';

const SAVE_KEY = 'banana_clicker_v1';
const TICK_MS  = 250;
const SAVE_INTERVAL_MS = 5000;
const OFFLINE_MIN_SECONDS = 60;
const OFFLINE_CAP_SECONDS = 4 * 3600;

export function useGame(weatherMultiplier: number = 1) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [pendingOfflineGains, setPendingOfflineGains] = useState(0);
  const [pendingOfflineSeconds, setPendingOfflineSeconds] = useState(0);
  const [zoneFullQueue, setZoneFullQueue] = useState<string[]>([]);
  const weatherRef   = useRef(weatherMultiplier);
  const saveTimeout  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loadedRef    = useRef(false);
  const prevStocksRef     = useRef<Record<string, number>>({});
  const achievementTimer  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stateRef          = useRef(state);

  useEffect(() => { weatherRef.current = weatherMultiplier; }, [weatherMultiplier]);

  // ── Chargement de la sauvegarde ──
  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          dispatch({ type: 'LOAD_SAVE', payload: saved });

          if (saved.lastSavedAt > 0) {
            const elapsed = (Date.now() - saved.lastSavedAt) / 1000;
            const capped  = Math.min(elapsed, OFFLINE_CAP_SECONDS);
            if (capped >= OFFLINE_MIN_SECONDS) {
              const bps    = getBps({ ...INITIAL_STATE, ...saved });
              const gains  = Math.floor(bps * capped);
              if (gains > 0) {
                dispatch({ type: 'ADD_OFFLINE_GAINS', amount: gains });
                setPendingOfflineGains(gains);
                setPendingOfflineSeconds(Math.floor(capped));
              }
            }
          }
        } catch {}
      }
      loadedRef.current = true;
    });
  }, []);

  // ── Sauvegarde toutes les 5s (indépendant de l'activité) ──
  useEffect(() => {
    const id = setInterval(() => {
      if (!loadedRef.current) return;
      AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ ...stateRef.current, lastSavedAt: Date.now() }));
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // ── Sauvegarde immédiate quand l'app passe en arrière-plan ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if ((nextState === 'background' || nextState === 'inactive') && loadedRef.current) {
        clearTimeout(saveTimeout.current);
        AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ ...stateRef.current, lastSavedAt: Date.now() }));
      }
    });
    return () => sub.remove();
  }, []);

  // ── Tick ──
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'TICK', delta: TICK_MS / 1000, weatherMultiplier: weatherRef.current });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── Détection zones pleines ──
  useEffect(() => {
    if (!loadedRef.current) return;
    const prev = prevStocksRef.current;
    const newFull: string[] = [];
    Object.entries(state.zoneStocks).forEach(([id, stock]) => {
      const level = state.zoneLevels[id] ?? 0;
      if (level < 1) return;
      const max = getZoneMaxStock(level);
      if (max > 0 && stock >= max && (prev[id] ?? 0) < max) newFull.push(id);
    });
    if (newFull.length > 0) setZoneFullQueue(q => [...q, ...newFull]);
    prevStocksRef.current = { ...state.zoneStocks };
  }, [state.zoneStocks]);

  // ── Succès (throttlé à 500ms) ──
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    achievementTimer.current = setInterval(() => { // eslint-disable-line
      const s = stateRef.current;
      const newIds = ACHIEVEMENTS
        .filter(a => !s.unlockedAchievements.includes(a.id) && a.check(s))
        .map(a => a.id);
      if (newIds.length > 0) dispatch({ type: 'UNLOCK_ACHIEVEMENTS_BATCH', ids: newIds });
    }, 1000);
    return () => clearInterval(achievementTimer.current);
  }, []);

  const boosterActive = state.playTimeSeconds < state.boosterLastUsed + 120;
  const bps = getBps(state) * weatherRef.current * (boosterActive ? 3 : 1);
  const bpc = getBpc(state);

  const click         = useCallback((comboMultiplier?: number) => dispatch({ type: 'CLICK', comboMultiplier }), []);
  const buyUpgrade     = useCallback((id: string) => dispatch({ type: 'BUY_UPGRADE', id }), []);
  const bulkBuyUpgrade = useCallback((id: string, quantity: number) => dispatch({ type: 'BUY_UPGRADE_BULK', id, quantity }), []);
  const claimQuest    = useCallback((id: string) => dispatch({ type: 'CLAIM_QUEST', id }), []);
  const migrate       = useCallback(() => dispatch({ type: 'GRANDE_MIGRATION' }), []);
  const collectGolden = useCallback(() => dispatch({ type: 'COLLECT_GOLDEN' }), []);
  const conquerZone   = useCallback((id: string) => dispatch({ type: 'CONQUER_ZONE', id }), []);
  const upgradeZone   = useCallback((id: string) => dispatch({ type: 'UPGRADE_ZONE', id }), []);
  const harvestZone   = useCallback((id: string) => dispatch({ type: 'HARVEST_ZONE', id }), []);
  const buyWhale        = useCallback(() => dispatch({ type: 'BUY_WHALE' }), []);
  const activateBooster   = useCallback(() => dispatch({ type: 'ACTIVATE_BOOSTER' }), []);
  const deactivateBooster = useCallback(() => dispatch({ type: 'DEACTIVATE_BOOSTER' }), []);
  const upgradeAutoClick = useCallback(() => dispatch({ type: 'UPGRADE_AUTO_CLICK' }), []);
  const devJumpToAge    = useCallback((age: number) => dispatch({
    type: 'LOAD_SAVE',
    payload: { ...INITIAL_STATE, currentAge: age, totalMigrations: age * 3, bananas: 1_000_000_000_000, totalBananas: 1_000_000_000_000 },
  }), []);
  const giftBananas = useCallback((amount: number) => {
    dispatch({ type: 'ADD_OFFLINE_GAINS', amount });
  }, []);
  const claimOfflineGains = useCallback(() => {
    setPendingOfflineGains(0);
    setPendingOfflineSeconds(0);
  }, []);
  const [justReset, setJustReset] = useState(false);
  const resetGame = useCallback(() => {
    dispatch({ type: 'LOAD_SAVE', payload: INITIAL_STATE });
    setJustReset(true);
  }, []);
  const clearJustReset = useCallback(() => setJustReset(false), []);

  const isBoosterActive = boosterActive;
  const boosterCooldownLeft = Math.max(0, state.boosterLastUsed + 600 - state.playTimeSeconds);

  const dismissZoneFull = useCallback(() => setZoneFullQueue(q => q.slice(1)), []);
  const saveNow = useCallback(() => {
    if (!loadedRef.current) return;
    AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ ...stateRef.current, lastSavedAt: Date.now() }));
  }, []);

  return { state, bps, bpc, click, buyUpgrade, bulkBuyUpgrade, claimQuest, migrate, collectGolden, conquerZone, upgradeZone, harvestZone, buyWhale, activateBooster, deactivateBooster, isBoosterActive, boosterCooldownLeft, devJumpToAge, pendingOfflineGains, pendingOfflineSeconds, claimOfflineGains, resetGame, justReset, clearJustReset, giftBananas, upgradeAutoClick, zoneFullQueue, dismissZoneFull, saveNow };
}
