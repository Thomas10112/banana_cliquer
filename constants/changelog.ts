// Notes de mise à jour affichées dans la modale « Quoi de neuf ? » (écran d'accueil).
//
// À CHAQUE release (avant `eas update`) :
//   1. bumpe "version" dans app.json (ex : 0.1.0 -> 0.2.0)
//   2. ajoute une entrée EN PREMIER ici avec la même version + la date + le contenu
// La modale s'affiche une seule fois par joueur dès que la version la plus
// récente change.

export interface ChangelogEntry {
  version: string;   // doit correspondre à app.json "version", ex : « 0.1.0 »
  date: string;      // date affichée, ex : « 8 juin 2026 »
  title?: string;    // titre optionnel
  items: string[];   // ce que contient la mise à jour
}

// ⬇️ La plus récente EN PREMIER.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.2.0",
    date: "9 juin 2026",
    title: "La Taverne",
    items: [
      "🍺 Nouvelle Taverne : recrute des héros au gacha (débloquée à l'Ère Moderne)",
      "🎖️ Assigne jusqu'à 3 héros à ton convoi — chacun apporte son bonus (BPS, cargaison, vitesse, stock, hors-ligne...)",
      "⬆️ Fais monter tes héros en niveau avec tes bananes",
      "⚔️ Raids de convoi : tes héros défendent ta cargaison (ou raflent gros !) lors des embuscades",
      "🔊 Nouveaux sons pour le Robot et la Mégastructure (Ère Robotique)",
    ],
  },
  {
    version: '0.1.0',
    date: '8 juin 2026',
    title: 'Première Alpha 🎉',
    items: [
      '🔋 Grosse baisse de la consommation et de la chauffe du téléphone',
      '✨ Compteur de bananes plus fluide',
      '🗺️ Carte et météo optimisées quand elles ne sont pas à l’écran',
      '🐋 Achat de transports en série : le menu ne se ferme plus à chaque achat',
      '🎥 Suivi des transports tout en douceur sur la carte',
    ],
  },
];

export const LATEST_CHANGELOG = CHANGELOG[0];
