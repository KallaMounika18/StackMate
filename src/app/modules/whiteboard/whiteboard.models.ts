import { Theme } from '../../services/theme.service';

export type WhiteboardHostTheme = Theme;

export type WhiteboardTool =
  | 'selection'
  | 'rectangle'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'text';

export interface WhiteboardSceneSnapshot {
  sceneJson: string;
  elementCount: number;
  isEmpty: boolean;
  zoom: number;
  activeTool: string;
  updatedAt: number;
}

export interface WhiteboardBoard extends WhiteboardSceneSnapshot {
  id: string;
  name: string;
  createdAt: number;
}

export interface WhiteboardWorkspaceState {
  boards: WhiteboardBoard[];
  lastOpenedBoardId: string | null;
}

export interface WhiteboardPngExport {
  dataUrl: string;
  fileName: string;
}
