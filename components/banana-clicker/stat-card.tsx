import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  emoji: string;
  label: string;
  value: string;
}

export function StatCard({ emoji, label, value }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    gap: 16,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  emoji: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 13,
    color: '#8d6e63',
    fontWeight: '500',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3e2723',
  },
});
