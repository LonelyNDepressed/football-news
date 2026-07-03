import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, Highlight } from '../types';

type Row =
  | { kind: 'bookmark'; item: Bookmark }
  | { kind: 'highlight'; item: Highlight };

export default function BookmarksModal({
  visible,
  bookmarks,
  highlights,
  onClose,
  onSelectBookmark,
  onSelectHighlight,
  onRemoveBookmark,
  onRemoveHighlight,
}: {
  visible: boolean;
  bookmarks: Bookmark[];
  highlights: Highlight[];
  onClose: () => void;
  onSelectBookmark: (bookmark: Bookmark) => void;
  onSelectHighlight: (highlight: Highlight) => void;
  onRemoveBookmark: (id: string) => void;
  onRemoveHighlight: (id: string) => void;
}) {
  const rows: Row[] = [
    ...bookmarks.map((b) => ({ kind: 'bookmark' as const, item: b })),
    ...highlights.map((h) => ({ kind: 'highlight' as const, item: h })),
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bookmarks & Highlights</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>
        <FlatList
          data={rows}
          keyExtractor={(row) => row.item.id}
          renderItem={({ item: row }) => {
            if (row.kind === 'bookmark') {
              return (
                <View style={styles.row}>
                  <Pressable style={styles.rowMain} onPress={() => onSelectBookmark(row.item)}>
                    <Text style={styles.rowIcon}>★</Text>
                    <Text style={styles.rowText} numberOfLines={2}>
                      {row.item.label}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => onRemoveBookmark(row.item.id)} hitSlop={10}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              );
            }
            return (
              <View style={styles.row}>
                <Pressable style={styles.rowMain} onPress={() => onSelectHighlight(row.item)}>
                  <View style={[styles.swatch, { backgroundColor: row.item.color }]} />
                  <Text style={styles.rowText} numberOfLines={2}>
                    {row.item.text}
                  </Text>
                </Pressable>
                <Pressable onPress={() => onRemoveHighlight(row.item.id)} hitSlop={10}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No bookmarks or highlights yet. Tap the star while reading to add a
                bookmark, or select text to add a highlight.
              </Text>
            </View>
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    gap: 8,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  rowIcon: { fontSize: 16, color: '#e0a800' },
  swatch: { width: 14, height: 14, borderRadius: 3 },
  rowText: { fontSize: 14, color: '#1a1a1a', flex: 1 },
  removeText: { fontSize: 12, color: '#c0392b' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: '#777', textAlign: 'center', lineHeight: 20 },
});
