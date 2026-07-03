import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { File } from 'expo-file-system';
import { useKeepAwake } from 'expo-keep-awake';
import BookmarksModal from '../components/BookmarksModal';
import ReaderControls from '../components/ReaderControls';
import ReadingSettingsSheet from '../components/ReadingSettingsSheet';
import SearchModal, { SearchResultItem } from '../components/SearchModal';
import TocModal, { TocEntry } from '../components/TocModal';
import { useLibrary } from '../context/LibraryContext';
import { useSettings } from '../context/SettingsContext';
import { buildPdfReaderHtml } from '../reader/pdfHtml';
import { Book } from '../types';

const PDF_HTML = buildPdfReaderHtml();
const AnyWebView = WebView as unknown as React.ComponentType<any>;

export default function PdfReaderView({
  book,
  onBack,
}: {
  book: Book;
  onBack: () => void;
}) {
  useKeepAwake();
  const { updateBook, addBookmark, removeBookmark, removeHighlight } = useLibrary();
  const { settings, updateSettings } = useSettings();
  const webViewRef = useRef<WebView>(null);
  const [webReady, setWebReady] = useState(false);
  const [docLoaded, setDocLoaded] = useState(false);
  const [progress, setProgress] = useState(book.progress || 0);
  const [currentPage, setCurrentPage] = useState(
    book.lastLocation ? parseInt(book.lastLocation, 10) : 1
  );
  const [totalPages, setTotalPages] = useState(book.totalLocations || 0);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [brightness, setBrightness] = useState(settings.brightness);

  const send = useCallback((message: object) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  const handleLoad = useCallback(async () => {
    const file = new File(book.fileUri);
    const base64 = await file.base64();
    send({
      type: 'load',
      base64,
      initialPage: currentPage,
      settings,
    });
  }, [book.fileUri, currentPage, send, settings]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
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
        case 'docLoaded':
          setDocLoaded(true);
          setTotalPages(msg.payload.totalPages);
          updateBook(book.id, { totalLocations: msg.payload.totalPages });
          break;
        case 'toc':
          setToc(msg.payload.items);
          break;
        case 'relocated': {
          const pct = msg.payload.percentage || 0;
          setCurrentPage(msg.payload.page);
          setProgress(pct);
          updateBook(book.id, {
            progress: pct,
            lastLocation: String(msg.payload.page),
            totalLocations: msg.payload.totalPages,
          });
          break;
        }
        case 'toggleControls':
          setShowControls((prev) => !prev);
          break;
        case 'searchResults':
          setSearching(false);
          setSearchResults(msg.payload.results.map((r: any) => ({ cfi: r.cfi, excerpt: r.excerpt })));
          break;
        case 'error':
          console.warn('PDF reader error:', msg.payload.message);
          break;
        default:
          break;
      }
    },
    [book.id, handleLoad, updateBook]
  );

  useEffect(() => {
    if (webReady) send({ type: 'applySettings', settings });
  }, [webReady, send, settings]);

  const isBookmarked = useMemo(
    () => book.bookmarks.some((b) => b.location === String(currentPage)),
    [book.bookmarks, currentPage]
  );

  const handleToggleBookmark = useCallback(() => {
    const existing = book.bookmarks.find((b) => b.location === String(currentPage));
    if (existing) {
      removeBookmark(book.id, existing.id);
    } else {
      addBookmark(book.id, {
        id: `${Date.now()}`,
        location: String(currentPage),
        label: `Page ${currentPage}${totalPages ? ` of ${totalPages}` : ''}`,
        createdAt: Date.now(),
      });
    }
  }, [addBookmark, book.bookmarks, book.id, currentPage, removeBookmark, totalPages]);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      setSearching(true);
      setSearchResults([]);
      send({ type: 'search', query: query.trim() });
    },
    [send]
  );

  return (
    <View style={styles.container}>
      <AnyWebView
        ref={webViewRef}
        source={{ html: PDF_HTML }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={(e: any) => Alert.alert('Reader error', e.nativeEvent.description)}
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />

      {!docLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2d6cdf" />
        </View>
      )}

      <View pointerEvents="none" style={[styles.dimOverlay, { opacity: 1 - brightness }]} />

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
          totalPages > 1
            ? (value) => send({ type: 'goTo', target: String(Math.round(value * (totalPages - 1)) + 1) })
            : undefined
        }
        onBrightnessChange={setBrightness}
      />

      <ReadingSettingsSheet
        visible={showSettingsSheet}
        settings={settings}
        onClose={() => setShowSettingsSheet(false)}
        onChange={(patch) => updateSettings(patch)}
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
        highlights={[]}
        onClose={() => setShowBookmarks(false)}
        onSelectBookmark={(bm) => {
          send({ type: 'goTo', target: bm.location });
          setShowBookmarks(false);
        }}
        onSelectHighlight={() => {}}
        onRemoveBookmark={(id) => removeBookmark(book.id, id)}
        onRemoveHighlight={(id) => removeHighlight(book.id, id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#525659' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#525659',
  },
  dimOverlay: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
});
