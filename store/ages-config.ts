export interface MigrationRequirements {
  totalBananas: number;    // 0 = pas de critère bananes
  claimedQuestId: string;
  description: string;
  minTransports?: number;  // whalesOwned minimum requis
  allZonesMaxed?: boolean; // toutes les zones de l'âge au niveau 3
  halfUpgrades?: boolean;  // posséder la moitié du maxCount de chaque upgrade de l'âge
}

export interface AgeConfig {
  id: number;
  name: string;
  emoji: string;
  // 3 migrations par âge (la 3e change d'ère) — sauf le dernier âge : 2 migrations puis fin du jeu
  migrations: MigrationRequirements[] | null;
}

export const AGES: AgeConfig[] = [
  {
    id: 0,
    name: "L'Ère Sauvage",
    emoji: '🌿',
    migrations: [
      { totalBananas: 1500,  claimedQuestId: 'buy_3_bananiers', description: '3 Bananiers et 1 500 bananes',  minTransports: 1 },
      { totalBananas: 4000,  claimedQuestId: 'buy_1_girafe',    description: '1 Girafe et 4 000 bananes',    minTransports: 1 },
      { totalBananas: 8000,  claimedQuestId: 'buy_1_girafe',    description: '1 Girafe et 8 000 bananes',    allZonesMaxed: true },
    ],
  },
  {
    id: 1,
    name: "L'Ère Agricole",
    emoji: '🌾',
    migrations: [
      { totalBananas: 20000,  claimedQuestId: 'buy_5_charrues',  description: '5 Charrues et 20 000 bananes',   minTransports: 1 },
      { totalBananas: 60000,  claimedQuestId: 'buy_1_marche',    description: '1 Marché et 60 000 bananes',     minTransports: 1 },
      { totalBananas: 120000, claimedQuestId: 'buy_1_marche',    description: '1 Marché et 120 000 bananes',    allZonesMaxed: true },
    ],
  },
  {
    id: 2,
    name: "L'Ère Industrielle",
    emoji: '🏭',
    migrations: [
      { totalBananas: 500000,   claimedQuestId: 'buy_5_machines',    description: '5 Machines et 500 000 bananes',  minTransports: 1 },
      { totalBananas: 1500000,  claimedQuestId: 'buy_1_locomotive',  description: '1 Locomotive et 1,5M bananes',  minTransports: 1 },
      { totalBananas: 3000000,  claimedQuestId: 'buy_1_locomotive',  description: '1 Locomotive et 3M bananes',    allZonesMaxed: true },
    ],
  },
  {
    id: 3,
    name: "L'Ère Moderne",
    emoji: '🚁',
    migrations: [
      { totalBananas: 10000000,   claimedQuestId: 'buy_5_ordinateurs', description: '5 Ordinateurs et 10M bananes',   minTransports: 1 },
      { totalBananas: 30000000,   claimedQuestId: 'buy_1_satellite',   description: '1 Satellite et 30M bananes',    minTransports: 1 },
      { totalBananas: 70000000,   claimedQuestId: 'buy_1_satellite',   description: '1 Satellite et 70M bananes',    allZonesMaxed: true },
    ],
  },
  {
    id: 4,
    name: "L'Ère Robotique",
    emoji: '🤖',
    migrations: [
      { totalBananas: 0, claimedQuestId: 'buy_1_megastructure', description: 'La moitié de chaque amélioration', halfUpgrades: true },
      { totalBananas: 0, claimedQuestId: 'buy_1_megastructure', description: 'La moitié de chaque amélioration', halfUpgrades: true },
    ],
  },
];
