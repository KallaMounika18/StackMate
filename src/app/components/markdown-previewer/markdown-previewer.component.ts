import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-markdown-previewer',
  templateUrl: './markdown-previewer.component.html',
  styleUrls: ['./markdown-previewer.component.scss']
})
export class MarkdownPreviewerComponent {
  @ViewChild('markdownEditor', { static: false }) markdownEditor!: ElementRef<HTMLTextAreaElement>;

  markdownContent: string = `# Welcome to StackMate Markdown Previewer!

This is a **powerful** and *easy-to-use* markdown editor with live preview.

## Features
- 📊 Multiple view modes (Split, Edit-only, Preview-only)
- 📝 Real-time preview
- 📋 Quick template insertion
- 📊 Word and character count
- 🎨 Clean, developer-friendly interface

## Quick Start
1. Type your markdown in the editor
2. See live preview on the right
3. Use toolbar buttons for quick formatting
4. Switch between view modes as needed

### Code Example
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

### Lists
- Item 1
- Item 2
  - Nested item
  - Another nested item

### Links and Images
[Visit StackMate](https://stackmate.dev)

> This is a blockquote. Perfect for highlighting important information!

---

**Happy coding!** 🚀`;

  viewMode: 'split' | 'edit' | 'preview' = 'split';

  setViewMode(mode: 'split' | 'edit' | 'preview') {
    this.viewMode = mode;
  }

  getWordCount(): number {
    if (!this.markdownContent) return 0;
    return this.markdownContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  getCharCount(): number {
    return this.markdownContent.length || 0;
  }

  insertTemplate(type: string) {
    const templates = {
      heading: '# Heading\n\n',
      list: '- List item 1\n- List item 2\n- List item 3\n\n',
      link: '[Link text](https://example.com)\n\n',
      code: '```javascript\n// Your code here\nconsole.log("Hello World!");\n```\n\n',
      table: '| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Data     | Data     |\n| Row 2    | Data     | Data     |\n\n',
      quote: '> This is a blockquote\n> It can span multiple lines\n\n'
    };

    const template = templates[type as keyof typeof templates];
    if (template) {
      this.insertAtCursor(template);
    }
  }

  private insertAtCursor(text: string) {
    const editor = this.markdownEditor.nativeElement;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const currentContent = this.markdownContent || '';

    this.markdownContent = 
      currentContent.substring(0, start) + 
      text + 
      currentContent.substring(end);

    // Set cursor position after inserted text
    setTimeout(() => {
      editor.selectionStart = editor.selectionEnd = start + text.length;
      editor.focus();
    }, 0);
  }

  clearContent() {
    if (confirm('Are you sure you want to clear all content?')) {
      this.markdownContent = '';
      this.markdownEditor.nativeElement.focus();
    }
  }

  // Additional utility methods
  exportAsMarkdown() {
    const blob = new Blob([this.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importMarkdown(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    if (file && file.type === 'text/markdown') {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = (e.target as FileReader).result;
        this.markdownContent = typeof result === 'string' ? result : '';
      };

      reader.readAsText(file);
    }
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.markdownContent).then(() => {
      // You could add a toast notification here
      console.log('Markdown copied to clipboard!');
    });
  }
}