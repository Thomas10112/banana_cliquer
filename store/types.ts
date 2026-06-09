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

export interface RaidEntry {
  id: string;
  menaceId: string;
  won: boolean;
  delta: number;   // bananes gagnées (>0) ou perdues (<0) sur la cargaison
  at: number;      // playTimeSeconds
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
  boosterActive: boolean;          // ×3 en cours
  boosterRemaining: number;        // budget de ×3 restant (s), max BOOSTER_DURATION
  boosterCooldownUntil: number;    // playTimeSeconds de fin de recharge (0 = pas de recharge)
  comboUnlocked: boolean;
  // Gains hors-ligne
  lastSavedAt: number;
  // Auto-clic
  autoClickLevel: number; // 0=inactif, 1-3
  // Stats lifetime
  totalClicks: number;
  // Quêtes secondaires — défis persistants (survivent aux migrations)
  claimedSideQuests: string[];
  // ── Taverne (héros gacha + raids) — débloqué à l'âge 3, persistant migration ──
  crewTokens: number;                      // 🎟️ monnaie gacha
  gachaPity: number;                       // compteur avant légendaire garanti
  heroLevels: Record<string, number>;      // heroId -> niveau (absent/0 = non possédé)
  heroFragments: Record<string, number>;   // doublons accumulés
  transportLevels: Record<number, number>; // niveau 0-20 PAR classe de transport (clé = âge)
  heroSlots: (string | null)[];            // héros assignés au transport
  lastPull: import('./gacha').PullResult[] | null; // résultats du dernier tirage (transient, pour la modale)
  raidLog: RaidEntry[];                    // journal des embuscades (cappé, récent en premier)
}

export type GameAction =
  | { type: 'CLICK'; comboMultiplier?: number }
  | { type: 'BUY_UPGRADE'; id: string }
  | { type: 'TICK'; delta: number; weatherMultiplier: number }
  | { type: 'CLAIM_QUEST'; id: string }
  | { type: 'CLAIM_SIDE_QUEST'; id: string }
  | { type: 'UPGRADE_TRANSPORT' }
  | { type: 'PULL_GACHA'; count: number }
  | { type: 'CLEAR_PULL' }
  | { type: 'ADD_TOKENS'; amount: number }
  | { type: 'LEVEL_UP_HERO'; id: string }
  | { type: 'ASSIGN_HERO'; heroId: string; slot: number }
  | { type: 'UNASSIGN_HERO'; slot: number }
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
