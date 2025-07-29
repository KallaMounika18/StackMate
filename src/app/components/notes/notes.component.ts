import { Component, OnInit, HostListener } from '@angular/core';
import { NotesService, NoteRequest, NoteResponse } from '../../services/notes.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  noteTitle: string = '';
  noteText: string = '';
  notes: NoteResponse[] = [];
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  editingNote: NoteResponse | null = null;

  constructor(
    private notesService: NotesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadNotes();
  }

  addNote(): void {
    if (!this.noteTitle.trim() && !this.noteText.trim()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const noteRequest: NoteRequest = {
      title: this.noteTitle.trim() || 'Untitled Note',
      content: this.noteText.trim() || 'Empty note'
    };

    if (this.editingNote) {
      // Update existing note
      this.notesService.updateNote(this.editingNote.id, noteRequest).subscribe({
        next: (response) => {
          const index = this.notes.findIndex(n => n.id === this.editingNote!.id);
          if (index !== -1) {
            this.notes[index] = response;
          }
          this.clearInputs();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating note:', error);
          this.errorMessage = 'Failed to update note. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      // Create new note
      this.notesService.createNote(noteRequest).subscribe({
        next: (response) => {
          this.notes.unshift(response);
          this.clearInputs();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating note:', error);
          this.errorMessage = 'Failed to create note. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  editNote(note: NoteResponse): void {
    this.editingNote = note;
    this.noteTitle = note.title;
    this.noteText = note.content;
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingNote = null;
    this.clearInputs();
  }

  deleteNote(noteId: number): void {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    this.notesService.deleteNote(noteId).subscribe({
      next: () => {
        this.notes = this.notes.filter(note => note.id !== noteId);
        if (this.editingNote && this.editingNote.id === noteId) {
          this.cancelEdit();
        }
      },
      error: (error) => {
        console.error('Error deleting note:', error);
        this.errorMessage = 'Failed to delete note. Please try again.';
      }
    });
  }

  loadNotes(): void {
    this.notesService.getUserNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
      },
      error: (error) => {
        console.error('Error loading notes:', error);
        this.errorMessage = 'Failed to load notes.';
      }
    });
  }

  searchNotes(): void {
    if (!this.searchQuery.trim()) {
      this.loadNotes();
      return;
    }

    this.notesService.searchNotes(this.searchQuery).subscribe({
      next: (notes) => {
        this.notes = notes;
      },
      error: (error) => {
        console.error('Error searching notes:', error);
        this.errorMessage = 'Failed to search notes.';
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadNotes();
  }

  clearInputs(): void {
    this.noteTitle = '';
    this.noteText = '';
    this.editingNote = null;
  }

  getTotalCharacters(): number {
    return this.notes.reduce((total, note) => 
      total + note.title.length + note.content.length, 0
    );
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      this.addNote();
    }
    if (event.key === 'Escape' && this.editingNote) {
      this.cancelEdit();
    }
  }
}
