// pastebin.component.ts
import { Component, OnInit, HostListener } from '@angular/core';

interface Paste {
  id: number;
  text: string;
  timestamp: string;
  lines: number;
  language?: string;
}

@Component({
  selector: 'app-pastebin',
  templateUrl: './pastebin.component.html',
  styleUrls: ['./pastebin.component.scss']
})
export class PastebinComponent implements OnInit {
  pasteText: string = '';
  pastes: Paste[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadPastes();
  }

  addPaste(): void {
    if (!this.pasteText.trim()) {
      return;
    }

    const paste: Paste = {
      id: Date.now(),
      text: this.pasteText.trim(),
      timestamp: new Date().toLocaleString(),
      lines: this.pasteText.split('\n').length,
      language: this.detectLanguage(this.pasteText)
    };

    this.pastes.unshift(paste);
    this.savePastes();
    this.clearInput();
  }

  deletePaste(id: number): void {
    this.pastes = this.pastes.filter(paste => paste.id !== id);
    this.savePastes();
  }

  clearInput(): void {
    this.pasteText = '';
  }

  getTotalLines(): number {
    return this.pastes.reduce((total, paste) => total + paste.lines, 0);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard!');
    });
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common patterns
    if (text.includes('function') && text.includes('{')) return 'JavaScript';
    if (text.includes('def ') || text.includes('import ')) return 'Python';
    if (text.includes('<') && text.includes('>')) return 'HTML/XML';
    if (text.includes('class ') && text.includes('public')) return 'Java/C#';
    if (text.includes('#include') || text.includes('int main')) return 'C/C++';
    if (text.includes('SELECT') || text.includes('FROM')) return 'SQL';
    return 'Text';
  }

  private savePastes(): void {
    localStorage.setItem('devnotes_pastes', JSON.stringify(this.pastes));
  }

  private loadPastes(): void {
    const saved = localStorage.getItem('devnotes_pastes');
    if (saved) {
      this.pastes = JSON.parse(saved);
    }
  }

  trackByPasteId(index: number, paste: Paste): number {
    return paste.id;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      this.addPaste();
    }
  }
}