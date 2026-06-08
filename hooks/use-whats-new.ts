import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { LATEST_CHANGELOG } from '@/constants/changelog';

const KEY = 'banana_clicker_last_changelog';

/**
 * Affiche la modale « Quoi de neuf ? » une seule fois par mise à jour.
 *
 * `enabled` : ne déclenche la vérification que quand l'écran d'accueil est prêt
 * (onboarding terminé, pas de tuto / pas d'autres pop-ups). Sur un tout premier
 * lancement (aucune clé enregistrée), on marque la version comme vue sans
 * l'afficher : un nouveau joueur n'a pas besoin des notes de version.
 */
export function useWhatsNew(enabled: boolean) {
  const [show, setShow] = useState(false);

  const markSeen = useCallback(() => {
    setShow(false);
    AsyncStorage.setItem(KEY, LATEST_CHANGELOG.id);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    AsyncStorage.getItem(KEY).then(seen => {
      if (cancelled) return;
      if (seen !== LATEST_CHANGELOG.id) setShow(true);
    });
    return () => { cancelled = true; };
  }, [enabled]);

  return { show, entry: LATEST_CHANGELOG, markSeen };
}
