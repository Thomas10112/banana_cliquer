import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameContext } from '@/store/game-context';
import { StatCard } from '@/components/banana-clicker/stat-card';
import { AGES } from '@/store/ages-config';
import { ACHIEVEMENTS } from '@/store/achievements-config';
import { ZONES, zoneBonusLabel } from '@/store/zones-config';
import { formatBananas } from '@/utils/format-bananas';
import { formatPlayTime } from '@/utils/format-play-time';

function AchievementsModal({ visible, onClose, unlockedIds }: {
  visible: boolean; onClose: () => void; unlockedIds: string[];
}) {
  const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id));
  const locked   = ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={achStyles.overlay}>
        <View style={achStyles.sheet}>
          <View style={achStyles.header}>
            <Text style={achStyles.title}>🏆 Succès</Text>
            <Text style={achStyles.count}>{unlocked.length}/{ACHIEVEMENTS.length}</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={achStyles.scroll}>
            {unlocked.map(a => (
              <View key={a.id} style={achStyles.row}>
                <Text style={achStyles.rowTitle}>{a.title}</Text>
                <Text style={achStyles.rowDesc}>{a.description}</Text>
              </View>
            ))}
            {locked.length > 0 && (
              <>
                <Text style={achStyles.lockedHeader}>Verrouillés</Text>
                {locked.map(a => (
                  <View key={a.id} style={[achStyles.row, achStyles.rowLocked]}>
                    <Text style={achStyles.rowTitleLocked}>🔒 {a.title}</Text>
                    <Text style={achStyles.rowDescLocked}>{a.description}</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
          <Pressable style={achStyles.closeBtn} onPress={onClose}>
            <Text style={achStyles.closeTxt}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const achStyles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#12122a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:      { fontSize: 20, fontWeight: '800', color: '#fff' },
  count:      { fontSize: 14, fontWeight: '700', color: '#ffd700', backgroundColor: 'rgba(255,215,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scroll:     { flexGrow: 0 },
  row:        { backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  rowLocked:  { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
  rowTitle:   { fontSize: 14, fontWeight: '700', color: '#ffd700' },
  rowDesc:    { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  rowTitleLocked: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  rowDescLocked:  { fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 2 },
  lockedHeader: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 6 },
  closeBtn:   { backgroundColor: '#f9a825', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  closeTxt:   { fontSize: 16, fontWeight: '800', color: '#fff' },
});

export default function Stats() {
  const { state, bps, devJumpToAge, giftBananas } = useGameContext();
  const [showAchievements, setShowAchievements] = useState(false);

  const totalUpgradesBought = Object.values(state.upgrades).reduce(
    (sum, count) => sum + count,
    0,
  );

  const ageZones       = ZONES.filter(z => z.minAge === state.currentAge);
  const conqueredCount = ageZones.filter(z => (state.zoneLevels[z.id] ?? 0) >= 1).length;
  const zoneBpsPct     = ageZones
    .filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.bpsMultiplier)
    .reduce((s, z) => s + (z.bonus.bpsMultiplier ?? 0), 0);
  const zoneClickBonus = ageZones
    .filter(z => (state.zoneLevels[z.id] ?? 0) >= 1 && z.bonus.clickBonus)
    .reduce((s, z) => s + (z.bonus.clickBonus ?? 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Statistiques</Text>

        <StatCard
          emoji="🍌"
          label="Bananes totales gagnées"
          value={formatBananas(state.totalBananas)}
        />
        <StatCard
          emoji="⚡"
          label="Bananes par seconde"
          value={bps > 0 ? `${formatBananas(bps)} / sec` : '—'}
        />
        <StatCard
          emoji="🛒"
          label="Améliorations achetées"
          value={totalUpgradesBought.toString()}
        />
        <StatCard
          emoji="⏱"
          label="Temps de jeu"
          value={formatPlayTime(state.playTimeSeconds)}
        />
        <StatCard
          emoji="🌍"
          label="Âge actuel"
          value={AGES[state.currentAge]?.name ?? '—'}
        />
        {state.totalMigrations > 0 && (
          <StatCard
            emoji="🚶"
            label="Grandes Migrations"
            value={`${state.totalMigrations} (âge ${state.currentAge + 1}, étape ${(state.totalMigrations % 3) + 1}/3)`}
          />
        )}
        {state.heritageBpc > 0 && (
          <StatCard
            emoji="🧬"
            label="Héritage (bonus clic)"
            value={`+${state.heritageBpc} 🍌/clic permanent`}
          />
        )}
        {state.boosterUnlocked && (
          <StatCard
            emoji="🚀"
            label="Accélérateur"
            value="Débloqué"
          />
        )}
        {state.comboUnlocked && (
          <StatCard
            emoji="⚡"
            label="Combo de clics"
            value="Débloqué"
          />
        )}

        {ageZones.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Carte du Monde</Text>
            <StatCard
              emoji="🗺️"
              label="Territoires conquis"
              value={`${conqueredCount} / ${ageZones.length}`}
            />
            {zoneBpsPct > 0 && (
              <StatCard
                emoji="⚡"
                label="Bonus BPS (zones)"
                value={`+${Math.round(zoneBpsPct * 100)}%`}
              />
            )}
            {zoneClickBonus > 0 && (
              <StatCard
                emoji="👆"
                label="Bonus clic (zones)"
                value={`+${formatBananas(zoneClickBonus)} 🍌/clic`}
              />
            )}
            {state.whalesOwned > 0 && (
              <StatCard
                emoji="🐋"
                label="Baleines porteuses"
                value={state.whalesOwned.toString()}
              />
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Succès</Text>
        <Pressable style={styles.achievementsBtn} onPress={() => setShowAchievements(true)}>
          <Text style={styles.achievementsBtnEmoji}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.achievementsBtnTitle}>Voir mes succès</Text>
            <Text style={styles.achievementsBtnSub}>{state.unlockedAchievements.length}/{ACHIEVEMENTS.length} débloqués</Text>
          </View>
          <Text style={styles.achievementsBtnArrow}>→</Text>
        </Pressable>
        <AchievementsModal
          visible={showAchievements}
          onClose={() => setShowAchievements(false)}
          unlockedIds={state.unlockedAchievements}
        />
        {/* Debug */}
        <Text style={styles.sectionTitle}>🛠 Debug</Text>
        <View style={styles.debugRow}>
          {AGES.map(age => (
            <Pressable
              key={age.id}
              style={[styles.debugBtn, state.currentAge === age.id && styles.debugBtnActive]}
              onPress={() => devJumpToAge(age.id)}
            >
              <Text style={styles.debugBtnTxt}>{age.emoji}</Text>
              <Text style={styles.debugBtnLabel}>{age.id}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.debugBananaBtn} onPress={() => giftBananas(999_999_999_999)}>
          <Text style={styles.debugBananaBtnTxt}>💰 +999 milliards 🍌</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffde7',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#3e2723',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3e2723',
    marginTop: 16,
    marginBottom: 4,
  },
  achievementsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    marginBottom: 8,
  },
  achievementsBtnEmoji: { fontSize: 28 },
  achievementsBtnTitle: { fontSize: 15, fontWeight: '700', color: '#3e2723' },
  achievementsBtnSub:   { fontSize: 12, color: '#8d6e63', marginTop: 2 },
  achievementsBtnArrow: { fontSize: 18, color: '#f9a825', fontWeight: '700' },
  debugRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  debugBtn: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 52,
  },
  debugBtnActive: {
    backgroundColor: '#fff8e1',
    borderColor: '#f9a825',
  },
  debugBtnTxt:   { fontSize: 20 },
  debugBtnLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  debugBananaBtn: {
    backgroundColor: '#1a3a00', borderRadius: 10,
    padding: 12, alignItems: 'center', marginTop: 8,
    borderWidth: 1, borderColor: '#f9a825',
  },
  debugBananaBtnTxt: { fontSize: 15, fontWeight: '700', color: '#f9a825' },
});
