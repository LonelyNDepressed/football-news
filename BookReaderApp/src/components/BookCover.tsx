import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const PALETTE = [
  '#2d6cdf',
  '#8a5a2b',
  '#3a7d5c',
  '#a13d63',
  '#5b4b8a',
  '#c1652f',
  '#2f7a7d',
];

function colorForTitle(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function BookCover({
  title,
  width = 96,
  height = 144,
}: {
  title: string;
  width?: number;
  height?: number;
}) {
  const bg = colorForTitle(title);
  return (
    <View style={[styles.cover, { backgroundColor: bg, width, height }]}>
      <Text style={styles.initials}>{initials(title)}</Text>
      <Text style={styles.title} numberOfLines={4}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 6,
    padding: 8,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  initials: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
