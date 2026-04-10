import { Excalidraw, Footer } from '@excalidraw/excalidraw';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import { useCallback, useMemo } from 'react';

import GoogleSignInModal from './components/GoogleSignInModal';
import ImportModal from './components/ImportButton';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import TabBar from './components/TabBar';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import { useDriveSync } from './hooks/useDriveSync';
import { useAppStore } from './store';
import { useExcalidrawFilesStore } from './store/excalidrawFiles';

function App() {
  const { tabs, currentTabId, updateTab } = useAppStore();
  const { setFiles, getFiles } = useExcalidrawFilesStore();
  const { onTabChange } = useDriveSync();
  const renderTopRightUI = useCallback(() => (
    <>
      <WorkspaceSwitcher />
      <ImportModal />
    </>
  ), []);
  const footerContent = useMemo(() => (
    <Footer>
      <TabBar />
      <SyncStatusIndicator />
    </Footer>
  ), []);

  const currentTab = tabs.find((t) => t.id === currentTabId) || tabs[0];

  const handleOnChange = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      state: AppState,
      files: BinaryFiles,
    ) => {
      if (!currentTab) return;

      const updatedTab = {
        elements: elements,
        appState: {
          viewBackgroundColor: state.viewBackgroundColor,
          theme: state.theme,
          zoom: state.zoom,
          scrollX: state.scrollX,
          scrollY: state.scrollY,
        },
      };

      updateTab(currentTabId, updatedTab);
      setFiles(files);
      onTabChange(currentTabId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTabId, onTabChange],
  );

  if (!currentTab) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <GoogleSignInModal />
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Excalidraw
          key={currentTabId}
          onChange={handleOnChange}
          initialData={async () => ({
            elements: currentTab.elements,
            appState: currentTab.appState,
            files: await getFiles(),
          })}
          renderTopRightUI={renderTopRightUI}
        >
          {footerContent}
        </Excalidraw>
      </div>
    </>
  );
}

export default App;
