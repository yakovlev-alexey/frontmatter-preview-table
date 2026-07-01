import { parse } from 'yaml';

export function parseFrontmatterYaml(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return {};
  }

  try {
    const result = parse(trimmed);
    if (result === null || typeof result !== 'object' || Array.isArray(result)) {
      return null;
    }
    return result as Record<string, unknown>;
  } catch {
    return null;
  }
}
