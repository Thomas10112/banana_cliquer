import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { getBps, gameReducer, INITIAL_STATE } from './game-reducer';
import { ACHIEVEMENTS } from './achievements-config';

const SAVE_KEY = 'banana_clicker_v1';
const TICK_MS  = 100;
const SAVE_DEBOUNCE_MS = 2000;

export function useGame(weatherMultiplier: number = 1) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const weatherRef  = useRef(weatherMultiplier);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const loadedRef   = useRef(false);

  useEffect(() => { weatherRef.current = weatherMultiplier; }, [weatherMultiplier]);

  // ── Chargement de la sauvegarde ──
  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          dispatch({ type: 'LOAD_SAVE', payload: saved });
        } catch {}
      }
      loadedRef.current = true;
    });
  }, []);

  // ── Sauvegarde automatique (debouncée) ──
  useEffect(() => {
    if (!loadedRef.current) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimeout.current);
  }, [state]);

  // ── Tick ──
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'TICK', delta: TICK_MS / 1000, weatherMultiplier: weatherRef.current });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── Succès ──
  useEffect(() => {
    ACHIEVEMENTS.forEach(a => {
      if (!state.unlockedAchievements.includes(a.id) && a.check(state)) {
        dispatch({ type: 'UNLOCK_ACHIEVEMENT', id: a.id });
      }
    });
  }, [state]);

  const bps = getBps(state) * weatherRef.current;

  const click         = useCallback((comboMultiplier?: number) => dispatch({ type: 'CLICK', comboMultiplier }), []);
  const buyUpgrade    = useCallback((id: string) => dispatch({ type: 'BUY_UPGRADE', id }), []);
  const claimQuest    = useCallback((id: string) => dispatch({ type: 'CLAIM_QUEST', id }), []);
  const migrate       = useCallback(() => dispatch({ type: 'GRANDE_MIGRATION' }), []);
  const collectGolden = useCallback(() => dispatch({ type: 'COLLECT_GOLDEN' }), []);
  const conquerZone   = useCallback((id: string) => dispatch({ type: 'CONQUER_ZONE', id }), []);
  const upgradeZone   = useCallback((id: string) => dispatch({ type: 'UPGRADE_ZONE', id }), []);
  const harvestZone   = useCallback((id: string) => dispatch({ type: 'HARVEST_ZONE', id }), []);
  const buyWhale        = useCallback(() => dispatch({ type: 'BUY_WHALE' }), []);
  const activateBooster = useCallback(() => dispatch({ type: 'ACTIVATE_BOOSTER' }), []);
  const devJumpToAge    = useCallback((age: number) => dispatch({
    type: 'LOAD_SAVE',
    payload: { ...INITIAL_STATE, currentAge: age, totalMigrations: age * 3, bananas: 999999, totalBananas: 999999 },
  }), []);

  const isBoosterActive = state.playTimeSeconds < state.boosterLastUsed + 120;
  const boosterCooldownLeft = Math.max(0, state.boosterLastUsed + 600 - state.playTimeSeconds);

  return { state, bps, click, buyUpgrade, claimQuest, migrate, collectGolden, conquerZone, upgradeZone, harvestZone, buyWhale, activateBooster, isBoosterActive, boosterCooldownLeft, devJumpToAge };
}
