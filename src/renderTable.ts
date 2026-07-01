import { escapeHtml } from './escapeHtml';

const EM_DASH = '\u2014';

interface TableRow {
  key: string;
  depth: number;
  value: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function formatArrayElement(item: unknown): string {
  if (item !== null && typeof item === 'object') {
    return JSON.stringify(item);
  }
  return String(item);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return EM_DASH;
  }
  if (Array.isArray(value)) {
    return value.map(formatArrayElement).join('; ');
  }
  return String(value);
}

function flattenToRows(
  data: Record<string, unknown>,
  prefix = '',
  depth = 0,
): TableRow[] {
  const rows: TableRow[] = [];

  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      rows.push(...flattenToRows(value, fullKey, depth + 1));
    } else {
      rows.push({ key: fullKey, depth, value: formatValue(value) });
    }
  }

  return rows;
}

function renderRow(row: TableRow): string {
  const indent = ' '.repeat(row.depth * 2);
  const keyText = escapeHtml(`${indent}${row.key}`);
  const valueText = escapeHtml(row.value);

  return `<tr><td><span class="fm-key">${keyText}</span>: <span class="fm-value">${valueText}</span></td></tr>`;
}

export function renderFrontmatterTable(data: Record<string, unknown>): string | null {
  if (Object.keys(data).length === 0) {
    return null;
  }

  const rows = flattenToRows(data);
  const body = rows.map(renderRow).join('\n');

  return `<div class="frontmatter-table" role="region" aria-label="Document metadata">
  <table>
    <tbody>
${body}
    </tbody>
  </table>
</div>`;
}
