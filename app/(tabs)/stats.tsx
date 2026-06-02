import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameContext } from '@/store/game-context';
import { StatCard } from '@/components/banana-clicker/stat-card';
import { AGES } from '@/store/ages-config';
import { ACHIEVEMENTS } from '@/store/achievements-config';
import { ZONES, zoneBonusLabel } from '@/store/zones-config';
import { formatBananas } from '@/utils/format-bananas';
import { formatPlayTime } from '@/utils/format-play-time';

export default function Stats() {
  const { state, bps, devJumpToAge } = useGameContext();

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

        {state.unlockedAchievements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Succès</Text>
            {ACHIEVEMENTS.filter(a => state.unlockedAchievements.includes(a.id)).map(a => (
              <StatCard key={a.id} emoji="🏆" label={a.title} value={a.description} />
            ))}
          </>
        )}
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
});
