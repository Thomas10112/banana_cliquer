import { GameState } from './types';

export interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  check: (state: GameState) => boolean;
}

export const ACHIEVEMENTS: AchievementConfig[] = [
  {
    id: 'premier_regime',
    title: '🌟 Premier Régime',
    description: 'Les grandes forêts commencent par une seule graine',
    check: (state) => state.totalBananas >= 1000,
  },
];
