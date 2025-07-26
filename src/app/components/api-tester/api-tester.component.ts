// api-tester.component.ts
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-api-tester',
  templateUrl: './api-tester.component.html',
  styleUrls: ['./api-tester.component.scss']
})
export class ApiTesterComponent {
  method = 'GET';
  url = '';
  headers = [{ key: '', value: '' }];
  body = '';
  response: any;
  status: number | null = null;

  constructor(private http: HttpClient) {}

  addHeader() {
    this.headers.push({ key: '', value: '' });
  }

  removeHeader(index: number) {
    this.headers.splice(index, 1);
  }

  sendRequest() {
    const httpHeaders = new HttpHeaders(
      this.headers
        .filter(h => h.key)
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})
    );

    let request;

    const options = {
      headers: httpHeaders,
      observe: 'response' as const,
      responseType: 'json' as const,
    };

    switch (this.method) {
      case 'GET':
        request = this.http.get(this.url, options);
        break;
      case 'POST':
        request = this.http.post(this.url, this.parseBody(), options);
        break;
      case 'PUT':
        request = this.http.put(this.url, this.parseBody(), options);
        break;
      case 'DELETE':
        request = this.http.delete(this.url, options);
        break;
    }

    request.subscribe(
      res => {
        this.status = res.status;
        this.response = res.body;
      },
      err => {
        this.status = err.status;
        this.response = err.error;
      }
    );
  }

  parseBody() {
    try {
      return JSON.parse(this.body || '{}');
    } catch {
      return {};
    }
  }
}
