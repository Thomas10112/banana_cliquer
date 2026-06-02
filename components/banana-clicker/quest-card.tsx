import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QuestConfig } from '@/store/quests-config';
import { GameState } from '@/store/types';

interface QuestCardProps {
  quest: QuestConfig;
  state: GameState;
  claimed: boolean;
  onClaim: (id: string) => void;
}

export function QuestCard({ quest, state, claimed, onClaim }: QuestCardProps) {
  const { current, total } = quest.progress(state);
  const completed = quest.check(state);
  const pct = Math.min(current / total, 1);
  const readyToClaim = completed && !claimed;

  return (
    <View style={[styles.card, readyToClaim && styles.cardReady, claimed && styles.cardDone]}>
      <View style={styles.header}>
        <Text style={styles.title}>{quest.title}</Text>
        {claimed && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={styles.description}>{quest.description}</Text>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{current} / {total}</Text>

      {readyToClaim && (
        <Pressable style={styles.claimBtn} onPress={() => onClaim(quest.id)}>
          <Text style={styles.claimText}>🎁 Réclamer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff8e1',
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  cardReady: {
    borderColor: '#f9a825',
    borderWidth: 2,
    shadowColor: '#f9a825',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cardDone: {
    borderColor: '#66bb6a',
    borderWidth: 1,
    backgroundColor: '#f1f8e9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3e2723',
  },
  check: {
    fontSize: 18,
    color: '#388e3c',
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: '#8d6e63',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#ffe082',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f9a825',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#8d6e63',
    textAlign: 'right',
  },
  claimBtn: {
    backgroundColor: '#f9a825',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  claimText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
