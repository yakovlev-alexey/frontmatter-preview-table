import { describe, expect, it } from 'vitest';
import { parseFrontmatterYaml } from '../src/parseYaml';

describe('parseFrontmatterYaml', () => {
  it('parses a valid mapping', () => {
    const result = parseFrontmatterYaml('title: Hello\ntags: [a, b]');
    expect(result).toEqual({ title: 'Hello', tags: ['a', 'b'] });
  });

  it('returns empty object for whitespace-only input', () => {
    expect(parseFrontmatterYaml('')).toEqual({});
    expect(parseFrontmatterYaml('   \n  ')).toEqual({});
  });

  it('returns null for invalid YAML', () => {
    expect(parseFrontmatterYaml('title: [unclosed')).toBeNull();
    expect(parseFrontmatterYaml('title: "unclosed')).toBeNull();
  });

  it('returns null for scalar root', () => {
    expect(parseFrontmatterYaml('just a string')).toBeNull();
  });

  it('returns null for array root', () => {
    expect(parseFrontmatterYaml('- item\n- other')).toBeNull();
  });

  it('parses nested mapping', () => {
    const result = parseFrontmatterYaml('author:\n  name: John\n  email: john@example.com');
    expect(result).toEqual({
      author: { name: 'John', email: 'john@example.com' },
    });
  });
});
