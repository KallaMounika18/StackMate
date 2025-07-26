// json-regex-tools.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-regex-tools',
  templateUrl: './json-regex-tools.component.html',
  styleUrls: ['./json-regex-tools.component.scss']
})
export class JsonRegexToolsComponent {
  activeTab: 'json' | 'regex' = 'json';
  
  // JSON Tool Properties
  jsonInput = '';
  jsonOutput = '';
  jsonError = '';
  jsonValid = false;

  // Regex Tool Properties
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

  formatJson(): void {
    this.jsonError = '';
    this.jsonOutput = '';
    
    if (!this.jsonInput.trim()) return;

    try {
      const parsed = JSON.parse(this.jsonInput);
      this.jsonOutput = JSON.stringify(parsed, null, 2);
      this.jsonValid = true;
    } catch (error) {
      this.jsonError = error instanceof Error ? error.message : 'Invalid JSON';
      this.jsonValid = false;
    }
  }

  minifyJson(): void {
    this.jsonError = '';
    this.jsonOutput = '';
    
    if (!this.jsonInput.trim()) return;

    try {
      const parsed = JSON.parse(this.jsonInput);
      this.jsonOutput = JSON.stringify(parsed);
      this.jsonValid = true;
    } catch (error) {
      this.jsonError = error instanceof Error ? error.message : 'Invalid JSON';
      this.jsonValid = false;
    }
  }

  copyJsonResult(): void {
    if (this.jsonOutput) {
      navigator.clipboard.writeText(this.jsonOutput);
    }
  }

  getJsonStats(): { characters: number; lines: number } {
    const output = this.jsonOutput || this.jsonInput;
    return {
      characters: output.length,
      lines: output.split('\n').length
    };
  }

  testRegex(): void {
    this.regexError = '';
    this.regexMatches = [];
    
    if (!this.regexPattern.trim() || !this.testString.trim()) return;

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
          if (match.index === regex.lastIndex) break;
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
}