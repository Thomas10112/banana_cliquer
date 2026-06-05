import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const PROFILE_KEY = 'banana_clicker_profile';

interface ProfileData {
  pseudo: string;
  avatarUri: string | null;
}

const DEFAULT_PROFILE: ProfileData = { pseudo: 'Explorateur', avatarUri: null };

export function useProfile() {
  const [pseudo, setPseudoState]       = useState(DEFAULT_PROFILE.pseudo);
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY).then(raw => {
      if (!raw) { loadedRef.current = true; return; }
      try {
        const data: ProfileData = JSON.parse(raw);
        if (data.pseudo)    setPseudoState(data.pseudo);
        if (data.avatarUri) setAvatarUriState(data.avatarUri);
      } catch {}
      loadedRef.current = true;
    });
  }, []);

  // Lit toujours depuis AsyncStorage avant d'écrire → évite d'écraser l'avatar
  const setPseudo = useCallback(async (value: string) => {
    setPseudoState(value);
    const raw     = await AsyncStorage.getItem(PROFILE_KEY);
    const current = raw ? (JSON.parse(raw) as ProfileData) : DEFAULT_PROFILE;
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ ...current, pseudo: value }));
  }, []);

  const setAvatarUri = useCallback(async (uri: string | null) => {
    setAvatarUriState(uri);
    const raw     = await AsyncStorage.getItem(PROFILE_KEY);
    const current = raw ? (JSON.parse(raw) as ProfileData) : DEFAULT_PROFILE;
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ ...current, avatarUri: uri }));
  }, []);

  const clearProfile = useCallback(async () => {
    await AsyncStorage.removeItem(PROFILE_KEY);
    setPseudoState(DEFAULT_PROFILE.pseudo);
    setAvatarUriState(null);
  }, []);

  return { pseudo, setPseudo, avatarUri, setAvatarUri, clearProfile };
}
