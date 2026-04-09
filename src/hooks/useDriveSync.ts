import axios from 'axios';
import { useCallback, useEffect, useRef } from 'react';

import {
  createFile,
  deleteFile,
  findOrCreateFolder,
  getFileContent,
  listFiles,
  renameFile,
  updateFile,
} from '../services/driveApi';
import { extractCodeFromUrl } from '../services/gisAuth';
import { useAppStore } from '../store';
import { useGoogleDriveStore } from '../store/googleDriveStore';
import type { ExcalidrawFileFormat, ITab } from '../types';

// Module-level flag — survives StrictMode double-mount unlike useRef
let driveLoadInProgress = false;

function tabToFileFormat(tab: ITab): ExcalidrawFileFormat {
  return {
    type: 'excalidraw',
    version: 2,
    title: tab.title,
    elements: tab.elements,
    appState: tab.appState,
  };
}

// Silently refresh the access token. Returns the new token or null if failed.
async function performTokenRefresh(): Promise<string | null> {
  const { refreshToken, userEmail } = useGoogleDriveStore.getState();
  if (!refreshToken) return null;

  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  try {
    const res = await axios.post<{ access_token: string; expires_in: number }>(
      `${apiBase}/mycelium/auth/refresh`,
      { refresh_token: refreshToken },
    );
    const { access_token, expires_in } = res.data;
    const expiry = Date.now() + expires_in * 1000;
    useGoogleDriveStore.getState().setAccessToken(access_token, expiry, userEmail ?? '');
    return access_token;
  } catch {
    useGoogleDriveStore.getState().clearAuth();
    return null;
  }
}

export function useDriveSync(): { onTabChange: (tabId: number) => void } {
  const {
    accessToken,
    isAuthenticated,
    folderId,
    refreshToken,
    tokenExpiry,
    clearAuth,
    setSyncStatus,
    setFolderId,
  } = useGoogleDriveStore();

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renameTimeoutsRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const isLoadingRef = useRef(false);

  // --- Exchange auth code for token via backend after redirect ---

  useEffect(() => {
    const code = extractCodeFromUrl();
    if (!code) return;

    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
    axios
      .post(`${apiBase}/mycelium/auth/token`, { code, redirect_uri: window.location.origin })
      .then((res) => {
        const { access_token, expires_in, refresh_token } = res.data as { access_token: string; expires_in: number; refresh_token?: string };
        const expiry = Date.now() + expires_in * 1000;

        return axios
          .get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
          })
          .then((userRes) => {
            useGoogleDriveStore.getState().setAccessToken(access_token, expiry, userRes.data.email as string, refresh_token);
          })
          .catch(() => {
            useGoogleDriveStore.getState().setAccessToken(access_token, expiry, '', refresh_token);
          });
      })
      .catch((err) => {
        const msg = axios.isAxiosError(err) ? (err.response?.data as { error?: string })?.error ?? err.message : 'Auth failed';
        useGoogleDriveStore.getState().setSyncStatus('error', msg);
      });
  }, []);

  // --- Auto-restore session from refresh token on load ---

  useEffect(() => {
    if (isAuthenticated || !refreshToken) return;
    performTokenRefresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Proactive token refresh (5 min before expiry) ---

  useEffect(() => {
    if (!tokenExpiry || !refreshToken) return;

    const delay = tokenExpiry - Date.now() - 5 * 60 * 1000;
    if (delay <= 0) {
      performTokenRefresh();
      return;
    }

    const timer = setTimeout(performTokenRefresh, delay);
    return () => clearTimeout(timer);
  }, [tokenExpiry, refreshToken]);

  // --- Load tabs from Drive on sign-in ---

  useEffect(() => {
    if (!isAuthenticated || !accessToken || driveLoadInProgress) return;

    driveLoadInProgress = true;
    isLoadingRef.current = true;

    (async () => {
      try {
        setSyncStatus('syncing');

        const resolvedFolderId = folderId ?? (await findOrCreateFolder(accessToken));
        if (!folderId) setFolderId(resolvedFolderId);

        const driveFiles = await listFiles(accessToken, resolvedFolderId);

        if (driveFiles.length === 0) {
          // Only upload if we have no prior Drive mapping — prevents double-upload on concurrent runs
          const existingIds = useGoogleDriveStore.getState().driveFileIds;
          if (Object.keys(existingIds).length === 0) {
            const localTabs = useAppStore.getState().tabs;
            await Promise.all(
              localTabs.map(async (tab) => {
                const fileId = await createFile(
                  accessToken,
                  resolvedFolderId,
                  `${tab.title}.excalidraw`,
                  tabToFileFormat(tab),
                );
                useGoogleDriveStore.getState().setDriveFileId(tab.id, fileId);
              }),
            );
          }
          setSyncStatus('idle');
          return;
        }

        // Fetch all Drive file contents in parallel
        const contents = await Promise.all(
          driveFiles.map((f) =>
            getFileContent(accessToken, f.id).then((c) => ({ ...c, driveId: f.id })),
          ),
        );

        const currentDriveFileIds = useGoogleDriveStore.getState().driveFileIds;

        // Build reverse map: driveFileId → tabId
        const driveIdToTabId = Object.fromEntries(
          Object.entries(currentDriveFileIds).map(([tabId, driveId]) => [driveId, Number(tabId)]),
        );

        // Drive is source of truth — build tab list purely from Drive files
        let maxId = Object.keys(currentDriveFileIds).length > 0
          ? Math.max(...Object.keys(currentDriveFileIds).map(Number))
          : -1;

        const reconciledTabs: ITab[] = contents.map((content) => {
          const existingTabId = driveIdToTabId[content.driveId];

          if (existingTabId !== undefined) {
            return { id: existingTabId, title: content.title, elements: content.elements, appState: content.appState };
          }

          maxId += 1;
          useGoogleDriveStore.getState().setDriveFileId(maxId, content.driveId);
          return { id: maxId, title: content.title, elements: content.elements, appState: content.appState };
        });

        useAppStore.getState().setTabs(reconciledTabs);
        setSyncStatus('idle');
      } catch (err) {
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          await performTokenRefresh();
        } else {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setSyncStatus('error', `Failed to load from Drive: ${msg}`);
        }
      } finally {
        isLoadingRef.current = false;
        driveLoadInProgress = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // --- Subscribe to tab lifecycle (delete + rename) ---

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = useAppStore.subscribe((newState, prevState) => {
      const token = useGoogleDriveStore.getState().accessToken;
      if (!token || isLoadingRef.current) return;

      const currentDriveFileIds = useGoogleDriveStore.getState().driveFileIds;

      // Detect deleted tabs
      const deletedTabs = prevState.tabs.filter(
        (pt) => !newState.tabs.find((nt) => nt.id === pt.id),
      );
      for (const tab of deletedTabs) {
        const driveFileId = currentDriveFileIds[tab.id];
        if (driveFileId) {
          deleteFile(token, driveFileId).catch(() => {});
          useGoogleDriveStore.getState().removeDriveFileId(tab.id);
        }
      }

      // Detect renamed tabs
      for (const nt of newState.tabs) {
        const pt = prevState.tabs.find((t) => t.id === nt.id);
        if (!pt || pt.title === nt.title) continue;

        const driveFileId = currentDriveFileIds[nt.id];
        if (!driveFileId) continue;

        clearTimeout(renameTimeoutsRef.current[nt.id]);
        renameTimeoutsRef.current[nt.id] = setTimeout(() => {
          const latestToken = useGoogleDriveStore.getState().accessToken;
          if (latestToken) {
            renameFile(latestToken, driveFileId, `${nt.title}.excalidraw`).catch(() => {});
          }
        }, 500);
      }
    });

    return unsubscribe;
  }, [isAuthenticated]);

  // --- Retry on back online ---

  useEffect(() => {
    const handleOnline = () => {
      const { syncStatus, accessToken: tok } = useGoogleDriveStore.getState();
      if (syncStatus === 'error' && tok) {
        useGoogleDriveStore.getState().setSyncStatus('idle');
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // --- Auto-save ---

  const saveTabToDrive = useCallback(
    async (tabId: number) => {
      let token = useGoogleDriveStore.getState().accessToken;
      if (!token) return;

      const tab = useAppStore.getState().tabs.find((t) => t.id === tabId);
      if (!tab) return;

      const { driveFileIds: ids, folderId: folder } = useGoogleDriveStore.getState();
      if (!folder) return;

      setSyncStatus('syncing');

      try {
        const content = tabToFileFormat(tab);
        const existingId = ids[tabId];

        if (existingId) {
          try {
            await updateFile(token, existingId, content);
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
              const newId = await createFile(token, folder, `${tab.title}.excalidraw`, content);
              useGoogleDriveStore.getState().setDriveFileId(tabId, newId);
            } else if (axios.isAxiosError(err) && err.response?.status === 401) {
              token = await performTokenRefresh() ?? token;
              await updateFile(token, existingId, content);
            } else {
              throw err;
            }
          }
        } else {
          const newId = await createFile(token, folder, `${tab.title}.excalidraw`, content);
          useGoogleDriveStore.getState().setDriveFileId(tabId, newId);
        }

        setSyncStatus('idle');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setSyncStatus('error', `Failed to save: ${msg}`);
      }
    },
    [setSyncStatus],
  );

  const onTabChange = useCallback(
    (tabId: number) => {
      if (!isAuthenticated || isLoadingRef.current) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTabToDrive(tabId);
      }, 1500);
    },
    [isAuthenticated, saveTabToDrive],
  );

  return { onTabChange };
}
