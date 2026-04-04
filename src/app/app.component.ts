import { Component } from '@angular/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})

export class AppComponent {
  title = 'StackMate';
  subtitle = 'Developer workspace for snippets, requests, diffs, transforms, and quick utilities.';
  readonly githubUrl = 'https://github.com/';
  readonly navItems = [
    { route: '/pastebin', label: 'PasteBin', icon: '</>' },
    { route: '/notes', label: 'Notes', icon: '[]' },
    { route: '/code-comparator', label: 'Code Comparator', icon: 'Δ' },
    { route: '/json-regex-tools', label: 'JSON & Regex', icon: '{}' },
    { route: '/timestamp-uuid-tools', label: 'Timestamp & UUID', icon: 'ID' },
    { route: '/api-tester', label: 'API Tester', icon: 'API' },
    { route: '/curl-converter', label: 'cURL Converter', icon: 'cURL' },
    { route: '/markdown-previewer', label: 'Markdown', icon: 'MD' }
  ];

  constructor(public themeService: ThemeService) {}

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
