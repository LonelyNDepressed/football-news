# Book Reader

A cross-platform (Android + iOS) e-reader app built with Expo/React Native.
Import your own EPUB, PDF, or TXT files and read them with a Kindle-like
experience: paginated reading, adjustable fonts/themes, table of contents,
bookmarks, highlights, in-book search, and automatic resume.

## Features

- **Import your own books** — pick EPUB, PDF, or TXT files from your device;
  they're copied into the app's private storage so they stay available even
  if you delete the original.
- **Library** — grid view of everything you've imported, with per-book
  reading progress.
- **Kindle-like reader**
  - Paginated, swipe/tap page turning (tap left/right edge to turn pages,
    tap the middle to show/hide controls)
  - Adjustable font size, font family, line spacing, margins
  - Four themes: light, sepia, dark, black (AMOLED)
  - Adjustable screen brightness/dimmer independent of system brightness
  - Table of contents drawer (EPUB navigation / PDF outline)
  - Bookmarks (star the current page/location)
  - Highlights with color picker (EPUB text selection)
  - In-book search with jump-to-result
  - Progress bar/slider and automatic resume from last position
  - Screen stays awake while a book is open, like Kindle
- Reading preferences are global defaults and persist across the app;
  library metadata, bookmarks, and highlights persist per book.

## Tech stack

- [Expo](https://expo.dev) (SDK 57) + React Native, TypeScript
- React Navigation (native stack)
- `epub.js` + `pdf.js`, both bundled fully offline and rendered inside a
  `react-native-webview`, so book rendering works with no network access
- `expo-file-system` (new `File`/`Directory` API) for on-device storage
- `expo-document-picker` for importing files
- `@react-native-async-storage/async-storage` for library/settings persistence

## Supported formats

| Format | Renderer | Notes |
|---|---|---|
| EPUB (`.epub`) | `epub.js` in a WebView | Full feature set: TOC, highlights, search, CFI-based bookmarks |
| PDF (`.pdf`) | `pdf.js` in a WebView | Outline/TOC, page-based bookmarks, text search, pinch-to-zoom |
| Plain text (`.txt`) | Native RN pagination | Simple heuristic pagination, bookmarks, search |

**Not supported:** `.mobi`/`.azw` (proprietary Amazon formats with no open
parser) and DRM-protected books of any format.

## Getting started

```bash
cd BookReaderApp
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (Android) or the Camera app (iOS)
to run it on a physical device, or press `a` / `i` in the terminal to launch
an Android emulator / iOS simulator if you have one configured.

## Building real Android/iOS binaries

This project runs in Expo's managed workflow, so production builds are done
with [EAS Build](https://docs.expo.dev/build/introduction/) — no Xcode or
Android Studio project needs to be checked in:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # produces an .apk/.aab
eas build --platform ios       # produces an .ipa (requires an Apple Developer account)
```

To install a development build on your own device instead of using Expo Go:

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

## Project structure

```
App.tsx                     App entry, providers, navigation
index.ts                    registerRootComponent entry point
src/
  types.ts                  Book/Bookmark/Highlight/ReadingSettings types
  context/                  LibraryContext (books) & SettingsContext (prefs)
  navigation/                React Navigation stack + route types
  screens/
    LibraryScreen.tsx        Book grid + import
    ReaderScreen.tsx          Picks the right reader by format
    EpubReaderView.tsx        epub.js WebView reader
    PdfReaderView.tsx         pdf.js WebView reader
    TxtReaderView.tsx         Native paginated text reader
    SettingsScreen.tsx        Global reading preference defaults
  components/                Shared UI: covers, progress bars, controls,
                              TOC/search/bookmark modals, settings sheet
  reader/
    epubHtml.ts               HTML+JS shell for the EPUB WebView
    pdfHtml.ts                 HTML+JS shell for the PDF WebView
    txtPaginate.ts             Plain-text pagination heuristic
  utils/fileImport.ts         Document picker + copy-into-sandbox logic
  vendor/                     Generated: jszip/epub.js/pdf.js bundled as
                              embeddable JS strings (see below)
```

### Regenerating the vendor bundles

`src/vendor/*.ts` are generated files containing the minified `jszip`,
`epubjs`, and `pdfjs-dist` browser bundles as JS string constants, so the
WebView readers work fully offline (no CDN, no network access needed on the
device). If you upgrade those packages, regenerate the bundles with:

```bash
node -e "
const fs = require('fs');
function embed(src, out, name) {
  fs.writeFileSync(out, 'export const ' + name + ': string = ' + JSON.stringify(fs.readFileSync(src, 'utf8')) + ';\n');
}
embed('node_modules/jszip/dist/jszip.min.js', 'src/vendor/jszipBundle.ts', 'JSZIP_MIN_JS');
embed('node_modules/epubjs/dist/epub.min.js', 'src/vendor/epubBundle.ts', 'EPUB_MIN_JS');
embed('node_modules/pdfjs-dist/build/pdf.min.mjs', 'src/vendor/pdfBundle.ts', 'PDF_MIN_MJS');
embed('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'src/vendor/pdfWorkerBundle.ts', 'PDF_WORKER_MIN_MJS');
"
```

## Known limitations / next steps

- Book covers in the library are generated placeholders (colored tile with
  initials), not extracted from the EPUB's actual cover image.
- No cloud sync/account system — everything is stored locally on-device.
- PDF text selection/highlighting isn't implemented (canvas-rendered pages);
  PDF supports bookmarks, TOC, search, and zoom instead.
- Plain-text pagination is heuristic (based on estimated characters-per-page)
  rather than exact text-layout measurement.
- This was built and type-checked in a sandboxed environment without an
  Android emulator or iOS simulator available, so it has been verified to
  install cleanly and produce valid Android/iOS JS bundles (`expo export
  --platform android|ios`) and pass `tsc --noEmit`, but hasn't been
  click-tested on a real device/simulator yet — please try it via Expo Go
  and file issues for anything that doesn't behave as expected.
