export type BookFormat = 'epub' | 'pdf' | 'txt';

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'black';

export type FontFamily = 'serif' | 'sans' | 'monospace';

export interface Bookmark {
  id: string;
  /** epub: CFI string. pdf: page number as string. txt: character offset as string. */
  location: string;
  label: string;
  createdAt: number;
}

export interface Highlight {
  id: string;
  /** epub: CFI range. pdf/txt: not supported yet. */
  cfiRange: string;
  text: string;
  color: string;
  note?: string;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  format: BookFormat;
  /** Local file:// uri where the book file lives inside app storage. */
  fileUri: string;
  fileName: string;
  fileSize: number;
  addedAt: number;
  /** 0-1 fraction of how far the reader has progressed. */
  progress: number;
  /** Format-specific resume location (CFI / page number / char offset). */
  lastLocation?: string;
  /** Total page count, known only for txt/pdf pagination. */
  totalLocations?: number;
  bookmarks: Bookmark[];
  highlights: Highlight[];
}

export interface ReadingSettings {
  fontSize: number;
  fontFamily: FontFamily;
  theme: ReaderTheme;
  lineHeight: number;
  margin: number;
  brightness: number;
}

export const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 18,
  fontFamily: 'serif',
  theme: 'light',
  lineHeight: 1.4,
  margin: 16,
  brightness: 1,
};

export const THEME_COLORS: Record<
  ReaderTheme,
  { background: string; text: string; accent: string }
> = {
  light: { background: '#ffffff', text: '#1a1a1a', accent: '#2d6cdf' },
  sepia: { background: '#f4ecd8', text: '#5b4636', accent: '#8a5a2b' },
  dark: { background: '#1e1e1e', text: '#d8d8d8', accent: '#6ea8fe' },
  black: { background: '#000000', text: '#b3b3b3', accent: '#6ea8fe' },
};
