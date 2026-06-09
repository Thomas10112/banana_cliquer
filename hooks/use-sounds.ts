import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';
import { duckMusic } from '@/utils/music-bus';

export function useSounds() {
  // Âge 0
  const monkeyPlayer   = useAudioPlayer(require('@/assets/sounds/age-0/mixkit-monkey-excited-screech-105.wav'));
  const guerrierPlayer = useAudioPlayer(require('@/assets/sounds/age-0/guerrier.mp3'));
  const bananierPlayer = useAudioPlayer(require('@/assets/sounds/age-0/cest-moi-qui-les-ai-plantes-planteees.mp3'));
  const girafePlayer   = useAudioPlayer(require('@/assets/sounds/age-0/chewbacca.swf.mp3'));
  // Âge 1
  const paysanPlayer   = useAudioPlayer(require('@/assets/sounds/age-1/paysan_sound.mp3'));
  const charruePlayer  = useAudioPlayer(require('@/assets/sounds/age-1/charrue_sound.mp3'));
  const moulinPlayer   = useAudioPlayer(require('@/assets/sounds/age-1/adolfo-h.mp3'));
  const marchePlayer   = useAudioPlayer(require('@/assets/sounds/age-1/jacquouille-santé-les-gueux-made-with-Voicemod.mp3'));
  // Âge 2
  const ouvrierPlayer      = useAudioPlayer(require('@/assets/sounds/age-2/eddy-le-quartier-le-chantier-made-with-Voicemod.mp3'));
  const machinePlayer      = useAudioPlayer(require('@/assets/sounds/age-2/faaah.mp3'));
  const usinePlayer        = useAudioPlayer(require('@/assets/sounds/age-2/usine.mp3'));
  const locomotivePlayer   = useAudioPlayer(require('@/assets/sounds/age-2/locomotive.mp3'));
  // Âge 3
  const ingenieurPlayer    = useAudioPlayer(require('@/assets/sounds/age-3/ingenieur.mp3'));
  const ordinateurPlayer   = useAudioPlayer(require('@/assets/sounds/age-3/ordinateur.mp3'));
  const dronePlayer        = useAudioPlayer(require('@/assets/sounds/age-3/drone.aac'));
  const satellitePlayer    = useAudioPlayer(require('@/assets/sounds/age-3/satellite.mp3'));
  // Âge 4
  const robotPlayer        = useAudioPlayer(require('@/assets/sounds/age-4/robot.mp3'));
  const iaPlayer           = useAudioPlayer(require('@/assets/sounds/age-4/ia.mp3'));
  const megastructurePlayer = useAudioPlayer(require('@/assets/sounds/age-4/megasturucture.mp3'));
  // UI
  const questPlayer     = useAudioPlayer(require('@/assets/sounds/ui/mixkit-achievement-bell-600.wav'));
  const migrationPlayer = useAudioPlayer(require('@/assets/sounds/ambiances/migrations.mp3'));

  const playBuy = useCallback((upgradeId: string) => {
    const player =
      upgradeId === 'guerrier_massai'  ? guerrierPlayer   :
      upgradeId === 'bananier'         ? bananierPlayer   :
      upgradeId === 'girafe'           ? girafePlayer     :
      upgradeId === 'paysan'           ? paysanPlayer     :
      upgradeId === 'charrue'          ? charruePlayer    :
      upgradeId === 'moulin'           ? moulinPlayer     :
      upgradeId === 'marche'           ? marchePlayer     :
      upgradeId === 'ouvrier'          ? ouvrierPlayer    :
      upgradeId === 'machine_vapeur'   ? machinePlayer    :
      upgradeId === 'usine'            ? usinePlayer      :
      upgradeId === 'locomotive'       ? locomotivePlayer :
      upgradeId === 'ingenieur'        ? ingenieurPlayer  :
      upgradeId === 'ordinateur'       ? ordinateurPlayer :
      upgradeId === 'drone'            ? dronePlayer      :
      upgradeId === 'satellite'        ? satellitePlayer  :
      upgradeId === 'robot'            ? robotPlayer      :
      upgradeId === 'ia'               ? iaPlayer         :
      upgradeId === 'megastructure'    ? megastructurePlayer :
                                         monkeyPlayer;
    player.volume = 1;   // SFX d'upgrade au volume plein (sans dépasser)
    duckMusic();         // baisse brièvement la musique d'ambiance
    player.seekTo(0);
    player.play();
  }, [monkeyPlayer, guerrierPlayer, bananierPlayer, girafePlayer,
      paysanPlayer, charruePlayer, moulinPlayer, marchePlayer,
      ouvrierPlayer, machinePlayer, usinePlayer, locomotivePlayer, ingenieurPlayer, ordinateurPlayer, dronePlayer, satellitePlayer, robotPlayer, iaPlayer, megastructurePlayer]);

  const playQuest = useCallback(() => {
    questPlayer.seekTo(0);
    questPlayer.play();
  }, [questPlayer]);

  const playMigration = useCallback(() => {
    migrationPlayer.seekTo(0);
    migrationPlayer.play();
  }, [migrationPlayer]);

  return { playBuy, playQuest, playMigration };
}
