import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAppStore } from '../../store';
import { ChevronDownIcon, WorkspaceIcon } from '../icons';
import styles from './style.module.css';

interface FormData {
  title: string;
}

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
  const [openSubmenuId, setOpenSubmenuId] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset } = useForm<FormData>();

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setRenamingId(null);
        setOpenSubmenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCreateWorkspace = () => {
    const newId = createWorkspace();
    setRenamingId(newId);
    reset({ title: 'New Workspace' });
  };

  const onRenameSubmit = (data: FormData) => {
    if (renamingId !== null) {
      const trimmed = data.title.trim();
      if (trimmed) renameWorkspace(renamingId, trimmed);
      setRenamingId(null);
    }
  };

  const handleRenameCancel = () => setRenamingId(null);

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
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.pillIcon}><WorkspaceIcon /></span>
        <span className={styles.pillText}>{currentWorkspace?.title ?? 'Default'}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {workspaces.map((ws) => (
            <div key={ws.id} className={styles.row}>
              {renamingId === ws.id ? (
                <form className={styles.renameForm} onSubmit={handleSubmit(onRenameSubmit)}>
                  <input
                    {...register('title')}
                    className={styles.renameInput}
                    autoFocus
                    onBlur={handleSubmit(onRenameSubmit)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { e.preventDefault(); handleRenameCancel(); }
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
                          onClick={() => { setOpenSubmenuId(null); setRenamingId(ws.id); reset({ title: ws.title }); }}
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
