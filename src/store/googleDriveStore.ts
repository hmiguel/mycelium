import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface GoogleDriveState {
  // Auth — accessToken in memory only, refreshToken persisted
  accessToken: string | null;
  tokenExpiry: number | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  skippedAuth: boolean;
  refreshToken: string | null;

  // Sync status
  syncStatus: SyncStatus;
  lastSyncError: string | null;

  // Persisted
  folderId: string | null;
  driveFileIds: Record<number, string>; // tabId → driveFileId
  workspaceFolderIds: Record<number, string>; // workspaceId → Drive subfolder ID

  // Actions
  setAccessToken: (token: string, expiry: number, email: string, refreshToken?: string | null) => void;
  clearAuth: () => void;
  setSkippedAuth: (skipped: boolean) => void;
  setSyncStatus: (status: SyncStatus, error?: string) => void;
  setFolderId: (id: string) => void;
  setDriveFileId: (tabId: number, fileId: string) => void;
  removeDriveFileId: (tabId: number) => void;
  setWorkspaceFolderId: (workspaceId: number, folderId: string) => void;
  removeWorkspaceFolderId: (workspaceId: number) => void;
}

export const useGoogleDriveStore = create<GoogleDriveState>()(
  persist(
    (set) => ({
      accessToken: null,
      tokenExpiry: null,
      userEmail: null,
      isAuthenticated: false,
      skippedAuth: false,
      refreshToken: null,
      syncStatus: 'idle',
      lastSyncError: null,
      folderId: null,
      driveFileIds: {},
      workspaceFolderIds: {},

      setAccessToken: (token, expiry, email, refreshToken) =>
        set((state) => ({
          accessToken: token,
          tokenExpiry: expiry,
          userEmail: email,
          isAuthenticated: true,
          syncStatus: 'idle',
          lastSyncError: null,
          refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
        })),

      clearAuth: () =>
        set({
          accessToken: null,
          tokenExpiry: null,
          userEmail: null,
          isAuthenticated: false,
          skippedAuth: false,
          refreshToken: null,
          syncStatus: 'idle',
          lastSyncError: null,
        }),

      setSkippedAuth: (skipped) => set({ skippedAuth: skipped }),

      setSyncStatus: (status, error) =>
        set({ syncStatus: status, lastSyncError: error ?? null }),

      setFolderId: (id) => set({ folderId: id }),

      setDriveFileId: (tabId, fileId) =>
        set((state) => ({
          driveFileIds: { ...state.driveFileIds, [tabId]: fileId },
        })),

      removeDriveFileId: (tabId) =>
        set((state) => {
          const next = { ...state.driveFileIds };
          delete next[tabId];
          return { driveFileIds: next };
        }),

      setWorkspaceFolderId: (workspaceId, folderId) =>
        set((state) => ({
          workspaceFolderIds: { ...state.workspaceFolderIds, [workspaceId]: folderId },
        })),

      removeWorkspaceFolderId: (workspaceId) =>
        set((state) => {
          const next = { ...state.workspaceFolderIds };
          delete next[workspaceId];
          return { workspaceFolderIds: next };
        }),
    }),
    {
      name: 'mycelium-drive-meta',
      partialize: (state) => ({
        folderId: state.folderId,
        driveFileIds: state.driveFileIds,
        workspaceFolderIds: state.workspaceFolderIds,
        refreshToken: state.refreshToken,
        userEmail: state.userEmail,
      }),
    },
  ),
);
