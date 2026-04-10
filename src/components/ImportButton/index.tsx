import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { useAppStore } from '../../store';
import type { ITab } from '../../types';
import { getExcalidrawBoard } from '../../utils/import';
import Modal from '../Modal';
import styles from './styles.module.css';

const EXCALIDRAW_URL = 'https://excalidraw.com/#json=';
const INVALID_EXCALIDRAW_LINK = 'Invalid Excalidraw link';

interface InputForm {
  excalidrawUrl: string;
}

const schema = z.object({
  excalidrawUrl: z
    .url({ message: INVALID_EXCALIDRAW_LINK })
    .startsWith(EXCALIDRAW_URL, { message: INVALID_EXCALIDRAW_LINK }),
});

const ImportModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { createTab, updateTab, setCurrentTabId } = useAppStore();

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<InputForm>({
    resolver: zodResolver(schema),
  });

  const handleModalClose = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit: SubmitHandler<InputForm> = async ({ excalidrawUrl }) => {
    try {
      const excalidrawBoard = await getExcalidrawBoard(excalidrawUrl);

      const newTabId = createTab();

      const newTabData: Partial<ITab> = {
        title: 'Imported board',
        elements: excalidrawBoard.elements,
        appState: {
          viewBackgroundColor: excalidrawBoard.appState.viewBackgroundColor,
        },
      };

      updateTab(newTabId, newTabData);
      setCurrentTabId(newTabId);
      setIsModalOpen(false);
      reset();
    } catch (error) {
      let errorMsg = 'Failed to load Excalidraw board. Unknown error';
      if (error instanceof Error && error.message) {
        errorMsg = error.message;
      }

      setError('excalidrawUrl', {
        type: 'manual',
        message: errorMsg,
      });
    }
  };

  return (
    <>
      <button
        className={styles.loadButton}
        onClick={() => setIsModalOpen(true)}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 13V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V13" />
          <path d="M12 3L12 15M12 15L8.5 11.5M12 15L15.5 11.5" />
        </svg>
        Import from Excalidraw
      </button>
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className={styles.title}>Import from Excalidraw</h2>
          <div className={styles.body}>
            <p>
              In Excalidraw, open <strong>Share</strong>, then select{' '}
              <strong>Export to link</strong> and paste it here.
            </p>
            <input
              type="text"
              {...register('excalidrawUrl')}
              className={styles.input}
              autoFocus={true}
              placeholder={EXCALIDRAW_URL}
              onPaste={(e) => {
                e.preventDefault();
                const pastedValue = e.clipboardData.getData('text');
                setValue('excalidrawUrl', pastedValue);
                handleSubmit(onSubmit)();
              }}
            />
            <p className={styles.error}>{errors.excalidrawUrl?.message}</p>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ImportModal;
