import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SavedApiService, SavedApiRequest, SavedApiResponse } from '../../services/saved-api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface HeaderPair {
  key: string;
  value: string;
}

@Component({
  selector: 'app-api-tester',
  templateUrl: './api-tester.component.html',
  styleUrls: ['./api-tester.component.scss']
})
export class ApiTesterComponent implements OnInit {
  method = 'GET';
  url = '';
  headers: HeaderPair[] = [{ key: '', value: '' }];
  body = '';
  response: any = null;
  status = 0;
  isLoading = false;
  errorMessage = '';

  // Saved APIs
  savedApis: SavedApiResponse[] = [];
  showSaveDialog = false;
  saveApiName = '';
  saveApiDescription = '';
  searchQuery = '';

  constructor(
    private http: HttpClient,
    private savedApiService: SavedApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadSavedApis();
  }

  sendRequest(): void {
    if (!this.url) return;

    this.isLoading = true;
    this.response = null;
    this.status = 0;
    this.errorMessage = '';

    const httpHeaders = new HttpHeaders();
    this.headers.forEach(header => {
      if (header.key && header.value) {
        httpHeaders.set(header.key, header.value);
      }
    });

    const requestOptions: any = {
      headers: httpHeaders,
      observe: 'response'
    };

    let requestObservable;
    
    switch (this.method) {
      case 'GET':
        requestObservable = this.http.get(this.url, requestOptions);
        break;
      case 'POST':
        requestObservable = this.http.post(this.url, this.parseBody(), requestOptions);
        break;
      case 'PUT':
        requestObservable = this.http.put(this.url, this.parseBody(), requestOptions);
        break;
      case 'PATCH':
        requestObservable = this.http.patch(this.url, this.parseBody(), requestOptions);
        break;
      case 'DELETE':
        requestObservable = this.http.delete(this.url, requestOptions);
        break;
      default:
        this.isLoading = false;
        return;
    }

    requestObservable.subscribe({
      next: (response: any) => {
        this.response = response.body;
        this.status = response.status;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('API request failed:', error);
        this.response = error.error || error.message;
        this.status = error.status || 0;
        this.errorMessage = `Request failed: ${error.message}`;
        this.isLoading = false;
      }
    });
  }

  parseBody(): any {
    if (!this.body.trim()) return {};
    
    try {
      return JSON.parse(this.body);
    } catch (e) {
      return this.body;
    }
  }

  addHeader(): void {
    this.headers.push({ key: '', value: '' });
  }

  removeHeader(index: number): void {
    this.headers.splice(index, 1);
  }

  // Saved APIs functionality
  openSaveDialog(): void {
    this.showSaveDialog = true;
    this.saveApiName = '';
    this.saveApiDescription = '';
  }

  closeSaveDialog(): void {
    this.showSaveDialog = false;
  }

  saveCurrentApi(): void {
    if (!this.saveApiName.trim()) return;

    const headersJson = JSON.stringify(
      this.headers.filter(h => h.key && h.value)
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})
    );

    const apiRequest: SavedApiRequest = {
      name: this.saveApiName.trim(),
      method: this.method,
      url: this.url,
      headers: headersJson,
      body: this.body,
      description: this.saveApiDescription.trim()
    };

    this.savedApiService.createSavedApi(apiRequest).subscribe({
      next: (response) => {
        this.savedApis.unshift(response);
        this.closeSaveDialog();
      },
      error: (error) => {
        console.error('Error saving API:', error);
        this.errorMessage = 'Failed to save API. Please try again.';
      }
    });
  }

  loadSavedApi(api: SavedApiResponse): void {
    this.method = api.method;
    this.url = api.url;
    this.body = api.body || '';

    // Parse headers
    this.headers = [{ key: '', value: '' }];
    if (api.headers) {
      try {
        const parsedHeaders = JSON.parse(api.headers);
        this.headers = Object.entries(parsedHeaders).map(([key, value]) => ({
          key,
          value: value as string
        }));
        if (this.headers.length === 0) {
          this.headers.push({ key: '', value: '' });
        }
      } catch (e) {
        console.error('Error parsing headers:', e);
      }
    }
  }

  deleteSavedApi(apiId: number): void {
    if (!confirm('Are you sure you want to delete this saved API?')) {
      return;
    }

    this.savedApiService.deleteSavedApi(apiId).subscribe({
      next: () => {
        this.savedApis = this.savedApis.filter(api => api.id !== apiId);
      },
      error: (error) => {
        console.error('Error deleting API:', error);
        this.errorMessage = 'Failed to delete API. Please try again.';
      }
    });
  }

  loadSavedApis(): void {
    this.savedApiService.getUserSavedApis().subscribe({
      next: (apis) => {
        this.savedApis = apis;
      },
      error: (error) => {
        console.error('Error loading saved APIs:', error);
      }
    });
  }

  searchSavedApis(): void {
    if (!this.searchQuery.trim()) {
      this.loadSavedApis();
      return;
    }

    this.savedApiService.searchSavedApis(this.searchQuery).subscribe({
      next: (apis) => {
        this.savedApis = apis;
      },
      error: (error) => {
        console.error('Error searching APIs:', error);
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadSavedApis();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
