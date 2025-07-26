import { Component } from '@angular/core';

@Component({
  selector: 'app-curl-converter',
  templateUrl: './curl-converter.component.html',
  styleUrls: ['./curl-converter.component.scss']
})
export class CurlConverterComponent {
  curlCommand: string = '';
  httpRequest: string = '';

  convert() {
    try {
      const urlMatch = this.curlCommand.match(/curl ['"]?([^'"]+)['"]?/);
      const url = urlMatch ? urlMatch[1] : '';
      const headers: string[] = [];
      const dataMatch = this.curlCommand.match(/--data-raw ['"]?(.+?)['"]?/);
      const methodMatch = this.curlCommand.match(/-X (\w+)/);
      const method = methodMatch ? methodMatch[1] : (dataMatch ? 'POST' : 'GET');

      const headerRegex = /-H ['"](.+?)['"]/g;
      let match;
      while ((match = headerRegex.exec(this.curlCommand)) !== null) {
        headers.push(match[1]);
      }

      const formatted = `${method} ${url}\n` +
        headers.map(h => `Header: ${h}`).join('\n') +
        (dataMatch ? `\nBody: ${dataMatch[1]}` : '');

      this.httpRequest = formatted;
    } catch (e) {
      this.httpRequest = 'Invalid curl command.';
    }
  }
}
