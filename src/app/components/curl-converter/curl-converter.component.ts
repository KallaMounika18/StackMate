import { Component } from '@angular/core';

interface ParsedCurlResult {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body: string;
}

@Component({
  selector: 'app-curl-converter',
  templateUrl: './curl-converter.component.html',
  styleUrls: ['./curl-converter.component.scss']
})
export class CurlConverterComponent {
  curlCommand = '';
  httpRequest = '';
  parsedRequest: ParsedCurlResult | null = null;
  errorMessage = '';
  statusMessage = 'Paste a cURL command to parse.';

  onCurlChange(value: string): void {
    this.curlCommand = value;
    this.convert();
  }

  convert(): void {
    this.errorMessage = '';

    if (!this.curlCommand.trim()) {
      this.httpRequest = '';
      this.parsedRequest = null;
      this.statusMessage = 'Paste a cURL command to parse.';
      return;
    }

    try {
      const parsed = this.parseCurl(this.curlCommand);
      this.parsedRequest = parsed;
      this.httpRequest = this.formatRequest(parsed);
      this.statusMessage = 'Request parsed successfully.';
    } catch (error) {
      this.parsedRequest = null;
      this.httpRequest = '';
      this.errorMessage = error instanceof Error ? error.message : 'Invalid cURL command.';
      this.statusMessage = 'Unable to parse command.';
    }
  }

  copyOutput(): void {
    if (!this.httpRequest) {
      return;
    }

    navigator.clipboard.writeText(this.httpRequest);
    this.statusMessage = 'HTTP request copied.';
  }

  clearAll(): void {
    this.curlCommand = '';
    this.httpRequest = '';
    this.parsedRequest = null;
    this.errorMessage = '';
    this.statusMessage = 'Editor cleared.';
  }

  private parseCurl(command: string): ParsedCurlResult {
    if (command.indexOf('curl') === -1) {
      throw new Error('Command must start with curl.');
    }

    const urlMatch = command.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^'"\\s]+)['"]?/);
    const url = urlMatch ? urlMatch[1] : '';
    if (!url) {
      throw new Error('Could not determine request URL.');
    }

    const methodMatch = command.match(/-X\s+(\w+)/i);
    const bodyMatch = command.match(/(?:--data-raw|--data|--data-binary)\s+(['"])([\s\S]*?)\1/);
    const method = methodMatch ? methodMatch[1].toUpperCase() : (bodyMatch ? 'POST' : 'GET');

    const headers: Array<{ key: string; value: string }> = [];
    const headerRegex = /-H\s+(['"])(.*?)\1/g;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(command)) !== null) {
      const parts = headerMatch[2].split(':');
      const key = (parts.shift() || '').trim();
      const value = parts.join(':').trim();
      headers.push({ key, value });
    }

    return {
      method,
      url,
      headers,
      body: bodyMatch ? bodyMatch[2] : ''
    };
  }

  private formatRequest(parsed: ParsedCurlResult): string {
    const headerLines = parsed.headers.map((header) => header.key + ': ' + header.value).join('\n');
    return [
      parsed.method + ' ' + parsed.url,
      headerLines,
      parsed.body ? '\n' + parsed.body : ''
    ].filter(Boolean).join('\n');
  }
}
