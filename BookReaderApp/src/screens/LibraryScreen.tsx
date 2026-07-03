import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookCover from '../components/BookCover';
import ProgressBar from '../components/ProgressBar';
import { useLibrary } from '../context/LibraryContext';
import { RootStackParamList } from '../navigation/types';
import { Book } from '../types';
import { pickAndImportBook, UnsupportedFormatError } from '../utils/fileImport';

type Props = NativeStackScreenProps<RootStackParamList, 'Library'>;

export default function LibraryScreen({ navigation }: Props) {
  const { books, loading, addBook, removeBook } = useLibrary();
  const [importing, setImporting] = useState(false);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      const book = await pickAndImportBook();
      if (book) {
        await addBook(book);
      }
    } catch (err) {
      const message =
        err instanceof UnsupportedFormatError
          ? err.message
          : 'Something went wrong while importing that file.';
      Alert.alert('Import failed', message);
    } finally {
      setImporting(false);
    }
  }, [addBook]);

  const handleLongPress = useCallback(
    (book: Book) => {
      Alert.alert(book.title, 'Remove this book from your library?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeBook(book.id),
        },
      ]);
    },
    [removeBook]
  );

  const renderItem = useCallback(
    ({ item }: { item: Book }) => (
      <Pressable
        style={styles.bookCell}
        onPress={() => navigation.navigate('Reader', { bookId: item.id })}
        onLongPress={() => handleLongPress(item)}
      >
        <BookCover title={item.title} />
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.progress > 0 && (
          <View style={styles.progressWrap}>
            <ProgressBar progress={item.progress} />
            <Text style={styles.progressText}>
              {Math.round(item.progress * 100)}%
            </Text>
          </View>
        )}
      </Pressable>
    ),
    [handleLongPress, navigation]
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.iconButtonText}>Settings</Text>
          </Pressable>
          <Pressable
            style={[styles.iconButton, styles.addButton]}
            onPress={handleImport}
            disabled={importing}
          >
            <Text style={[styles.iconButtonText, styles.addButtonText]}>
              {importing ? 'Importing…' : '+ Add Book'}
            </Text>
          </Pressable>
        </View>
      </View>

      {!loading && books.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No books yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap "+ Add Book" and choose an EPUB, PDF, or TXT file from your
            device to start reading.
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => b.id}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  iconButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  addButton: { backgroundColor: '#2d6cdf' },
  iconButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
  addButtonText: { color: '#fff' },
  grid: { paddingHorizontal: 12, paddingBottom: 24 },
  gridRow: { justifyContent: 'flex-start', gap: 12 },
  bookCell: { width: 108, marginBottom: 20, alignItems: 'center' },
  bookTitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  progressWrap: { width: '100%', marginTop: 4, alignItems: 'center' },
  progressText: { fontSize: 10, color: '#777', marginTop: 2 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20 },
});
