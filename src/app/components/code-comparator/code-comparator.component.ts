import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { createTwoFilesPatch, diffLines } from 'diff';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

declare const monaco: any;
type SplitMode = 'vertical' | 'horizontal';

interface ComparisonRow {
  type: 'added' | 'removed' | 'modified' | 'unchanged' | 'collapsed';
  originalLineNumber: number | null;
  modifiedLineNumber: number | null;
  originalContent: string;
  modifiedContent: string;
  summary?: string;
}

interface ComparisonHistoryItem {
  id: string;
  createdAt: number;
  originalCode: string;
  modifiedCode: string;
  originalLanguage: string;
  modifiedLanguage: string;
  additions: number;
  deletions: number;
  modifications: number;
}

interface SharedComparisonPayload {
  originalCode: string;
  modifiedCode: string;
  splitMode: SplitMode;
  wordWrapEnabled: boolean;
  ignoreWhitespace: boolean;
  showUnchanged: boolean;
}

@Component({
  selector: 'app-code-comparator',
  templateUrl: './code-comparator.component.html',
  styleUrls: ['./code-comparator.component.scss']
})
export class CodeComparatorComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly HISTORY_KEY = 'stackmate-code-comparator-history';
  private static readonly SHARE_KEY = 'stackmate-code-comparator-shares';

  @ViewChild('originalEditorHost', { static: true }) originalEditorHost!: ElementRef<HTMLDivElement>;
  @ViewChild('modifiedEditorHost', { static: true }) modifiedEditorHost!: ElementRef<HTMLDivElement>;

  originalCode = '';
  modifiedCode = '';
  originalLanguage = 'plaintext';
  modifiedLanguage = 'plaintext';
  detectedLanguageLabel = 'Plain Text';

  splitMode: SplitMode = 'vertical';
  wordWrapEnabled = true;
  ignoreWhitespace = false;
  showUnchanged = false;

  additionsCount = 0;
  deletionsCount = 0;
  modificationsCount = 0;
  originalLineCount = 0;
  modifiedLineCount = 0;
  changeCount = 0;

  comparisonRows: ComparisonRow[] = [];
  comparisonHistory: ComparisonHistoryItem[] = [];
  shareUrl = '';
  statusMessage = 'Idle';
  isProcessing = false;
  hasCompared = false;
  monacoReady = false;
  monacoFailed = false;

  private originalEditor: any;
  private modifiedEditor: any;
  private originalModel: any;
  private modifiedModel: any;
  private compareTimer: number | null = null;
  private themeSubscription?: Subscription;
  private queryParamSubscription?: Subscription;
  private suppressEditorEvents = false;
  unifiedDiff = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.comparisonHistory = this.readHistory();
    this.queryParamSubscription = this.route.queryParamMap.subscribe((params) => {
      const sessionId = params.get('session');
      if (sessionId) {
        this.restoreSharedComparison(sessionId);
      }
    });
  }

  ngAfterViewInit(): void {
    this.bootstrapMonaco();
  }

  ngOnDestroy(): void {
    if (this.compareTimer !== null) {
      window.clearTimeout(this.compareTimer);
    }

    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }

    if (this.queryParamSubscription) {
      this.queryParamSubscription.unsubscribe();
    }

    if (this.originalEditor) {
      this.originalEditor.dispose();
    }

    if (this.modifiedEditor) {
      this.modifiedEditor.dispose();
    }

    if (this.originalModel) {
      this.originalModel.dispose();
    }

    if (this.modifiedModel) {
      this.modifiedModel.dispose();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.layoutEditors();
  }

  @HostListener('window:keydown', ['$event'])
  handleShortcuts(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'enter') {
      event.preventDefault();
      this.compareNow();
    }

    if (key === 'l') {
      event.preventDefault();
      this.clearAll();
    }
  }

  get canOperate(): boolean {
    return !!this.originalCode.trim() || !!this.modifiedCode.trim();
  }

  get editorThemeLabel(): string {
    return this.themeService.currentTheme === 'dark' ? 'VS Dark' : 'VS Light';
  }

  compareNow(): void {
    if (this.compareTimer !== null) {
      window.clearTimeout(this.compareTimer);
      this.compareTimer = null;
    }

    this.computeComparison();
  }

  scheduleComparison(): void {
    if (this.suppressEditorEvents) {
      return;
    }

    this.isProcessing = true;
    this.statusMessage = 'Syncing changes...';

    if (this.compareTimer !== null) {
      window.clearTimeout(this.compareTimer);
    }

    this.compareTimer = window.setTimeout(() => {
      this.computeComparison();
    }, 220);
  }

  toggleSplitMode(): void {
    this.splitMode = this.splitMode === 'vertical' ? 'horizontal' : 'vertical';
    this.layoutEditors();
  }

  toggleWordWrap(): void {
    this.wordWrapEnabled = !this.wordWrapEnabled;
    this.updateEditorOptions();
    this.compareNow();
  }

  toggleIgnoreWhitespace(): void {
    this.ignoreWhitespace = !this.ignoreWhitespace;
    this.compareNow();
  }

  toggleShowUnchanged(): void {
    this.showUnchanged = !this.showUnchanged;
    this.compareNow();
  }

  onFallbackOriginalChange(value: string): void {
    this.originalCode = value;
    this.updateDetectedLanguages();
    this.scheduleComparison();
  }

  onFallbackModifiedChange(value: string): void {
    this.modifiedCode = value;
    this.updateDetectedLanguages();
    this.scheduleComparison();
  }

  swapSides(): void {
    this.setEditorValues(this.modifiedCode, this.originalCode);
    this.statusMessage = 'Original and modified sides swapped.';
    this.compareNow();
  }

  clearAll(): void {
    this.setEditorValues('', '');
    this.shareUrl = '';
    this.comparisonRows = [];
    this.unifiedDiff = '';
    this.additionsCount = 0;
    this.deletionsCount = 0;
    this.modificationsCount = 0;
    this.changeCount = 0;
    this.originalLineCount = 0;
    this.modifiedLineCount = 0;
    this.hasCompared = false;
    this.isProcessing = false;
    this.statusMessage = 'Editors cleared.';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { session: null },
      queryParamsHandling: 'merge'
    });
  }

  copyDiff(): void {
    if (!this.unifiedDiff) {
      return;
    }

    this.copyText(this.unifiedDiff);
    this.statusMessage = 'Unified diff copied to clipboard.';
  }

  downloadDiff(): void {
    if (!this.unifiedDiff) {
      return;
    }

    const blob = new Blob([this.unifiedDiff], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stackmate-comparison.diff';
    link.click();
    URL.revokeObjectURL(url);
    this.statusMessage = 'Diff file downloaded.';
  }

  shareComparison(): void {
    if (!this.canOperate) {
      return;
    }

    const id = this.generateId();
    const shareStore = this.readSharedComparisons();
    shareStore[id] = {
      originalCode: this.originalCode,
      modifiedCode: this.modifiedCode,
      splitMode: this.splitMode,
      wordWrapEnabled: this.wordWrapEnabled,
      ignoreWhitespace: this.ignoreWhitespace,
      showUnchanged: this.showUnchanged
    };
    localStorage.setItem(CodeComparatorComponent.SHARE_KEY, JSON.stringify(shareStore));

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { session: id },
      queryParamsHandling: 'merge'
    }).then(() => {
      this.shareUrl = window.location.href;
      this.copyText(this.shareUrl);
      this.statusMessage = 'Share link copied to clipboard.';
    });
  }

  restoreFromHistory(item: ComparisonHistoryItem): void {
    this.setEditorValues(item.originalCode, item.modifiedCode);
    this.statusMessage = 'Comparison restored from local history.';
    this.compareNow();
  }

  formatHistoryDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  trackHistoryItem(index: number, item: ComparisonHistoryItem): string {
    return item.id + ':' + index;
  }

  trackComparisonRow(index: number): number {
    return index;
  }

  private bootstrapMonaco(): void {
    const amdRequire = (window as any).require;

    if (typeof monaco !== 'undefined' && monaco.editor) {
      this.initializeEditors();
      return;
    }

    if (!amdRequire) {
      this.monacoFailed = true;
      this.statusMessage = 'Monaco loader is unavailable.';
      return;
    }

    amdRequire.config({ paths: { vs: 'assets/monaco/vs' } });
    amdRequire(
      ['vs/editor/editor.main'],
      () => {
        this.initializeEditors();
      },
      () => {
        this.monacoFailed = true;
        this.statusMessage = 'Monaco failed to load. Using fallback editors.';
      }
    );
  }

  private initializeEditors(): void {
    monaco.editor.setTheme(this.themeService.currentTheme === 'dark' ? 'vs-dark' : 'vs');
    this.originalModel = monaco.editor.createModel(this.originalCode, this.originalLanguage);
    this.modifiedModel = monaco.editor.createModel(this.modifiedCode, this.modifiedLanguage);

    this.originalEditor = monaco.editor.create(this.originalEditorHost.nativeElement, this.getEditorOptions(this.originalModel));
    this.modifiedEditor = monaco.editor.create(this.modifiedEditorHost.nativeElement, this.getEditorOptions(this.modifiedModel));

    this.originalEditor.onDidChangeModelContent(() => {
      this.originalCode = this.originalModel.getValue();
      this.updateDetectedLanguages();
      this.scheduleComparison();
    });

    this.modifiedEditor.onDidChangeModelContent(() => {
      this.modifiedCode = this.modifiedModel.getValue();
      this.updateDetectedLanguages();
      this.scheduleComparison();
    });

    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      if (typeof monaco !== 'undefined' && monaco.editor) {
        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
      }
    });

    this.monacoReady = true;
    this.monacoFailed = false;
    this.updateDetectedLanguages();
    this.compareNow();
    this.layoutEditors();
  }

  private getEditorOptions(model: any): any {
    return {
      model,
      automaticLayout: true,
      minimap: { enabled: true },
      roundedSelection: true,
      scrollBeyondLastLine: false,
      fontFamily: 'JetBrains Mono',
      fontSize: 13,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      smoothScrolling: true,
      wordWrap: this.wordWrapEnabled ? 'on' : 'off',
      padding: {
        top: 16,
        bottom: 16
      },
    };
  }

  private updateEditorOptions(): void {
    if (!this.originalEditor || !this.modifiedEditor) {
      return;
    }

    const options = {
      wordWrap: this.wordWrapEnabled ? 'on' : 'off'
    };

    this.originalEditor.updateOptions(options);
    this.modifiedEditor.updateOptions(options);
    this.layoutEditors();
  }

  private updateDetectedLanguages(): void {
    this.originalLanguage = this.detectLanguage(this.originalCode);
    this.modifiedLanguage = this.detectLanguage(this.modifiedCode);

    if (this.originalModel) {
      monaco.editor.setModelLanguage(this.originalModel, this.originalLanguage);
    }

    if (this.modifiedModel) {
      monaco.editor.setModelLanguage(this.modifiedModel, this.modifiedLanguage);
    }

    this.detectedLanguageLabel = this.getLanguageLabel(
      this.originalLanguage === this.modifiedLanguage ? this.originalLanguage : 'mixed'
    );
  }

  private computeComparison(): void {
    this.originalCode = this.originalModel ? this.originalModel.getValue() : this.originalCode;
    this.modifiedCode = this.modifiedModel ? this.modifiedModel.getValue() : this.modifiedCode;

    this.originalLineCount = this.countLines(this.originalCode);
    this.modifiedLineCount = this.countLines(this.modifiedCode);

    if (!this.originalCode.trim() && !this.modifiedCode.trim()) {
      this.comparisonRows = [];
      this.unifiedDiff = '';
      this.additionsCount = 0;
      this.deletionsCount = 0;
      this.modificationsCount = 0;
      this.changeCount = 0;
      this.hasCompared = false;
      this.isProcessing = false;
      this.statusMessage = 'Paste code or start typing to compare.';
      return;
    }

    const diffOptions = this.ignoreWhitespace ? { ignoreWhitespace: true } : undefined;
    const parts = diffLines(this.originalCode, this.modifiedCode, diffOptions as any);
    const rows: ComparisonRow[] = [];
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    let originalLineNumber = 1;
    let modifiedLineNumber = 1;

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const nextPart = parts[index + 1];

      if (part.removed && nextPart && nextPart.added) {
        const removedLines = this.toLines(part.value);
        const addedLines = this.toLines(nextPart.value);
        const pairedCount = Math.min(removedLines.length, addedLines.length);
        let lineIndex = 0;

        while (lineIndex < pairedCount) {
          rows.push({
            type: 'modified',
            originalLineNumber,
            modifiedLineNumber,
            originalContent: removedLines[lineIndex],
            modifiedContent: addedLines[lineIndex]
          });
          modifications++;
          originalLineNumber++;
          modifiedLineNumber++;
          lineIndex++;
        }

        while (lineIndex < removedLines.length) {
          rows.push({
            type: 'removed',
            originalLineNumber,
            modifiedLineNumber: null,
            originalContent: removedLines[lineIndex],
            modifiedContent: ''
          });
          deletions++;
          originalLineNumber++;
          lineIndex++;
        }

        lineIndex = pairedCount;
        while (lineIndex < addedLines.length) {
          rows.push({
            type: 'added',
            originalLineNumber: null,
            modifiedLineNumber,
            originalContent: '',
            modifiedContent: addedLines[lineIndex]
          });
          additions++;
          modifiedLineNumber++;
          lineIndex++;
        }

        index++;
        continue;
      }

      if (part.removed) {
        const removedOnlyLines = this.toLines(part.value);
        for (let lineIndex = 0; lineIndex < removedOnlyLines.length; lineIndex++) {
          rows.push({
            type: 'removed',
            originalLineNumber,
            modifiedLineNumber: null,
            originalContent: removedOnlyLines[lineIndex],
            modifiedContent: ''
          });
          deletions++;
          originalLineNumber++;
        }
        continue;
      }

      if (part.added) {
        const addedOnlyLines = this.toLines(part.value);
        for (let lineIndex = 0; lineIndex < addedOnlyLines.length; lineIndex++) {
          rows.push({
            type: 'added',
            originalLineNumber: null,
            modifiedLineNumber,
            originalContent: '',
            modifiedContent: addedOnlyLines[lineIndex]
          });
          additions++;
          modifiedLineNumber++;
        }
        continue;
      }

      const unchangedLines = this.toLines(part.value);
      const unchangedRows = this.buildUnchangedRows(unchangedLines, originalLineNumber, modifiedLineNumber);
      rows.push.apply(rows, unchangedRows.rows);
      originalLineNumber += unchangedRows.originalAdvance;
      modifiedLineNumber += unchangedRows.modifiedAdvance;
    }

    this.additionsCount = additions;
    this.deletionsCount = deletions;
    this.modificationsCount = modifications;
    this.changeCount = additions + deletions + modifications;
    this.comparisonRows = rows;
    this.unifiedDiff = createTwoFilesPatch(
      'original',
      'modified',
      this.originalCode,
      this.modifiedCode,
      '',
      '',
      { context: this.showUnchanged ? 9999 : 2 }
    );
    this.hasCompared = true;
    this.isProcessing = false;
    this.statusMessage = this.changeCount
      ? 'Realtime diff synced.'
      : 'Files are identical under current comparison settings.';
    this.persistHistory();
  }

  private buildUnchangedRows(
    lines: string[],
    startOriginalLine: number,
    startModifiedLine: number
  ): { rows: ComparisonRow[]; originalAdvance: number; modifiedAdvance: number } {
    const rows: ComparisonRow[] = [];

    if (this.showUnchanged || lines.length <= 4) {
      for (let index = 0; index < lines.length; index++) {
        rows.push({
          type: 'unchanged',
          originalLineNumber: startOriginalLine + index,
          modifiedLineNumber: startModifiedLine + index,
          originalContent: lines[index],
          modifiedContent: lines[index]
        });
      }

      return {
        rows,
        originalAdvance: lines.length,
        modifiedAdvance: lines.length
      };
    }

    rows.push({
      type: 'unchanged',
      originalLineNumber: startOriginalLine,
      modifiedLineNumber: startModifiedLine,
      originalContent: lines[0],
      modifiedContent: lines[0]
    });

    rows.push({
      type: 'unchanged',
      originalLineNumber: startOriginalLine + 1,
      modifiedLineNumber: startModifiedLine + 1,
      originalContent: lines[1],
      modifiedContent: lines[1]
    });

    rows.push({
      type: 'collapsed',
      originalLineNumber: null,
      modifiedLineNumber: null,
      originalContent: '',
      modifiedContent: '',
      summary: (lines.length - 4) + ' unchanged lines hidden'
    });

    rows.push({
      type: 'unchanged',
      originalLineNumber: startOriginalLine + lines.length - 2,
      modifiedLineNumber: startModifiedLine + lines.length - 2,
      originalContent: lines[lines.length - 2],
      modifiedContent: lines[lines.length - 2]
    });

    rows.push({
      type: 'unchanged',
      originalLineNumber: startOriginalLine + lines.length - 1,
      modifiedLineNumber: startModifiedLine + lines.length - 1,
      originalContent: lines[lines.length - 1],
      modifiedContent: lines[lines.length - 1]
    });

    return {
      rows,
      originalAdvance: lines.length,
      modifiedAdvance: lines.length
    };
  }

  private persistHistory(): void {
    if (!this.originalCode.trim() && !this.modifiedCode.trim()) {
      return;
    }

    const snapshot: ComparisonHistoryItem = {
      id: this.generateId(),
      createdAt: Date.now(),
      originalCode: this.originalCode,
      modifiedCode: this.modifiedCode,
      originalLanguage: this.originalLanguage,
      modifiedLanguage: this.modifiedLanguage,
      additions: this.additionsCount,
      deletions: this.deletionsCount,
      modifications: this.modificationsCount
    };

    const history = this.readHistory().filter((item) => {
      return !(item.originalCode === snapshot.originalCode && item.modifiedCode === snapshot.modifiedCode);
    });

    history.unshift(snapshot);
    this.comparisonHistory = history.slice(0, 5);
    localStorage.setItem(CodeComparatorComponent.HISTORY_KEY, JSON.stringify(this.comparisonHistory));
  }

  private restoreSharedComparison(sessionId: string): void {
    const shareStore = this.readSharedComparisons();
    const shared = shareStore[sessionId];

    if (!shared) {
      return;
    }

    this.splitMode = shared.splitMode || 'vertical';
    this.wordWrapEnabled = shared.wordWrapEnabled !== false;
    this.ignoreWhitespace = !!shared.ignoreWhitespace;
    this.showUnchanged = !!shared.showUnchanged;
    this.setEditorValues(shared.originalCode || '', shared.modifiedCode || '');
    this.updateEditorOptions();
    this.statusMessage = 'Shared comparison restored.';
    this.compareNow();
  }

  private setEditorValues(original: string, modified: string): void {
    this.suppressEditorEvents = true;
    this.originalCode = original;
    this.modifiedCode = modified;

    if (this.originalModel) {
      this.originalModel.setValue(original);
    }

    if (this.modifiedModel) {
      this.modifiedModel.setValue(modified);
    }

    this.updateDetectedLanguages();
    this.suppressEditorEvents = false;
  }

  private detectLanguage(content: string): string {
    const sample = content.trim();

    if (!sample) {
      return 'plaintext';
    }

    if ((sample.startsWith('{') && sample.endsWith('}')) || (sample.startsWith('[') && sample.endsWith(']'))) {
      try {
        JSON.parse(sample);
        return 'json';
      } catch (error) {
        // Fall through to generic heuristics.
      }
    }

    if (sample.indexOf('SELECT ') > -1 || sample.indexOf('select ') > -1 || sample.indexOf('FROM ') > -1) {
      return 'sql';
    }

    if (sample.indexOf('function ') > -1 || sample.indexOf('const ') > -1 || sample.indexOf('=>') > -1) {
      return sample.indexOf('interface ') > -1 || sample.indexOf(': string') > -1 ? 'typescript' : 'javascript';
    }

    if (sample.indexOf('def ') > -1 || sample.indexOf('import ') > -1 || sample.indexOf('print(') > -1) {
      return 'python';
    }

    if (sample.indexOf('<html') > -1 || sample.indexOf('<div') > -1 || sample.indexOf('</') > -1) {
      return 'html';
    }

    if (sample.indexOf('{') > -1 && sample.indexOf('}') > -1 && sample.indexOf(':') > -1 && sample.indexOf(';') > -1) {
      return 'css';
    }

    if (sample.indexOf('#!/bin/') === 0 || sample.indexOf('echo ') > -1 || sample.indexOf('export ') > -1) {
      return 'shell';
    }

    if (sample.indexOf('public class ') > -1 || sample.indexOf('System.out.println') > -1) {
      return 'java';
    }

    if (sample.indexOf('# ') === 0 || sample.indexOf('## ') > -1 || sample.indexOf('```') > -1) {
      return 'markdown';
    }

    if (sample.indexOf('<?xml') === 0) {
      return 'xml';
    }

    return 'plaintext';
  }

  getLanguageLabel(language: string): string {
    const labels: { [key: string]: string } = {
      css: 'CSS',
      html: 'HTML',
      java: 'Java',
      javascript: 'JavaScript',
      json: 'JSON',
      markdown: 'Markdown',
      mixed: 'Mixed Languages',
      plaintext: 'Plain Text',
      python: 'Python',
      shell: 'Shell',
      sql: 'SQL',
      typescript: 'TypeScript',
      xml: 'XML'
    };

    return labels[language] || 'Plain Text';
  }

  private countLines(content: string): number {
    if (!content) {
      return 0;
    }

    return content.split(/\r?\n/).length;
  }

  private toLines(content: string): string[] {
    if (!content) {
      return [];
    }

    const normalized = content.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');

    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    return lines;
  }

  private readHistory(): ComparisonHistoryItem[] {
    try {
      const rawValue = localStorage.getItem(CodeComparatorComponent.HISTORY_KEY);
      return rawValue ? JSON.parse(rawValue) : [];
    } catch (error) {
      return [];
    }
  }

  private readSharedComparisons(): { [key: string]: SharedComparisonPayload } {
    try {
      const rawValue = localStorage.getItem(CodeComparatorComponent.SHARE_KEY);
      return rawValue ? JSON.parse(rawValue) : {};
    } catch (error) {
      return {};
    }
  }

  private copyText(value: string): void {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private layoutEditors(): void {
    if (this.originalEditor) {
      this.originalEditor.layout();
    }

    if (this.modifiedEditor) {
      this.modifiedEditor.layout();
    }
  }

  private generateId(): string {
    return Math.random().toString(36).slice(2, 10);
  }
}
