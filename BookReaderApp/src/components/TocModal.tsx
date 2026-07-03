import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface TocEntry {
  label: string;
  href: string;
  depth: number;
}

export default function TocModal({
  visible,
  items,
  onClose,
  onSelect,
}: {
  visible: boolean;
  items: TocEntry[];
  onClose: () => void;
  onSelect: (href: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Contents</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No table of contents available.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, idx) => `${item.href}-${idx}`}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.row, { paddingLeft: 16 + item.depth * 16 }]}
                onPress={() => {
                  onSelect(item.href);
                  onClose();
                }}
              >
                <Text style={styles.rowText} numberOfLines={2}>
                  {item.label || 'Untitled section'}
                </Text>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  closeText: { fontSize: 15, color: '#2d6cdf', fontWeight: '600' },
  row: {
    paddingVertical: 14,
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowText: { fontSize: 15, color: '#1a1a1a' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#777' },
});
