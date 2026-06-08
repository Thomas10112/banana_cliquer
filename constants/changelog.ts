// Notes de mise à jour affichées dans la modale « Quoi de neuf ? ».
//
// À CHAQUE release (avant `eas update`), ajoute une entrée EN PREMIER avec un
// `id` unique : la modale s'affichera une seule fois pour chaque joueur dès que
// l'`id` le plus récent change.

export interface ChangelogEntry {
  id: string;        // clé unique stable — sert au « déjà vu »
  date: string;      // date affichée, ex : « 8 juin 2026 »
  title?: string;    // titre optionnel
  items: string[];   // ce que contient la mise à jour
}

// ⬇️ La plus récente EN PREMIER.
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-06-08-perf',
    date: '8 juin 2026',
    title: 'Moins de batterie, plus de fluidité',
    items: [
      '🔋 Grosse baisse de la consommation et de la chauffe du téléphone',
      '✨ Compteur de bananes plus fluide',
      '🗺️ Carte et météo optimisées quand elles ne sont pas à l’écran',
      '🐋 Achat de transports en série : le menu ne se ferme plus à chaque achat',
      '🆕 Cet écran « Quoi de neuf ? » à chaque mise à jour',
    ],
  },
];

export const LATEST_CHANGELOG = CHANGELOG[0];
