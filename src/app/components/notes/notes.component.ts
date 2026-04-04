import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

interface Note {
  id: number;
  title: string;
  text: string;
  tags: string[];
  timestamp: string;
  wordCount: number;
}

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit, OnDestroy {
  private readonly NOTES_KEY = 'stackmate_notes';
  private readonly DRAFT_KEY = 'stackmate_notes_draft';
  private saveTimer: number | null = null;

  noteTitle = '';
  noteText = '';
  noteTags = '';
  detectedLanguage = 'markdown';
  notes: Note[] = [];
  saveIndicator = 'Draft idle';
  isSaving = false;

  ngOnInit(): void {
    this.loadNotes();
    this.loadDraft();
  }

  ngOnDestroy(): void {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.addNote();
    }
  }

  onDraftChange(): void {
    this.queueDraftSave();
  }

  onEditorLanguageDetected(language: string): void {
    this.detectedLanguage = language || 'markdown';
  }

  addNote(): void {
    if (!this.noteTitle.trim() && !this.noteText.trim()) {
      return;
    }

    const text = this.noteText.trim();
    const note: Note = {
      id: Date.now(),
      title: this.noteTitle.trim() || 'Untitled Note',
      text,
      tags: this.parseTags(this.noteTags),
      timestamp: new Date().toLocaleString(),
      wordCount: this.getWordCount(text)
    };

    this.notes.unshift(note);
    this.saveNotes();
    this.clearInputs();
    this.saveIndicator = 'Saved ✓';
  }

  deleteNote(id: number): void {
    this.notes = this.notes.filter((note) => note.id !== id);
    this.saveNotes();
  }

  copyNoteText(note: Note): void {
    navigator.clipboard.writeText(note.text);
  }

  clearInputs(): void {
    this.noteTitle = '';
    this.noteText = '';
    this.noteTags = '';
    localStorage.removeItem(this.DRAFT_KEY);
  }

  getTotalCharacters(): number {
    return this.notes.reduce((total, note) => total + note.title.length + note.text.length, 0);
  }

  getDraftWordCount(): number {
    return this.getWordCount(this.noteText);
  }

  getReadingTime(): number {
    return Math.max(1, Math.ceil(this.getDraftWordCount() / 200));
  }

  trackNote(index: number, note: Note): number {
    return note.id;
  }

  private queueDraftSave(): void {
    this.isSaving = true;
    this.saveIndicator = 'Saving draft...';

    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }

    this.saveTimer = window.setTimeout(() => {
      localStorage.setItem(
        this.DRAFT_KEY,
        JSON.stringify({
          title: this.noteTitle,
          text: this.noteText,
          tags: this.noteTags
        })
      );
      this.isSaving = false;
      this.saveIndicator = 'Saved ✓';
    }, 250);
  }

  private parseTags(value: string): string[] {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag, index, items) => !!tag && items.indexOf(tag) === index);
  }

  private getWordCount(text: string): number {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }

  private saveNotes(): void {
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(this.notes));
  }

  private loadNotes(): void {
    const saved = localStorage.getItem(this.NOTES_KEY);
    if (saved) {
      this.notes = JSON.parse(saved);
    }
  }

  private loadDraft(): void {
    const draft = localStorage.getItem(this.DRAFT_KEY);
    if (!draft) {
      return;
    }

    try {
      const parsed = JSON.parse(draft);
      this.noteTitle = parsed.title || '';
      this.noteText = parsed.text || '';
      this.noteTags = parsed.tags || '';
      this.saveIndicator = 'Saved ✓';
    } catch (error) {
      this.saveIndicator = 'Draft idle';
    }
  }
}
