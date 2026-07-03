import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily, ReaderTheme, ReadingSettings, THEME_COLORS } from '../types';

const THEMES: ReaderTheme[] = ['light', 'sepia', 'dark', 'black'];
const FONTS: { key: FontFamily; label: string }[] = [
  { key: 'serif', label: 'Serif' },
  { key: 'sans', label: 'Sans' },
  { key: 'monospace', label: 'Mono' },
];

export default function ReadingSettingsSheet({
  visible,
  settings,
  onClose,
  onChange,
}: {
  visible: boolean;
  settings: ReadingSettings;
  onClose: () => void;
  onChange: (patch: Partial<ReadingSettings>) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.handle} />

        <Text style={styles.sectionLabel}>Text size</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => onChange({ fontSize: Math.max(12, settings.fontSize - 2) })}
          >
            <Text style={styles.stepBtnText}>A-</Text>
          </Pressable>
          <Text style={styles.valueText}>{settings.fontSize}px</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => onChange({ fontSize: Math.min(40, settings.fontSize + 2) })}
          >
            <Text style={styles.stepBtnText}>A+</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Font</Text>
        <View style={styles.row}>
          {FONTS.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.choiceBtn,
                settings.fontFamily === f.key && styles.choiceBtnActive,
              ]}
              onPress={() => onChange({ fontFamily: f.key })}
            >
              <Text
                style={[
                  styles.choiceText,
                  settings.fontFamily === f.key && styles.choiceTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Line spacing</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.stepBtn}
            onPress={() =>
              onChange({ lineHeight: Math.max(1, Math.round((settings.lineHeight - 0.1) * 10) / 10) })
            }
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.valueText}>{settings.lineHeight.toFixed(1)}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() =>
              onChange({ lineHeight: Math.min(2.4, Math.round((settings.lineHeight + 0.1) * 10) / 10) })
            }
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Theme</Text>
        <View style={styles.row}>
          {THEMES.map((t) => (
            <Pressable
              key={t}
              style={[
                styles.themeSwatch,
                { backgroundColor: THEME_COLORS[t].background },
                settings.theme === t && styles.themeSwatchActive,
              ]}
              onPress={() => onChange({ theme: t })}
            >
              <Text style={{ color: THEME_COLORS[t].text, fontSize: 12 }}>Aa</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.doneBtn} onPress={onClose}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 44,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  valueText: { flex: 1, textAlign: 'center', fontSize: 14, color: '#333' },
  choiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  choiceBtnActive: { backgroundColor: '#2d6cdf' },
  choiceText: { fontSize: 14, color: '#333', fontWeight: '600' },
  choiceTextActive: { color: '#fff' },
  themeSwatch: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeSwatchActive: { borderColor: '#2d6cdf' },
  doneBtn: {
    marginTop: 20,
    backgroundColor: '#2d6cdf',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
