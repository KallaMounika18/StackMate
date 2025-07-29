import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface PasteRequest {
  content: string;
  language?: string;
  isPublic?: boolean;
  expiresAt?: string;
}

export interface PasteResponse {
  id: number;
  publicId: string;
  content: string;
  language: string;
  lineCount: number;
  isPublic: boolean;
  expiresAt?: string;
  createdAt: string;
  publicUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class PastebinService {
  private apiUrl = 'http://localhost:8080/api/pastes';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createPaste(paste: PasteRequest): Observable<PasteResponse> {
    return this.http.post<PasteResponse>(this.apiUrl, paste, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserPastes(): Observable<PasteResponse[]> {
    return this.http.get<PasteResponse[]>(this.apiUrl, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deletePaste(pasteId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${pasteId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getPublicPaste(publicId: string): Observable<PasteResponse> {
    return this.http.get<PasteResponse>(`http://localhost:8080/api/public/paste/${publicId}`);
  }
}
