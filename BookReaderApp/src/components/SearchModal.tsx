import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface SearchResultItem {
  cfi: string;
  excerpt: string;
}

export default function SearchModal({
  visible,
  results,
  searching,
  onClose,
  onSubmit,
  onSelect,
}: {
  visible: boolean;
  results: SearchResultItem[];
  searching: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
  onSelect: (cfi: string) => void;
}) {
  const [query, setQuery] = useState('');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TextInput
            style={styles.input}
            placeholder="Search in book…"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => onSubmit(query)}
            returnKeyType="search"
            autoFocus
          />
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
        </View>
        {searching && <ActivityIndicator style={styles.spinner} />}
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.cfi}-${idx}`}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                onSelect(item.cfi);
                onClose();
              }}
            >
              <Text style={styles.excerpt} numberOfLines={2}>
                {item.excerpt}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            !searching ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {query ? 'No matches found.' : 'Type a word or phrase to search.'}
                </Text>
              </View>
            ) : null
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  closeText: { fontSize: 15, color: '#2d6cdf', fontWeight: '600' },
  spinner: { marginTop: 16 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  excerpt: { fontSize: 14, color: '#1a1a1a', lineHeight: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  emptyText: { color: '#777' },
});
