import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PastebinService {
  private api = 'http://localhost:8080/api/paste';
  constructor(private http: HttpClient) {}
  getPastes() { return this.http.get<string[]>(this.api); }
  addPaste(paste: string) { return this.http.post(this.api, paste); }
  deletePaste(index: number) { return this.http.delete(`${this.api}/${index}`); }
}