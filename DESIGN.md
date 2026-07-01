# Frontmatter Preview Table — Design Spec

VS Code / Cursor extension that renders YAML frontmatter as a styled table at the top of Markdown preview.

**Extension ID:** `frontmatter-preview-table`  
**Display name:** Frontmatter Preview Table  
**Date:** 2026-06-30

---

## Problem

Markdown files with YAML frontmatter (Hugo/Jekyll posts, docs-as-code, Obsidian exports) show the raw `---` block in VS Code / Cursor preview. Metadata is hard to scan. This extension replaces the raw block with a readable table that follows the editor theme.

## Requirements (v1)

| Decision | Choice |
|---|---|
| Frontmatter format | YAML only (`--- ... ---`) |
| Scope | All `.md` files with valid frontmatter |
| Raw block in preview | Hidden |
| Table layout | Single column — `key: value` per row |
| Arrays | Joined with `; ` (semicolon + space) |
| Nested objects | Separate rows, key indented 2 spaces per nesting level |
| Styling | VS Code native — CSS variables (`--vscode-*`) |
| User settings | None in v1 (behavior is fixed) |

## Approach

**Selected: markdown-it plugin via `extendMarkdownIt`** (VS Code standard preview extension API).

Alternatives considered:

- **Custom Webview preview** — full UI control, but duplicates built-in preview and is heavy to maintain.
- **Preprocessor + HTML comment injection** — simpler to debug, but less idiomatic and fragile across API updates.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Markdown file (.md)                            │
│  ---                                            │
│  title: Hello                                   │
│  tags: [a, b]                                   │
│  ---                                            │
│  # Content...                                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  VS Code Markdown Preview Engine                │
│  └── markdown-it                                │
│       └── frontmatter plugin (core ruler)       │
│            1. detect + parse YAML frontmatter   │
│            2. remove raw --- block from stream    │
│            3. inject HTML table at top            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Preview Webview                                │
│  ├── HTML table (frontmatter)                   │
│  └── rendered markdown body                     │
│  styled via markdown.previewStyles              │
└─────────────────────────────────────────────────┘
```

### File structure

| File | Purpose |
|---|---|
| `package.json` | Contributions: `markdown.markdownItPlugins`, `markdown.previewStyles` |
| `src/extension.ts` | Activation, registers markdown-it plugin |
| `src/frontmatterPlugin.ts` | Core ruler: detect, parse, inject |
| `src/parseYaml.ts` | Parse YAML → plain object |
| `src/renderTable.ts` | Object → HTML table rows |
| `media/frontmatter.css` | Theme-aware styles |

### Activation

`onLanguage:markdown` — extension loads when working with `.md` files.

### Dependencies

- `yaml` (npm) for parsing
- `markdown-it` is provided by VS Code as a peer — do not bundle a separate copy

## Parsing and rendering

### Frontmatter detection

Valid frontmatter starts at line 1 with `---`, followed by YAML content, closed by a second `---`:

```yaml
---
title: Hello
tags: [a, b]
author:
  name: John
  email: john@example.com
---
```

If `---` is missing or YAML is invalid, the plugin does nothing and preview renders normally.

### Row transformation rules

Single column: **key: value** per row. Nesting is expressed via key indentation.

| YAML | Table row |
|---|---|
| `title: Hello` | `title: Hello` |
| `tags: [a, b, c]` | `tags: a; b; c` |
| `published: true` | `published: true` |
| `count: 42` | `count: 42` |
| `author.name: John` | `  author.name: John` (2 spaces per level) |
| `author.email: john@...` | `  author.email: john@...` |

**Arrays:** elements joined with `; `. Nested arrays or objects inside arrays are rendered as a JSON string in the value cell.

**Objects:** each field is a separate row; the key is indented `  ` (2 spaces) × nesting depth. Nested keys use dot notation in the key name (e.g. `author.name`).

**Null / empty values:** `key:` with no value or `key: null` → `key: —` (em dash).

**Field order:** preserved from source YAML.

### HTML structure

```html
<div class="frontmatter-table" role="region" aria-label="Document metadata">
  <table>
    <tbody>
      <tr>
        <td>
          <span class="fm-key">title</span>:
          <span class="fm-value">Hello</span>
        </td>
      </tr>
      <tr>
        <td>
          <span class="fm-key">  author.name</span>:
          <span class="fm-value">John</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

Key and value are separate spans for styling (key uses `--vscode-descriptionForeground`, value uses `--vscode-foreground`).

### Raw block removal

The core ruler intercepts source text **before** tokenization: strips the block from the first `---` through the closing `---` (inclusive), then injects the HTML block at the start of the token stream. Raw YAML is not visible in preview.

## Styles

CSS is contributed via `markdown.previewStyles` → `media/frontmatter.css`.

- Block background: `--vscode-editor-inactiveSelectionBackground` or `--vscode-textBlockQuote-background`
- Text: `--vscode-foreground`; keys: `--vscode-descriptionForeground`
- Border: `1px solid var(--vscode-panel-border)`
- Font: `var(--vscode-editor-font-family)`, size matches preview body
- Spacing: `padding: 12px 16px`, `margin-bottom: 16px`
- Table has no visible row borders — typography and light container background only
- Automatically follows light/dark theme via CSS variables

## Error handling

| Situation | Behavior |
|---|---|
| No frontmatter | Plugin does nothing; normal preview |
| Invalid YAML | Plugin does nothing; raw block remains (fallback) |
| Empty frontmatter (`---\n---`) | No table rendered; block is hidden |
| Frontmatter not at file start | Ignored |

**Principle: fail silently** — a normal preview is better than a broken one.

## Testing

| Level | Scope |
|---|---|
| Unit | `parseYaml.ts` — parsing edge cases |
| Unit | `renderTable.ts` — arrays, nesting, null, key order |
| Unit | `frontmatterPlugin.ts` — block detection and removal |
| Manual | Open `.md` with frontmatter → preview shows table, YAML hidden |

Unit tests use `vitest` or `node:test` — pure functions only, no VS Code API.

## Out of scope (v1)

- TOML / JSON frontmatter
- User-configurable settings (toggle, glob patterns, custom styles)
- Editor (non-preview) rendering
- Schema validation or typed frontmatter

These may be added in later versions if needed.
