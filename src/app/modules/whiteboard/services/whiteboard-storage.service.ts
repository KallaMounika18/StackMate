import { Injectable } from '@angular/core';
import { Theme } from '../../../services/theme.service';
import { WhiteboardBoard, WhiteboardWorkspaceState } from '../whiteboard.models';

@Injectable()
export class WhiteboardStorageService {
  private readonly STORAGE_KEY = 'stackmate_whiteboard_workspace_v1';
  private readonly DEFAULT_BOARD_NAME = 'New Board';

  loadWorkspace(theme: Theme): WhiteboardWorkspaceState {
    const fallbackWorkspace = this.createInitialWorkspace(theme);
    const savedWorkspace = localStorage.getItem(this.STORAGE_KEY);

    if (!savedWorkspace) {
      return fallbackWorkspace;
    }

    try {
      const parsedWorkspace = JSON.parse(savedWorkspace);
      const boards = Array.isArray(parsedWorkspace.boards)
        ? parsedWorkspace.boards
            .map((board: any) => this.normalizeBoard(board, theme))
            .filter((board: WhiteboardBoard | null): board is WhiteboardBoard => board !== null)
        : [];

      if (!boards.length) {
        return fallbackWorkspace;
      }

      const lastOpenedBoardId = this.findBoard(
        boards,
        parsedWorkspace.lastOpenedBoardId
      )
        ? parsedWorkspace.lastOpenedBoardId
        : boards[0].id;

      return {
        boards,
        lastOpenedBoardId
      };
    } catch (error) {
      return fallbackWorkspace;
    }
  }

  saveWorkspace(workspace: WhiteboardWorkspaceState): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workspace));
  }

  createBoard(theme: Theme, existingBoards: WhiteboardBoard[], baseName?: string): WhiteboardBoard {
    const name = this.buildUniqueName(baseName || this.DEFAULT_BOARD_NAME, existingBoards);
    const now = Date.now();

    return {
      id: this.createId(),
      name,
      createdAt: now,
      updatedAt: now,
      sceneJson: this.createSceneJson(theme, name),
      elementCount: 0,
      isEmpty: true,
      zoom: 100,
      activeTool: 'selection'
    };
  }

  duplicateBoard(sourceBoard: WhiteboardBoard, theme: Theme, existingBoards: WhiteboardBoard[]): WhiteboardBoard {
    const name = this.buildUniqueName(sourceBoard.name + ' Copy', existingBoards);
    const now = Date.now();

    return {
      id: this.createId(),
      name,
      createdAt: now,
      updatedAt: now,
      sceneJson: this.withSceneMetadata(sourceBoard.sceneJson, theme, name),
      elementCount: sourceBoard.elementCount,
      isEmpty: sourceBoard.isEmpty,
      zoom: sourceBoard.zoom,
      activeTool: sourceBoard.activeTool || 'selection'
    };
  }

  createImportedBoard(sceneJson: string, theme: Theme, fileName: string, existingBoards: WhiteboardBoard[]): WhiteboardBoard {
    const name = this.buildUniqueName(this.stripExtension(fileName) || 'Imported Board', existingBoards);
    const now = Date.now();

    return {
      id: this.createId(),
      name,
      createdAt: now,
      updatedAt: now,
      sceneJson: this.withSceneMetadata(sceneJson, theme, name),
      elementCount: 0,
      isEmpty: true,
      zoom: 100,
      activeTool: 'selection'
    };
  }

  private createInitialWorkspace(theme: Theme): WhiteboardWorkspaceState {
    const board = this.createBoard(theme, [], this.DEFAULT_BOARD_NAME);

    return {
      boards: [board],
      lastOpenedBoardId: board.id
    };
  }

  private normalizeBoard(board: any, theme: Theme): WhiteboardBoard | null {
    if (!board || typeof board.id !== 'string') {
      return null;
    }

    const name = typeof board.name === 'string' && board.name.trim()
      ? board.name.trim()
      : this.DEFAULT_BOARD_NAME;
    const createdAt = typeof board.createdAt === 'number' ? board.createdAt : Date.now();
    const updatedAt = typeof board.updatedAt === 'number' ? board.updatedAt : createdAt;

    return {
      id: board.id,
      name,
      createdAt,
      updatedAt,
      sceneJson: this.withSceneMetadata(typeof board.sceneJson === 'string' ? board.sceneJson : '', theme, name),
      elementCount: typeof board.elementCount === 'number' ? board.elementCount : 0,
      isEmpty: typeof board.isEmpty === 'boolean' ? board.isEmpty : true,
      zoom: typeof board.zoom === 'number' ? board.zoom : 100,
      activeTool: typeof board.activeTool === 'string' ? board.activeTool : 'selection'
    };
  }

  private createSceneJson(theme: Theme, name: string): string {
    return JSON.stringify({
      type: 'excalidraw',
      version: 2,
      source: 'StackMate Whiteboard',
      elements: [],
      appState: {
        name,
        theme,
        viewBackgroundColor: this.getThemeBackground(theme),
        exportBackground: true,
        exportWithDarkMode: theme === 'dark',
        gridSize: null
      },
      files: {}
    }, null, 2);
  }

  private withSceneMetadata(sceneJson: string, theme: Theme, name: string): string {
    const parsedScene = this.safeParseScene(sceneJson);
    const appState = parsedScene.appState || {};

    parsedScene.type = parsedScene.type || 'excalidraw';
    parsedScene.version = parsedScene.version || 2;
    parsedScene.source = parsedScene.source || 'StackMate Whiteboard';
    parsedScene.elements = Array.isArray(parsedScene.elements) ? parsedScene.elements : [];
    parsedScene.files = parsedScene.files || {};
    parsedScene.appState = {
      ...appState,
      name,
      theme,
      viewBackgroundColor: this.getThemeBackground(theme),
      exportBackground: true,
      exportWithDarkMode: theme === 'dark',
      gridSize: typeof appState.gridSize === 'number' ? appState.gridSize : null
    };

    return JSON.stringify(parsedScene, null, 2);
  }

  private safeParseScene(sceneJson: string): any {
    if (!sceneJson) {
      return {};
    }

    try {
      return JSON.parse(sceneJson);
    } catch (error) {
      return {};
    }
  }

  private buildUniqueName(baseName: string, boards: WhiteboardBoard[]): string {
    const normalizedBase = baseName && baseName.trim() ? baseName.trim() : this.DEFAULT_BOARD_NAME;
    const existingNames = boards.map((board) => board.name.toLowerCase());

    if (existingNames.indexOf(normalizedBase.toLowerCase()) === -1) {
      return normalizedBase;
    }

    let index = 2;
    let candidate = normalizedBase + ' ' + index;

    while (existingNames.indexOf(candidate.toLowerCase()) !== -1) {
      index += 1;
      candidate = normalizedBase + ' ' + index;
    }

    return candidate;
  }

  private stripExtension(fileName: string): string {
    return fileName.replace(/\.(excalidraw\.json|json|excalidraw)$/i, '');
  }

  private createId(): string {
    return 'board-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  private getThemeBackground(theme: Theme): string {
    return theme === 'light' ? '#ffffff' : '#0f172a';
  }

  private findBoard(boards: WhiteboardBoard[], boardId: any): WhiteboardBoard | null {
    if (typeof boardId !== 'string') {
      return null;
    }

    return boards.find((board) => board.id === boardId) || null;
  }
}
