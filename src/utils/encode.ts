import { deflate, inflate } from 'pako';

import { encryptData, IV_LENGTH_BYTES } from './encryption';
import { decryptData } from './encryption';

export interface FileEncodingInfo {
  version: 2;
  compression: 'pako@1';
  encryption: 'AES-GCM';
}

export const concatBuffers = (version: number, ...chunks: Uint8Array[]): Uint8Array => {
  const VERSION_BYTES = 4;
  const CHUNK_SIZE_BYTES = 4;
  const totalSize =
    VERSION_BYTES +
    chunks.reduce((acc, chunk) => acc + CHUNK_SIZE_BYTES + chunk.byteLength, 0);

  const result = new Uint8Array(totalSize);
  const view = new DataView(result.buffer);
  view.setUint32(0, version);
  let cursor = VERSION_BYTES;

  for (const chunk of chunks) {
    view.setUint32(cursor, chunk.byteLength);
    cursor += CHUNK_SIZE_BYTES;
    result.set(chunk, cursor);
    cursor += chunk.byteLength;
  }

  return result;
};

export const compressData = async (
  data: Uint8Array,
  options: { encryptionKey: string },
): Promise<Uint8Array> => {
  const encodingMetadata: FileEncodingInfo = {
    version: 2,
    compression: 'pako@1',
    encryption: 'AES-GCM',
  };

  const compressed = deflate(data);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encrypted = new Uint8Array(
    await encryptData(iv, compressed, options.encryptionKey),
  );

  return concatBuffers(
    2,
    new TextEncoder().encode(JSON.stringify(encodingMetadata)),
    iv,
    encrypted,
  );
};

export const splitBuffers = (concatenatedBuffer: Uint8Array): Uint8Array[] => {
  const buffers: Uint8Array[] = [];
  const VERSION_DATAVIEW_BYTES = 4;
  const NEXT_CHUNK_SIZE_DATAVIEW_BYTES = 4;

  const view = new DataView(
    concatenatedBuffer.buffer,
    concatenatedBuffer.byteOffset,
    concatenatedBuffer.byteLength,
  );

  let cursor = VERSION_DATAVIEW_BYTES;

  while (cursor < concatenatedBuffer.byteLength) {
    const chunkSize = view.getUint32(cursor);
    cursor += NEXT_CHUNK_SIZE_DATAVIEW_BYTES;

    if (cursor + chunkSize > concatenatedBuffer.byteLength) {
      break;
    }

    buffers.push(concatenatedBuffer.slice(cursor, cursor + chunkSize));
    cursor += chunkSize;
  }

  return buffers;
};

export const decompressData = async <T extends Record<string, unknown>>(
  bufferView: Uint8Array,
  options: { decryptionKey: string },
) => {
  const [encodingMetadataBuffer, iv, buffer] = splitBuffers(bufferView);

  const encodingMetadata: FileEncodingInfo = JSON.parse(
    new TextDecoder().decode(encodingMetadataBuffer),
  );
  let decryptedBuffer = new Uint8Array(
    await decryptData(iv, buffer, options.decryptionKey),
  );

  if (encodingMetadata.compression) {
    decryptedBuffer = inflate(decryptedBuffer);
  }

  const [contentsMetadataBuffer, contentsBuffer] =
    splitBuffers(decryptedBuffer);

  const metadata = JSON.parse(
    new TextDecoder().decode(contentsMetadataBuffer),
  ) as T;

  return {
    metadata,
    data: contentsBuffer,
  };
};
