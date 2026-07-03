import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function HighlightPopover({
  visible,
  colors,
  onPick,
  onDismiss,
}: {
  visible: boolean;
  colors: string[];
  onPick: (color: string) => void;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.card}>
          <Text style={styles.label}>Highlight</Text>
          <View style={styles.swatchRow}>
            {colors.map((c) => (
              <Pressable
                key={c}
                style={[styles.swatch, { backgroundColor: c }]}
                onPress={() => onPick(c)}
              />
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 6,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 10 },
  swatchRow: { flexDirection: 'row', gap: 14 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
