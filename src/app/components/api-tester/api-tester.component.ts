import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';

interface HeaderRow {
  key: string;
  value: string;
}

type ResponseTab = 'body' | 'headers' | 'status';

@Component({
  selector: 'app-api-tester',
  templateUrl: './api-tester.component.html',
  styleUrls: ['./api-tester.component.scss']
})
export class ApiTesterComponent implements OnInit {
  private readonly STORAGE_KEY = 'stackmate-api-request';

  method = 'GET';
  url = '';
  headers: HeaderRow[] = [{ key: '', value: '' }];
  body = '';

  responseBody = '';
  responseHeaders: Array<{ key: string; value: string }> = [];
  responseStatus: number | null = null;
  responseTime = 0;
  responseTab: ResponseTab = 'body';

  isLoading = false;
  statusMessage = 'Ready';
  responseLanguage = 'json';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.restoreRequest();
  }

  addHeader(): void {
    this.headers.push({ key: '', value: '' });
  }

  removeHeader(index: number): void {
    this.headers.splice(index, 1);
    if (!this.headers.length) {
      this.headers = [{ key: '', value: '' }];
    }
    this.persistRequest();
  }

  persistRequest(): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        method: this.method,
        url: this.url,
        headers: this.headers,
        body: this.body
      })
    );
  }

  sendRequest(): void {
    if (!this.url) {
      return;
    }

    this.persistRequest();
    this.isLoading = true;
    this.statusMessage = 'Sending request...';
    this.responseBody = '';
    this.responseHeaders = [];
    this.responseStatus = null;
    const startedAt = Date.now();

    const httpHeaders = new HttpHeaders(
      this.headers
        .filter((header) => header.key)
        .reduce((acc, header) => {
          acc[header.key] = header.value;
          return acc;
        }, {} as { [key: string]: string })
    );

    const options = {
      headers: httpHeaders,
      observe: 'response' as const,
      responseType: 'text' as const
    };

    let request;
    switch (this.method) {
      case 'POST':
        request = this.http.post(this.url, this.parseBody(), options);
        break;
      case 'PUT':
        request = this.http.put(this.url, this.parseBody(), options);
        break;
      case 'PATCH':
        request = this.http.patch(this.url, this.parseBody(), options);
        break;
      case 'DELETE':
        request = this.http.delete(this.url, options);
        break;
      default:
        request = this.http.get(this.url, options);
        break;
    }

    request.subscribe(
      (response: HttpResponse<string>) => {
        this.handleResponse(response.status, response.headers.keys().map((key) => ({ key, value: response.headers.get(key) || '' })), response.body || '', startedAt);
      },
      (error: HttpErrorResponse) => {
        const headers = error.headers ? error.headers.keys().map((key) => ({ key, value: error.headers.get(key) || '' })) : [];
        const body = typeof error.error === 'string' ? error.error : JSON.stringify(error.error || {}, null, 2);
        this.handleResponse(error.status || 0, headers, body, startedAt);
        this.statusMessage = 'Request failed.';
      }
    );
  }

  copyResponse(): void {
    navigator.clipboard.writeText(this.responseBody);
    this.statusMessage = 'Response copied.';
  }

  setResponseTab(tab: ResponseTab): void {
    this.responseTab = tab;
  }

  getStatusTone(): string {
    if (this.responseStatus === null) {
      return 'idle';
    }
    if (this.responseStatus >= 200 && this.responseStatus < 300) {
      return 'success';
    }
    if (this.responseStatus >= 400) {
      return 'error';
    }
    return 'warning';
  }

  private handleResponse(status: number, headers: Array<{ key: string; value: string }>, body: string, startedAt: number): void {
    this.responseStatus = status;
    this.responseHeaders = headers;
    this.responseBody = this.formatBody(body);
    this.responseLanguage = this.detectResponseLanguage(this.responseBody, headers);
    this.responseTime = Date.now() - startedAt;
    this.isLoading = false;
    this.statusMessage = 'Response received.';
  }

  private parseBody(): any {
    if (!this.body.trim()) {
      return {};
    }

    try {
      return JSON.parse(this.body);
    } catch (error) {
      return this.body;
    }
  }

  private formatBody(body: string): string {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch (error) {
      return body;
    }
  }

  private detectResponseLanguage(body: string, headers: Array<{ key: string; value: string }>): string {
    const contentType = headers.find((header) => header.key.toLowerCase() === 'content-type');
    if (contentType && contentType.value.indexOf('application/json') > -1) {
      return 'json';
    }
    if (body.trim().charAt(0) === '{' || body.trim().charAt(0) === '[') {
      return 'json';
    }
    if (body.indexOf('<html') > -1) {
      return 'html';
    }
    return 'plaintext';
  }

  private restoreRequest(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      this.method = parsed.method || 'GET';
      this.url = parsed.url || '';
      this.headers = parsed.headers && parsed.headers.length ? parsed.headers : [{ key: '', value: '' }];
      this.body = parsed.body || '';
    } catch (error) {
      this.headers = [{ key: '', value: '' }];
    }
  }
}
