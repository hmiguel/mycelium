import axios from 'axios';

import type { ExcalidrawFileFormat } from '../types';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_NAME = 'Mycelium';

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function findOrCreateFolder(accessToken: string): Promise<string> {
  const headers = authHeader(accessToken);

  const searchRes = await axios.get(DRIVE_FILES_URL, {
    headers,
    params: {
      q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      fields: 'files(id)',
    },
  });

  const files: { id: string }[] = searchRes.data.files;
  if (files.length > 0) return files[0].id;

  const createRes = await axios.post(
    DRIVE_FILES_URL,
    { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
    { headers },
  );
  return createRes.data.id as string;
}

export async function listSubfolders(
  accessToken: string,
  parentFolderId: string,
): Promise<{ id: string; name: string }[]> {
  const res = await axios.get(DRIVE_FILES_URL, {
    headers: authHeader(accessToken),
    params: {
      q: `mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id,name)',
    },
  });
  return res.data.files as { id: string; name: string }[];
}

export async function findOrCreateSubfolder(
  accessToken: string,
  parentFolderId: string,
  name: string,
): Promise<string> {
  const headers = authHeader(accessToken);

  const searchRes = await axios.get(DRIVE_FILES_URL, {
    headers,
    params: {
      q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id)',
    },
  });

  const files: { id: string }[] = searchRes.data.files;
  if (files.length > 0) return files[0].id;

  const createRes = await axios.post(
    DRIVE_FILES_URL,
    { name, parents: [parentFolderId], mimeType: 'application/vnd.google-apps.folder' },
    { headers },
  );
  return createRes.data.id as string;
}

export async function listFiles(
  accessToken: string,
  folderId: string,
): Promise<{ id: string; name: string }[]> {
  const res = await axios.get(DRIVE_FILES_URL, {
    headers: authHeader(accessToken),
    params: {
      q: `'${folderId}' in parents and name contains '.excalidraw' and trashed=false`,
      fields: 'files(id,name)',
    },
  });
  return res.data.files as { id: string; name: string }[];
}

export async function getFileContent(
  accessToken: string,
  fileId: string,
): Promise<ExcalidrawFileFormat> {
  const res = await axios.get(`${DRIVE_FILES_URL}/${fileId}`, {
    headers: authHeader(accessToken),
    params: { alt: 'media' },
  });
  return res.data as ExcalidrawFileFormat;
}

export async function createFile(
  accessToken: string,
  folderId: string,
  name: string,
  content: ExcalidrawFileFormat,
): Promise<string> {
  const metadata = { name, parents: [folderId], mimeType: 'application/json' };
  const body = JSON.stringify(content);

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  );
  form.append('file', new Blob([body], { type: 'application/json' }));

  const res = await axios.post(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, form, {
    headers: authHeader(accessToken),
  });
  return res.data.id as string;
}

export async function updateFile(
  accessToken: string,
  fileId: string,
  content: ExcalidrawFileFormat,
): Promise<void> {
  await axios.patch(
    `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`,
    JSON.stringify(content),
    {
      headers: {
        ...authHeader(accessToken),
        'Content-Type': 'application/json',
      },
    },
  );
}

export async function renameFile(
  accessToken: string,
  fileId: string,
  newName: string,
): Promise<void> {
  await axios.patch(
    `${DRIVE_FILES_URL}/${fileId}`,
    { name: newName },
    { headers: authHeader(accessToken) },
  );
}

export async function deleteFile(
  accessToken: string,
  fileId: string,
): Promise<void> {
  await axios.delete(`${DRIVE_FILES_URL}/${fileId}`, {
    headers: authHeader(accessToken),
  });
}
