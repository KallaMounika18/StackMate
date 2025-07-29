import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface NoteRequest {
  title: string;
  content: string;
}

export interface NoteResponse {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private apiUrl = 'http://localhost:8080/api/notes';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createNote(note: NoteRequest): Observable<NoteResponse> {
    return this.http.post<NoteResponse>(this.apiUrl, note, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserNotes(): Observable<NoteResponse[]> {
    return this.http.get<NoteResponse[]>(this.apiUrl, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateNote(noteId: number, note: Partial<NoteRequest>): Observable<NoteResponse> {
    return this.http.put<NoteResponse>(`${this.apiUrl}/${noteId}`, note, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteNote(noteId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${noteId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  searchNotes(query: string): Observable<NoteResponse[]> {
    return this.http.get<NoteResponse[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}