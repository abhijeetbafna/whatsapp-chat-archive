import { getDb, STORES } from './db';
import { StoredAttachment } from '../../types/storage';
import { ImportedMediaFile } from '../../types';
import { ParsedChat, MessageType } from '../../types/chat';

/**
 * Creates a unique attachment ID for IndexedDB storage.
 */
export function createAttachmentId(archiveId: string, fileName: string): string {
  return `${archiveId}::${fileName.toLowerCase()}`;
}

/**
 * Saves all media files for an archive into the attachments object store.
 */
export async function saveArchiveAttachments(
  archiveId: string,
  mediaFiles: ImportedMediaFile[]
): Promise<number> {
  if (mediaFiles.length === 0) return 0;

  const db = await getDb();
  let totalBytes = 0;

  // Pre-extract arraybuffers if blobs present
  const preparedRecords: StoredAttachment[] = [];
  for (const media of mediaFiles) {
    if (!media.blob) continue;

    totalBytes += media.size || media.blob.size || 0;
    let arrayBuf: ArrayBuffer | undefined = undefined;
    try {
      if (typeof media.blob.arrayBuffer === 'function') {
        arrayBuf = await media.blob.arrayBuffer();
      }
    } catch {
      // Fallback
    }

    preparedRecords.push({
      id: createAttachmentId(archiveId, media.fileName),
      archiveId,
      fileName: media.fileName,
      mimeType: media.mimeType,
      size: media.size || media.blob.size,
      type: (media.type as MessageType) || 'other',
      blob: media.blob,
      data: arrayBuf,
      originalPath: media.path,
    });
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.ATTACHMENTS], 'readwrite');
    const store = transaction.objectStore(STORES.ATTACHMENTS);

    transaction.onerror = () => {
      reject(transaction.error || new Error('Failed to save archive attachments'));
    };

    transaction.oncomplete = () => {
      resolve(totalBytes);
    };

    for (const record of preparedRecords) {
      store.put(record);
    }
  });
}

/**
 * Loads all stored attachments for a specific archive.
 */
export async function getArchiveAttachments(archiveId: string): Promise<StoredAttachment[]> {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.ATTACHMENTS], 'readonly');
    const store = transaction.objectStore(STORES.ATTACHMENTS);
    const index = store.index('archiveId');
    const request = index.getAll(archiveId);

    request.onsuccess = () => {
      const records: StoredAttachment[] = request.result || [];
      for (const rec of records) {
        // Ensure rec.blob is a valid Blob instance
        const hasValidBlob = rec.blob && typeof rec.blob === 'object' && 'size' in rec.blob && rec.blob.size > 0;
        if (!hasValidBlob && rec.data) {
          rec.blob = new Blob([rec.data], { type: rec.mimeType || 'application/octet-stream' });
        }
      }
      resolve(records);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to load attachments for archive ${archiveId}`));
    };
  });
}

/**
 * Attaches Blob Object URLs to all message attachments in a parsed chat.
 * Returns an array of newly created Object URLs for subsequent revocation.
 */
export function hydrateChatMediaUrls(chat: ParsedChat, attachments: StoredAttachment[]): string[] {
  const createdUrls: string[] = [];
  if (typeof window === 'undefined' || !window.URL) return createdUrls;

  // Build lookup map by lowercase filename
  const attachmentMap = new Map<string, Blob>();
  for (const att of attachments) {
    if (att.blob) {
      attachmentMap.set(att.fileName.toLowerCase(), att.blob);
    }
  }

  for (const message of chat.messages) {
    if (!message.attachments || message.attachments.length === 0) continue;

    for (const att of message.attachments) {
      if (!att.fileName) continue;

      const cleanName = att.fileName.toLowerCase();
      // Try exact name or variations
      let blob = attachmentMap.get(cleanName);
      if (!blob) {
        // Try sanitized
        const sanitized = cleanName.replace(/[-_]/g, ' ');
        for (const [key, val] of attachmentMap.entries()) {
          if (key.replace(/[-_]/g, ' ') === sanitized) {
            blob = val;
            break;
          }
        }
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        att.mediaUrl = url;
        att.mediaStatus = 'available';
        createdUrls.push(url);
      } else if (!att.mediaUrl && att.mediaStatus !== 'missing') {
        att.mediaStatus = 'missing';
      }
    }
  }

  return createdUrls;
}

/**
 * Revokes an array of created Blob URLs to prevent memory leaks.
 */
export function revokeMediaUrls(urls: string[]): void {
  if (typeof window === 'undefined' || !window.URL) return;
  for (const url of urls) {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation errors
      }
    }
  }
}

/**
 * Deletes all attachments belonging to an archive.
 */
export async function deleteArchiveAttachments(archiveId: string): Promise<void> {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.ATTACHMENTS], 'readwrite');
    const store = transaction.objectStore(STORES.ATTACHMENTS);
    const index = store.index('archiveId');
    const request = index.getAllKeys(archiveId);

    request.onsuccess = () => {
      const keys = request.result;
      for (const key of keys) {
        store.delete(key);
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
