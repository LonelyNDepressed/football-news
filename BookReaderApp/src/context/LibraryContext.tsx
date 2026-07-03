import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { File } from 'expo-file-system';
import { Book, Bookmark, Highlight } from '../types';

const LIBRARY_KEY = 'bookreader.library.v1';

interface LibraryContextValue {
  books: Book[];
  loading: boolean;
  addBook: (book: Book) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  updateBook: (id: string, patch: Partial<Book>) => Promise<void>;
  addBookmark: (id: string, bookmark: Bookmark) => Promise<void>;
  removeBookmark: (id: string, bookmarkId: string) => Promise<void>;
  addHighlight: (id: string, highlight: Highlight) => Promise<void>;
  removeHighlight: (id: string, highlightId: string) => Promise<void>;
  getBook: (id: string) => Book | undefined;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LIBRARY_KEY);
        if (raw) {
          setBooks(JSON.parse(raw));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Book[]) => {
    setBooks(next);
    await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
  }, []);

  const addBook = useCallback(
    async (book: Book) => {
      await persist([book, ...books]);
    },
    [books, persist]
  );

  const removeBook = useCallback(
    async (id: string) => {
      const book = books.find((b) => b.id === id);
      if (book) {
        try {
          const file = new File(book.fileUri);
          if (file.exists) file.delete();
        } catch {
          // best-effort cleanup; ignore missing file errors
        }
      }
      await persist(books.filter((b) => b.id !== id));
    },
    [books, persist]
  );

  const updateBook = useCallback(
    async (id: string, patch: Partial<Book>) => {
      await persist(books.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    },
    [books, persist]
  );

  const addBookmark = useCallback(
    async (id: string, bookmark: Bookmark) => {
      await persist(
        books.map((b) =>
          b.id === id ? { ...b, bookmarks: [...b.bookmarks, bookmark] } : b
        )
      );
    },
    [books, persist]
  );

  const removeBookmark = useCallback(
    async (id: string, bookmarkId: string) => {
      await persist(
        books.map((b) =>
          b.id === id
            ? { ...b, bookmarks: b.bookmarks.filter((bm) => bm.id !== bookmarkId) }
            : b
        )
      );
    },
    [books, persist]
  );

  const addHighlight = useCallback(
    async (id: string, highlight: Highlight) => {
      await persist(
        books.map((b) =>
          b.id === id ? { ...b, highlights: [...b.highlights, highlight] } : b
        )
      );
    },
    [books, persist]
  );

  const removeHighlight = useCallback(
    async (id: string, highlightId: string) => {
      await persist(
        books.map((b) =>
          b.id === id
            ? { ...b, highlights: b.highlights.filter((h) => h.id !== highlightId) }
            : b
        )
      );
    },
    [books, persist]
  );

  const getBook = useCallback((id: string) => books.find((b) => b.id === id), [books]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      books,
      loading,
      addBook,
      removeBook,
      updateBook,
      addBookmark,
      removeBookmark,
      addHighlight,
      removeHighlight,
      getBook,
    }),
    [
      books,
      loading,
      addBook,
      removeBook,
      updateBook,
      addBookmark,
      removeBookmark,
      addHighlight,
      removeHighlight,
      getBook,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
