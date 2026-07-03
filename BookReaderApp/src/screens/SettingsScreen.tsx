import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { RootStackParamList } from '../navigation/types';
import { FontFamily, ReaderTheme, THEME_COLORS } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const THEMES: ReaderTheme[] = ['light', 'sepia', 'dark', 'black'];
const FONTS: { key: FontFamily; label: string }[] = [
  { key: 'serif', label: 'Serif' },
  { key: 'sans', label: 'Sans' },
  { key: 'monospace', label: 'Mono' },
];

export default function SettingsScreen({ navigation }: Props) {
  const { settings, updateSettings } = useSettings();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Reading Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Default text size</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 2) })}
          >
            <Text style={styles.stepBtnText}>A-</Text>
          </Pressable>
          <Text style={styles.valueText}>{settings.fontSize}px</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => updateSettings({ fontSize: Math.min(40, settings.fontSize + 2) })}
          >
            <Text style={styles.stepBtnText}>A+</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Default font</Text>
        <View style={styles.row}>
          {FONTS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.choiceBtn, settings.fontFamily === f.key && styles.choiceBtnActive]}
              onPress={() => updateSettings({ fontFamily: f.key })}
            >
              <Text
                style={[styles.choiceText, settings.fontFamily === f.key && styles.choiceTextActive]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Default line spacing</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.stepBtn}
            onPress={() =>
              updateSettings({ lineHeight: Math.max(1, Math.round((settings.lineHeight - 0.1) * 10) / 10) })
            }
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.valueText}>{settings.lineHeight.toFixed(1)}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() =>
              updateSettings({ lineHeight: Math.min(2.4, Math.round((settings.lineHeight + 0.1) * 10) / 10) })
            }
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Margins</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => updateSettings({ margin: Math.max(0, settings.margin - 4) })}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.valueText}>{settings.margin}px</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => updateSettings({ margin: Math.min(64, settings.margin + 4) })}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Default theme</Text>
        <View style={styles.row}>
          {THEMES.map((t) => (
            <Pressable
              key={t}
              style={[
                styles.themeSwatch,
                { backgroundColor: THEME_COLORS[t].background },
                settings.theme === t && styles.themeSwatchActive,
              ]}
              onPress={() => updateSettings({ theme: t })}
            >
              <Text style={{ color: THEME_COLORS[t].text, fontSize: 12 }}>Aa</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footnote}>
          These are the defaults new and existing books open with. You can also
          adjust them from the "Aa" button while reading.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  backText: { fontSize: 15, color: '#2d6cdf', fontWeight: '600', width: 60 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginTop: 18, marginBottom: 8 },
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
  choiceBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
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
  footnote: { marginTop: 24, fontSize: 12, color: '#999', lineHeight: 18 },
});
