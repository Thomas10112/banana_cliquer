// Système Taverne — roster des héros (capitaines) débloqué à l'Ère Moderne.
// Les héros s'obtiennent au gacha, montent jusqu'au niveau 60 avec des bananes,
// et s'assignent au transport courant. Voir aussi menaces-config.ts (raids).

export type Rarity = 1 | 2 | 3 | 4; // 1 Commun · 2 Rare · 3 Épique · 4 Légendaire

export type SkillType =
  | 'cargo'    // +% bananes livrées / voyage
  | 'speed'    // -% durée de trajet
  | 'double'   // chance de livrer ×2
  | 'stock'    // +% capacité de stock des zones
  | 'bps'      // +% BPS global tant qu'assigné
  | 'crit'     // chance de livraison ×3
  | 'multi'    // dessert +1 zone par voyage
  | 'offline'  // +% gains hors-ligne
  | 'discount' // -% coût d'achat des transports
  | 'synergy'; // buff d'équipe

export interface Stat  { base: number; perLevel: number; }
export interface Skill { type: SkillType; base: number; perLevel: number; }

export interface HeroConfig {
  id: string;
  name: string;
  rarity: Rarity;
  emoji: string;       // placeholder en attendant les images
  lore: string;
  atk: Stat;
  def: Stat;
  skill: Skill;        // compétence principale
  passive?: Skill;     // épique+ : 2e buff
  ultimate?: string;   // légendaire : capacité signature (flavor pour l'instant)
  maxLevel: number;    // 60
}

export const HERO_MAX_LEVEL = 60;

export const RARITY_LABEL: Record<Rarity, string> = {
  1: 'Commun', 2: 'Rare', 3: 'Épique', 4: 'Légendaire',
};
export const RARITY_COLOR: Record<Rarity, string> = {
  1: '#8bc34a', 2: '#ffca28', 3: '#ab47bc', 4: '#ffd700',
};
export const RARITY_STARS: Record<Rarity, string> = {
  1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐',
};

const m = HERO_MAX_LEVEL;

export const HEROES: HeroConfig[] = [
  // ── ⭐ Commun ───────────────────────────────────────────────────────────────
  {
    id: 'milo', name: 'Milo le Coursier', rarity: 1, emoji: '🏃', maxLevel: m,
    lore: 'Un livreur infatigable, toujours prêt à charger une banane de plus.',
    atk: { base: 10, perLevel: 1 }, def: { base: 8, perLevel: 0.8 },
    skill: { type: 'cargo', base: 0.05, perLevel: 0.002 },
  },
  {
    id: 'bibi', name: 'Bibi la Vigie', rarity: 1, emoji: '👀', maxLevel: m,
    lore: 'Elle repère les ennuis avant tout le monde et protège la cargaison.',
    atk: { base: 6, perLevel: 0.6 }, def: { base: 14, perLevel: 1.4 },
    skill: { type: 'stock', base: 0.08, perLevel: 0.003 },
  },
  {
    id: 'tonio', name: 'Tonio Bricolo', rarity: 1, emoji: '🔧', maxLevel: m,
    lore: 'Mécanicien du dimanche, il gratte toujours un peu de vitesse.',
    atk: { base: 9, perLevel: 0.9 }, def: { base: 9, perLevel: 0.9 },
    skill: { type: 'speed', base: 0.05, perLevel: 0.002 },
  },

  // ── ⭐⭐ Rare ────────────────────────────────────────────────────────────────
  {
    id: 'sky_nora', name: 'Sky Nora', rarity: 2, emoji: '🪂', maxLevel: m,
    lore: 'Casse-cou des airs, elle prend tous les raccourcis.',
    atk: { base: 22, perLevel: 2 }, def: { base: 14, perLevel: 1.3 },
    skill: { type: 'speed', base: 0.12, perLevel: 0.004 },
  },
  {
    id: 'vol_hugo', name: 'Vol Hugo', rarity: 2, emoji: '📦', maxLevel: m,
    lore: 'Il optimise le moindre centimètre de soute.',
    atk: { base: 18, perLevel: 1.8 }, def: { base: 18, perLevel: 1.8 },
    skill: { type: 'cargo', base: 0.12, perLevel: 0.004 },
  },
  {
    id: 'mecano_tess', name: 'Mécano Tess', rarity: 2, emoji: '🛠️', maxLevel: m,
    lore: 'Rien ne casse sous sa surveillance.',
    atk: { base: 12, perLevel: 1.2 }, def: { base: 26, perLevel: 2.4 },
    skill: { type: 'stock', base: 0.15, perLevel: 0.005 },
  },
  {
    id: 'rex', name: 'Rex le Convoyeur', rarity: 2, emoji: '🚚', maxLevel: m,
    lore: 'Toujours partant pour un deuxième tour.',
    atk: { base: 26, perLevel: 2.4 }, def: { base: 12, perLevel: 1.1 },
    skill: { type: 'double', base: 0.10, perLevel: 0.003 },
  },

  // ── ⭐⭐⭐ Épique ────────────────────────────────────────────────────────────
  {
    id: 'ailes_dor', name: "Capitaine Ailes d'Or", rarity: 3, emoji: '🦅', maxLevel: m,
    lore: 'Un as légendaire qui frappe là où ça compte.',
    atk: { base: 45, perLevel: 4 }, def: { base: 28, perLevel: 2.6 },
    skill:   { type: 'crit', base: 0.15, perLevel: 0.004 },
    passive: { type: 'cargo', base: 0.10, perLevel: 0.002 },
  },
  {
    id: 'ai7', name: 'AI-7 « Bourdon »', rarity: 3, emoji: '🤖', maxLevel: m,
    lore: 'Une IA logistique qui ne dort jamais.',
    atk: { base: 30, perLevel: 2.8 }, def: { base: 42, perLevel: 3.8 },
    skill:   { type: 'offline', base: 0.40, perLevel: 0.008 },
    passive: { type: 'bps', base: 0.05, perLevel: 0.001 },
  },
  {
    id: 'vega', name: 'Vega la Renarde', rarity: 3, emoji: '🦊', maxLevel: m,
    lore: 'Rusée, elle dessert plusieurs zones en un seul vol.',
    atk: { base: 50, perLevel: 4.5 }, def: { base: 24, perLevel: 2.2 },
    skill:   { type: 'multi', base: 1, perLevel: 0 },
    passive: { type: 'speed', base: 0.10, perLevel: 0.003 },
  },

  // ── ⭐⭐⭐⭐ Légendaire ──────────────────────────────────────────────────────
  {
    id: 'orion', name: 'Amiral Orion', rarity: 4, emoji: '🎖️', maxLevel: m,
    lore: 'Le chef de flotte que tout équipage rêve de servir.',
    atk: { base: 72, perLevel: 6.5 }, def: { base: 60, perLevel: 5.5 },
    skill:   { type: 'synergy', base: 0.03, perLevel: 0.0005 },
    passive: { type: 'discount', base: 0.20, perLevel: 0.003 },
    ultimate: 'Flotte d\'Or — booste tout l\'équipage assigné.',
  },
  {
    id: 'banaia', name: 'Dre. Banaïa (IA)', rarity: 4, emoji: '🧠', maxLevel: m,
    lore: 'L\'intelligence ultime dédiée à la banane.',
    atk: { base: 55, perLevel: 5 }, def: { base: 78, perLevel: 7 },
    skill:   { type: 'bps', base: 0.08, perLevel: 0.0015 },
    passive: { type: 'stock', base: 0.20, perLevel: 0.004 },
    ultimate: 'Surcadence — surproduction temporaire de bananes.',
  },
  {
    id: 'corsaire', name: 'Le Corsaire Doré', rarity: 4, emoji: '🏴‍☠️', maxLevel: m,
    lore: 'Pirate flamboyant, il rafle tout sur son passage.',
    atk: { base: 98, perLevel: 9 }, def: { base: 44, perLevel: 4 },
    skill:   { type: 'crit', base: 0.20, perLevel: 0.005 },
    passive: { type: 'cargo', base: 0.15, perLevel: 0.003 },
    ultimate: 'Abordage — gains de raid massivement augmentés.',
  },
];

export function getHero(id: string): HeroConfig | undefined {
  return HEROES.find(h => h.id === id);
}

/** Valeur d'une stat (ATK/DEF) à un niveau donné. */
export function statAt(stat: Stat, level: number): number {
  return Math.round(stat.base + stat.perLevel * Math.max(0, level - 1));
}

/** Valeur d'une compétence à un niveau donné. */
export function skillAt(skill: Skill, level: number): number {
  return skill.base + skill.perLevel * Math.max(0, level - 1);
}
