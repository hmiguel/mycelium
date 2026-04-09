import type { AppData } from '../types';

const STORAGE_KEY = 'excalidraw-tabs-data';

function migrateAppData(raw: AppData): AppData {
  if (!raw.workspaces) {
    return {
      ...raw,
      workspaces: [{ id: 0, title: 'Default' }],
      currentWorkspaceId: 0,
      tabs: raw.tabs.map((tab) => ({
        ...tab,
        workspaceId: (tab as { workspaceId?: number }).workspaceId ?? 0,
      })),
    };
  }
  return raw;
}

export const saveAppData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getAppData = (): AppData | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  return migrateAppData(JSON.parse(data) as AppData);
};
