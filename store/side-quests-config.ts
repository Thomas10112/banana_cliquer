import { GameState } from './types';
import { BaseQuest } from './quests-config';

/**
 * Quêtes secondaires — défis transversaux et PERSISTANTS.
 * Contrairement aux quêtes d'âge, elles ne se reset PAS à la migration
 * (claimedSideQuests est conservé dans GRANDE_MIGRATION) et ne débloquent
 * aucun upgrade : elles donnent juste des bananes. `minAge` sert seulement
 * de palier d'apparition (la quête devient visible à partir de cet âge).
 */
export interface SideQuestConfig extends BaseQuest {
  emoji: string;
  minAge: number; // palier d'apparition (ne disparaît jamais ensuite)
}

// Helpers de comptage sur l'état courant
const conqueredZones = (s: GameState) =>
  Object.values(s.zoneLevels ?? {}).filter(l => l >= 1).length;
const maxedZones = (s: GameState) =>
  Object.values(s.zoneLevels ?? {}).filter(l => l >= 3).length;
const totalUpgradesOwned = (s: GameState) =>
  Object.values(s.upgrades ?? {}).reduce((sum, n) => sum + n, 0);

const clamp = (cur: number, total: number) => ({ current: Math.min(cur, total), total });

export const SIDE_QUESTS: SideQuestConfig[] = [

  // ── Clics ──────────────────────────────────────────────────────────────────
  {
    id: 'clicks_100', emoji: '👆', minAge: 0, reward: 500,
    title: 'Apprenti cliqueur', description: 'Clique 100 fois sur la banane',
    check: (s) => s.totalClicks >= 100,
    progress: (s) => clamp(s.totalClicks, 100),
  },
  {
    id: 'clicks_1k', emoji: '✊', minAge: 0, reward: 4000,
    title: 'Doigt en feu', description: 'Clique 1 000 fois au total',
    check: (s) => s.totalClicks >= 1000,
    progress: (s) => clamp(s.totalClicks, 1000),
  },
  {
    id: 'clicks_10k', emoji: '💥', minAge: 1, reward: 80000,
    title: 'Machine à cliquer', description: 'Clique 10 000 fois au total',
    check: (s) => s.totalClicks >= 10000,
    progress: (s) => clamp(s.totalClicks, 10000),
  },
  {
    id: 'clicks_50k', emoji: '🌋', minAge: 2, reward: 3000000,
    title: 'Tendinite légendaire', description: 'Clique 50 000 fois au total',
    check: (s) => s.totalClicks >= 50000,
    progress: (s) => clamp(s.totalClicks, 50000),
  },

  // ── Bananes cumulées (lifetime) ──────────────────────────────────────────────
  {
    id: 'total_10k', emoji: '🍌', minAge: 0, reward: 2000,
    title: 'Premier régime', description: 'Récolte 10 000 bananes au total',
    check: (s) => s.totalBananas >= 10000,
    progress: (s) => clamp(s.totalBananas, 10000),
  },
  {
    id: 'total_1m', emoji: '🏦', minAge: 1, reward: 60000,
    title: 'Millionnaire en bananes', description: 'Récolte 1 000 000 bananes au total',
    check: (s) => s.totalBananas >= 1000000,
    progress: (s) => clamp(s.totalBananas, 1000000),
  },
  {
    id: 'total_1b', emoji: '🌍', minAge: 3, reward: 50000000,
    title: 'Empire bananier', description: 'Récolte 1 milliard de bananes au total',
    check: (s) => s.totalBananas >= 1000000000,
    progress: (s) => clamp(s.totalBananas, 1000000000),
  },

  // ── Temps de jeu ─────────────────────────────────────────────────────────────
  {
    id: 'playtime_1h', emoji: '⏱️', minAge: 0, reward: 15000,
    title: 'Mordu', description: 'Joue 1 heure au total',
    check: (s) => s.playTimeSeconds >= 3600,
    progress: (s) => clamp(s.playTimeSeconds, 3600),
  },
  {
    id: 'playtime_5h', emoji: '🕰️', minAge: 1, reward: 120000,
    title: 'Accro à la banane', description: 'Joue 5 heures au total',
    check: (s) => s.playTimeSeconds >= 18000,
    progress: (s) => clamp(s.playTimeSeconds, 18000),
  },

  // ── Transports (baleines) ────────────────────────────────────────────────────
  {
    id: 'whales_3', emoji: '🐋', minAge: 0, reward: 10000,
    title: 'Petite flotte', description: 'Possède 3 transports',
    check: (s) => s.whalesOwned >= 3,
    progress: (s) => clamp(s.whalesOwned, 3),
  },
  {
    id: 'whales_10', emoji: '⚓', minAge: 1, reward: 400000,
    title: "Maître de la mer", description: 'Possède 10 transports',
    check: (s) => s.whalesOwned >= 10,
    progress: (s) => clamp(s.whalesOwned, 10),
  },

  // ── Territoires ──────────────────────────────────────────────────────────────
  {
    id: 'zones_3', emoji: '🗺️', minAge: 0, reward: 8000,
    title: 'Explorateur', description: 'Conquiers 3 territoires',
    check: (s) => conqueredZones(s) >= 3,
    progress: (s) => clamp(conqueredZones(s), 3),
  },
  {
    id: 'zones_max_1', emoji: '🏰', minAge: 1, reward: 50000,
    title: 'Place forte', description: 'Améliore un territoire au niveau maximum',
    check: (s) => maxedZones(s) >= 1,
    progress: (s) => clamp(maxedZones(s), 1),
  },
  {
    id: 'zones_6', emoji: '🧭', minAge: 1, reward: 150000,
    title: 'Conquérant', description: 'Conquiers 6 territoires',
    check: (s) => conqueredZones(s) >= 6,
    progress: (s) => clamp(conqueredZones(s), 6),
  },

  // ── Migrations ───────────────────────────────────────────────────────────────
  {
    id: 'migrate_1', emoji: '🧬', minAge: 0, reward: 5000,
    title: 'Premier héritage', description: 'Effectue ta première migration',
    check: (s) => s.totalMigrations >= 1,
    progress: (s) => clamp(s.totalMigrations, 1),
  },
  {
    id: 'migrate_3', emoji: '🚀', minAge: 1, reward: 200000,
    title: "Saut d'ère", description: 'Effectue 3 migrations (un âge complet)',
    check: (s) => s.totalMigrations >= 3,
    progress: (s) => clamp(s.totalMigrations, 3),
  },

  // ── Auto-clic ────────────────────────────────────────────────────────────────
  {
    id: 'autoclick_1', emoji: '🤖', minAge: 0, reward: 12000,
    title: 'Mains libres', description: "Débloque l'auto-clic",
    check: (s) => s.autoClickLevel >= 1,
    progress: (s) => clamp(s.autoClickLevel, 1),
  },
  {
    id: 'autoclick_max', emoji: '⚙️', minAge: 1, reward: 300000,
    title: 'Pilote automatique', description: "Améliore l'auto-clic au niveau maximum",
    check: (s) => s.autoClickLevel >= 3,
    progress: (s) => clamp(s.autoClickLevel, 3),
  },

  // ── Améliorations possédées ──────────────────────────────────────────────────
  {
    id: 'upgrades_50', emoji: '🏗️', minAge: 1, reward: 100000,
    title: 'Petite entreprise', description: 'Possède 50 améliorations au total',
    check: (s) => totalUpgradesOwned(s) >= 50,
    progress: (s) => clamp(totalUpgradesOwned(s), 50),
  },
  {
    id: 'upgrades_200', emoji: '🏢', minAge: 2, reward: 2000000,
    title: 'Conglomérat', description: 'Possède 200 améliorations au total',
    check: (s) => totalUpgradesOwned(s) >= 200,
    progress: (s) => clamp(totalUpgradesOwned(s), 200),
  },
];
