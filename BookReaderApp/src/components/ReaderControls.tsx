import Slider from '@react-native-community/slider';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  title: string;
  progress: number;
  isBookmarked: boolean;
  brightness: number;
  onBack: () => void;
  onToc: () => void;
  onSearch?: () => void;
  onOpenBookmarksList: () => void;
  onToggleBookmark: () => void;
  onSettings: () => void;
  onSeek?: (value: number) => void;
  onBrightnessChange: (value: number) => void;
}

export default function ReaderControls({
  visible,
  title,
  progress,
  isBookmarked,
  brightness,
  onBack,
  onToc,
  onSearch,
  onOpenBookmarksList,
  onToggleBookmark,
  onSettings,
  onSeek,
  onBrightnessChange,
}: Props) {
  if (!visible) return null;

  return (
    <>
      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable style={styles.iconBtn} onPress={onBack} hitSlop={12}>
            <Text style={styles.iconText}>‹ Library</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.topRightGroup}>
            {onSearch && (
              <Pressable style={styles.iconBtn} onPress={onSearch} hitSlop={12}>
                <Text style={styles.iconText}>🔍</Text>
              </Pressable>
            )}
            <Pressable style={styles.iconBtn} onPress={onOpenBookmarksList} hitSlop={12}>
              <Text style={styles.iconText}>📑</Text>
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={onToggleBookmark} hitSlop={12}>
              <Text style={styles.iconText}>{isBookmarked ? '★' : '☆'}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.brightnessRow}>
          <Text style={styles.dimText}>☀︎</Text>
          <Slider
            style={styles.brightnessSlider}
            minimumValue={0.2}
            maximumValue={1}
            value={brightness}
            onValueChange={onBrightnessChange}
            minimumTrackTintColor="#f2c94c"
            maximumTrackTintColor="#555"
          />
          <Text style={styles.brightText}>☀︎</Text>
        </View>
        <View style={styles.progressRow}>
          <Pressable style={styles.iconBtn} onPress={onToc} hitSlop={12}>
            <Text style={styles.iconText}>☰ Contents</Text>
          </Pressable>
          {onSeek ? (
            <Slider
              style={styles.progressSlider}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              onSlidingComplete={onSeek}
              minimumTrackTintColor="#6ea8fe"
              maximumTrackTintColor="#555"
            />
          ) : (
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          )}
          <Pressable style={styles.iconBtn} onPress={onSettings} hitSlop={12}>
            <Text style={styles.iconText}>Aa</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const BAR_BG = 'rgba(20,20,20,0.92)';

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: BAR_BG,
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
  },
  topRightGroup: { flexDirection: 'row' },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  iconText: { color: '#fff', fontSize: 15 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BAR_BG,
    zIndex: 20,
    paddingBottom: 4,
  },
  brightnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  brightnessSlider: { flex: 1, height: 32, marginHorizontal: 8 },
  dimText: { color: '#888', fontSize: 12 },
  brightText: { color: '#fff', fontSize: 16 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  progressSlider: { flex: 1, height: 32, marginHorizontal: 4 },
  progressText: {
    flex: 1,
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
});
