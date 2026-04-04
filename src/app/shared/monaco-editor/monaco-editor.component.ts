import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

declare const monaco: any;

@Component({
  selector: 'app-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss']
})
export class MonacoEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;

  @Input() value = '';
  @Input() language = 'plaintext';
  @Input() height = 320;
  @Input() readOnly = false;
  @Input() minimap = true;
  @Input() wordWrap = true;
  @Input() placeholder = '';
  @Input() markers: any[] = [];
  @Output() valueChange = new EventEmitter<string>();
  @Output() languageDetected = new EventEmitter<string>();

  monacoReady = false;
  monacoFailed = false;

  private editor: any;
  private model: any;
  private suppressEvents = false;
  private themeSubscription?: Subscription;

  constructor(private readonly themeService: ThemeService) {}

  ngAfterViewInit(): void {
    this.bootstrapMonaco();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value && !changes.value.firstChange && this.model && this.model.getValue() !== this.value) {
      this.suppressEvents = true;
      this.model.setValue(this.value || '');
      this.suppressEvents = false;
      this.detectAndApplyLanguage(this.value || '');
    }

    if ((changes.markers && !changes.markers.firstChange) || (changes.language && !changes.language.firstChange)) {
      this.applyMarkers();
    }

    if (this.editor && ((changes.wordWrap && !changes.wordWrap.firstChange) || (changes.readOnly && !changes.readOnly.firstChange))) {
      this.editor.updateOptions({
        readOnly: this.readOnly,
        wordWrap: this.wordWrap ? 'on' : 'off'
      });
    }
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }

    if (this.editor) {
      this.editor.dispose();
    }

    if (this.model) {
      this.model.dispose();
    }
  }

  private bootstrapMonaco(): void {
    const amdRequire = (window as any).require;

    if (typeof monaco !== 'undefined' && monaco.editor) {
      this.initializeEditor();
      return;
    }

    if (!amdRequire) {
      this.monacoReady = false;
      this.monacoFailed = true;
      return;
    }

    amdRequire.config({ paths: { vs: 'assets/monaco/vs' } });
    amdRequire(
      ['vs/editor/editor.main'],
      () => this.initializeEditor(),
      () => {
        this.monacoReady = false;
        this.monacoFailed = true;
      }
    );
  }

  private initializeEditor(): void {
    monaco.editor.setTheme(this.themeService.currentTheme === 'dark' ? 'vs-dark' : 'vs');
    this.model = monaco.editor.createModel(this.value || '', this.language || 'plaintext');
    this.editor = monaco.editor.create(this.editorHost.nativeElement, {
      model: this.model,
      automaticLayout: true,
      readOnly: this.readOnly,
      minimap: { enabled: this.minimap },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      wordWrap: this.wordWrap ? 'on' : 'off',
      roundedSelection: true,
      fontFamily: 'JetBrains Mono',
      fontSize: 13,
      padding: { top: 16, bottom: 16 }
    });

    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      if (typeof monaco !== 'undefined' && monaco.editor) {
        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
      }
    });

    this.editor.onDidChangeModelContent(() => {
      if (this.suppressEvents) {
        return;
      }

      const nextValue = this.model.getValue();
      this.valueChange.emit(nextValue);
      this.detectAndApplyLanguage(nextValue);
    });

    this.monacoReady = true;
    this.detectAndApplyLanguage(this.value || '');
    this.applyMarkers();
  }

  private detectAndApplyLanguage(content: string): void {
    const nextLanguage = this.language === 'auto' ? this.detectLanguage(content) : this.language;

    if (this.model) {
      monaco.editor.setModelLanguage(this.model, nextLanguage || 'plaintext');
    }

    this.languageDetected.emit(nextLanguage || 'plaintext');
    this.applyMarkers();
  }

  private applyMarkers(): void {
    if (!this.model || typeof monaco === 'undefined' || !monaco.editor) {
      return;
    }

    monaco.editor.setModelMarkers(this.model, 'stackmate', this.markers || []);
  }

  private detectLanguage(content: string): string {
    const sample = (content || '').trim();

    if (!sample) {
      return 'plaintext';
    }

    if ((sample.charAt(0) === '{' || sample.charAt(0) === '[') && sample.indexOf(':') > -1) {
      return 'json';
    }

    if (sample.indexOf('function ') > -1 || sample.indexOf('const ') > -1 || sample.indexOf('=>') > -1) {
      return sample.indexOf('interface ') > -1 ? 'typescript' : 'javascript';
    }

    if (sample.indexOf('def ') > -1 || sample.indexOf('print(') > -1) {
      return 'python';
    }

    if (sample.indexOf('<') > -1 && sample.indexOf('>') > -1 && sample.indexOf('</') > -1) {
      return 'html';
    }

    if (sample.indexOf('SELECT ') > -1 || sample.indexOf('FROM ') > -1) {
      return 'sql';
    }

    if (sample.indexOf('# ') === 0 || sample.indexOf('## ') > -1) {
      return 'markdown';
    }

    if (sample.indexOf('{') > -1 && sample.indexOf('}') > -1 && sample.indexOf(';') > -1) {
      return 'css';
    }

    return 'plaintext';
  }
}
