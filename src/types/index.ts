import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';

export interface IWorkspace {
  id: number;
  title: string;
}

export interface ITab {
  id: number;
  title: string;
  workspaceId: number;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
}

export interface AppData {
  tabs: ITab[];
  currentTabId: number;
  workspaces: IWorkspace[];
  currentWorkspaceId: number;
}

export interface ExcalidrawFileFormat {
  type: 'excalidraw';
  version: 2;
  title: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
}
