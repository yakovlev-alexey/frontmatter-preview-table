# Frontmatter Preview Table

VS Code / Cursor extension that renders YAML frontmatter as a styled table at the top of the built-in Markdown preview. The raw `---` block is hidden; metadata is shown in a single-column layout that follows the editor theme.

## Features

- YAML frontmatter only (`--- ... ---` at the start of the file)
- One row per field: `key: value`
- Arrays joined with `; `
- Nested objects as separate rows with dot notation and 2-space indent per level
- Theme-aware styling via VS Code CSS variables (`--vscode-*`)
- Fail-silent: invalid or missing frontmatter leaves the normal preview unchanged

## Example

**Markdown source:**

```markdown
---
title: Hello
tags: [docs, preview]
author:
  name: John
  email: john@example.com
---

# Content starts here
```

**Preview:** a styled metadata table appears above the heading; the YAML block is not shown.

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
pnpm install
pnpm build
pnpm test
```

### Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Bundle extension to `dist/extension.js` |
| `pnpm watch` | Rebuild on file changes |
| `pnpm test` | Run unit tests (vitest) |
| `pnpm package` | Create `.vsix` package |

### Run locally

1. Open this folder in VS Code or Cursor.
2. Run **Run Extension** from the Run and Debug panel (F5).
3. In the Extension Development Host, open a `.md` file with YAML frontmatter and open Markdown Preview.

## Project layout

```
src/
  extension.ts          # activate → extendMarkdownIt
  frontmatterPlugin.ts  # markdown-it block ruler
  parseYaml.ts          # YAML parsing
  renderTable.ts        # HTML table rendering
media/
  frontmatter.css       # preview styles
test/                   # vitest unit tests
```

## License

See repository license file if present.
