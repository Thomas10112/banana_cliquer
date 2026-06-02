import { GameState } from './types';

export interface QuestConfig {
  id: string;
  title: string;
  description: string;
  minAge?: number;
  check: (state: GameState) => boolean;
  progress: (state: GameState) => { current: number; total: number };
}

export const QUESTS: QuestConfig[] = [

  // ── Ère Sauvage (age 0) ─────────────────────────────────────────────────────
  {
    id: 'buy_10_monkeys',
    title: 'Une armée de singes',
    description: 'Achète 10 singes',
    check: (s) => (s.upgrades['monkey'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['monkey'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_guerriers',
    title: 'La garde Maasaï',
    description: 'Achète 5 guerriers Maasaï',
    check: (s) => (s.upgrades['guerrier_massai'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['guerrier_massai'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_3_bananiers',
    title: 'La forêt de bananiers',
    description: 'Achète 3 bananiers',
    check: (s) => (s.upgrades['bananier'] ?? 0) >= 3,
    progress: (s) => ({ current: Math.min(s.upgrades['bananier'] ?? 0, 3), total: 3 }),
  },
  {
    id: 'buy_1_girafe',
    title: 'Cou long, vue large',
    description: 'Achète ta première Girafe Cueilleuse',
    check: (s) => (s.upgrades['girafe'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['girafe'] ?? 0, 1), total: 1 }),
  },

  // ── Ère Agricole (age 1) ─────────────────────────────────────────────────────
  {
    id: 'buy_10_paysans',
    title: 'La commune',
    description: 'Embauche 10 paysans',
    minAge: 1,
    check: (s) => (s.upgrades['paysan'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['paysan'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_charrues',
    title: 'Les champs labourés',
    description: 'Acquiers 5 charrues',
    minAge: 1,
    check: (s) => (s.upgrades['charrue'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['charrue'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_3_moulins',
    title: 'Le bruit du vent',
    description: 'Construis 3 moulins à vent',
    minAge: 1,
    check: (s) => (s.upgrades['moulin'] ?? 0) >= 3,
    progress: (s) => ({ current: Math.min(s.upgrades['moulin'] ?? 0, 3), total: 3 }),
  },
  {
    id: 'buy_1_marche',
    title: 'Place du marché',
    description: 'Ouvre ton premier marché',
    minAge: 1,
    check: (s) => (s.upgrades['marche'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['marche'] ?? 0, 1), total: 1 }),
  },

  // ── Ère Industrielle (age 2) ─────────────────────────────────────────────────
  {
    id: 'buy_10_ouvriers',
    title: 'La classe ouvrière',
    description: 'Embauche 10 ouvriers',
    minAge: 2,
    check: (s) => (s.upgrades['ouvrier'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['ouvrier'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_machines',
    title: 'Vapeur et acier',
    description: 'Installe 5 machines à vapeur',
    minAge: 2,
    check: (s) => (s.upgrades['machine_vapeur'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['machine_vapeur'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_3_usines',
    title: 'Fumée à l\'horizon',
    description: 'Construis 3 usines',
    minAge: 2,
    check: (s) => (s.upgrades['usine'] ?? 0) >= 3,
    progress: (s) => ({ current: Math.min(s.upgrades['usine'] ?? 0, 3), total: 3 }),
  },
  {
    id: 'buy_1_locomotive',
    title: 'En route !',
    description: 'Lance ta première locomotive',
    minAge: 2,
    check: (s) => (s.upgrades['locomotive'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['locomotive'] ?? 0, 1), total: 1 }),
  },

  // ── Ère Moderne (age 3) ──────────────────────────────────────────────────────
  {
    id: 'buy_10_ingenieurs',
    title: 'Bureau d\'études',
    description: 'Recrute 10 ingénieurs',
    minAge: 3,
    check: (s) => (s.upgrades['ingenieur'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['ingenieur'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_ordinateurs',
    title: 'Réseau bananier',
    description: 'Connecte 5 ordinateurs',
    minAge: 3,
    check: (s) => (s.upgrades['ordinateur'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['ordinateur'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_3_drones',
    title: 'La flotte aérienne',
    description: 'Déploie 3 drones',
    minAge: 3,
    check: (s) => (s.upgrades['drone'] ?? 0) >= 3,
    progress: (s) => ({ current: Math.min(s.upgrades['drone'] ?? 0, 3), total: 3 }),
  },
  {
    id: 'buy_1_satellite',
    title: 'Vue depuis l\'orbite',
    description: 'Lance ton premier satellite',
    minAge: 3,
    check: (s) => (s.upgrades['satellite'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['satellite'] ?? 0, 1), total: 1 }),
  },

  // ── Ère Robotique (age 4) ────────────────────────────────────────────────────
  {
    id: 'buy_10_robots',
    title: 'L\'armée de métal',
    description: 'Déploie 10 robots',
    minAge: 4,
    check: (s) => (s.upgrades['robot'] ?? 0) >= 10,
    progress: (s) => ({ current: Math.min(s.upgrades['robot'] ?? 0, 10), total: 10 }),
  },
  {
    id: 'buy_5_ia',
    title: 'Esprit de ruche',
    description: 'Active 5 intelligences artificielles',
    minAge: 4,
    check: (s) => (s.upgrades['ia'] ?? 0) >= 5,
    progress: (s) => ({ current: Math.min(s.upgrades['ia'] ?? 0, 5), total: 5 }),
  },
  {
    id: 'buy_1_megastructure',
    title: 'Civilisation de type II',
    description: 'Construis ta première Mégastructure',
    minAge: 4,
    check: (s) => (s.upgrades['megastructure'] ?? 0) >= 1,
    progress: (s) => ({ current: Math.min(s.upgrades['megastructure'] ?? 0, 1), total: 1 }),
  },
];
