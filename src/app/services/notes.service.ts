import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private api = 'http://localhost:8080/api/notes';
  constructor(private http: HttpClient) {}
  getNotes() { return this.http.get<any[]>(this.api); }
  addNote(note: any) { return this.http.post(this.api, note); }
  deleteNote(index: number) { return this.http.delete(`${this.api}/${index}`); }
}
