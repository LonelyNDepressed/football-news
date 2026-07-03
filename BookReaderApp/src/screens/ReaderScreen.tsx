import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLibrary } from '../context/LibraryContext';
import { RootStackParamList } from '../navigation/types';
import EpubReaderView from './EpubReaderView';
import PdfReaderView from './PdfReaderView';
import TxtReaderView from './TxtReaderView';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

export default function ReaderScreen({ route, navigation }: Props) {
  const { getBook } = useLibrary();
  const book = getBook(route.params.bookId);

  const onBack = useCallback(() => navigation.goBack(), [navigation]);

  if (!book) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This book could not be found.</Text>
      </View>
    );
  }

  switch (book.format) {
    case 'epub':
      return <EpubReaderView book={book} onBack={onBack} />;
    case 'pdf':
      return <PdfReaderView book={book} onBack={onBack} />;
    case 'txt':
      return <TxtReaderView book={book} onBack={onBack} />;
    default:
      return (
        <View style={styles.missing}>
          <Text style={styles.missingText}>Unsupported book format.</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  missingText: { color: '#777', fontSize: 15 },
});
