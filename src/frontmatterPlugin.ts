import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';
import { parseFrontmatterYaml } from './parseYaml';
import { renderFrontmatterTable } from './renderTable';

const FENCE_MARKER = '---';
const FENCE_LENGTH = 3;

export interface FrontmatterBlock {
  yamlText: string;
  startLine: number;
  endLine: number;
}

export function extractFrontmatterBlock(src: string): FrontmatterBlock | null {
  const lines = src.split('\n');
  if (lines[0] !== FENCE_MARKER) {
    return null;
  }

  let closeLine = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FENCE_MARKER) {
      closeLine = i;
      break;
    }
  }

  if (closeLine === -1) {
    return null;
  }

  const yamlText = lines.slice(1, closeLine).join('\n');
  return { yamlText, startLine: 0, endLine: closeLine };
}

export function processFrontmatter(src: string): {
  tableHtml: string | null;
  body: string;
  consumed: boolean;
} {
  const block = extractFrontmatterBlock(src);
  if (!block) {
    return { tableHtml: null, body: src, consumed: false };
  }

  const parsed = parseFrontmatterYaml(block.yamlText);
  if (parsed === null) {
    return { tableHtml: null, body: src, consumed: false };
  }

  const lines = src.split('\n');
  const body = lines.slice(block.endLine + 1).join('\n');
  const tableHtml = renderFrontmatterTable(parsed);

  return { tableHtml, body, consumed: true };
}

function isClosingFence(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === FENCE_MARKER;
}

function frontmatterRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  if (startLine !== 0) {
    return false;
  }

  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];

  if (pos + FENCE_LENGTH > max) {
    return false;
  }

  if (state.src.slice(pos, pos + FENCE_LENGTH) !== FENCE_MARKER) {
    return false;
  }

  if (pos + FENCE_LENGTH < max && state.src.charCodeAt(pos + FENCE_LENGTH) !== 0x0a) {
    const rest = state.src.slice(pos + FENCE_LENGTH, max).trim();
    if (rest.length > 0) {
      return false;
    }
  }

  let nextLine = startLine + 1;
  let autoClosed = false;

  while (nextLine < endLine) {
    const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const lineMax = state.eMarks[nextLine];
    const line = state.src.slice(lineStart, lineMax);

    if (isClosingFence(line)) {
      autoClosed = true;
      break;
    }

    nextLine++;
  }

  if (!autoClosed) {
    return false;
  }

  const yamlStart = state.bMarks[startLine + 1];
  const yamlEnd = state.eMarks[nextLine - 1];
  const yamlText = nextLine > startLine + 1 ? state.src.slice(yamlStart, yamlEnd) : '';

  const parsed = parseFrontmatterYaml(yamlText);
  if (parsed === null) {
    return false;
  }

  if (silent) {
    return true;
  }

  const tableHtml = renderFrontmatterTable(parsed);
  if (tableHtml) {
    const token = state.push('html_block', '', 0);
    token.block = true;
    token.map = [startLine, nextLine + 1];
    token.content = tableHtml;
  }

  state.line = nextLine + 1;
  return true;
}

export function frontmatterPlugin(md: MarkdownIt): void {
  md.block.ruler.before('table', 'frontmatter', frontmatterRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
}
