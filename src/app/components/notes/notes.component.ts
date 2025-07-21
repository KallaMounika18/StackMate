// notes.component.ts
import { Component, OnInit, HostListener } from '@angular/core';

interface Note {
  id: number;
  title: string;
  text: string;
  timestamp: string;
}

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  noteTitle: string = '';
  noteText: string = '';
  notes: Note[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadNotes();
  }

  addNote(): void {
    if (!this.noteTitle.trim() && !this.noteText.trim()) {
      return;
    }

    const note: Note = {
      id: Date.now(),
      title: this.noteTitle.trim() || 'Untitled Note',
      text: this.noteText.trim() || 'Empty note',
      timestamp: new Date().toLocaleString()
    };

    this.notes.unshift(note);
    this.saveNotes();
    this.clearInputs();
  }

  deleteNote(id: number): void {
    this.notes = this.notes.filter(note => note.id !== id);
    this.saveNotes();
  }

  clearInputs(): void {
    this.noteTitle = '';
    this.noteText = '';
  }

  getTotalCharacters(): number {
    return this.notes.reduce((total, note) => 
      total + note.title.length + note.text.length, 0
    );
  }

  private saveNotes(): void {
    localStorage.setItem('devnotes_notes', JSON.stringify(this.notes));
  }

  private loadNotes(): void {
    const saved = localStorage.getItem('devnotes_notes');
    if (saved) {
      this.notes = JSON.parse(saved);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      this.addNote();
    }
  }
}