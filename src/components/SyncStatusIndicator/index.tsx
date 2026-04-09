import { useRef, useState } from 'react';
import { MdCloudDone, MdCloudOff, MdSync } from 'react-icons/md';

import { redirectToGoogleSignIn, revokeToken } from '../../services/gisAuth';
import { useGoogleDriveStore } from '../../store/googleDriveStore';
import styles from './style.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const SyncStatusIndicator = () => {
  const { isAuthenticated, syncStatus, lastSyncError, accessToken, userEmail, clearAuth } =
    useGoogleDriveStore();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!CLIENT_ID) return null;

  if (!isAuthenticated) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.commitSha}>{__COMMIT_SHA__}</span>
        <button
          className={styles.signInButton}
          onClick={() => redirectToGoogleSignIn(CLIENT_ID)}
          title="Sign in to sync with Google Drive"
        >
          Sign in
        </button>
      </div>
    );
  }

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
      <span className={styles.commitSha}>{__COMMIT_SHA__}</span>
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
