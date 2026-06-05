import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { QUESTS } from '@/store/quests-config';
import { GameState } from '@/store/types';
import { QuestCard } from './quest-card';

interface QuestsPanelProps {
  state: GameState;
  onClaim: (id: string) => void;
}

export function QuestsPanel({ state, onClaim }: QuestsPanelProps) {
  const ageQuests = QUESTS.filter(q => (q.minAge ?? 0) === state.currentAge);
  const firstUnclaimedIdx = ageQuests.findIndex(q => !state.claimedQuests.includes(q.id));
  const visible = firstUnclaimedIdx === -1 ? ageQuests : ageQuests.slice(0, firstUnclaimedIdx + 1);
  const visibleQuests = [
    ...visible.filter(q => !state.claimedQuests.includes(q.id)),
    ...visible.filter(q =>  state.claimedQuests.includes(q.id)),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quêtes</Text>
      {visibleQuests.map(quest => (
        <QuestCard
          key={quest.id}
          quest={quest}
          state={state}
          claimed={state.claimedQuests.includes(quest.id)}
          onClaim={onClaim}
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5d4037',
    marginBottom: 8,
  },
});
