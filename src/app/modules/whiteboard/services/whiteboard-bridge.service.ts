import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  WhiteboardHostTheme,
  WhiteboardPngExport,
  WhiteboardSceneSnapshot,
  WhiteboardTool
} from '../whiteboard.models';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutId: number;
}

@Injectable()
export class WhiteboardBridgeService implements OnDestroy {
  private readonly HOST_SOURCE = 'stackmate-whiteboard-host';
  private readonly PARENT_SOURCE = 'stackmate-whiteboard-parent';
  private readonly RESPONSE_TIMEOUT = 12000;

  private frameWindow: Window | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;
  private readyResolver: (() => void) | null = null;
  private readyPromise: Promise<void>;

  private readonly readySubject = new BehaviorSubject<boolean>(false);
  private readonly snapshotSubject = new Subject<WhiteboardSceneSnapshot>();

  readonly ready$ = this.readySubject.asObservable();
  readonly sceneSnapshot$ = this.snapshotSubject.asObservable();

  constructor() {
    this.resetReadyPromise();
    window.addEventListener('message', this.handleMessage);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.handleMessage);
    this.detachFrame();
  }

  attachFrame(frame: HTMLIFrameElement): void {
    this.frameWindow = frame.contentWindow;
    this.readySubject.next(false);
    this.resetReadyPromise();
  }

  detachFrame(): void {
    this.frameWindow = null;
    this.readySubject.next(false);
    this.rejectPendingRequests('Whiteboard frame detached');
    this.resetReadyPromise();
  }

  loadScene(sceneJson: string, name: string, theme: WhiteboardHostTheme): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('load-scene', {
      sceneJson,
      name,
      theme
    });
  }

  setTheme(theme: WhiteboardHostTheme): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('set-theme', { theme });
  }

  setBoardName(name: string): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('set-board-name', { name });
  }

  setActiveTool(tool: WhiteboardTool): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('set-active-tool', { tool });
  }

  undo(): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('undo');
  }

  redo(): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('redo');
  }

  zoomIn(): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('zoom-in');
  }

  zoomOut(): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('zoom-out');
  }

  zoomToFit(): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('zoom-to-fit');
  }

  clearCanvas(name: string, theme: WhiteboardHostTheme): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('clear-canvas', {
      name,
      theme
    });
  }

  getScene(): Promise<WhiteboardSceneSnapshot> {
    return this.sendRequest<WhiteboardSceneSnapshot>('get-scene');
  }

  exportPng(fileName: string, theme: WhiteboardHostTheme): Promise<WhiteboardPngExport> {
    return this.sendRequest<WhiteboardPngExport>('export-png', {
      fileName,
      theme
    });
  }

  private resetReadyPromise(): void {
    this.readyPromise = new Promise<void>((resolve) => {
      this.readyResolver = resolve;
    });
  }

  private resolveReady(): void {
    if (!this.readySubject.value) {
      this.readySubject.next(true);
    }

    if (this.readyResolver) {
      this.readyResolver();
      this.readyResolver = null;
    }
  }

  private rejectPendingRequests(message: string): void {
    this.pendingRequests.forEach((pendingRequest) => {
      window.clearTimeout(pendingRequest.timeoutId);
      pendingRequest.reject(new Error(message));
    });

    this.pendingRequests.clear();
  }

  private async sendRequest<T>(type: string, payload: any = {}): Promise<T> {
    await this.readyPromise;

    if (!this.frameWindow) {
      throw new Error('Whiteboard frame is unavailable');
    }

    const requestId = 'whiteboard-' + (++this.requestCounter);

    return new Promise<T>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Whiteboard host timed out while handling ' + type));
      }, this.RESPONSE_TIMEOUT);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeoutId
      });

      this.frameWindow!.postMessage({
        source: this.PARENT_SOURCE,
        kind: 'request',
        type,
        requestId,
        payload
      }, window.location.origin);
    });
  }

  private handleMessage = (event: MessageEvent): void => {
    if (!this.frameWindow || event.source !== this.frameWindow || event.origin !== window.location.origin) {
      return;
    }

    const data = event.data || {};

    if (data.source !== this.HOST_SOURCE) {
      return;
    }

    if (data.kind === 'event') {
      if (data.type === 'ready') {
        this.resolveReady();
        return;
      }

      if (data.type === 'scene-updated') {
        this.snapshotSubject.next(data.payload as WhiteboardSceneSnapshot);
      }

      return;
    }

    if (data.kind !== 'response' || !data.requestId) {
      return;
    }

    const pendingRequest = this.pendingRequests.get(data.requestId);

    if (!pendingRequest) {
      return;
    }

    window.clearTimeout(pendingRequest.timeoutId);
    this.pendingRequests.delete(data.requestId);

    if (data.success === false) {
      pendingRequest.reject(new Error(data.error || 'Whiteboard host returned an error'));
      return;
    }

    pendingRequest.resolve(data.payload);
  }
}
