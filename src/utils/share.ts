import axios from 'axios';

import { compressData, concatBuffers } from './encode';
import { generateEncryptionKey } from './encryption';
import type { ITab } from '../types';

const EXCALIDRAW_STORE_API = 'https://json.excalidraw.com/api/v2/post/';

export const shareBoard = async (tab: ITab): Promise<string> => {
  const privateKey = await generateEncryptionKey();

  const boardJson = JSON.stringify({
    type: 'excalidraw',
    version: 2,
    source: window.location.origin,
    elements: tab.elements,
    appState: { viewBackgroundColor: tab.appState.viewBackgroundColor },
  });

  const contentsMetadata = new TextEncoder().encode(JSON.stringify({}));
  const contentsBuffer = new TextEncoder().encode(boardJson);
  const innerBuffer = concatBuffers(2, contentsMetadata, contentsBuffer);

  const encoded = await compressData(innerBuffer, { encryptionKey: privateKey });

  const { data } = await axios.post<{ id: string }>(EXCALIDRAW_STORE_API, encoded, {
    headers: { 'Content-Type': 'application/octet-stream' },
  });

  if (!data?.id) {
    throw new Error('Failed to upload board');
  }

  return `${window.location.origin}${window.location.pathname}#json=${data.id},${privateKey}`;
};
