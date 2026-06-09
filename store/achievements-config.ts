import { GameState } from './types';
import { getBps } from './game-reducer';
import { ZONES } from './zones-config';

export interface AchievementConfig {
  id: string;
  title: string;
  description: string;
  check: (state: GameState) => boolean;
}

function totalUpgrades(state: GameState): number {
  return Object.values(state.upgrades).reduce((a, b) => a + b, 0);
}

function conqueredCount(state: GameState): number {
  return Object.values(state.zoneLevels).filter(l => l >= 1).length;
}

function allAgeZonesConquered(state: GameState): boolean {
  const ageZones = ZONES.filter(z => z.minAge === state.currentAge);
  return ageZones.length > 0 && ageZones.every(z => (state.zoneLevels[z.id] ?? 0) >= 1);
}

export const ACHIEVEMENTS: AchievementConfig[] = [

  // ── Bananes récoltées ───────────────────────────────────────────────────────
  {
    id: 'premier_regime',
    title: '🍌 Premier Régime',
    description: 'Récolter 1 000 bananes au total',
    check: s => s.totalBananas >= 1_000,
  },
  {
    id: 'recolte_abondante',
    title: '🍌 Récolte Abondante',
    description: 'Récolter 10 000 bananes au total',
    check: s => s.totalBananas >= 10_000,
  },
  {
    id: 'grenier_plein',
    title: '🏚️ Grenier Plein',
    description: 'Récolter 100 000 bananes au total',
    check: s => s.totalBananas >= 100_000,
  },
  {
    id: 'millionnaire',
    title: '💰 Millionnaire',
    description: 'Récolter 1 000 000 bananes au total',
    check: s => s.totalBananas >= 1_000_000,
  },
  {
    id: 'cent_millions',
    title: '💎 Cent Millions',
    description: 'Récolter 100 000 000 bananes au total',
    check: s => s.totalBananas >= 100_000_000,
  },
  {
    id: 'milliardaire',
    title: '🏆 Milliardaire',
    description: 'Récolter 1 000 000 000 bananes au total',
    check: s => s.totalBananas >= 1_000_000_000,
  },
  {
    id: 'maitre_des_bananes',
    title: '👑 Maître des Bananes',
    description: 'Récolter 1 000 000 000 000 bananes au total',
    check: s => s.totalBananas >= 1_000_000_000_000,
  },

  // ── Production par seconde ──────────────────────────────────────────────────
  {
    id: 'premier_bps',
    title: '⚙️ Première Machine',
    description: 'Atteindre 1 banane/s',
    check: s => getBps(s) >= 1,
  },
  {
    id: 'ferme_productive',
    title: '🌾 Ferme Productive',
    description: 'Atteindre 10 bananes/s',
    check: s => getBps(s) >= 10,
  },
  {
    id: 'usine_a_bananes',
    title: '🏭 Usine à Bananes',
    description: 'Atteindre 100 bananes/s',
    check: s => getBps(s) >= 100,
  },
  {
    id: 'mega_production',
    title: '🚀 Méga Production',
    description: 'Atteindre 10 000 bananes/s',
    check: s => getBps(s) >= 10_000,
  },
  {
    id: 'machine_infernale',
    title: '🤖 Machine Infernale',
    description: 'Atteindre 1 000 000 bananes/s',
    check: s => getBps(s) >= 1_000_000,
  },

  // ── Clics ───────────────────────────────────────────────────────────────────
  {
    id: 'premier_clic',
    title: '👆 Premiers Pas',
    description: 'Cliquer 10 fois',
    check: s => s.totalClicks >= 10,
  },
  {
    id: 'cliqueur_assidu',
    title: '✌️ Cliqueur Assidu',
    description: 'Cliquer 100 fois',
    check: s => s.totalClicks >= 100,
  },
  {
    id: 'doigt_dart',
    title: '⚡ Doigt d\'Art',
    description: 'Cliquer 1 000 fois',
    check: s => s.totalClicks >= 1_000,
  },
  {
    id: 'tapeur_pro',
    title: '🔥 Tapeur Pro',
    description: 'Cliquer 10 000 fois',
    check: s => s.totalClicks >= 10_000,
  },

  // ── Upgrades ────────────────────────────────────────────────────────────────
  {
    id: 'premier_upgrade',
    title: '🐒 Premier Ouvrier',
    description: 'Acheter ta première amélioration',
    check: s => totalUpgrades(s) >= 1,
  },
  {
    id: 'equipement_basique',
    title: '🛠️ Équipement Basique',
    description: 'Posséder 10 améliorations au total',
    check: s => totalUpgrades(s) >= 10,
  },
  {
    id: 'arsenal_bananier',
    title: '⚔️ Arsenal Bananier',
    description: 'Posséder 50 améliorations au total',
    check: s => totalUpgrades(s) >= 50,
  },
  {
    id: 'empire_upgrades',
    title: '🏰 Empire d\'Upgrades',
    description: 'Posséder 100 améliorations au total',
    check: s => totalUpgrades(s) >= 100,
  },

  // ── Migrations & âges ───────────────────────────────────────────────────────
  {
    id: 'premiere_migration',
    title: '🌅 Première Migration',
    description: 'Effectuer ta première migration',
    check: s => s.totalMigrations >= 1,
  },
  {
    id: 'ere_agricole',
    title: '🌾 Ère Agricole',
    description: 'Atteindre l\'Ère Agricole',
    check: s => s.currentAge >= 1,
  },
  {
    id: 'ere_industrielle',
    title: '🏭 Ère Industrielle',
    description: 'Atteindre l\'Ère Industrielle',
    check: s => s.currentAge >= 2,
  },
  {
    id: 'ere_moderne',
    title: '💻 Ère Moderne',
    description: 'Atteindre l\'Ère Moderne',
    check: s => s.currentAge >= 3,
  },
  {
    id: 'ere_robotique',
    title: '🤖 Ère Robotique',
    description: 'Atteindre l\'Ère Robotique',
    check: s => s.currentAge >= 4,
  },

  // ── Zones ───────────────────────────────────────────────────────────────────
  {
    id: 'premier_territoire',
    title: '🗺️ Premier Territoire',
    description: 'Conquérir ta première zone',
    check: s => conqueredCount(s) >= 1,
  },
  {
    id: 'conquerant',
    title: '⚔️ Conquérant',
    description: 'Conquérir 3 zones',
    check: s => conqueredCount(s) >= 3,
  },
  {
    id: 'maitre_du_territoire',
    title: '🌍 Maître du Territoire',
    description: 'Conquérir toutes les zones de ton âge',
    check: s => allAgeZonesConquered(s),
  },

  // ── Transports ──────────────────────────────────────────────────────────────
  {
    id: 'premier_transport',
    title: '🐋 Premier Transport',
    description: 'Acheter ton premier transport',
    check: s => s.whalesOwned >= 1,
  },
  {
    id: 'flotte',
    title: '🚢 Flotte',
    description: 'Posséder 5 transports',
    check: s => s.whalesOwned >= 5,
  },

  // ── Combo & booster ─────────────────────────────────────────────────────────
  {
    id: 'combo_debloque',
    title: '🌟 Combo Débloqué',
    description: 'Débloquer le système de combo de clics',
    check: s => s.comboUnlocked,
  },
  {
    id: 'booster_debloque',
    title: '⚡ Booster Débloqué',
    description: 'Débloquer l\'Accélérateur ×3',
    check: s => s.boosterUnlocked,
  },
  {
    id: 'acceleration',
    title: '💨 Accélération',
    description: 'Activer l\'Accélérateur pour la première fois',
    check: s => s.boosterActive || s.boosterCooldownUntil > 0 || s.boosterRemaining < 180,
  },

  // ── Temps de jeu ────────────────────────────────────────────────────────────
  {
    id: 'joueur_curieux',
    title: '👀 Joueur Curieux',
    description: 'Jouer 5 minutes',
    check: s => s.playTimeSeconds >= 300,
  },
  {
    id: 'joueur_assidu',
    title: '🕐 Joueur Assidu',
    description: 'Jouer 1 heure',
    check: s => s.playTimeSeconds >= 3_600,
  },
  {
    id: 'legende',
    title: '🏆 Légende',
    description: 'Jouer 10 heures',
    check: s => s.playTimeSeconds >= 36_000,
  },
];
