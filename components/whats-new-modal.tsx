import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ChangelogEntry } from '@/constants/changelog';

export function WhatsNewModal({ entry, onClose }: { entry: ChangelogEntry; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>{entry.title ?? 'Quoi de neuf ?'}</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionTxt}>v{entry.version}</Text>
          </View>
          <Text style={styles.date}>{entry.date}</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {entry.items.map((item, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.bullet}>›</Text>
                <Text style={styles.itemTxt}>{item}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnTxt}>Super !</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center' },
  versionPill: {
    backgroundColor: 'rgba(249,168,37,0.18)',
    borderWidth: 1, borderColor: 'rgba(249,168,37,0.5)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 3, marginTop: 4,
  },
  versionTxt: { fontSize: 13, fontWeight: '800', color: '#ffd700', letterSpacing: 0.5 },
  date:  { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 8 },
  list:  { alignSelf: 'stretch', marginBottom: 8 },
  listContent: { gap: 12, paddingVertical: 4 },
  row:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4 },
  bullet:  { fontSize: 16, fontWeight: '900', color: '#f9a825', lineHeight: 22 },
  itemTxt: { flex: 1, fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
  btn: {
    backgroundColor: '#f9a825',
    borderRadius: 14,
    paddingHorizontal: 48,
    paddingVertical: 14,
    marginTop: 4,
  },
  btnTxt: { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
});
