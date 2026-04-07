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

function tabToFileFormat(tab: ITab): ExcalidrawFileFormat {
  return {
    type: 'excalidraw',
    version: 2,
    title: tab.title,
    elements: tab.elements,
    appState: tab.appState,
  };
}

export function useDriveSync(): { onTabChange: (tabId: number) => void } {
  const {
    accessToken,
    isAuthenticated,
    folderId,
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
        const { access_token, expires_in } = res.data as { access_token: string; expires_in: number };
        const expiry = Date.now() + expires_in * 1000;

        return axios
          .get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
          })
          .then((userRes) => {
            useGoogleDriveStore.getState().setAccessToken(access_token, expiry, userRes.data.email as string);
          })
          .catch(() => {
            useGoogleDriveStore.getState().setAccessToken(access_token, expiry, '');
          });
      })
      .catch((err) => {
        const msg = axios.isAxiosError(err) ? (err.response?.data as { error?: string })?.error ?? err.message : 'Auth failed';
        useGoogleDriveStore.getState().setSyncStatus('error', msg);
      });
  }, []);

  // --- Load tabs from Drive on sign-in ---

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    isLoadingRef.current = true;

    (async () => {
      try {
        setSyncStatus('syncing');

        const resolvedFolderId = folderId ?? (await findOrCreateFolder(accessToken));
        if (!folderId) setFolderId(resolvedFolderId);

        const driveFiles = await listFiles(accessToken, resolvedFolderId);

        if (driveFiles.length === 0) {
          // No Drive files yet — upload existing local tabs
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
          setSyncStatus('idle');
          return;
        }

        // Fetch all Drive file contents in parallel
        const contents = await Promise.all(
          driveFiles.map((f) =>
            getFileContent(accessToken, f.id).then((c) => ({ ...c, driveId: f.id })),
          ),
        );

        const localTabs = useAppStore.getState().tabs;
        const currentDriveFileIds = useGoogleDriveStore.getState().driveFileIds;

        // Build reverse map: driveFileId → tabId
        const driveIdToTabId = Object.fromEntries(
          Object.entries(currentDriveFileIds).map(([tabId, driveId]) => [driveId, Number(tabId)]),
        );

        const reconciledTabs: ITab[] = [...localTabs];
        let maxId = localTabs.length > 0 ? Math.max(...localTabs.map((t) => t.id)) : -1;

        for (const content of contents) {
          const existingTabId = driveIdToTabId[content.driveId];

          if (existingTabId !== undefined) {
            // Update existing tab — Drive wins
            const idx = reconciledTabs.findIndex((t) => t.id === existingTabId);
            if (idx !== -1) {
              reconciledTabs[idx] = {
                ...reconciledTabs[idx],
                elements: content.elements,
                appState: content.appState,
                title: content.title,
              };
            }
          } else {
            // New Drive file — create a new local tab
            maxId += 1;
            const newTab: ITab = {
              id: maxId,
              title: content.title,
              elements: content.elements,
              appState: content.appState,
            };
            reconciledTabs.push(newTab);
            useGoogleDriveStore.getState().setDriveFileId(maxId, content.driveId);
          }
        }

        // Create Drive files for local tabs that have no mapping yet
        const updatedDriveFileIds = useGoogleDriveStore.getState().driveFileIds;
        await Promise.all(
          reconciledTabs
            .filter((tab) => !updatedDriveFileIds[tab.id])
            .map(async (tab) => {
              const fileId = await createFile(
                accessToken,
                resolvedFolderId,
                `${tab.title}.excalidraw`,
                tabToFileFormat(tab),
              );
              useGoogleDriveStore.getState().setDriveFileId(tab.id, fileId);
            }),
        );

        useAppStore.getState().setTabs(reconciledTabs);
        setSyncStatus('idle');
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 401 || err.response?.status === 403)
        ) {
          useGoogleDriveStore.getState().clearAuth();
        } else {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setSyncStatus('error', `Failed to load from Drive: ${msg}`);
        }
      } finally {
        isLoadingRef.current = false;
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
      const token = useGoogleDriveStore.getState().accessToken;
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
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearAuth();
        }
      }
    },
    [setSyncStatus, clearAuth],
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
