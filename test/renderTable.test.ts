import { describe, expect, it } from 'vitest';
import { renderFrontmatterTable } from '../src/renderTable';

describe('renderFrontmatterTable', () => {
  it('returns null for empty object', () => {
    expect(renderFrontmatterTable({})).toBeNull();
  });

  it('renders primitives', () => {
    const html = renderFrontmatterTable({
      title: 'Hello',
      published: true,
      count: 42,
    });
    expect(html).toContain('class="fm-key">title</span>');
    expect(html).toContain('class="fm-value">Hello</span>');
    expect(html).toContain('class="fm-value">true</span>');
    expect(html).toContain('class="fm-value">42</span>');
  });

  it('joins arrays with semicolon and space', () => {
    const html = renderFrontmatterTable({ tags: ['a', 'b', 'c'] });
    expect(html).toContain('class="fm-value">a; b; c</span>');
  });

  it('renders nested objects with dot notation and indent', () => {
    const html = renderFrontmatterTable({
      author: { name: 'John', email: 'john@example.com' },
    });
    expect(html).toContain('class="fm-key">  author.name</span>');
    expect(html).toContain('class="fm-value">John</span>');
    expect(html).toContain('class="fm-key">  author.email</span>');
    expect(html).toContain('class="fm-value">john@example.com</span>');
  });

  it('renders null and undefined as em dash', () => {
    const html = renderFrontmatterTable({ empty: null, missing: undefined });
    expect(html).toContain('class="fm-value">\u2014</span>');
  });

  it('renders nested array elements as JSON', () => {
    const html = renderFrontmatterTable({ items: [{ id: 1 }, 'plain'] });
    expect(html).toContain('{&quot;id&quot;:1}; plain</span>');
  });

  it('preserves key order', () => {
    const html = renderFrontmatterTable({ z: 1, a: 2, m: 3 });
    const zPos = html!.indexOf('fm-key">z</span>');
    const aPos = html!.indexOf('fm-key">a</span>');
    const mPos = html!.indexOf('fm-key">m</span>');
    expect(zPos).toBeLessThan(aPos);
    expect(aPos).toBeLessThan(mPos);
  });

  it('escapes HTML in values', () => {
    const html = renderFrontmatterTable({ title: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('wraps output in frontmatter-table container', () => {
    const html = renderFrontmatterTable({ title: 'Hello' });
    expect(html).toContain('class="frontmatter-table"');
    expect(html).toContain('aria-label="Document metadata"');
  });
});
