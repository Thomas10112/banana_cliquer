import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { QUESTS } from '@/store/quests-config';
import { SIDE_QUESTS } from '@/store/side-quests-config';
import { GameState } from '@/store/types';
import { QuestCard } from './quest-card';

interface QuestsPanelProps {
  state: GameState;
  onClaim: (id: string) => void;
  onClaimSide: (id: string) => void;
}

export function QuestsPanel({ state, onClaim, onClaimSide }: QuestsPanelProps) {
  // ── Quêtes d'âge : chaîne de l'âge courant, une seule visible à la fois ──────
  const ageQuests = QUESTS.filter(q => (q.minAge ?? 0) === state.currentAge);
  const firstUnclaimedIdx = ageQuests.findIndex(q => !state.claimedQuests.includes(q.id));
  const visible = firstUnclaimedIdx === -1 ? ageQuests : ageQuests.slice(0, firstUnclaimedIdx + 1);
  const visibleAgeQuests = [
    ...visible.filter(q => !state.claimedQuests.includes(q.id)),
    ...visible.filter(q =>  state.claimedQuests.includes(q.id)),
  ];

  // ── Quêtes secondaires : débloquées par âge, persistantes, triées ────────────
  const unlockedSide = SIDE_QUESTS.filter(q => q.minAge <= state.currentAge);
  const claimableSide = unlockedSide.filter(q => !state.claimedSideQuests.includes(q.id) && q.check(state));
  const inProgressSide = unlockedSide.filter(q => !state.claimedSideQuests.includes(q.id) && !q.check(state));
  const claimedSide = unlockedSide.filter(q => state.claimedSideQuests.includes(q.id));
  const sortedSide = [...claimableSide, ...inProgressSide, ...claimedSide];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Quêtes d'âge</Text>
      {visibleAgeQuests.map(quest => (
        <QuestCard
          key={quest.id}
          quest={quest}
          state={state}
          claimed={state.claimedQuests.includes(quest.id)}
          onClaim={onClaim}
        />
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.section}>Quêtes secondaires</Text>
        <Text style={styles.counter}>{claimedSide.length}/{unlockedSide.length}</Text>
      </View>
      {sortedSide.map(quest => (
        <QuestCard
          key={quest.id}
          quest={quest}
          state={state}
          claimed={state.claimedSideQuests.includes(quest.id)}
          onClaim={onClaimSide}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffde7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5d4037',
    marginBottom: 8,
  },
  counter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a1887f',
  },
});
