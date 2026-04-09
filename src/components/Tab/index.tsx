import { useSortable } from '@dnd-kit/react/sortable';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useAppStore } from '../../store';
import type { ITab } from '../../types';
import { ChevronDownIcon } from '../icons';
import styles from './style.module.css';

interface TabProps {
  tab: ITab;
  index: number;
}

interface FormData {
  title: string;
}

const Tab = ({ tab, index }: TabProps) => {
  const { currentTabId, setCurrentTabId, updateTab, deleteTab } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: { title: tab.title },
  });

  const { ref, isDragging } = useSortable({
    id: tab.id,
    index,
    group: 'tabs',
    disabled: isEditing,
  });

  const isActive = currentTabId === tab.id;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentTabId(tab.id);
    setMenuOpen((open) => !open);
  };

  const handleRename = () => {
    setMenuOpen(false);
    setIsEditing(true);
    reset({ title: tab.title });
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (tab.elements.length === 0) {
      deleteTab(tab.id);
      return;
    }
    if (confirm('Are you sure you want to delete this tab?')) {
      deleteTab(tab.id);
    }
  };

  const onSubmit = (data: FormData) => {
    const trimmedTitle = data.title.trim();
    if (trimmedTitle && trimmedTitle !== tab.title) {
      updateTab(tab.id, { ...tab, title: trimmedTitle });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({ title: tab.title });
  };

  return (
    <div
      ref={ref}
      className={clsx(styles.tab, {
        [styles.active]: isActive,
        [styles.dragging]: isDragging,
      })}
      onClick={() => setCurrentTabId(tab.id)}
    >
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register('title')}
            className={styles.titleInput}
            type="text"
            autoFocus
            onBlur={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
            }}
          />
        </form>
      ) : (
        <span className={styles.title} title={tab.title}>
          {tab.title}
        </span>
      )}

      <div className={styles.menuWrapper} ref={menuRef}>
        <button
          className={clsx(styles.chevron, { [styles.chevronVisible]: isActive || menuOpen })}
          onClick={handleChevronClick}
          title="Tab options"
        >
          <ChevronDownIcon />
        </button>

        {menuOpen && (
          <div className={styles.menu}>
            <button className={styles.menuItem} onClick={handleRename}>Rename</button>
            <button className={clsx(styles.menuItem, styles.menuItemDanger)} onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab;
