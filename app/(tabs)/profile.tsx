import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '@/hooks/use-profile';
import { AGES } from '@/store/ages-config';
import { useGameContext } from '@/store/game-context';
import { formatBananas } from '@/utils/format-bananas';

// ─── Titre évolutif ───────────────────────────────────────────────────────────

const TITLES: { minMigrations: number; label: string; emoji: string }[] = [
  { minMigrations: 0,  label: 'Chasseur-cueilleur',      emoji: '🌿' },
  { minMigrations: 1,  label: 'Gardien de la tribu',     emoji: '🔥' },
  { minMigrations: 2,  label: 'Chef du clan',             emoji: '🦣' },
  { minMigrations: 3,  label: 'Paysan',                   emoji: '🌾' },
  { minMigrations: 4,  label: 'Fermier prospère',         emoji: '⚙️' },
  { minMigrations: 5,  label: 'Seigneur des récoltes',    emoji: '🏡' },
  { minMigrations: 6,  label: "Ouvrier d'usine",          emoji: '⚒️' },
  { minMigrations: 7,  label: 'Contremaître',             emoji: '🏭' },
  { minMigrations: 8,  label: 'Baron industriel',         emoji: '🚂' },
  { minMigrations: 9,  label: 'Ingénieur',                emoji: '💻' },
  { minMigrations: 10, label: 'Directeur technique',      emoji: '✈️' },
  { minMigrations: 11, label: 'Pionnier du futur',        emoji: '🛸' },
  { minMigrations: 12, label: "Architecte de l'humanité", emoji: '🌌' },
];

function getTitle(totalMigrations: number) {
  let result = TITLES[0];
  for (const t of TITLES) {
    if (totalMigrations >= t.minMigrations) result = t;
  }
  return result;
}

// ─── Utilitaire durée ─────────────────────────────────────────────────────────

function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

// ─── Composant avatar ─────────────────────────────────────────────────────────

function Avatar({ uri, onPress }: { uri: string | null; onPress: () => void }) {
  return (
    <Pressable style={styles.avatarWrap} onPress={onPress}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatarImg} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarEmoji}>🍌</Text>
        </View>
      )}
      <View style={styles.avatarEditBadge}>
        <Text style={styles.avatarEditTxt}>✎</Text>
      </View>
    </Pressable>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { state, bps, resetGame } = useGameContext();
  const { pseudo, setPseudo, avatarUri, setAvatarUri, clearProfile } = useProfile();
  const router = useRouter();
  const [editingPseudo, setEditingPseudo] = useState(false);
  const [pseudoDraft, setPseudoDraft]     = useState(pseudo);
  const inputRef = useRef<TextInput>(null);

  const title = getTitle(state.totalMigrations);

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', 'Active l\'accès à la galerie dans les réglages.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  function startEditPseudo() {
    setPseudoDraft(pseudo);
    setEditingPseudo(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function confirmPseudo() {
    const trimmed = pseudoDraft.trim();
    if (trimmed.length > 0) setPseudo(trimmed);
    setEditingPseudo(false);
  }

  function confirmReset() {
    Alert.alert(
      'Réinitialiser le compte',
      'Toutes tes bananes, upgrades, zones, migrations, ton pseudo et ta photo seront effacés.\n\nCette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Tout effacer', style: 'destructive', onPress: () => {
          resetGame();
          clearProfile();
          router.navigate('/(tabs)/BananaClicker');
        }},
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Bandeau décoratif */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroBannerEmoji}>🍌 🌿 🍌 🌿 🍌</Text>
        <Text style={styles.heroTitle}>Profil</Text>
        <Text style={styles.heroBannerEmoji}>🍌 🌿 🍌 🌿 🍌</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Carte profil ── */}
        <View style={styles.profileCard}>
          <Avatar uri={avatarUri} onPress={pickAvatar} />

          {editingPseudo ? (
            <View style={styles.pseudoEditRow}>
              <TextInput
                ref={inputRef}
                style={styles.pseudoInput}
                value={pseudoDraft}
                onChangeText={setPseudoDraft}
                maxLength={24}
                returnKeyType="done"
                onSubmitEditing={confirmPseudo}
                autoCorrect={false}
              />
              <Pressable style={styles.pseudoConfirmBtn} onPress={confirmPseudo}>
                <Text style={styles.pseudoConfirmTxt}>✓</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={startEditPseudo}>
              <Text style={styles.pseudo}>{pseudo} ✎</Text>
            </Pressable>
          )}

          <View style={styles.titleBadge}>
            <Text style={styles.titleEmoji}>{title.emoji}</Text>
            <Text style={styles.titleLabel}>{title.label}</Text>
          </View>
        </View>

        {/* ── Stat héros : bananes ── */}
        <View style={styles.heroBananaCard}>
          <Text style={styles.heroBananaEmoji}>🍌</Text>
          <View>
            <Text style={styles.heroBananaValue}>{formatBananas(state.totalBananas)}</Text>
            <Text style={styles.heroBananaLabel}>bananes produites au total</Text>
          </View>
        </View>

        {/* ── Stats secondaires ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍌 Statistiques</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Temps de jeu"  value={formatPlayTime(state.playTimeSeconds)} emoji="⏱️" />
            <StatBox label="Migrations"    value={String(state.totalMigrations)}          emoji="🔄" />
            <StatBox label="Âge actuel"    value={AGES[state.currentAge]?.name ?? '—'}   emoji={AGES[state.currentAge]?.emoji ?? '🌿'} />
            <StatBox label="BPS actuel"    value={`${formatBananas(bps)}/s`}                                      emoji="⚡" />
          </View>
        </View>

        {/* ── Timeline des âges ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍌 Progression</Text>
          <View style={styles.timeline}>
            {AGES.map((age, idx) => {
              const done    = idx < state.currentAge;
              const current = idx === state.currentAge;
              return (
                <View key={age.id} style={styles.timelineRow}>
                  <View style={[
                    styles.timelineDot,
                    done    && styles.timelineDotDone,
                    current && styles.timelineDotCurrent,
                  ]}>
                    <Text style={styles.timelineDotEmoji}>
                      {done ? '✓' : current ? '🍌' : '🔒'}
                    </Text>
                  </View>
                  {idx < AGES.length - 1 && (
                    <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                  )}
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineEmoji}>{age.emoji}</Text>
                    <Text style={[
                      styles.timelineName,
                      done    && styles.timelineNameDone,
                      current && styles.timelineNameCurrent,
                      !done && !current && styles.timelineNameLocked,
                    ]}>
                      {age.name}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Zone danger ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍌 Compte</Text>
          <Pressable style={styles.resetBtn} onPress={confirmReset}>
            <Text style={styles.resetEmoji}>🗑️</Text>
            <View>
              <Text style={styles.resetTxt}>Réinitialiser le compte</Text>
              <Text style={styles.resetSub}>Repart de zéro, profil conservé</Text>
            </View>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0a1628' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  // Bandeau héro
  heroBanner: {
    backgroundColor: 'rgba(249,168,37,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249,168,37,0.2)',
    paddingVertical: 10, paddingHorizontal: 16,
    alignItems: 'center', gap: 2,
  },
  heroBannerEmoji: { fontSize: 14, letterSpacing: 6, opacity: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#ffd700', letterSpacing: 1 },

  // Carte profil
  profileCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(249,168,37,0.25)',
  },
  avatarWrap:        { position: 'relative' },
  avatarImg:         { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#f9a825' },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(249,168,37,0.12)',
    borderWidth: 3, borderColor: '#f9a825',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji:    { fontSize: 44 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#f9a825', borderRadius: 12,
    width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditTxt: { fontSize: 13, color: '#fff', fontWeight: '800' },

  pseudo:        { fontSize: 22, fontWeight: '800', color: '#fff' },
  pseudoEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pseudoInput: {
    fontSize: 20, fontWeight: '700', color: '#fff',
    borderBottomWidth: 2, borderBottomColor: '#f9a825',
    paddingVertical: 2, paddingHorizontal: 4, minWidth: 120,
  },
  pseudoConfirmBtn: {
    backgroundColor: '#f9a825', borderRadius: 10,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
  },
  pseudoConfirmTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },

  titleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(249,168,37,0.12)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(249,168,37,0.4)',
  },
  titleEmoji: { fontSize: 16 },
  titleLabel: { fontSize: 14, fontWeight: '700', color: '#ffd700' },

  // Stat héros bananes
  heroBananaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(249,168,37,0.1)',
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(249,168,37,0.35)',
  },
  heroBananaEmoji: { fontSize: 48 },
  heroBananaValue: { fontSize: 28, fontWeight: '900', color: '#ffd700' },
  heroBananaLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  // Section
  section:      { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f9a825', letterSpacing: 0.5 },

  // Stats secondaires
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#1a1a2e',
    borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderLeftWidth: 3, borderLeftColor: 'rgba(249,168,37,0.5)',
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 15, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  // Timeline
  timeline: {
    backgroundColor: '#1a1a2e', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(249,168,37,0.15)',
  },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 14, position: 'relative' },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotDone:    { backgroundColor: 'rgba(46,125,50,0.4)', borderWidth: 1.5, borderColor: '#4caf50' },
  timelineDotCurrent: { backgroundColor: 'rgba(249,168,37,0.25)', borderWidth: 1.5, borderColor: '#f9a825' },
  timelineDotEmoji:   { fontSize: 13, color: '#fff' },
  timelineLine: {
    position: 'absolute', left: 15, top: 32,
    width: 2, height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  timelineLineDone: { backgroundColor: '#4caf50' },
  timelineInfo:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  timelineEmoji:  { fontSize: 18 },
  timelineName:   { fontSize: 15, fontWeight: '600' },
  timelineNameDone:    { color: '#4caf50' },
  timelineNameCurrent: { color: '#ffd700', fontWeight: '800' },
  timelineNameLocked:  { color: 'rgba(255,255,255,0.3)' },

  // Reset
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(211,47,47,0.1)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(211,47,47,0.3)',
  },
  resetEmoji: { fontSize: 26 },
  resetTxt:   { fontSize: 15, fontWeight: '700', color: '#ef5350' },
  resetSub:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
});
