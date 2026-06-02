import React, { createContext, useContext } from 'react';
import { useGame } from './use-game';
import { useWeather, WeatherType } from '@/hooks/use-weather';

type GameContextValue = ReturnType<typeof useGame> & {
  weatherEmoji: string;
  weatherLabel: string;
  weatherType: WeatherType;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const weather = useWeather();
  const game = useGame(weather.multiplier);

  return (
    <GameContext.Provider value={{ ...game, weatherEmoji: weather.emoji, weatherLabel: weather.label, weatherType: weather.type }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
