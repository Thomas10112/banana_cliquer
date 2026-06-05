import { GameState } from './types';

export interface QuestConfig {
  id: string;
  title: string;
  description: string;
  minAge?: number;
  reward: number; // bananes reçues en réclamant la quête
  check: (state: GameState) => boolean;
  progress: (state: GameState) => { current: number; total: number };
}

export const QUESTS: QuestConfig[] = [

  // ── Ère Sauvage (age 0) ─────────────────────────────────────────────────────
  {
    id: 'buy_10_monkeys', reward: 25,
    title: 'Une armée de singes', description: 'Achète 10 singes',
    check: (s) => (s.upgrades['monkey'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['monkey'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_guerriers', reward: 100,
    title: 'La garde Maasaï', description: 'Achète 5 guerriers Maasaï',
    check: (s) => (s.upgrades['guerrier_massai'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['guerrier_massai'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_3_bananiers', reward: 400,
    title: 'La forêt de bananiers', description: 'Achète 3 bananiers',
    check: (s) => (s.upgrades['bananier'] ?? 0) >= 3,
    progress: (s) => ({ current: Math.min(s.upgrades['bananier'] ?? 0, 3), total: 3 }),
  },
  {
    id: 'buy_1_girafe', reward: 1000,
    title: 'Cou long, vue large', description: 'Achète ta première Girafe Cueilleuse',
    check: (s) => (s.upgrades['girafe'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['girafe'] ?? 0, 1), total: 1 }),
  },

  // ── Ère Agricole (age 1) ─────────────────────────────────────────────────────
  {
    id: 'buy_10_paysans', reward: 1500, minAge: 1,
    title: 'La commune', description: 'Embauche 10 paysans',
    check: (s) => (s.upgrades['paysan'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['paysan'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_charrues', reward: 6000, minAge: 1,
    title: 'Les champs labourés', description: 'Acquiers 5 charrues',
    check: (s) => (s.upgrades['charrue'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['charrue'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_3_moulins', reward: 20000, minAge: 1,
    title: 'Le bruit du vent', description: 'Construis 3 moulins à vent',
    check: (s) => (s.upgrades['moulin'] ?? 0) >= 3,
    progress: (s) => ({ current: Math.min(s.upgrades['moulin'] ?? 0, 3), total: 3 }),
  },
  {
    id: 'buy_1_marche', reward: 50000, minAge: 1,
    title: 'Place du marché', description: 'Ouvre ton premier marché',
    check: (s) => (s.upgrades['marche'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['marche'] ?? 0, 1), total: 1 }),
  },

  // ── Ère Industrielle (age 2) ─────────────────────────────────────────────────
  {
    id: 'buy_10_ouvriers', reward: 100000, minAge: 2,
    title: 'La classe ouvrière', description: 'Embauche 10 ouvriers',
    check: (s) => (s.upgrades['ouvrier'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['ouvrier'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_machines', reward: 400000, minAge: 2,
    title: 'Vapeur et acier', description: 'Installe 5 machines à vapeur',
    check: (s) => (s.upgrades['machine_vapeur'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['machine_vapeur'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_3_usines', reward: 1500000, minAge: 2,
    title: 'Fumée à l\'horizon', description: 'Construis 3 usines',
    check: (s) => (s.upgrades['usine'] ?? 0) >= 3,
    progress: (s) => ({ current: Math.min(s.upgrades['usine'] ?? 0, 3), total: 3 }),
  },
  {
    id: 'buy_1_locomotive', reward: 5000000, minAge: 2,
    title: 'En route !', description: 'Lance ta première locomotive',
    check: (s) => (s.upgrades['locomotive'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['locomotive'] ?? 0, 1), total: 1 }),
  },

  // ── Ère Moderne (age 3) ──────────────────────────────────────────────────────
  {
    id: 'buy_10_ingenieurs', reward: 1000000, minAge: 3,
    title: 'Bureau d\'études', description: 'Recrute 10 ingénieurs',
    check: (s) => (s.upgrades['ingenieur'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['ingenieur'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_ordinateurs', reward: 5000000, minAge: 3,
    title: 'Réseau bananier', description: 'Connecte 5 ordinateurs',
    check: (s) => (s.upgrades['ordinateur'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['ordinateur'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_3_drones', reward: 20000000, minAge: 3,
    title: 'La flotte aérienne', description: 'Déploie 3 drones',
    check: (s) => (s.upgrades['drone'] ?? 0) >= 3,
    progress: (s) => ({ current: Math.min(s.upgrades['drone'] ?? 0, 3), total: 3 }),
  },
  {
    id: 'buy_1_satellite', reward: 60000000, minAge: 3,
    title: 'Vue depuis l\'orbite', description: 'Lance ton premier satellite',
    check: (s) => (s.upgrades['satellite'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['satellite'] ?? 0, 1), total: 1 }),
  },

  // ── Ère Robotique (age 4) ────────────────────────────────────────────────────
  {
    id: 'buy_10_robots', reward: 6000000000, minAge: 4,
    title: 'L\'armée de métal', description: 'Déploie 10 robots',
    check: (s) => (s.upgrades['robot'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['robot'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_ia', reward: 30000000000, minAge: 4,
    title: 'Esprit de ruche', description: 'Active 5 intelligences artificielles',
    check: (s) => (s.upgrades['ia'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['ia'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_1_megastructure', reward: 150000000000, minAge: 4,
    title: 'Civilisation de type II', description: 'Construis ta première Mégastructure',
    check: (s) => (s.upgrades['megastructure'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['megastructure'] ?? 0, 1), total: 1 }),
  },
];
