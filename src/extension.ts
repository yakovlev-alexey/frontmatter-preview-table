import * as vscode from 'vscode';
import type MarkdownIt from 'markdown-it';
import { frontmatterPlugin } from './frontmatterPlugin';

export function activate(_context: vscode.ExtensionContext) {
  return {
    extendMarkdownIt(md: MarkdownIt) {
      return md.use(frontmatterPlugin);
    },
  };
}

export function deactivate() {}
