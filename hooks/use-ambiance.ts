import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { setActiveMusic } from '@/utils/music-bus';

const MUSIC_MAX  = 0.3; // volume effectif quand le curseur musique est à 100 %
const FADE_STEPS = 25;
const FADE_MS    = 1500;

export function useAmbiance(currentAge: number, enabled = true) {
  const { settings } = useSettings();
  const musicAllowed = enabled && settings.musicEnabled;
  const volume       = MUSIC_MAX * settings.musicVolume;

  const p0 = useAudioPlayer(require('@/assets/sounds/ambiances/ere_sauvage_ambiance.mp3'));
  const p1 = useAudioPlayer(require('@/assets/sounds/ambiances/ere_agricole_ambiance.mp3'));
  const p2 = useAudioPlayer(require('@/assets/sounds/ambiances/ere_industrielle_ambiance.mp3'));
  const p3 = useAudioPlayer(require('@/assets/sounds/ambiances/ere_moderne_ambiance.mp3'));
  const p4 = useAudioPlayer(require('@/assets/sounds/ambiances/ere_robotique_ambiance.mp3'));

  const players      = [p0, p1, p2, p3, p4];
  const playingRef   = useRef(-1); // index du player actuellement audible
  const timerRef     = useRef<ReturnType<typeof setInterval>>(undefined);
  const volumeRef    = useRef(volume); // lu par les intervals de fade
  volumeRef.current  = volume;

  useEffect(() => {
    players.forEach(p => { p.loop = true; p.volume = 0; });
    return () => {
      clearInterval(timerRef.current);
      players.forEach(p => { try { p.pause(); } catch {} });
      setActiveMusic(null, volumeRef.current);
    };
  }, []);

  // Curseur de volume : appliqué en direct au player audible (hors fade)
  useEffect(() => {
    if (!musicAllowed) return;
    const idx = playingRef.current;
    if (idx < 0) return;
    players[idx].volume = volume;
    setActiveMusic(players[idx], volume);
  }, [volume]);

  useEffect(() => {
    clearInterval(timerRef.current);

    if (!musicAllowed) {
      setActiveMusic(null, volumeRef.current); // pas de musique → pas de ducking
      // Fade out le player actif s'il y en a un
      const cur = playingRef.current >= 0 ? players[playingRef.current] : null;
      if (!cur) return;
      const startVol = cur.volume;
      let step = 0;
      timerRef.current = setInterval(() => {
        step++;
        cur.volume = Math.max(0, startVol * (1 - step / FADE_STEPS));
        if (step >= FADE_STEPS) {
          clearInterval(timerRef.current);
          try { cur.pause(); } catch {}
        }
      }, FADE_MS / FADE_STEPS);
      return;
    }

    if (currentAge < 0 || currentAge > 4) return;

    const prevIdx = playingRef.current;
    const oldP    = prevIdx >= 0 && prevIdx !== currentAge ? players[prevIdx] : null;
    const newP    = players[currentAge];

    newP.loop   = true;
    newP.volume = 0;
    newP.play();
    playingRef.current = currentAge;
    setActiveMusic(newP, volume); // cible du ducking

    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      const t   = step / FADE_STEPS;
      const vol = volumeRef.current;
      newP.volume = Math.min(vol, vol * t);
      if (oldP) {
        oldP.volume = Math.max(0, vol * (1 - t));
        if (step >= FADE_STEPS) { try { oldP.pause(); } catch {} }
      }
      if (step >= FADE_STEPS) clearInterval(timerRef.current);
    }, FADE_MS / FADE_STEPS);

  }, [currentAge, musicAllowed]);
}
