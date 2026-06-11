import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSettings } from '@/hooks/use-settings';

// Slider maison (pas de dépendance native → OTA-safe, fonctionne aussi sur web).
// Tap ou glissé horizontal sur la piste.
export function VolumeSlider({ value, onChange, disabled }: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [trackW, setTrackW] = useState(0);

  function setFromX(x: number) {
    if (trackW <= 0 || disabled) return;
    const v = Math.max(0, Math.min(1, x / trackW));
    onChange(Math.round(v * 20) / 20); // pas de 5 %
  }

  return (
    <View style={[sl.wrap, disabled && { opacity: 0.35 }]}>
      <View
        style={sl.track}
        onLayout={e => setTrackW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={e => setFromX(e.nativeEvent.locationX)}
        onResponderMove={e => setFromX(e.nativeEvent.locationX)}
      >
        <View style={sl.trackBg} />
        <View style={[sl.fill, { width: `${value * 100}%` }]} />
        <View style={[sl.thumb, { left: Math.max(0, Math.min(trackW - 18, value * trackW - 9)) }]} />
      </View>
      <Text style={sl.pct}>{Math.round(value * 100)} %</Text>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 28, justifyContent: 'center' },
  trackBg: {
    position: 'absolute', left: 0, right: 0, height: 6,
    borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fill: {
    position: 'absolute', left: 0, height: 6,
    borderRadius: 3, backgroundColor: '#f9a825',
  },
  thumb: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#ffd700',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  pct: { width: 44, textAlign: 'right', fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
});

// ─── Modale Paramètres (roue crantée) ────────────────────────────────────────

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, set } = useSettings();

  return (
    <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={st.overlay} onPress={onClose}>
        <Pressable style={st.card} onPress={() => {}}>
          <Text style={st.title}>⚙️ Paramètres</Text>

          {/* Musique */}
          <View style={st.row}>
            <Text style={st.rowEmoji}>🎵</Text>
            <Text style={st.rowLabel}>Musique d'ambiance</Text>
            <Switch
              value={settings.musicEnabled}
              onValueChange={v => set('musicEnabled', v)}
              trackColor={{ false: '#2a2a3a', true: '#f9a825' }}
              thumbColor="#fff"
            />
          </View>
          <VolumeSlider
            value={settings.musicVolume}
            onChange={v => set('musicVolume', v)}
            disabled={!settings.musicEnabled}
          />

          {/* Effets sonores */}
          <View style={[st.row, { marginTop: 18 }]}>
            <Text style={st.rowEmoji}>🔔</Text>
            <Text style={st.rowLabel}>Effets sonores</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={v => set('soundEnabled', v)}
              trackColor={{ false: '#2a2a3a', true: '#f9a825' }}
              thumbColor="#fff"
            />
          </View>
          <VolumeSlider
            value={settings.sfxVolume}
            onChange={v => set('sfxVolume', v)}
            disabled={!settings.soundEnabled}
          />

          <Pressable style={st.closeBtn} onPress={onClose}>
            <Text style={st.closeTxt}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: '#12131f', borderRadius: 22, padding: 24,
    width: '100%', maxWidth: 380, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  title: { fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowEmoji: { fontSize: 18 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#ebebeb' },
  closeBtn: {
    backgroundColor: '#f9a825', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', marginTop: 18,
  },
  closeTxt: { fontSize: 15, fontWeight: '800', color: '#0a0a0a' },
});
