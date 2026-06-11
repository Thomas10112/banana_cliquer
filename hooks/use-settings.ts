import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'banana_clicker_settings_v1';

export interface Settings {
  musicEnabled: boolean;
  soundEnabled: boolean;
  musicVolume: number; // 0..1 — curseur utilisateur, appliqué sur le volume de base de la musique
  sfxVolume: number;   // 0..1 — volume des effets sonores
}

const DEFAULT: Settings = { musicEnabled: true, soundEnabled: true, musicVolume: 0.5, sfxVolume: 1 };
let _current: Settings = { ...DEFAULT };
let _listeners: Array<(s: Settings) => void> = [];
let _loaded = false;

function broadcast() { _listeners.forEach(fn => fn({ ..._current })); }

export function getSettings(): Settings { return _current; }

async function initLoad() {
  if (_loaded) return;
  _loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) { _current = { ...DEFAULT, ...JSON.parse(raw) }; broadcast(); }
  } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({ ..._current });

  useEffect(() => {
    initLoad();
    _listeners.push(setSettings);
    return () => { _listeners = _listeners.filter(fn => fn !== setSettings); };
  }, []);

  async function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    _current = { ..._current, [key]: value };
    broadcast();
    await AsyncStorage.setItem(KEY, JSON.stringify(_current));
  }

  return { settings, set };
}
