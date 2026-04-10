import { useState } from 'react';

import type { ITab } from '../../types';
import { shareBoard } from '../../utils/share';
import { ShareIcon } from '../icons';
import styles from './styles.module.css';

interface Props {
  currentTab: ITab;
}

const ShareButton = ({ currentTab }: Props) => {
  const [state, setState] = useState<'idle' | 'loading' | 'copied'>('idle');

  const handleClick = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      const url = await shareBoard(currentTab);
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  };

  return (
    <button className={styles.shareButton} onClick={handleClick} disabled={state === 'loading'}>
      <ShareIcon />
      {state === 'copied' ? 'Copied!' : state === 'loading' ? 'Sharing…' : 'Share'}
    </button>
  );
};

export default ShareButton;
