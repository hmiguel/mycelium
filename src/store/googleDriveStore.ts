import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface GoogleDriveState {
  // Auth (in memory only — not persisted)
  accessToken: string | null;
  tokenExpiry: number | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  skippedAuth: boolean;

  // Sync status
  syncStatus: SyncStatus;
  lastSyncError: string | null;

  // Persisted
  folderId: string | null;
  driveFileIds: Record<number, string>; // tabId → driveFileId

  // Actions
  setAccessToken: (token: string, expiry: number, email: string) => void;
  clearAuth: () => void;
  setSkippedAuth: (skipped: boolean) => void;
  setSyncStatus: (status: SyncStatus, error?: string) => void;
  setFolderId: (id: string) => void;
  setDriveFileId: (tabId: number, fileId: string) => void;
  removeDriveFileId: (tabId: number) => void;
}

export const useGoogleDriveStore = create<GoogleDriveState>()(
  persist(
    (set) => ({
      accessToken: null,
      tokenExpiry: null,
      userEmail: null,
      isAuthenticated: false,
      skippedAuth: false,
      syncStatus: 'idle',
      lastSyncError: null,
      folderId: null,
      driveFileIds: {},

      setAccessToken: (token, expiry, email) =>
        set({
          accessToken: token,
          tokenExpiry: expiry,
          userEmail: email,
          isAuthenticated: true,
          syncStatus: 'idle',
          lastSyncError: null,
        }),

      clearAuth: () =>
        set({
          accessToken: null,
          tokenExpiry: null,
          userEmail: null,
          isAuthenticated: false,
          skippedAuth: false,
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
    }),
    {
      name: 'mycelium-drive-meta',
      partialize: (state) => ({
        folderId: state.folderId,
        driveFileIds: state.driveFileIds,
      }),
    },
  ),
);
