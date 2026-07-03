import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { File } from 'expo-file-system';
import { useKeepAwake } from 'expo-keep-awake';
import BookmarksModal from '../components/BookmarksModal';
import HighlightPopover from '../components/HighlightPopover';
import ReaderControls from '../components/ReaderControls';
import ReadingSettingsSheet from '../components/ReadingSettingsSheet';
import SearchModal, { SearchResultItem } from '../components/SearchModal';
import TocModal, { TocEntry } from '../components/TocModal';
import { useLibrary } from '../context/LibraryContext';
import { useSettings } from '../context/SettingsContext';
import { buildEpubReaderHtml } from '../reader/epubHtml';
import { Book } from '../types';

const EPUB_HTML = buildEpubReaderHtml();
const HIGHLIGHT_COLORS = ['#ffe066', '#8ce99a', '#a5d8ff', '#ffc9c9'];
// react-native-webview's class-component typings don't resolve cleanly
// against this project's TypeScript/React versions; render it untyped.
const AnyWebView = WebView as unknown as React.ComponentType<any>;

export default function EpubReaderView({
  book,
  onBack,
}: {
  book: Book;
  onBack: () => void;
}) {
  useKeepAwake();
  const { updateBook, addBookmark, removeBookmark, addHighlight, removeHighlight, getBook } =
    useLibrary();
  const { settings, updateSettings } = useSettings();
  const webViewRef = useRef<WebView>(null);
  const [webReady, setWebReady] = useState(false);
  const [progress, setProgress] = useState(book.progress || 0);
  const [currentCfi, setCurrentCfi] = useState<string | undefined>(book.lastLocation);
  const [locationsReady, setLocationsReady] = useState(false);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [brightness, setBrightness] = useState(settings.brightness);
  const [pendingSelection, setPendingSelection] = useState<
    { cfiRange: string; text: string } | null
  >(null);

  const send = useCallback((message: object) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  const handleLoad = useCallback(async () => {
    const file = new File(book.fileUri);
    const base64 = await file.base64();
    send({
      type: 'load',
      base64,
      initialLocation: book.lastLocation,
      settings,
      highlights: book.highlights,
    });
  }, [book, send, settings]);

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case 'ready':
          setWebReady(true);
          handleLoad();
          break;
        case 'toc':
          setToc(msg.payload.items);
          break;
        case 'metadata': {
          const latest = getBook(book.id);
          const patch: Partial<Book> = {};
          if (msg.payload.title && (!latest?.title || latest.title === book.fileName)) {
            patch.title = msg.payload.title;
          }
          if (msg.payload.author && !latest?.author) {
            patch.author = msg.payload.author;
          }
          if (Object.keys(patch).length > 0) updateBook(book.id, patch);
          break;
        }
        case 'locationsReady':
          setLocationsReady(true);
          break;
        case 'relocated': {
          const pct = msg.payload.percentage || 0;
          setProgress(pct);
          setCurrentCfi(msg.payload.cfi);
          updateBook(book.id, { progress: pct, lastLocation: msg.payload.cfi });
          break;
        }
        case 'selection':
          setPendingSelection({
            cfiRange: msg.payload.cfiRange,
            text: msg.payload.text,
          });
          break;
        case 'toggleControls':
          setShowControls((prev) => !prev);
          break;
        case 'searchResults':
          setSearching(false);
          setSearchResults(msg.payload.results.map((r: any) => ({ cfi: r.cfi, excerpt: r.excerpt })));
          break;
        case 'error':
          console.warn('EPUB reader error:', msg.payload.message);
          break;
        default:
          break;
      }
    },
    [book, getBook, handleLoad, updateBook]
  );

  const isBookmarked = useMemo(
    () => !!currentCfi && book.bookmarks.some((b) => b.location === currentCfi),
    [book.bookmarks, currentCfi]
  );

  const handleToggleBookmark = useCallback(() => {
    if (!currentCfi) return;
    const existing = book.bookmarks.find((b) => b.location === currentCfi);
    if (existing) {
      removeBookmark(book.id, existing.id);
    } else {
      addBookmark(book.id, {
        id: `${Date.now()}`,
        location: currentCfi,
        label: `${Math.round(progress * 100)}% through the book`,
        createdAt: Date.now(),
      });
    }
  }, [addBookmark, book.bookmarks, book.id, currentCfi, progress, removeBookmark]);

  const handleSettingsChange = useCallback(
    (patch: Partial<typeof settings>) => {
      updateSettings(patch);
    },
    [updateSettings]
  );

  React.useEffect(() => {
    if (webReady) send({ type: 'applySettings', settings });
  }, [webReady, send, settings]);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      setSearching(true);
      setSearchResults([]);
      send({ type: 'search', query: query.trim() });
    },
    [send]
  );

  const handleHighlightColor = useCallback(
    (color: string) => {
      if (!pendingSelection) return;
      send({ type: 'addHighlight', cfiRange: pendingSelection.cfiRange, color });
      addHighlight(book.id, {
        id: `${Date.now()}`,
        cfiRange: pendingSelection.cfiRange,
        text: pendingSelection.text,
        color,
        createdAt: Date.now(),
      });
      setPendingSelection(null);
    },
    [addHighlight, book.id, pendingSelection, send]
  );

  return (
    <View style={styles.container}>
      <AnyWebView
        ref={webViewRef}
        source={{ html: EPUB_HTML }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={(e: any) => Alert.alert('Reader error', e.nativeEvent.description)}
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />

      {!webReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2d6cdf" />
        </View>
      )}

      <View
        pointerEvents="none"
        style={[styles.dimOverlay, { opacity: 1 - brightness }]}
      />

      <ReaderControls
        visible={showControls}
        title={book.title}
        progress={progress}
        isBookmarked={isBookmarked}
        brightness={brightness}
        onBack={onBack}
        onToc={() => setShowToc(true)}
        onSearch={() => setShowSearch(true)}
        onOpenBookmarksList={() => setShowBookmarks(true)}
        onToggleBookmark={handleToggleBookmark}
        onSettings={() => setShowSettingsSheet(true)}
        onSeek={
          locationsReady
            ? (value) => send({ type: 'goTo', target: value })
            : undefined
        }
        onBrightnessChange={setBrightness}
      />

      <ReadingSettingsSheet
        visible={showSettingsSheet}
        settings={settings}
        onClose={() => setShowSettingsSheet(false)}
        onChange={handleSettingsChange}
      />

      <TocModal
        visible={showToc}
        items={toc}
        onClose={() => setShowToc(false)}
        onSelect={(href) => send({ type: 'goTo', target: href })}
      />

      <SearchModal
        visible={showSearch}
        results={searchResults}
        searching={searching}
        onClose={() => setShowSearch(false)}
        onSubmit={handleSearchSubmit}
        onSelect={(cfi) => send({ type: 'goTo', target: cfi })}
      />

      <BookmarksModal
        visible={showBookmarks}
        bookmarks={book.bookmarks}
        highlights={book.highlights}
        onClose={() => setShowBookmarks(false)}
        onSelectBookmark={(bm) => {
          send({ type: 'goTo', target: bm.location });
          setShowBookmarks(false);
        }}
        onSelectHighlight={(h) => {
          send({ type: 'goTo', target: h.cfiRange });
          setShowBookmarks(false);
        }}
        onRemoveBookmark={(id) => removeBookmark(book.id, id)}
        onRemoveHighlight={(id) => removeHighlight(book.id, id)}
      />

      <HighlightPopover
        visible={!!pendingSelection}
        colors={HIGHLIGHT_COLORS}
        onPick={handleHighlightColor}
        onDismiss={() => setPendingSelection(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
});
