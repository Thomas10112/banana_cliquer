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
    version: "0.3.1",
    date: "11 juin 2026",
    title: "Égalisation Sonore",
    items: [
      "🔊 Tous les sons d'amélioration sont au même volume (fini l'ordinateur qui hurle et le jacquouille inaudible)",
      "🎵 Musique d'ambiance plus discrète, encore plus pendant les sons d'achat",
      "🌐 Le jeu est désormais jouable dans le navigateur : projet-react-native.expo.app",
    ],
  },
  {
    version: "0.3.0",
    date: "11 juin 2026",
    title: "La Fin du Voyage",
    items: [
      "🏁 Le jeu a désormais une fin : 2 Migrations Finales à l'Ère Robotique (possède la moitié de chaque amélioration pour les déclencher)",
      "🦍 Célébration de fin de jeu : gorille déchaîné, pluie de bananes... et la mesure officielle de ta banane",
      "🌙 La modale de retour t'accueille par ton pseudo avec le temps de farm et les bananes récoltées",
      "🔊 Nouveau son du Drone et son dédié au changement d'ère",
    ],
  },
  {
    version: "0.2.1",
    date: "10 juin 2026",
    title: "Grand Équilibrage",
    items: [
      "⚖️ Rééquilibrage complet de l'économie : les coûts des améliorations ont été revus sur les 5 âges",
      "🚁 L'Ère Moderne offre désormais une vraie progression (fini les améliorations quasi gratuites)",
      "🌿 Zones Australie et Mammouth moins chères : la fin de l'Ère Sauvage est plus fluide",
      "🤖 L'Ère Robotique se mérite : l'endgame dure plus longtemps",
    ],
  },
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
