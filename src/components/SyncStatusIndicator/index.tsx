import { useRef, useState } from 'react';
import { MdCloudDone, MdCloudOff, MdSync } from 'react-icons/md';

import { revokeToken } from '../../services/gisAuth';
import { useGoogleDriveStore } from '../../store/googleDriveStore';
import styles from './style.module.css';

const SyncStatusIndicator = () => {
  const { isAuthenticated, syncStatus, lastSyncError, accessToken, userEmail, clearAuth } =
    useGoogleDriveStore();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!isAuthenticated) return null;

  const handleSignOut = () => {
    if (accessToken) revokeToken(accessToken);
    clearAuth();
    setPopoverOpen(false);
  };

  const handleButtonClick = () => {
    if (syncStatus === 'idle') {
      setPopoverOpen((open) => !open);
    }
  };

  const icon =
    syncStatus === 'syncing' ? (
      <MdSync className={`${styles.icon} ${styles.spinning}`} title="Saving..." />
    ) : syncStatus === 'error' ? (
      <MdCloudOff className={`${styles.icon} ${styles.error}`} title={lastSyncError ?? 'Sync error'} />
    ) : (
      <MdCloudDone className={`${styles.icon} ${styles.idle}`} title="Synced to Google Drive" />
    );

  return (
    <div className={styles.wrapper}>
      <button
        ref={buttonRef}
        className={styles.button}
        onClick={handleButtonClick}
        title={
          syncStatus === 'error'
            ? (lastSyncError ?? 'Sync error')
            : syncStatus === 'syncing'
              ? 'Saving...'
              : 'Synced to Google Drive'
        }
      >
        {icon}
      </button>

      {popoverOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setPopoverOpen(false)} />
          <div className={styles.popover}>
            {userEmail && <p className={styles.email}>{userEmail}</p>}
            <button className={styles.signOutButton} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
