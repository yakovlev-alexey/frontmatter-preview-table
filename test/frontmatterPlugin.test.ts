import MarkdownIt from 'markdown-it';
import { describe, expect, it } from 'vitest';
import {
  extractFrontmatterBlock,
  frontmatterPlugin,
  processFrontmatter,
} from '../src/frontmatterPlugin';

function createMarkdownIt(): MarkdownIt {
  return new MarkdownIt({ html: true }).use(frontmatterPlugin);
}

describe('extractFrontmatterBlock', () => {
  it('extracts yaml between fences', () => {
    const block = extractFrontmatterBlock('---\ntitle: Hello\n---\n# Content');
    expect(block).toEqual({
      yamlText: 'title: Hello',
      startLine: 0,
      endLine: 2,
    });
  });

  it('returns null when no opening fence at start', () => {
    expect(extractFrontmatterBlock('# No frontmatter')).toBeNull();
    expect(extractFrontmatterBlock('\n---\ntitle: x\n---')).toBeNull();
  });

  it('returns null when closing fence is missing', () => {
    expect(extractFrontmatterBlock('---\ntitle: Hello')).toBeNull();
  });

  it('handles empty frontmatter', () => {
    const block = extractFrontmatterBlock('---\n---\n# Content');
    expect(block).toEqual({
      yamlText: '',
      startLine: 0,
      endLine: 1,
    });
  });
});

describe('processFrontmatter', () => {
  it('returns table html and stripped body for valid frontmatter', () => {
    const result = processFrontmatter('---\ntitle: Hello\n---\n# Content');
    expect(result.consumed).toBe(true);
    expect(result.body).toBe('# Content');
    expect(result.tableHtml).toContain('frontmatter-table');
    expect(result.tableHtml).toContain('Hello');
  });

  it('does not consume invalid yaml', () => {
    const src = '---\ntitle: [broken\n---\n# Content';
    const result = processFrontmatter(src);
    expect(result.consumed).toBe(false);
    expect(result.body).toBe(src);
    expect(result.tableHtml).toBeNull();
  });

  it('consumes empty frontmatter without table', () => {
    const result = processFrontmatter('---\n---\n# Content');
    expect(result.consumed).toBe(true);
    expect(result.body).toBe('# Content');
    expect(result.tableHtml).toBeNull();
  });
});

describe('frontmatterPlugin integration', () => {
  it('renders table and hides raw yaml for valid frontmatter', () => {
    const md = createMarkdownIt();
    const html = md.render('---\ntitle: Hello\n---\n# Heading');
    expect(html).toContain('frontmatter-table');
    expect(html).toContain('Hello');
    expect(html).not.toContain('title: Hello');
    expect(html).toContain('<h1>Heading</h1>');
  });

  it('falls back to normal preview for invalid yaml', () => {
    const md = createMarkdownIt();
    const html = md.render('---\ntitle: [broken\n---\n# Heading');
    expect(html).not.toContain('frontmatter-table');
    expect(html).toContain('<hr>');
    expect(html).toContain('<h1>Heading</h1>');
  });

  it('hides empty frontmatter without rendering table', () => {
    const md = createMarkdownIt();
    const html = md.render('---\n---\n# Heading');
    expect(html).not.toContain('frontmatter-table');
    expect(html).not.toContain('<hr>');
    expect(html).toContain('<h1>Heading</h1>');
  });

  it('ignores frontmatter not at file start', () => {
    const md = createMarkdownIt();
    const html = md.render('# Intro\n\n---\ntitle: Hello\n---\n\nBody');
    expect(html).not.toContain('frontmatter-table');
    expect(html).toContain('title: Hello');
  });

  it('renders nested frontmatter fields', () => {
    const md = createMarkdownIt();
    const html = md.render(`---
author:
  name: John
  email: john@example.com
---
# Post`);
    expect(html).toContain('author.name');
    expect(html).toContain('John');
    expect(html).not.toContain('name: John');
  });
});
