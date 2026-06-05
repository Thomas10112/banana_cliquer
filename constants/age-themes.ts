export interface AgeTheme {
  panelBg: string;      // fond du panel bas (zone améliorations/quêtes)
  panelBorder: string;  // séparateur du panel
  tabAccent: string;    // onglet actif : underline + texte
  tabInactive: string;  // onglet inactif : texte
  navBg: string;        // fond de la tab bar de navigation
  navActive: string;    // icône/label actif dans la tab bar
}

export const AGE_THEMES: Record<number, AgeTheme> = {
  0: { // Ère Sauvage 🌿
    panelBg:     '#f1f8e9',
    panelBorder: '#c5e1a5',
    tabAccent:   '#33691e',
    tabInactive: '#558b2f',
    navBg:       '#0d1a0d',
    navActive:   '#8bc34a',
  },
  1: { // Ère Agricole 🌾
    panelBg:     '#fffde7',
    panelBorder: '#ffe082',
    tabAccent:   '#e65100',
    tabInactive: '#8d6e63',
    navBg:       '#1a1200',
    navActive:   '#f9a825',
  },
  2: { // Ère Industrielle 🏭
    panelBg:     '#eceff1',
    panelBorder: '#b0bec5',
    tabAccent:   '#37474f',
    tabInactive: '#607d8b',
    navBg:       '#111418',
    navActive:   '#90a4ae',
  },
  3: { // Ère Moderne 💻
    panelBg:     '#e3f2fd',
    panelBorder: '#90caf9',
    tabAccent:   '#0d47a1',
    tabInactive: '#1565c0',
    navBg:       '#0a1628',
    navActive:   '#29b6f6',
  },
  4: { // Ère Robotique 🤖
    panelBg:     '#f3e5f5',
    panelBorder: '#ce93d8',
    tabAccent:   '#6a1b9a',
    tabInactive: '#8e24aa',
    navBg:       '#0d0a1a',
    navActive:   '#ce93d8',
  },
};

export const DEFAULT_THEME = AGE_THEMES[1];
