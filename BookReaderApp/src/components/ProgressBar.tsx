import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function ProgressBar({
  progress,
  color = '#2d6cdf',
  trackColor = 'rgba(0,0,0,0.08)',
  height = 4,
}: {
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { backgroundColor: trackColor, height }]}>
      <View
        style={[
          styles.fill,
          { backgroundColor: color, width: `${clamped * 100}%`, height },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});
