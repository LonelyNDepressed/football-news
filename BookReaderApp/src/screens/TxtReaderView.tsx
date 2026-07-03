import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { File } from 'expo-file-system';
import { useKeepAwake } from 'expo-keep-awake';
import BookmarksModal from '../components/BookmarksModal';
import ReaderControls from '../components/ReaderControls';
import ReadingSettingsSheet from '../components/ReadingSettingsSheet';
import SearchModal, { SearchResultItem } from '../components/SearchModal';
import { useLibrary } from '../context/LibraryContext';
import { useSettings } from '../context/SettingsContext';
import { estimateCharsPerPage, pageIndexForOffset, paginateText, TxtPage } from '../reader/txtPaginate';
import { Book, THEME_COLORS } from '../types';

const FONT_STACKS: Record<string, string> = {
  serif: 'serif',
  sans: 'sans-serif',
  monospace: 'monospace',
};

export default function TxtReaderView({
  book,
  onBack,
}: {
  book: Book;
  onBack: () => void;
}) {
  useKeepAwake();
  const { updateBook, addBookmark, removeBookmark } = useLibrary();
  const { settings, updateSettings } = useSettings();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<TxtPage>>(null);

  const [text, setText] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [brightness, setBrightness] = useState(settings.brightness);
  const [pageIndex, setPageIndex] = useState(0);
  const initialOffset = book.lastLocation ? parseInt(book.lastLocation, 10) : 0;

  useEffect(() => {
    (async () => {
      const file = new File(book.fileUri);
      const content = await file.text();
      setText(content);
    })();
  }, [book.fileUri]);

  const charsPerPage = useMemo(
    () => estimateCharsPerPage(width, height, settings.fontSize, settings.lineHeight, settings.margin),
    [width, height, settings.fontSize, settings.lineHeight, settings.margin]
  );

  const pages = useMemo(() => {
    if (text == null) return [];
    return paginateText(text, charsPerPage);
  }, [text, charsPerPage]);

  useEffect(() => {
    if (pages.length === 0) return;
    const idx = pageIndexForOffset(pages, initialOffset);
    setPageIndex(idx);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: idx * width, animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, width]);

  const persistProgress = useCallback(
    (idx: number) => {
      if (pages.length === 0) return;
      const page = pages[Math.max(0, Math.min(pages.length - 1, idx))];
      const pct = pages.length > 1 ? idx / (pages.length - 1) : 0;
      updateBook(book.id, {
        progress: pct,
        lastLocation: String(page.start),
        totalLocations: pages.length,
      });
    },
    [book.id, pages, updateBook]
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      setPageIndex(idx);
      persistProgress(idx);
    },
    [persistProgress, width]
  );

  const theme = THEME_COLORS[settings.theme];
  const isBookmarked = useMemo(() => {
    if (pages.length === 0) return false;
    const page = pages[pageIndex];
    return book.bookmarks.some((b) => {
      const off = parseInt(b.location, 10);
      return off >= page.start && off < page.end;
    });
  }, [book.bookmarks, pageIndex, pages]);

  const handleToggleBookmark = useCallback(() => {
    if (pages.length === 0) return;
    const page = pages[pageIndex];
    const existing = book.bookmarks.find((b) => {
      const off = parseInt(b.location, 10);
      return off >= page.start && off < page.end;
    });
    if (existing) {
      removeBookmark(book.id, existing.id);
    } else {
      addBookmark(book.id, {
        id: `${Date.now()}`,
        location: String(page.start),
        label: `Page ${pageIndex + 1} of ${pages.length}`,
        createdAt: Date.now(),
      });
    }
  }, [addBookmark, book.bookmarks, book.id, pageIndex, pages, removeBookmark]);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      if (!text || !query.trim()) return;
      const q = query.trim().toLowerCase();
      const lower = text.toLowerCase();
      const results: SearchResultItem[] = [];
      let from = 0;
      while (results.length < 40) {
        const idx = lower.indexOf(q, from);
        if (idx === -1) break;
        const start = Math.max(0, idx - 40);
        const excerpt = text.substring(start, idx + q.length + 40);
        results.push({ cfi: String(idx), excerpt });
        from = idx + q.length;
      }
      setSearchResults(results);
    },
    [text]
  );

  const goToOffset = useCallback(
    (offset: number) => {
      const idx = pageIndexForOffset(pages, offset);
      listRef.current?.scrollToOffset({ offset: idx * width, animated: false });
      setPageIndex(idx);
      persistProgress(idx);
    },
    [pages, persistProgress, width]
  );

  if (text == null || pages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(_, idx) => String(idx)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={pageIndex}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.page, { width, height, padding: settings.margin }]}
            onPress={(e) => {
              const x = e.nativeEvent.locationX;
              if (x < width * 0.2) {
                if (pageIndex > 0) goToOffset(pages[pageIndex - 1].start);
              } else if (x > width * 0.8) {
                if (pageIndex < pages.length - 1) goToOffset(pages[pageIndex + 1].start);
              } else {
                setShowControls((v) => !v);
              }
            }}
          >
            <Text
              style={{
                fontSize: settings.fontSize,
                lineHeight: settings.fontSize * settings.lineHeight,
                color: theme.text,
                fontFamily: FONT_STACKS[settings.fontFamily],
              }}
            >
              {item.text}
            </Text>
          </Pressable>
        )}
      />

      <View pointerEvents="none" style={[styles.dimOverlay, { opacity: 1 - brightness }]} />

      <ReaderControls
        visible={showControls}
        title={book.title}
        progress={pages.length > 1 ? pageIndex / (pages.length - 1) : 0}
        isBookmarked={isBookmarked}
        brightness={brightness}
        onBack={onBack}
        onToc={() => {}}
        onSearch={() => setShowSearch(true)}
        onOpenBookmarksList={() => setShowBookmarks(true)}
        onToggleBookmark={handleToggleBookmark}
        onSettings={() => setShowSettingsSheet(true)}
        onSeek={(value) => goToOffset(pages[Math.round(value * (pages.length - 1))].start)}
        onBrightnessChange={setBrightness}
      />

      <ReadingSettingsSheet
        visible={showSettingsSheet}
        settings={settings}
        onClose={() => setShowSettingsSheet(false)}
        onChange={(patch) => updateSettings(patch)}
      />

      <SearchModal
        visible={showSearch}
        results={searchResults}
        searching={false}
        onClose={() => setShowSearch(false)}
        onSubmit={handleSearchSubmit}
        onSelect={(offsetStr) => goToOffset(parseInt(offsetStr, 10))}
      />

      <BookmarksModal
        visible={showBookmarks}
        bookmarks={book.bookmarks}
        highlights={[]}
        onClose={() => setShowBookmarks(false)}
        onSelectBookmark={(bm) => {
          goToOffset(parseInt(bm.location, 10));
          setShowBookmarks(false);
        }}
        onSelectHighlight={() => {}}
        onRemoveBookmark={(id) => removeBookmark(book.id, id)}
        onRemoveHighlight={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  page: { justifyContent: 'flex-start' },
  dimOverlay: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
});
