import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

export function useSounds() {
  const monkeyPlayer   = useAudioPlayer(require('@/assets/sounds/mixkit-monkey-excited-screech-105.wav'));
  const guerrierPlayer = useAudioPlayer(require('@/assets/sounds/guerrier.mp3'));
  const bananierPlayer = useAudioPlayer(require('@/assets/sounds/cest-moi-qui-les-ai-plantes-planteees.mp3'));
  const girafePlayer   = useAudioPlayer(require('@/assets/sounds/chewbacca.swf.mp3'));
  const questPlayer    = useAudioPlayer(require('@/assets/sounds/mixkit-achievement-bell-600.wav'));
  const paysanPlayer   = useAudioPlayer(require('@/assets/sounds/paysan_sound.mp3'));
  const charruePlayer  = useAudioPlayer(require('@/assets/sounds/charrue_sound.mp3'));
  const moulinPlayer   = useAudioPlayer(require('@/assets/sounds/adolfo-h.mp3'));
  const marchePlayer   = useAudioPlayer(require('@/assets/sounds/jacquouille-santé-les-gueux-made-with-Voicemod.mp3'));
  const ouvrierPlayer  = useAudioPlayer(require('@/assets/sounds/eddy-le-quartier-le-chantier-made-with-Voicemod.mp3'));

  const playBuy = useCallback((upgradeId: string) => {
    const player =
      upgradeId === 'guerrier_massai' ? guerrierPlayer :
      upgradeId === 'bananier'        ? bananierPlayer :
      upgradeId === 'girafe'          ? girafePlayer   :
      upgradeId === 'paysan'          ? paysanPlayer   :
      upgradeId === 'charrue'         ? charruePlayer  :
      upgradeId === 'moulin'          ? moulinPlayer   :
      upgradeId === 'marche'          ? marchePlayer   :
      upgradeId === 'ouvrier'         ? ouvrierPlayer  :
                                        monkeyPlayer;
    player.seekTo(0);
    player.play();
  }, [monkeyPlayer, guerrierPlayer, bananierPlayer, girafePlayer, paysanPlayer, charruePlayer, moulinPlayer, marchePlayer, ouvrierPlayer]);

  const playQuest = useCallback(() => {
    questPlayer.seekTo(0);
    questPlayer.play();
  }, [questPlayer]);

  return { playBuy, playQuest };
}
