import { Component } from '@angular/core';

@Component({
  selector: 'app-markdown-previewer',
  templateUrl: './markdown-previewer.component.html',
  styleUrls: ['./markdown-previewer.component.scss']
})
export class MarkdownPreviewerComponent {
  markdownContent = `# Welcome to StackMate Markdown Previewer!

This is a **powerful** and *easy-to-use* markdown editor with live preview.

## Features
- Multiple view modes
- Real-time preview
- Template insertion
- Word and character count

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`
`;

  viewMode: 'split' | 'edit' | 'preview' = 'split';
  splitRatio = 50;
  isFullscreen = false;
  statusMessage = 'Ready';

  setViewMode(mode: 'split' | 'edit' | 'preview'): void {
    this.viewMode = mode;
  }

  getWordCount(): number {
    if (!this.markdownContent.trim()) {
      return 0;
    }
    return this.markdownContent.trim().split(/\s+/).length;
  }

  getCharCount(): number {
    return this.markdownContent.length || 0;
  }

  updateSplitRatio(value: string): void {
    const next = parseInt(value, 10);
    this.splitRatio = isNaN(next) ? 50 : Math.min(70, Math.max(30, next));
  }

  insertTemplate(type: string): void {
    const templates: { [key: string]: string } = {
      heading: '# Heading\n\n',
      list: '- List item 1\n- List item 2\n- List item 3\n\n',
      link: '[Link text](https://example.com)\n\n',
      code: '```typescript\nconsole.log("Hello StackMate");\n```\n\n'
    };

    this.markdownContent += templates[type] || '';
  }

  clearContent(): void {
    this.markdownContent = '';
    this.statusMessage = 'Editor cleared.';
  }

  copyMarkdown(): void {
    navigator.clipboard.writeText(this.markdownContent);
    this.statusMessage = 'Markdown copied.';
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
  }
}
