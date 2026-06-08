import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

/**
 * Invite à installer une mise à jour OTA — affichée en bas de l'écran d'accueil
 * (plus sur le clicker). Composant autonome : pas de dépendance au GameProvider.
 */
export function UpdatePrompt() {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const insets = useSafeAreaInsets();
  const ty      = useSharedValue(160);
  const op      = useSharedValue(0);
  const doneRef = useRef(false);

  const shouldShow = (isUpdateAvailable || isUpdatePending) && !dismissed;

  useEffect(() => {
    if (!shouldShow) return;
    ty.value = withSpring(0, { damping: 15, stiffness: 140 });
    op.value = withTiming(1, { duration: 250 });
  }, [shouldShow]);

  function hide(cb?: () => void) {
    if (doneRef.current) return;
    doneRef.current = true;
    ty.value = withTiming(160, { duration: 300 });
    op.value = withTiming(0, { duration: 300 }, (f) => { if (f && cb) runOnJS(cb)(); });
  }

  async function install() {
    setInstalling(true);
    try {
      if (!isUpdatePending) await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      setInstalling(false);
      doneRef.current = false;
    }
  }

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value,
  }));

  if (!shouldShow) return null;

  return (
    <Animated.View style={[styles.banner, { bottom: insets.bottom + 16 }, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>🔄 Mise à jour disponible</Text>
        <Text style={styles.sub}>Installe-la pour profiter des nouveautés</Text>
      </View>
      <Pressable onPress={install} disabled={installing} style={styles.installBtn}>
        <Text style={styles.installTxt}>{installing ? '…' : 'Installer'}</Text>
      </Pressable>
      <Pressable onPress={() => hide(() => setDismissed(true))} style={styles.closeBtn} hitSlop={10}>
        <Text style={styles.closeTxt}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', left: 14, right: 14, zIndex: 50,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(15,20,40,0.97)',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#29b6f6',
    shadowColor: '#29b6f6', shadowOpacity: 0.4,
    shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 15,
  },
  title:      { fontSize: 14, fontWeight: '800', color: '#fff' },
  sub:        { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  installBtn: { backgroundColor: '#29b6f6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  installTxt: { fontSize: 13, fontWeight: '800', color: '#0a0a1a' },
  closeBtn:   { paddingHorizontal: 4, paddingVertical: 2 },
  closeTxt:   { fontSize: 14, color: 'rgba(255,255,255,0.35)' },
});
