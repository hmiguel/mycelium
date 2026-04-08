import { FcGoogle } from 'react-icons/fc';

import { redirectToGoogleSignIn } from '../../services/gisAuth';
import { useGoogleDriveStore } from '../../store/googleDriveStore';
import Modal from '../Modal';
import styles from './style.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const GoogleSignInModal = () => {
  const { isAuthenticated, skippedAuth, refreshToken, setSkippedAuth } = useGoogleDriveStore();

  if (!CLIENT_ID || isAuthenticated || skippedAuth || refreshToken) return null;

  const handleSignIn = () => {
    redirectToGoogleSignIn(CLIENT_ID);
  };

  const handleSkip = () => {
    setSkippedAuth(true);
  };

  return (
    <Modal isOpen={true} onClose={() => {}}>
      <div className={styles.container}>
        <h2 className={styles.title}>Save your work to Google Drive</h2>
        <p className={styles.subtitle}>
          Automatically back up all your tabs and restore them on any device.
        </p>
        <button className={styles.signInButton} onClick={handleSignIn}>
          <FcGoogle className={styles.googleIcon} />
          Sign in with Google
        </button>
        <button className={styles.skipButton} onClick={handleSkip}>
          Continue without sync
        </button>
      </div>
    </Modal>
  );
};

export default GoogleSignInModal;
