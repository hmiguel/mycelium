import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { move } from '@dnd-kit/helpers';
import { type DragDropEventHandlers, DragDropProvider } from '@dnd-kit/react';
import { useRef } from 'react';

import { useAppStore } from '../../store';
import { PlusIcon } from '../icons';
import Tab from '../Tab';
import style from './style.module.css';

const TabBar = () => {
  const { tabs, currentWorkspaceId, setCurrentTabId, createTab, setTabs } = useAppStore();
  const tabBarRef = useRef<HTMLDivElement>(null);

  const workspaceTabs = tabs.filter((t) => t.workspaceId === currentWorkspaceId);

  const handleCreateTabBtnClick = () => {
    const newTabId = createTab();
    setCurrentTabId(newTabId);
  };

  const handleDragEnd: NonNullable<DragDropEventHandlers['onDragEnd']> = (event) => {
    if (event.canceled) return;
    const reordered = move(workspaceTabs, event);
    if (reordered === workspaceTabs) return;
    setTabs([...tabs.filter((t) => t.workspaceId !== currentWorkspaceId), ...reordered]);
  };

  return (
    <>
      <div className={style.container}>
        <DragDropProvider
          onDragEnd={handleDragEnd}
          modifiers={[
            RestrictToHorizontalAxis,
            RestrictToElement.configure({ element: tabBarRef.current }),
          ]}
        >
          <div className={style.tabBar} ref={tabBarRef}>
            {workspaceTabs.map((tab, index) => (
              <Tab key={tab.id} tab={tab} index={index} />
            ))}
            <button className={style.createTabButton} onClick={handleCreateTabBtnClick}>
              <PlusIcon />
            </button>
          </div>
        </DragDropProvider>
      </div>
    </>
  );
};

export default TabBar;
