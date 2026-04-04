import { Component } from '@angular/core';

interface JsonTreeNode {
  path: string;
  key: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  value: any;
  summary: string;
  children: JsonTreeNode[];
}

@Component({
  selector: 'app-json-regex-tools',
  templateUrl: './json-regex-tools.component.html',
  styleUrls: ['./json-regex-tools.component.scss']
})
export class JsonRegexToolsComponent {
  activeTab: 'json' | 'regex' = 'json';

  jsonInput = '';
  jsonOutput = '';
  jsonError = '';
  jsonValid = false;
  jsonTree: JsonTreeNode[] = [];
  jsonMarkers: any[] = [];
  jsonDetectedLanguage = 'json';
  collapsedPaths: { [path: string]: boolean } = {};

  regexPattern = '';
  testString = '';
  regexError = '';
  regexValid = false;
  flags = {
    global: true,
    ignoreCase: false,
    multiline: false
  };
  regexMatches: { match: string; index: number }[] = [];

  onJsonChange(value: string): void {
    this.jsonInput = value;
    this.validateJson();
  }

  onJsonLanguageDetected(language: string): void {
    this.jsonDetectedLanguage = language;
  }

  validateJson(): void {
    this.jsonError = '';
    this.jsonOutput = '';
    this.jsonTree = [];
    this.jsonMarkers = [];

    if (!this.jsonInput.trim()) {
      this.jsonValid = false;
      return;
    }

    try {
      const parsed = JSON.parse(this.jsonInput);
      this.jsonOutput = JSON.stringify(parsed, null, 2);
      this.jsonTree = this.buildTree(parsed, '$');
      this.jsonValid = true;
    } catch (error) {
      this.jsonError = error instanceof Error ? error.message : 'Invalid JSON';
      this.jsonMarkers = this.buildErrorMarkers(this.jsonError, this.jsonInput);
      this.jsonValid = false;
    }
  }

  formatJson(): void {
    this.validateJson();
    if (this.jsonValid) {
      this.jsonInput = this.jsonOutput;
    }
  }

  minifyJson(): void {
    this.validateJson();
    if (!this.jsonValid) {
      return;
    }

    this.jsonOutput = JSON.stringify(JSON.parse(this.jsonInput));
    this.jsonInput = this.jsonOutput;
  }

  copyJsonResult(): void {
    if (this.jsonOutput) {
      navigator.clipboard.writeText(this.jsonOutput);
    }
  }

  getJsonStats(): { characters: number; lines: number; nodes: number } {
    const output = this.jsonOutput || this.jsonInput;
    return {
      characters: output.length,
      lines: output ? output.split('\n').length : 0,
      nodes: this.countNodes(this.jsonTree)
    };
  }

  toggleNode(path: string): void {
    this.collapsedPaths[path] = !this.collapsedPaths[path];
  }

  isCollapsed(path: string): boolean {
    return !!this.collapsedPaths[path];
  }

  testRegex(): void {
    this.regexError = '';
    this.regexMatches = [];

    if (!this.regexPattern.trim() || !this.testString.trim()) {
      return;
    }

    try {
      const flagString =
        (this.flags.global ? 'g' : '') +
        (this.flags.ignoreCase ? 'i' : '') +
        (this.flags.multiline ? 'm' : '');

      const regex = new RegExp(this.regexPattern, flagString);
      this.regexValid = true;

      if (this.flags.global) {
        let match;
        while ((match = regex.exec(this.testString)) !== null) {
          this.regexMatches.push({
            match: match[0],
            index: match.index
          });
          if (match.index === regex.lastIndex) {
            break;
          }
        }
      } else {
        const match = regex.exec(this.testString);
        if (match) {
          this.regexMatches.push({
            match: match[0],
            index: match.index
          });
        }
      }
    } catch (error) {
      this.regexError = error instanceof Error ? error.message : 'Invalid regex';
      this.regexValid = false;
    }
  }

  clearRegex(): void {
    this.regexPattern = '';
    this.testString = '';
    this.regexMatches = [];
    this.regexError = '';
    this.flags = { global: true, ignoreCase: false, multiline: false };
  }

  trackByIndex(index: number): number {
    return index;
  }

  private buildTree(value: any, path: string, key: string = '$'): JsonTreeNode[] {
    if (Array.isArray(value)) {
      return value.map((item, index) => this.buildNode(index.toString(), item, path + '[' + index + ']'));
    }

    if (value !== null && typeof value === 'object') {
      return Object.keys(value).map((childKey) => this.buildNode(childKey, value[childKey], path + '.' + childKey));
    }

    return [this.buildNode(key, value, path)];
  }

  private buildNode(key: string, value: any, path: string): JsonTreeNode {
    const type = this.getValueType(value);
    const children =
      type === 'array'
        ? (value as any[]).map((item, index) => this.buildNode(index.toString(), item, path + '[' + index + ']'))
        : type === 'object'
          ? Object.keys(value).map((childKey) => this.buildNode(childKey, value[childKey], path + '.' + childKey))
          : [];

    return {
      path,
      key,
      type,
      value,
      children,
      summary: this.getSummary(type, value, children.length)
    };
  }

  private getValueType(value: any): JsonTreeNode['type'] {
    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    switch (typeof value) {
      case 'boolean':
        return 'boolean';
      case 'number':
        return 'number';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }

  private getSummary(type: JsonTreeNode['type'], value: any, length: number): string {
    if (type === 'object') {
      return '{ ' + length + ' keys }';
    }

    if (type === 'array') {
      return '[ ' + length + ' items ]';
    }

    if (type === 'string') {
      return '"' + value + '"';
    }

    return String(value);
  }

  private countNodes(nodes: JsonTreeNode[]): number {
    return nodes.reduce((count, node) => count + 1 + this.countNodes(node.children), 0);
  }

  private buildErrorMarkers(message: string, input: string): any[] {
    const positionMatch = /position\s(\d+)/i.exec(message);
    if (!positionMatch) {
      return [];
    }

    const position = parseInt(positionMatch[1], 10);
    const before = input.slice(0, position);
    const lines = before.split('\n');
    const lineNumber = lines.length;
    const column = lines[lines.length - 1].length + 1;

    return [
      {
        startLineNumber: lineNumber,
        startColumn: column,
        endLineNumber: lineNumber,
        endColumn: column + 1,
        message,
        severity: 8
      }
    ];
  }


  get noMatchMessage(): string {
    if (this.regexPattern && this.testString && !this.regexError) {
      return 'No matches found for the current pattern.';
    }
    return 'Enter a pattern and test string to inspect matches.';
  }
}
