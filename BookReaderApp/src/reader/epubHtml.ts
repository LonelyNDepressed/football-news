import { JSZIP_MIN_JS } from '../vendor/jszipBundle';
import { EPUB_MIN_JS } from '../vendor/epubBundle';

function safe(code: string): string {
  return code.split('</script>').join('<\\/script>');
}

/**
 * Static HTML shell for the EPUB reader. All book-specific data (the file
 * itself, resume location, reading settings) is sent afterwards over the
 * postMessage bridge rather than baked into this string, so the same shell
 * can be reused across books and settings changes without reloading the
 * WebView.
 */
export function buildEpubReaderHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #ffffff; overscroll-behavior: none; }
  #viewer { width: 100vw; height: 100vh; }
  #tap-left, #tap-right, #tap-center {
    position: fixed; top: 0; bottom: 0; z-index: 10;
  }
  #tap-left { left: 0; width: 20%; }
  #tap-right { right: 0; width: 20%; }
  #tap-center { left: 20%; width: 60%; }
</style>
</head>
<body>
<div id="viewer"></div>
<div id="tap-left"></div>
<div id="tap-center"></div>
<div id="tap-right"></div>
<script>${safe(JSZIP_MIN_JS)}</script>
<script>${safe(EPUB_MIN_JS)}</script>
<script>
(function () {
  var book = null;
  var rendition = null;
  var currentSettings = null;
  var pendingHighlights = [];
  var locationsReady = false;

  function post(type, payload) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
  }

  function b64ToArrayBuffer(base64) {
    var binary = atob(base64);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  var THEME_CSS = {
    light: { background: '#ffffff', color: '#1a1a1a', linkColor: '#2d6cdf' },
    sepia: { background: '#f4ecd8', color: '#5b4636', linkColor: '#8a5a2b' },
    dark: { background: '#1e1e1e', color: '#d8d8d8', linkColor: '#6ea8fe' },
    black: { background: '#000000', color: '#b3b3b3', linkColor: '#6ea8fe' }
  };

  var FONT_STACKS = {
    serif: 'Georgia, "Times New Roman", serif',
    sans: '-apple-system, Roboto, Helvetica, Arial, sans-serif',
    monospace: '"Courier New", monospace'
  };

  function applySettings(settings) {
    currentSettings = settings;
    document.body.style.background = THEME_CSS[settings.theme].background;
    if (!rendition) return;
    rendition.themes.fontSize(settings.fontSize + 'px');
    var theme = THEME_CSS[settings.theme];
    rendition.themes.register('current', {
      'html': { background: theme.background + ' !important' },
      'body': {
        background: theme.background + ' !important',
        color: theme.color + ' !important',
        'font-family': FONT_STACKS[settings.fontFamily] + ' !important',
        'line-height': String(settings.lineHeight) + ' !important',
        padding: settings.margin + 'px !important'
      },
      'p, div, span, li': {
        color: theme.color + ' !important',
        'font-family': FONT_STACKS[settings.fontFamily] + ' !important'
      },
      'a, a *': { color: theme.linkColor + ' !important' }
    });
    rendition.themes.select('current');
  }

  function replayHighlights(highlights) {
    highlights.forEach(function (h) {
      try {
        rendition.annotations.highlight(h.cfiRange, {}, function () {}, '', { fill: h.color, 'fill-opacity': '0.35' });
      } catch (e) {}
    });
  }

  function flattenToc(items, depth) {
    var out = [];
    (items || []).forEach(function (item) {
      out.push({ label: item.label ? item.label.trim() : '', href: item.href, depth: depth });
      if (item.subitems && item.subitems.length) {
        out = out.concat(flattenToc(item.subitems, depth + 1));
      }
    });
    return out;
  }

  function loadBook(base64, initialLocation, settings, highlights) {
    var buffer = b64ToArrayBuffer(base64);
    book = ePub(buffer);
    rendition = book.renderTo('viewer', {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'none',
      allowScriptedContent: false
    });

    applySettings(settings);

    rendition.on('relocated', function (location) {
      var percentage = locationsReady ? book.locations.percentageFromCfi(location.start.cfi) : 0;
      post('relocated', {
        cfi: location.start.cfi,
        percentage: percentage,
        atStart: location.atStart,
        atEnd: location.atEnd
      });
    });

    rendition.on('selected', function (cfiRange, contents) {
      var text = '';
      try { text = contents.window.getSelection().toString(); } catch (e) {}
      if (text && text.trim().length > 0) {
        post('selection', { cfiRange: cfiRange, text: text.trim() });
      }
    });

    rendition.on('rendered', function () {
      pendingHighlights.forEach(function (h) {
        try { rendition.annotations.highlight(h.cfiRange, {}, function () {}, '', { fill: h.color, 'fill-opacity': '0.35' }); } catch (e) {}
      });
    });

    pendingHighlights = highlights || [];

    book.ready.then(function () {
      return book.loaded.metadata;
    }).then(function (meta) {
      post('metadata', { title: meta.title, author: meta.creator });
      return book.loaded.navigation;
    }).then(function (nav) {
      post('toc', { items: flattenToc(nav.toc, 0) });
      return book.locations.generate(1200);
    }).then(function () {
      locationsReady = true;
      post('locationsReady', { total: book.locations.length() });
      rendition.display(initialLocation || undefined).then(function() {
        var loc = rendition.currentLocation();
        if (loc && loc.start) {
          post('relocated', {
            cfi: loc.start.cfi,
            percentage: book.locations.percentageFromCfi(loc.start.cfi),
            atStart: loc.atStart,
            atEnd: loc.atEnd
          });
        }
      });
    })['catch'](function (err) {
      post('error', { message: String(err && err.message ? err.message : err) });
    });

    rendition.display(initialLocation || undefined)['catch'](function (err) {
      post('error', { message: 'displayFailed: ' + String(err) });
    });
  }

  document.getElementById('tap-left').addEventListener('click', function () {
    if (rendition) rendition.prev();
  });
  document.getElementById('tap-right').addEventListener('click', function () {
    if (rendition) rendition.next();
  });
  document.getElementById('tap-center').addEventListener('click', function () {
    post('toggleControls', {});
  });

  function handleBridgeMessage(evt) {
    var msg;
    try { msg = JSON.parse(evt.data); } catch (e) { return; }
    switch (msg.type) {
      case 'load':
        loadBook(msg.base64, msg.initialLocation, msg.settings, msg.highlights);
        break;
      case 'applySettings':
        applySettings(msg.settings);
        break;
      case 'next':
        if (rendition) rendition.next();
        break;
      case 'prev':
        if (rendition) rendition.prev();
        break;
      case 'goTo':
        if (rendition) {
          var target = msg.target;
          if (typeof target === 'number' && locationsReady) {
            target = book.locations.cfiFromPercentage(target);
          }
          rendition.display(target);
        }
        break;
      case 'addHighlight':
        if (rendition) {
          try {
            rendition.annotations.highlight(msg.cfiRange, {}, function () {}, '', { fill: msg.color, 'fill-opacity': '0.35' });
            post('highlightAdded', { cfiRange: msg.cfiRange });
          } catch (e) {
            post('error', { message: 'highlightFailed: ' + String(e) });
          }
        }
        break;
      case 'removeHighlight':
        if (rendition) {
          try { rendition.annotations.remove(msg.cfiRange, 'highlight'); } catch (e) {}
        }
        break;
      case 'search':
        if (!book) return;
        var query = msg.query;
        var results = [];
        var items = book.spine.spineItems.slice(0, 60);
        var i = 0;
        function next() {
          if (i >= items.length || results.length >= 40) {
            post('searchResults', { results: results, query: query });
            return;
          }
          var item = items[i++];
          item.load(book.load.bind(book)).then(function () {
            var found = item.find(query);
            results = results.concat(found.slice(0, 5));
            item.unload();
            next();
          })['catch'](function () { next(); });
        }
        next();
        break;
      default:
        break;
    }
  }
  document.addEventListener('message', handleBridgeMessage);
  window.addEventListener('message', handleBridgeMessage);

  post('ready', {});
})();
</script>
</body>
</html>`;
}
