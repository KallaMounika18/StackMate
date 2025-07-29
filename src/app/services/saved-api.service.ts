import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface SavedApiRequest {
  name: string;
  method: string;
  url: string;
  headers?: string;
  body?: string;
  description?: string;
}

export interface SavedApiResponse {
  id: number;
  name: string;
  method: string;
  url: string;
  headers?: string;
  body?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SavedApiService {
  private apiUrl = 'http://localhost:8080/api/saved-apis';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createSavedApi(api: SavedApiRequest): Observable<SavedApiResponse> {
    return this.http.post<SavedApiResponse>(this.apiUrl, api, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserSavedApis(): Observable<SavedApiResponse[]> {
    return this.http.get<SavedApiResponse[]>(this.apiUrl, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateSavedApi(apiId: number, api: SavedApiRequest): Observable<SavedApiResponse> {
    return this.http.put<SavedApiResponse>(`${this.apiUrl}/${apiId}`, api, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteSavedApi(apiId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${apiId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  searchSavedApis(query: string): Observable<SavedApiResponse[]> {
    return this.http.get<SavedApiResponse[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}