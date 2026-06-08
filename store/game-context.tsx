import React, { createContext, useContext, useMemo } from 'react';
import { useGame } from './use-game';
import { useWeather, WeatherType } from '@/hooks/use-weather';

type GameValue = ReturnType<typeof useGame> & {
  weatherEmoji: string;
  weatherLabel: string;
  weatherType: WeatherType;
  weatherMultiplier: number;
};

// État changeant (re-render à chaque tick) — séparé des actions stables pour que
// les composants qui n'ont besoin que des actions ne re-render jamais sur un tick.
type GameStateValue = Pick<GameValue,
  | 'state' | 'bps' | 'bpc'
  | 'isBoosterActive' | 'boosterCooldownLeft'
  | 'pendingOfflineGains' | 'pendingOfflineSeconds'
  | 'justReset' | 'zoneFullQueue'
  | 'weatherEmoji' | 'weatherLabel' | 'weatherType' | 'weatherMultiplier'
>;

// Actions stables (identité figée après le montage).
type GameActionsValue = Omit<GameValue, keyof GameStateValue>;

const GameStateContext   = createContext<GameStateValue | null>(null);
const GameActionsContext = createContext<GameActionsValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const weather = useWeather();
  const game = useGame(weather.multiplier);

  const {
    state, bps, bpc, isBoosterActive, boosterCooldownLeft,
    pendingOfflineGains, pendingOfflineSeconds, justReset, zoneFullQueue,
    ...actions
  } = game;

  const stateValue = useMemo<GameStateValue>(() => ({
    state, bps, bpc, isBoosterActive, boosterCooldownLeft,
    pendingOfflineGains, pendingOfflineSeconds, justReset, zoneFullQueue,
    weatherEmoji: weather.emoji, weatherLabel: weather.label,
    weatherType: weather.type, weatherMultiplier: weather.multiplier,
  }), [
    state, bps, bpc, isBoosterActive, boosterCooldownLeft,
    pendingOfflineGains, pendingOfflineSeconds, justReset, zoneFullQueue,
    weather.emoji, weather.label, weather.type, weather.multiplier,
  ]);

  // Les callbacks de useGame sont déjà stables (useCallback) → ce memo l'est aussi.
  const actionsValue = useMemo<GameActionsValue>(() => actions as GameActionsValue,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(actions));

  return (
    <GameActionsContext.Provider value={actionsValue}>
      <GameStateContext.Provider value={stateValue}>
        {children}
      </GameStateContext.Provider>
    </GameActionsContext.Provider>
  );
}

/** Accès complet (état + actions) — re-render à chaque tick. Compat historique. */
export function useGameContext(): GameValue {
  const s = useContext(GameStateContext);
  const a = useContext(GameActionsContext);
  if (!s || !a) throw new Error('useGameContext must be used within GameProvider');
  return { ...s, ...a } as GameValue;
}

/** Accès aux seules actions — identité stable, ne re-render pas sur les ticks. */
export function useGameActions(): GameActionsValue {
  const a = useContext(GameActionsContext);
  if (!a) throw new Error('useGameActions must be used within GameProvider');
  return a;
}

/** Accès au seul état changeant. */
export function useGameState(): GameStateValue {
  const s = useContext(GameStateContext);
  if (!s) throw new Error('useGameState must be used within GameProvider');
  return s;
}
