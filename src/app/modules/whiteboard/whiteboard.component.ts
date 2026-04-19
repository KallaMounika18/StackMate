import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { Theme, ThemeService } from '../../services/theme.service';
import {
  WhiteboardBoard,
  WhiteboardHostTheme,
  WhiteboardPngExport,
  WhiteboardSceneSnapshot,
  WhiteboardTool,
  WhiteboardWorkspaceState
} from './whiteboard.models';
import { WhiteboardBridgeService } from './services/whiteboard-bridge.service';
import { WhiteboardStorageService } from './services/whiteboard-storage.service';

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('whiteboardFrame', { static: true })
  whiteboardFrameRef!: ElementRef<HTMLIFrameElement>;

  @ViewChild('importInput', { static: false })
  importInputRef!: ElementRef<HTMLInputElement>;

  readonly frameUrl: SafeResourceUrl;
  readonly toolButtons = [
    { id: 'selection', label: 'Select', icon: 'SEL', title: 'Select, move, resize, and rotate elements.' },
    { id: 'rectangle', label: 'Rect', icon: '[]', title: 'Draw rectangles.' },
    { id: 'ellipse', label: 'Circle', icon: '()', title: 'Draw circles and ellipses.' },
    { id: 'arrow', label: 'Arrow', icon: '->', title: 'Connect ideas with arrows.' },
    { id: 'line', label: 'Line', icon: '/', title: 'Draw straight connector lines.' },
    { id: 'freedraw', label: 'Sketch', icon: 'PEN', title: 'Freehand sketching.' },
    { id: 'text', label: 'Text', icon: 'TXT', title: 'Insert labels and annotations.' }
  ];

  workspace: WhiteboardWorkspaceState = {
    boards: [],
    lastOpenedBoardId: null
  };
  currentBoardId: string | null = null;
  draftBoardName = '';
  selectedTool: WhiteboardTool = 'selection';
  isBoardShelfOpen = false;
  isFrameReady = false;
  isCanvasLoading = true;
  isImporting = false;
  isSaving = false;
  saveIndicator = 'Initializing whiteboard...';
  saveTone: 'neutral' | 'saving' | 'success' | 'warning' = 'neutral';

  private autosaveTimer: number | null = null;
  private pendingBoardLoadId: string | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    public themeService: ThemeService,
    sanitizer: DomSanitizer,
    private bridge: WhiteboardBridgeService,
    private storage: WhiteboardStorageService
  ) {
    this.frameUrl = sanitizer.bypassSecurityTrustResourceUrl('assets/excalidraw/frame.html');
  }

  get currentBoard(): WhiteboardBoard | null {
    if (!this.currentBoardId) {
      return null;
    }

    return this.workspace.boards.find((board) => board.id === this.currentBoardId) || null;
  }

  get recentBoards(): WhiteboardBoard[] {
    return this.workspace.boards
      .slice()
      .sort((leftBoard, rightBoard) => rightBoard.updatedAt - leftBoard.updatedAt);
  }

  get totalElements(): number {
    return this.workspace.boards.reduce((total, board) => total + board.elementCount, 0);
  }

  get emptyStateVisible(): boolean {
    return !!this.currentBoard && this.currentBoard.isEmpty && this.isFrameReady && !this.isCanvasLoading;
  }

  ngOnInit(): void {
    this.workspace = this.storage.loadWorkspace(this.themeService.currentTheme);
    this.currentBoardId = this.workspace.lastOpenedBoardId || (this.workspace.boards[0] && this.workspace.boards[0].id) || null;
    this.draftBoardName = this.currentBoard ? this.currentBoard.name : '';

    this.subscriptions.push(
      this.bridge.ready$.subscribe((isReady) => {
        this.isFrameReady = isReady;

        if (isReady && this.currentBoardId) {
          this.loadBoard(this.currentBoardId);
        }
      }),
      this.bridge.sceneSnapshot$.subscribe((snapshot) => {
        if (!this.currentBoardId) {
          return;
        }

        const changed = this.applySnapshotToBoard(this.currentBoardId, snapshot);

        if (changed) {
          this.queueAutosave('Autosaving board...');
        }
      }),
      this.themeService.theme$.subscribe((theme) => {
        this.syncTheme(theme);
      })
    );
  }

  ngAfterViewInit(): void {
    this.bridge.attachFrame(this.whiteboardFrameRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.autosaveTimer !== null) {
      window.clearTimeout(this.autosaveTimer);
    }

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.bridge.detachFrame();
  }

  trackBoard(index: number, board: WhiteboardBoard): string {
    return board.id;
  }

  toggleBoardShelf(): void {
    this.isBoardShelfOpen = !this.isBoardShelfOpen;
  }

  closeBoardShelf(): void {
    this.isBoardShelfOpen = false;
  }

  async selectBoard(boardId: string): Promise<void> {
    if (boardId === this.currentBoardId && this.isFrameReady) {
      return;
    }

    await this.commitBoardName();

    this.currentBoardId = boardId;
    this.workspace.lastOpenedBoardId = boardId;
    this.storage.saveWorkspace(this.workspace);

    const board = this.getBoard(boardId);
    this.draftBoardName = board ? board.name : '';

    if (window.innerWidth <= 1100) {
      this.isBoardShelfOpen = false;
    }

    if (this.isFrameReady) {
      this.loadBoard(boardId);
    }
  }

  onBoardNameInput(value: string): void {
    this.draftBoardName = value;
  }

  async commitBoardName(): Promise<void> {
    const board = this.currentBoard;

    if (!board) {
      return;
    }

    const normalizedName = this.normalizeBoardName(this.draftBoardName);
    this.draftBoardName = normalizedName;

    if (normalizedName === board.name) {
      return;
    }

    this.workspace.boards = this.workspace.boards.map((item) =>
      item.id === board.id
        ? { ...item, name: normalizedName }
        : item
    );

    this.storage.saveWorkspace(this.workspace);

    if (!this.isFrameReady) {
      this.saveTone = 'success';
      this.saveIndicator = this.buildStatusLabel('Renamed');
      return;
    }

    this.saveTone = 'saving';
    this.saveIndicator = 'Syncing board name...';

    try {
      const snapshot = await this.bridge.setBoardName(normalizedName);
      this.applySnapshotToBoard(board.id, snapshot);
      this.persistWorkspace(this.buildStatusLabel('Renamed'));
    } catch (error) {
      this.saveTone = 'warning';
      this.saveIndicator = 'Board name sync failed';
    }
  }

  async createBoard(): Promise<void> {
    await this.commitBoardName();

    const board = this.storage.createBoard(this.themeService.currentTheme, this.workspace.boards);
    this.workspace.boards = [board].concat(this.workspace.boards);
    this.workspace.lastOpenedBoardId = board.id;
    this.currentBoardId = board.id;
    this.draftBoardName = board.name;
    this.persistWorkspace(this.buildStatusLabel('Created new board'));

    if (this.isFrameReady) {
      this.loadBoard(board.id);
    }
  }

  async duplicateBoard(): Promise<void> {
    const currentBoard = this.currentBoard;

    if (!currentBoard) {
      return;
    }

    await this.commitBoardName();

    const duplicateBoard = this.storage.duplicateBoard(
      currentBoard,
      this.themeService.currentTheme,
      this.workspace.boards
    );

    this.workspace.boards = [duplicateBoard].concat(this.workspace.boards);
    this.workspace.lastOpenedBoardId = duplicateBoard.id;
    this.currentBoardId = duplicateBoard.id;
    this.draftBoardName = duplicateBoard.name;
    this.persistWorkspace(this.buildStatusLabel('Duplicated board'));

    if (this.isFrameReady) {
      this.loadBoard(duplicateBoard.id);
    }
  }

  async selectTool(tool: WhiteboardTool): Promise<void> {
    if (!this.currentBoard || !this.isFrameReady) {
      return;
    }

    try {
      const snapshot = await this.bridge.setActiveTool(tool);
      this.applySnapshotToBoard(this.currentBoard.id, snapshot);
      this.selectedTool = tool;
      this.storage.saveWorkspace(this.workspace);
    } catch (error) {
      this.saveTone = 'warning';
      this.saveIndicator = 'Tool switch failed';
    }
  }

  async undo(): Promise<void> {
    await this.runSnapshotCommand(this.bridge.undo(), 'Reverted change');
  }

  async redo(): Promise<void> {
    await this.runSnapshotCommand(this.bridge.redo(), 'Reapplied change');
  }

  async zoomIn(): Promise<void> {
    await this.runSnapshotCommand(this.bridge.zoomIn(), 'Zoom updated', false);
  }

  async zoomOut(): Promise<void> {
    await this.runSnapshotCommand(this.bridge.zoomOut(), 'Zoom updated', false);
  }

  async zoomToFit(): Promise<void> {
    await this.runSnapshotCommand(this.bridge.zoomToFit(), 'Canvas fitted', false);
  }

  async clearCanvas(): Promise<void> {
    const board = this.currentBoard;

    if (!board || !this.isFrameReady) {
      return;
    }

    await this.commitBoardName();
    await this.runSnapshotCommand(
      this.bridge.clearCanvas(board.name, this.themeService.currentTheme),
      'Canvas cleared'
    );
  }

  async saveBoard(): Promise<void> {
    const board = this.currentBoard;

    if (!board || !this.isFrameReady) {
      return;
    }

    await this.commitBoardName();
    this.saveTone = 'saving';
    this.saveIndicator = 'Saving board...';

    try {
      const snapshot = await this.bridge.getScene();
      this.applySnapshotToBoard(board.id, snapshot);
      this.persistWorkspace(this.buildStatusLabel('Saved'));
    } catch (error) {
      this.saveTone = 'warning';
      this.saveIndicator = 'Save failed';
    }
  }

  async exportJson(): Promise<void> {
    const board = this.currentBoard;

    if (!board || !this.isFrameReady) {
      return;
    }

    await this.commitBoardName();

    try {
      const snapshot = await this.bridge.getScene();
      this.applySnapshotToBoard(board.id, snapshot);
      this.persistWorkspace(this.buildStatusLabel('Prepared JSON export'));
      this.downloadText(
        this.getFileName(board.name, 'excalidraw.json'),
        snapshot.sceneJson,
        'application/json'
      );
    } catch (error) {
      this.saveTone = 'warning';
      this.saveIndicator = 'JSON export failed';
    }
  }

  async exportPng(): Promise<void> {
    const board = this.currentBoard;

    if (!board || !this.isFrameReady) {
      return;
    }

    await this.commitBoardName();
    this.saveTone = 'saving';
    this.saveIndicator = 'Rendering PNG...';

    try {
      const pngExport = await this.bridge.exportPng(board.name, this.themeService.currentTheme);
      this.downloadDataUrl(pngExport);
      this.saveTone = 'success';
      this.saveIndicator = this.buildStatusLabel('PNG exported');
    } catch (error) {
      this.saveTone = 'warning';
      this.saveIndicator = 'PNG export failed';
    }
  }

  triggerImport(): void {
    if (this.importInputRef && this.importInputRef.nativeElement) {
      this.importInputRef.nativeElement.click();
    }
  }

  async onImportSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (!input.files || !input.files.length) {
      return;
    }

    await this.commitBoardName();
    this.isImporting = true;
    this.saveTone = 'saving';
    this.saveIndicator = 'Importing board...';

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const sceneJson = String(reader.result || '');
        JSON.parse(sceneJson);

        const importedBoard = this.storage.createImportedBoard(
          sceneJson,
          this.themeService.currentTheme,
          file.name,
          this.workspace.boards
        );

        this.workspace.boards = [importedBoard].concat(this.workspace.boards);
        this.workspace.lastOpenedBoardId = importedBoard.id;
        this.currentBoardId = importedBoard.id;
        this.draftBoardName = importedBoard.name;
        this.persistWorkspace(this.buildStatusLabel('Imported board'));

        if (this.isFrameReady) {
          await this.loadBoard(importedBoard.id);
        }
      } catch (error) {
        this.saveTone = 'warning';
        this.saveIndicator = 'Import failed: invalid JSON file';
      } finally {
        this.isImporting = false;
        input.value = '';
      }
    };

    reader.onerror = () => {
      this.isImporting = false;
      this.saveTone = 'warning';
      this.saveIndicator = 'Import failed while reading the file';
      input.value = '';
    };

    reader.readAsText(file);
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  labelForTool(tool: string): string {
    const matchingTool = this.toolButtons.find((button) => button.id === tool);
    return matchingTool ? matchingTool.label : 'Select';
  }

  private async loadBoard(boardId: string): Promise<void> {
    const board = this.getBoard(boardId);

    if (!board || !this.isFrameReady) {
      return;
    }

    this.pendingBoardLoadId = boardId;
    this.isCanvasLoading = true;
    this.saveTone = 'saving';
    this.saveIndicator = 'Loading board...';

    try {
      const snapshot = await this.bridge.loadScene(
        board.sceneJson,
        board.name,
        this.themeService.currentTheme
      );

      if (this.pendingBoardLoadId !== boardId || this.currentBoardId !== boardId) {
        return;
      }

      this.applySnapshotToBoard(boardId, snapshot);
      this.draftBoardName = board.name;
      this.persistWorkspace(this.buildStatusLabel('Board ready'));
    } catch (error) {
      this.saveTone = 'warning';
      this.saveIndicator = 'Board failed to load';
    } finally {
      if (this.pendingBoardLoadId === boardId) {
        this.pendingBoardLoadId = null;
      }

      if (this.currentBoardId === boardId) {
        this.isCanvasLoading = false;
      }
    }
  }

  private async syncTheme(theme: Theme): Promise<void> {
    if (!this.isFrameReady || !this.currentBoardId) {
      return;
    }

    try {
      const snapshot = await this.bridge.setTheme(theme);
      this.applySnapshotToBoard(this.currentBoardId, snapshot);
      this.storage.saveWorkspace(this.workspace);
    } catch (error) {
      this.saveTone = 'warning';
      this.saveIndicator = 'Theme sync failed';
    }
  }

  private async runSnapshotCommand(
    command: Promise<WhiteboardSceneSnapshot>,
    successLabel: string,
    persist = true
  ): Promise<void> {
    const board = this.currentBoard;

    if (!board) {
      return;
    }

    this.saveTone = 'saving';
    this.saveIndicator = successLabel + '...';

    try {
      const snapshot = await command;
      this.applySnapshotToBoard(board.id, snapshot);

      if (persist) {
        this.persistWorkspace(this.buildStatusLabel(successLabel));
      } else {
        this.storage.saveWorkspace(this.workspace);
        this.saveTone = 'success';
        this.saveIndicator = this.buildStatusLabel(successLabel);
      }
    } catch (error) {
      this.saveTone = 'warning';
      this.saveIndicator = 'Canvas action failed';
    }
  }

  private applySnapshotToBoard(boardId: string, snapshot: WhiteboardSceneSnapshot): boolean {
    let changed = false;

    this.workspace.boards = this.workspace.boards.map((board) => {
      if (board.id !== boardId) {
        return board;
      }

      changed = board.sceneJson !== snapshot.sceneJson
        || board.elementCount !== snapshot.elementCount
        || board.isEmpty !== snapshot.isEmpty
        || board.zoom !== snapshot.zoom
        || board.activeTool !== snapshot.activeTool;

      return {
        ...board,
        sceneJson: snapshot.sceneJson,
        elementCount: snapshot.elementCount,
        isEmpty: snapshot.isEmpty,
        zoom: snapshot.zoom,
        activeTool: snapshot.activeTool,
        updatedAt: changed ? snapshot.updatedAt : board.updatedAt
      };
    });

    if (this.currentBoardId === boardId) {
      this.selectedTool = this.normalizeTool(snapshot.activeTool);
    }

    return changed;
  }

  private queueAutosave(label: string): void {
    this.isSaving = true;
    this.saveTone = 'saving';
    this.saveIndicator = label;

    if (this.autosaveTimer !== null) {
      window.clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = window.setTimeout(() => {
      this.persistWorkspace(this.buildStatusLabel('Autosaved'));
    }, 280);
  }

  private persistWorkspace(message: string): void {
    this.storage.saveWorkspace(this.workspace);
    this.isSaving = false;
    this.saveTone = 'success';
    this.saveIndicator = message;
  }

  private normalizeBoardName(value: string): string {
    return value && value.trim() ? value.trim() : 'New Board';
  }

  private normalizeTool(tool: string): WhiteboardTool {
    const matchingTool = this.toolButtons.find((button) => button.id === tool);
    return matchingTool ? matchingTool.id as WhiteboardTool : 'selection';
  }

  private buildStatusLabel(prefix: string): string {
    return prefix + ' · ' + new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getBoard(boardId: string): WhiteboardBoard | null {
    return this.workspace.boards.find((board) => board.id === boardId) || null;
  }

  private getFileName(name: string, extension: string): string {
    const safeName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'stackmate-whiteboard';

    return safeName + '.' + extension;
  }

  private downloadText(fileName: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    this.downloadUrl(fileName, url);
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  private downloadDataUrl(exportedPng: WhiteboardPngExport): void {
    this.downloadUrl(exportedPng.fileName, exportedPng.dataUrl);
  }

  private downloadUrl(fileName: string, url: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    link.click();
  }
}
