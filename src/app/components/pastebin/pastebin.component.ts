import { Component, HostListener, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { v4 as uuidv4 } from 'uuid';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-markdown';

interface Paste {
  id: string;
  title: string;
  text: string;
  timestamp: string;
  lines: number;
  language: string;
}

@Component({
  selector: 'app-pastebin',
  templateUrl: './pastebin.component.html',
  styleUrls: ['./pastebin.component.scss']
})
export class PastebinComponent implements OnInit {
  private readonly STORAGE_KEY = 'stackmate_pastes';

  pasteTitle = '';
  pasteText = '';
  selectedLanguage = 'auto';
  detectedLanguage = 'plaintext';
  statusMessage = 'Idle';
  pastes: Paste[] = [];
  baseUrl: string = window.location.origin;

  readonly languageOptions = [
    { label: 'Auto Detect', value: 'auto' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'JSON', value: 'json' },
    { label: 'HTML', value: 'markup' },
    { label: 'CSS', value: 'css' },
    { label: 'SQL', value: 'sql' },
    { label: 'Bash', value: 'bash' },
    { label: 'Python', value: 'python' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'Plain Text', value: 'plaintext' }
  ];

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadPastes();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.addPaste();
    }
  }

  onEditorChange(value: string): void {
    this.pasteText = value;
  }

  onEditorLanguageDetected(language: string): void {
    this.detectedLanguage = language || 'plaintext';
  }

  addPaste(): void {
    if (!this.pasteText.trim()) {
      return;
    }

    const id = uuidv4();
    const effectiveLanguage = this.selectedLanguage === 'auto' ? this.detectedLanguage : this.selectedLanguage;
    const paste: Paste = {
      id,
      title: this.pasteTitle.trim() || 'Untitled snippet',
      text: this.pasteText.trim(),
      timestamp: new Date().toLocaleString(),
      lines: this.pasteText.trim().split('\n').length,
      language: effectiveLanguage || 'plaintext'
    };

    this.pastes.unshift(paste);
    this.savePastes();
    this.clearInput();
    this.statusMessage = 'Snippet saved locally.';
  }

  deletePaste(id: string): void {
    this.pastes = this.pastes.filter((paste) => paste.id !== id);
    this.savePastes();
  }

  clearInput(): void {
    this.pasteTitle = '';
    this.pasteText = '';
    this.detectedLanguage = 'plaintext';
  }

  getDraftLineCount(): number {
    return this.pasteText ? this.pasteText.split('\n').length : 0;
  }

  getTotalLines(): number {
    return this.pastes.reduce((total, paste) => total + paste.lines, 0);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
    this.statusMessage = 'Snippet copied.';
  }

  copyShareLink(id: string): void {
    const link = this.getShareLink(id);
    navigator.clipboard.writeText(link);
    this.statusMessage = 'Shareable link copied.';
  }

  getShareLink(id: string): string {
    return this.baseUrl + '/share/' + id;
  }

  getHighlightedCode(paste: Paste): SafeHtml {
    const language = this.getPrismLanguage(paste.language);
    const grammar = Prism.languages[language] || Prism.languages.markup;
    const highlighted = Prism.highlight(paste.text, grammar, language);
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  trackPaste(index: number, paste: Paste): string {
    return paste.id;
  }

  private getPrismLanguage(language: string): string {
    const normalized = (language || 'plaintext').toLowerCase();
    const supported: { [key: string]: string } = {
      bash: 'bash',
      css: 'css',
      html: 'markup',
      javascript: 'javascript',
      json: 'json',
      markdown: 'markdown',
      markup: 'markup',
      plaintext: 'markup',
      python: 'python',
      sql: 'sql',
      typescript: 'typescript'
    };

    return supported[normalized] || 'markup';
  }

  private savePastes(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pastes));
  }

  private loadPastes(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.pastes = JSON.parse(saved);
    }
  }
}
