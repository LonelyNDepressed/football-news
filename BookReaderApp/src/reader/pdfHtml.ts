import { PDF_MIN_MJS } from '../vendor/pdfBundle';
import { PDF_WORKER_MIN_MJS } from '../vendor/pdfWorkerBundle';

function safe(code: string): string {
  return code.split('</script>').join('<\\/script>');
}

/**
 * Static HTML shell for the PDF reader. pdf.js ships as ES modules only, so
 * both the library and its worker are inlined as Blob text and loaded via
 * dynamic `import()` / a module Worker at runtime instead of via <script>
 * tags, which keeps everything working fully offline inside the WebView.
 */
export function buildPdfReaderHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #525659; }
  #page-container {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; justify-content: center;
    transform-origin: center center;
  }
  #page-canvas { background: #fff; box-shadow: 0 0 8px rgba(0,0,0,0.4); }
  .theme-dark #page-canvas, .theme-black #page-canvas { filter: invert(1) hue-rotate(180deg); }
  .theme-sepia #page-canvas { filter: sepia(0.4); }
  #tap-left, #tap-right, #tap-center { position: fixed; top: 0; bottom: 0; z-index: 10; }
  #tap-left { left: 0; width: 20%; }
  #tap-right { right: 0; width: 20%; }
  #tap-center { left: 20%; width: 60%; }
</style>
</head>
<body>
<div id="page-container"><canvas id="page-canvas"></canvas></div>
<div id="tap-left"></div>
<div id="tap-center"></div>
<div id="tap-right"></div>
<script type="module">
var PDF_SRC = ${JSON.stringify(safe(PDF_MIN_MJS))};
var WORKER_SRC = ${JSON.stringify(safe(PDF_WORKER_MIN_MJS))};

function post(type, payload) {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
}

function b64ToUint8Array(base64) {
  var binary = atob(base64);
  var len = binary.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

(async function () {
  try {
    var pdfjsBlobUrl = URL.createObjectURL(new Blob([PDF_SRC], { type: 'text/javascript' }));
    var pdfjsLib = await import(pdfjsBlobUrl);
    var workerBlobUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerBlobUrl;

    var pdfDoc = null;
    var currentPage = 1;
    var totalPages = 0;
    var scale = 1;
    var fitScale = 1;
    var currentSettings = null;
    var container = document.getElementById('page-container');
    var canvas = document.getElementById('page-canvas');
    var ctx = canvas.getContext('2d');
    var renderTask = null;

    function applyTheme(settings) {
      currentSettings = settings;
      document.body.className = 'theme-' + settings.theme;
      var bgByTheme = { light: '#525659', sepia: '#6b6155', dark: '#111', black: '#000' };
      document.body.style.background = bgByTheme[settings.theme] || '#525659';
    }

    async function renderPage(pageNum) {
      if (!pdfDoc) return;
      pageNum = Math.max(1, Math.min(totalPages, pageNum));
      currentPage = pageNum;
      var page = await pdfDoc.getPage(pageNum);
      var viewportBase = page.getViewport({ scale: 1 });
      fitScale = (window.innerWidth / viewportBase.width);
      var dpr = window.devicePixelRatio || 1;
      var viewport = page.getViewport({ scale: fitScale * scale * dpr });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = (viewport.width / dpr) + 'px';
      canvas.style.height = (viewport.height / dpr) + 'px';
      if (renderTask) { try { renderTask.cancel(); } catch (e) {} }
      renderTask = page.render({ canvasContext: ctx, viewport: viewport });
      try {
        await renderTask.promise;
      } catch (e) {
        return;
      }
      post('relocated', {
        page: currentPage,
        totalPages: totalPages,
        percentage: totalPages > 1 ? (currentPage - 1) / (totalPages - 1) : 0
      });
    }

    async function flattenOutline(items, depth) {
      var out = [];
      for (var i = 0; i < (items || []).length; i++) {
        var item = items[i];
        var pageIndex = null;
        try {
          var dest = item.dest;
          if (typeof dest === 'string') dest = await pdfDoc.getDestination(dest);
          if (dest && dest[0] != null) pageIndex = await pdfDoc.getPageIndex(dest[0]);
        } catch (e) {}
        out.push({ label: item.title || '', href: pageIndex != null ? String(pageIndex + 1) : '', depth: depth });
        if (item.items && item.items.length) {
          var nested = await flattenOutline(item.items, depth + 1);
          out = out.concat(nested);
        }
      }
      return out;
    }

    async function loadPdf(base64, initialPage, settings) {
      applyTheme(settings);
      var data = b64ToUint8Array(base64);
      var loadingTask = pdfjsLib.getDocument({ data: data });
      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;
      post('docLoaded', { totalPages: totalPages });
      try {
        var outline = await pdfDoc.getOutline();
        if (outline && outline.length) {
          var flat = await flattenOutline(outline, 0);
          post('toc', { items: flat });
        }
      } catch (e) {}
      await renderPage(initialPage && initialPage > 0 ? initialPage : 1);
    }

    document.getElementById('tap-left').addEventListener('click', function () {
      if (currentPage > 1) renderPage(currentPage - 1);
    });
    document.getElementById('tap-right').addEventListener('click', function () {
      if (currentPage < totalPages) renderPage(currentPage + 1);
    });
    document.getElementById('tap-center').addEventListener('click', function () {
      post('toggleControls', {});
    });

    // Basic two-finger pinch to zoom the current page.
    var pinchStartDist = null;
    var pinchStartScale = 1;
    function dist(touches) {
      var dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    container.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        pinchStartDist = dist(e.touches);
        pinchStartScale = scale;
      }
    }, { passive: true });
    container.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && pinchStartDist) {
        var newDist = dist(e.touches);
        var next = pinchStartScale * (newDist / pinchStartDist);
        scale = Math.max(1, Math.min(3, next));
        renderPage(currentPage);
      }
    }, { passive: true });
    container.addEventListener('touchend', function (e) {
      if (e.touches.length < 2) pinchStartDist = null;
    }, { passive: true });

    function handleBridgeMessage(evt) {
      var msg;
      try { msg = JSON.parse(evt.data); } catch (e) { return; }
      switch (msg.type) {
        case 'load':
          loadPdf(msg.base64, msg.initialPage, msg.settings)['catch'](function (err) {
            post('error', { message: String(err && err.message ? err.message : err) });
          });
          break;
        case 'applySettings':
          applyTheme(msg.settings);
          break;
        case 'next':
          if (currentPage < totalPages) renderPage(currentPage + 1);
          break;
        case 'prev':
          if (currentPage > 1) renderPage(currentPage - 1);
          break;
        case 'goTo':
          var target = parseInt(msg.target, 10);
          if (!isNaN(target)) renderPage(target);
          break;
        case 'search':
          (async function () {
            var query = (msg.query || '').toLowerCase();
            var results = [];
            var limit = Math.min(totalPages, 300);
            for (var p = 1; p <= limit && results.length < 40; p++) {
              try {
                var page = await pdfDoc.getPage(p);
                var content = await page.getTextContent();
                var text = content.items.map(function (it) { return it.str; }).join(' ');
                var idx = text.toLowerCase().indexOf(query);
                if (idx >= 0) {
                  var start = Math.max(0, idx - 40);
                  var excerpt = text.substring(start, idx + query.length + 40);
                  results.push({ cfi: String(p), excerpt: excerpt });
                }
              } catch (e) {}
            }
            post('searchResults', { results: results, query: msg.query });
          })();
          break;
        default:
          break;
      }
    }
    document.addEventListener('message', handleBridgeMessage);
    window.addEventListener('message', handleBridgeMessage);

    post('ready', {});
  } catch (err) {
    post('error', { message: 'init failed: ' + String(err && err.message ? err.message : err) });
  }
})();
</script>
</body>
</html>`;
}
