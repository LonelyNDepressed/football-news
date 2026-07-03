import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Book, BookFormat } from '../types';

const SUPPORTED_MIME_TYPES = [
  'application/epub+zip',
  'application/pdf',
  'text/plain',
];

function detectFormat(fileName: string, mimeType?: string): BookFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.epub') || mimeType === 'application/epub+zip') return 'epub';
  if (lower.endsWith('.pdf') || mimeType === 'application/pdf') return 'pdf';
  if (lower.endsWith('.txt') || mimeType === 'text/plain') return 'txt';
  return null;
}

function titleFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_-]+/g, ' ').trim() || fileName;
}

function ensureBooksDirectory(): Directory {
  const dir = new Directory(Paths.document, 'books');
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export class UnsupportedFormatError extends Error {
  constructor(fileName: string) {
    super(
      `"${fileName}" is not a supported book format. Please choose an EPUB, PDF, or TXT file.`
    );
    this.name = 'UnsupportedFormatError';
  }
}

/**
 * Opens the system document picker restricted to book-like files, copies the
 * selection into the app's private "books" directory (so it survives even if
 * the user deletes the original from their device), and returns a new Book
 * record ready to be added to the library. Returns null if the user cancels.
 */
export async function pickAndImportBook(): Promise<Book | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...SUPPORTED_MIME_TYPES, '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const format = detectFormat(asset.name, asset.mimeType);
  if (!format) {
    throw new UnsupportedFormatError(asset.name);
  }

  const booksDir = ensureBooksDirectory();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const destFileName = `${id}.${format}`;
  const sourceFile = new File(asset.uri);
  const destFile = new File(booksDir, destFileName);

  await sourceFile.copy(destFile, { overwrite: true });

  const book: Book = {
    id,
    title: titleFromFileName(asset.name),
    author: undefined,
    format,
    fileUri: destFile.uri,
    fileName: asset.name,
    fileSize: asset.size ?? destFile.size ?? 0,
    addedAt: Date.now(),
    progress: 0,
    lastLocation: undefined,
    totalLocations: undefined,
    bookmarks: [],
    highlights: [],
  };

  return book;
}
