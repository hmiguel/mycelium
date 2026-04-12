import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { useAppStore } from '../../store';
import { ChevronDownIcon, WorkspaceIcon } from '../icons';
import styles from './style.module.css';

const WorkspaceSwitcher = () => {
  const {
    workspaces,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useAppStore();

  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [openSubmenuId, setOpenSubmenuId] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  // Focus input whenever rename mode opens
  useEffect(() => {
    if (renamingId !== null) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        commitRename();
        setOpen(false);
        setOpenSubmenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, renamingId, renameValue]);

  const openRename = (id: number, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
    setOpenSubmenuId(null);
  };

  const commitRename = () => {
    if (renamingId !== null) {
      const trimmed = renameValue.trim();
      if (trimmed) renameWorkspace(renamingId, trimmed);
      setRenamingId(null);
    }
  };

  const cancelRename = () => setRenamingId(null);

  const handleCreateWorkspace = () => {
    const newId = createWorkspace();
    setRenamingId(newId);
    setRenameValue('');
  };

  const handlePillClick = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double-click: open dropdown and rename current workspace
      setOpen(true);
      openRename(currentWorkspaceId, currentWorkspace?.title ?? '');
    } else {
      setOpen((o) => !o);
    }
  };

  const handleDelete = (id: number) => {
    setOpenSubmenuId(null);
    if (workspaces.length === 1) return;
    const ws = workspaces.find((w) => w.id === id);
    if (confirm(`Delete workspace "${ws?.title ?? ''}"?`)) {
      deleteWorkspace(id);
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={clsx(styles.pill, { [styles.pillOpen]: open })}
        onClick={handlePillClick}
      >
        <span className={styles.pillIcon}><WorkspaceIcon /></span>
        <span className={styles.pillText}>{currentWorkspace?.title ?? 'Default'}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {workspaces.map((ws) => (
            <div key={ws.id} className={styles.row}>
              {renamingId === ws.id ? (
                <form
                  className={styles.renameForm}
                  onSubmit={(e) => { e.preventDefault(); commitRename(); }}
                >
                  <input
                    ref={renameInputRef}
                    className={styles.renameInput}
                    placeholder="New Workspace"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                    }}
                  />
                </form>
              ) : (
                <>
                  <button
                    className={clsx(styles.rowLabel, { [styles.rowLabelActive]: ws.id === currentWorkspaceId })}
                    onClick={() => { setCurrentWorkspaceId(ws.id); setOpen(false); }}
                  >
                    <span className={clsx(styles.checkmark, { [styles.checkmarkVisible]: ws.id === currentWorkspaceId })}>✓</span>
                    {ws.title}
                  </button>
                  <div className={styles.rowMenuWrapper}>
                    <button
                      className={clsx(styles.rowChevron, { [styles.rowChevronVisible]: openSubmenuId === ws.id })}
                      onClick={(e) => { e.stopPropagation(); setOpenSubmenuId(openSubmenuId === ws.id ? null : ws.id); }}
                    >
                      <ChevronDownIcon />
                    </button>
                    {openSubmenuId === ws.id && (
                      <div className={styles.submenu}>
                        <button
                          className={styles.submenuItem}
                          onClick={() => openRename(ws.id, ws.title)}
                        >
                          Rename
                        </button>
                        <button
                          className={clsx(styles.submenuItem, styles.submenuItemDanger)}
                          onClick={() => handleDelete(ws.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          <div className={styles.divider} />
          <button className={styles.addButton} onClick={handleCreateWorkspace}>
            + New workspace
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
