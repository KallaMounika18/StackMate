import { Component, OnInit, HostListener } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

interface Paste {
  id: string;
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
  baseUrl: string = window.location.origin;

  ngOnInit(): void {
    this.loadPastes();
  }

  addPaste(): void {
    if (!this.pasteText.trim()) return;

    const id = uuidv4();
    const paste: Paste = {
      id,
      text: this.pasteText.trim(),
      timestamp: new Date().toLocaleString(),
      lines: this.pasteText.trim().split('\n').length,
      language: this.detectLanguage(this.pasteText)
    };

    this.pastes.unshift(paste);
    this.savePastes();
    this.clearInput();
  }

  deletePaste(id: string): void {
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
    navigator.clipboard.writeText(text);
  }

  copyShareLink(id: string): void {
    const link = `${this.baseUrl}/share/${id}`;
    navigator.clipboard.writeText(link);
    alert('🔗 Shareable link copied!');
  }

  private detectLanguage(text: string): string {
    if (text.includes('function')) return 'JavaScript';
    if (text.includes('def ') || text.includes('import ')) return 'Python';
    if (text.includes('<') && text.includes('>')) return 'HTML/XML';
    if (text.includes('class ') && text.includes('public')) return 'Java/C#';
    if (text.includes('#include') || text.includes('int main')) return 'C/C++';
    if (text.includes('SELECT') || text.includes('FROM')) return 'SQL';
    return 'Text';
  }

  private savePastes(): void {
    localStorage.setItem('stackmate_pastes', JSON.stringify(this.pastes));
  }

  private loadPastes(): void {
    const saved = localStorage.getItem('stackmate_pastes');
    if (saved) this.pastes = JSON.parse(saved);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') this.addPaste();
  }
}
