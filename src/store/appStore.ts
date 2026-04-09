import { create } from 'zustand';

import type { AppData, ITab, IWorkspace } from '../types';
import { getAppData, saveAppData } from '../utils/storage-utils';

interface AppStoreState extends AppData {
  setCurrentTabId: (id: number) => void;
  createTab: () => number;
  updateTab: (id: number, updatedTab: Partial<ITab>) => void;
  setTabs: (tabs: ITab[]) => void;
  deleteTab: (tabId: number) => void;
  setWorkspaces: (workspaces: IWorkspace[]) => void;
  setWorkspacesAndTabs: (workspaces: IWorkspace[], tabs: ITab[], currentWorkspaceId: number, currentTabId: number) => void;
  createWorkspace: () => number;
  renameWorkspace: (id: number, title: string) => void;
  deleteWorkspace: (id: number) => void;
  setCurrentWorkspaceId: (id: number) => void;
}

const defaultAppData: AppData = {
  tabs: [{ id: 0, title: 'Tab 1', workspaceId: 0, elements: [], appState: {} }],
  currentTabId: 0,
  workspaces: [{ id: 0, title: 'Default' }],
  currentWorkspaceId: 0,
};

function save(data: AppData): AppData {
  saveAppData(data);
  return data;
}

export const useAppStore = create<AppStoreState>()((set) => {
  const data = getAppData() ?? defaultAppData;

  return {
    tabs: data.tabs,
    currentTabId: data.currentTabId,
    workspaces: data.workspaces,
    currentWorkspaceId: data.currentWorkspaceId,

    setCurrentTabId: (id) =>
      set((s) => save({ tabs: s.tabs, currentTabId: id, workspaces: s.workspaces, currentWorkspaceId: s.currentWorkspaceId })),

    createTab: () => {
      let newTabId = -1;
      set((s) => {
        const maxId = s.tabs.length > 0 ? Math.max(...s.tabs.map((t) => t.id)) : -1;
        newTabId = maxId + 1;
        const newTab: ITab = { id: newTabId, title: `Tab ${newTabId + 1}`, workspaceId: s.currentWorkspaceId, elements: [], appState: {} };
        return save({ tabs: [...s.tabs, newTab], currentTabId: s.currentTabId, workspaces: s.workspaces, currentWorkspaceId: s.currentWorkspaceId });
      });
      return newTabId;
    },

    updateTab: (id, updatedTab) =>
      set((s) => save({
        tabs: s.tabs.map((t) => (t.id !== id ? t : { ...t, ...updatedTab })),
        currentTabId: s.currentTabId,
        workspaces: s.workspaces,
        currentWorkspaceId: s.currentWorkspaceId,
      })),

    setTabs: (tabs) =>
      set((s) => save({ tabs, currentTabId: s.currentTabId, workspaces: s.workspaces, currentWorkspaceId: s.currentWorkspaceId })),

    deleteTab: (tabId) =>
      set((s) => {
        const workspaceTabs = s.tabs.filter((t) => t.workspaceId === s.currentWorkspaceId);
        if (workspaceTabs.length === 1 && workspaceTabs[0].id === tabId) return s;

        const delIdx = s.tabs.findIndex((t) => t.id === tabId);
        const newTabs = [...s.tabs];
        newTabs.splice(delIdx, 1);

        let newCurrentTabId = s.currentTabId;
        if (s.currentTabId === tabId) {
          const newWsTabs = newTabs.filter((t) => t.workspaceId === s.currentWorkspaceId);
          const wsDelIdx = workspaceTabs.findIndex((t) => t.id === tabId);
          newCurrentTabId = wsDelIdx > 0 ? workspaceTabs[wsDelIdx - 1].id : newWsTabs[0].id;
        }

        return save({ tabs: newTabs, currentTabId: newCurrentTabId, workspaces: s.workspaces, currentWorkspaceId: s.currentWorkspaceId });
      }),

    setWorkspaces: (workspaces) =>
      set((s) => save({ tabs: s.tabs, currentTabId: s.currentTabId, workspaces, currentWorkspaceId: s.currentWorkspaceId })),

    setWorkspacesAndTabs: (workspaces, tabs, currentWorkspaceId, currentTabId) =>
      set(() => save({ tabs, currentTabId, workspaces, currentWorkspaceId })),

    createWorkspace: () => {
      let newWsId = -1;
      set((s) => {
        const maxWsId = s.workspaces.length > 0 ? Math.max(...s.workspaces.map((w) => w.id)) : -1;
        newWsId = maxWsId + 1;
        const newWorkspace: IWorkspace = { id: newWsId, title: 'New Workspace' };

        const maxTabId = s.tabs.length > 0 ? Math.max(...s.tabs.map((t) => t.id)) : -1;
        const newTabId = maxTabId + 1;
        const newTab: ITab = { id: newTabId, title: 'Tab 1', workspaceId: newWsId, elements: [], appState: {} };

        return save({ tabs: [...s.tabs, newTab], currentTabId: newTabId, workspaces: [...s.workspaces, newWorkspace], currentWorkspaceId: newWsId });
      });
      return newWsId;
    },

    renameWorkspace: (id, title) =>
      set((s) => save({
        tabs: s.tabs,
        currentTabId: s.currentTabId,
        workspaces: s.workspaces.map((w) => (w.id !== id ? w : { ...w, title })),
        currentWorkspaceId: s.currentWorkspaceId,
      })),

    deleteWorkspace: (id) =>
      set((s) => {
        if (s.workspaces.length === 1) return s;
        const newWorkspaces = s.workspaces.filter((w) => w.id !== id);
        const newTabs = s.tabs.filter((t) => t.workspaceId !== id);
        const newCurrentWsId = newWorkspaces[0].id;
        const wsTabs = newTabs.filter((t) => t.workspaceId === newCurrentWsId);
        const newCurrentTabId = wsTabs.length > 0 ? wsTabs[0].id : newTabs[0]?.id ?? 0;
        return save({ tabs: newTabs, currentTabId: newCurrentTabId, workspaces: newWorkspaces, currentWorkspaceId: newCurrentWsId });
      }),

    setCurrentWorkspaceId: (id) =>
      set((s) => {
        const wsTabs = s.tabs.filter((t) => t.workspaceId === id);
        const newCurrentTabId = wsTabs.length > 0 ? wsTabs[0].id : s.currentTabId;
        return save({ tabs: s.tabs, currentTabId: newCurrentTabId, workspaces: s.workspaces, currentWorkspaceId: id });
      }),
  };
});
