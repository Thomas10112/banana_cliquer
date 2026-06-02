export interface MigrationRequirements {
  totalBananas: number;
  claimedQuestId: string;
  description: string;
}

export interface AgeConfig {
  id: number;
  name: string;
  emoji: string;
  migrations: [MigrationRequirements, MigrationRequirements, MigrationRequirements] | null;
}

export const AGES: AgeConfig[] = [
  {
    id: 0,
    name: "L'Ère Sauvage",
    emoji: '🌿',
    migrations: [
      {
        totalBananas: 1500,
        claimedQuestId: 'buy_3_bananiers',
        description: '3 Bananiers et 1 500 bananes récoltées',
      },
      {
        totalBananas: 4000,
        claimedQuestId: 'buy_1_girafe',
        description: '1 Girafe et 4 000 bananes récoltées',
      },
      {
        totalBananas: 8000,
        claimedQuestId: 'buy_1_girafe',
        description: '1 Girafe et 8 000 bananes récoltées',
      },
    ],
  },
  {
    id: 1,
    name: "L'Ère Agricole",
    emoji: '🌾',
    migrations: [
      { totalBananas: 20000,  claimedQuestId: 'buy_5_charrues',  description: '5 Charrues et 20 000 bananes' },
      { totalBananas: 60000,  claimedQuestId: 'buy_1_marche',    description: '1 Marché et 60 000 bananes' },
      { totalBananas: 120000, claimedQuestId: 'buy_1_marche',    description: '1 Marché et 120 000 bananes' },
    ],
  },
  {
    id: 2,
    name: "L'Ère Industrielle",
    emoji: '🏭',
    migrations: [
      { totalBananas: 500000,   claimedQuestId: 'buy_5_machines',    description: '5 Machines et 500 000 bananes' },
      { totalBananas: 1500000,  claimedQuestId: 'buy_1_locomotive',  description: '1 Locomotive et 1,5M bananes' },
      { totalBananas: 3000000,  claimedQuestId: 'buy_1_locomotive',  description: '1 Locomotive et 3M bananes' },
    ],
  },
  {
    id: 3,
    name: "L'Ère Moderne",
    emoji: '🚁',
    migrations: [
      { totalBananas: 100000000,  claimedQuestId: 'buy_5_ordinateurs', description: '5 Ordinateurs et 100M bananes' },
      { totalBananas: 300000000,  claimedQuestId: 'buy_1_satellite',   description: '1 Satellite et 300M bananes' },
      { totalBananas: 600000000,  claimedQuestId: 'buy_1_satellite',   description: '1 Satellite et 600M bananes' },
    ],
  },
  {
    id: 4,
    name: "L'Ère Robotique",
    emoji: '🤖',
    migrations: null,
  },
];
