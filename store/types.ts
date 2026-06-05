import { ImageSourcePropType } from 'react-native';

export interface UpgradeConfig {
  id: string;
  name: string;
  emoji?: string;
  image?: ImageSourcePropType;
  description: string;
  baseCost: number;
  baseBps: number;
  minAge?: number;
  unlockedBy?: string;
  maxCount?: number;
}

export interface WhaleTrip {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  startedAt: number;
  duration: number;
}

export interface GameState {
  bananas: number;
  totalBananas: number;
  bananasPerClick: number;
  upgrades: Record<string, number>;
  playTimeSeconds: number;
  claimedQuests: string[];
  currentAge: number;
  totalMigrations: number;
  unlockedAchievements: string[];
  zoneLevels: Record<string, number>;
  zoneStocks: Record<string, number>;
  activeWhales: WhaleTrip[];
  whalesOwned: number;
  // Héritage inter-migrations
  heritageBpc: number;
  heritageBps: number;
  boosterUnlocked: boolean;
  boosterLastUsed: number;
  comboUnlocked: boolean;
  // Gains hors-ligne
  lastSavedAt: number;
  // Auto-clic
  autoClickLevel: number; // 0=inactif, 1-3
  // Stats lifetime
  totalClicks: number;
}

export type GameAction =
  | { type: 'CLICK'; comboMultiplier?: number }
  | { type: 'BUY_UPGRADE'; id: string }
  | { type: 'TICK'; delta: number; weatherMultiplier: number }
  | { type: 'CLAIM_QUEST'; id: string }
  | { type: 'GRANDE_MIGRATION' }
  | { type: 'UNLOCK_ACHIEVEMENT'; id: string }
  | { type: 'UNLOCK_ACHIEVEMENTS_BATCH'; ids: string[] }
  | { type: 'COLLECT_GOLDEN' }
  | { type: 'CONQUER_ZONE'; id: string }
  | { type: 'UPGRADE_ZONE'; id: string }
  | { type: 'HARVEST_ZONE'; id: string }
  | { type: 'BUY_WHALE' }
  | { type: 'ACTIVATE_BOOSTER' }
  | { type: 'DEACTIVATE_BOOSTER' }
  | { type: 'BUY_UPGRADE_BULK'; id: string; quantity: number }
  | { type: 'UPGRADE_AUTO_CLICK' }
  | { type: 'ADD_OFFLINE_GAINS'; amount: number }
  | { type: 'LOAD_SAVE'; payload: Partial<GameState> };
