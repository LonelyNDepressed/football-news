export interface TxtPage {
  start: number;
  end: number;
  text: string;
}

/**
 * Greedily packs `text` into pages of roughly `charsPerPage` characters,
 * preferring to break on paragraph or word boundaries so lines never split
 * mid-word. This is a heuristic (no real text-layout measurement), same
 * trade-off most lightweight plain-text readers make.
 */
export function paginateText(text: string, charsPerPage: number): TxtPage[] {
  const len = text.length;
  if (len === 0) return [{ start: 0, end: 0, text: '' }];
  const pages: TxtPage[] = [];
  let pos = 0;
  const safeCharsPerPage = Math.max(200, charsPerPage);

  while (pos < len) {
    let end = Math.min(len, pos + safeCharsPerPage);
    if (end < len) {
      const windowEnd = Math.min(len, end + 200);
      const window = text.slice(pos, windowEnd);
      const relEnd = end - pos;
      let breakAt = -1;

      const paraIdx = window.lastIndexOf('\n\n', relEnd);
      if (paraIdx > relEnd * 0.5) breakAt = paraIdx + 2;

      if (breakAt === -1) {
        const newlineIdx = window.lastIndexOf('\n', relEnd);
        if (newlineIdx > relEnd * 0.5) breakAt = newlineIdx + 1;
      }

      if (breakAt === -1) {
        const spaceIdx = window.lastIndexOf(' ', relEnd);
        if (spaceIdx > 0) breakAt = spaceIdx + 1;
      }

      if (breakAt > 0) end = pos + breakAt;
    }
    pages.push({ start: pos, end, text: text.slice(pos, end) });
    pos = end;
  }

  return pages;
}

export function estimateCharsPerPage(
  width: number,
  height: number,
  fontSize: number,
  lineHeight: number,
  margin: number
): number {
  const areaWidth = Math.max(100, width - margin * 2);
  const areaHeight = Math.max(100, height - margin * 2);
  const avgCharWidth = fontSize * 0.55;
  const lineHeightPx = fontSize * lineHeight;
  const charsPerLine = Math.max(10, Math.floor(areaWidth / avgCharWidth));
  const linesPerPage = Math.max(5, Math.floor(areaHeight / lineHeightPx));
  return charsPerLine * linesPerPage;
}

export function pageIndexForOffset(pages: TxtPage[], offset: number): number {
  for (let i = 0; i < pages.length; i++) {
    if (offset >= pages[i].start && offset < pages[i].end) return i;
  }
  return offset <= 0 ? 0 : pages.length - 1;
}
