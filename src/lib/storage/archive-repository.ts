import { getDb, STORES } from './db';
import { ChatArchiveMetadata, StoredAttachment } from '../../types/storage';
import { ParsedChat, Message } from '../../types/chat';
import { ImportedMediaFile } from '../../types';
import {
  saveArchiveAttachments,
  getArchiveAttachments,
  hydrateChatMediaUrls,
  revokeMediaUrls,
  deleteArchiveAttachments,
} from './attachment-repository';
import { generateFingerprint, deriveDefaultTitle } from './storage-utils';

/**
 * Strips ephemeral blob URLs from messages before persistent storage.
 */
function sanitizeMessageForStorage(msg: Message, archiveId: string): Message {
  return {
    ...msg,
    chatId: archiveId,
    sourceArchiveId: msg.sourceArchiveId,
    sourceMessageId: msg.sourceMessageId,
    isStarred: Boolean(msg.isStarred),
    attachments: (msg.attachments || []).map((att) => ({
      type: att.type,
      fileName: att.fileName,
      mediaMimeType: att.mediaMimeType,
      mediaSize: att.mediaSize,
      mediaStatus: att.mediaStatus,
      // Omit ephemeral mediaUrl
    })),
  };
}

/**
 * Saves a full parsed chat archive and associated media into IndexedDB.
 */
export async function saveArchive(
  chat: ParsedChat,
  originalFileName: string,
  mediaFiles: ImportedMediaFile[] = [],
  customTitle?: string
): Promise<ChatArchiveMetadata> {
  const db = await getDb();
  const archiveId = chat.chatId || `archive_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const title = (customTitle && customTitle.trim()) || deriveDefaultTitle(chat, originalFileName);
  const fingerprint = generateFingerprint(chat, originalFileName);
  const now = new Date().toISOString();

  // Calculate statistics
  let documentCount = 0;
  for (const msg of chat.messages) {
    if (msg.attachments) {
      for (const att of msg.attachments) {
        if (att.type === 'document') documentCount++;
      }
    }
  }

  // 1. Save attachments first
  let totalMediaBytes = 0;
  try {
    totalMediaBytes = await saveArchiveAttachments(archiveId, mediaFiles);
  } catch (err) {
    throw new Error(`Failed to persist media files: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2. Save messages in a transaction
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.MESSAGES], 'readwrite');
      const store = transaction.objectStore(STORES.MESSAGES);

      transaction.onerror = () => {
        reject(transaction.error || new Error('Failed to save messages transaction'));
      };

      transaction.oncomplete = () => {
        resolve();
      };

      for (const msg of chat.messages) {
        const sanitized = sanitizeMessageForStorage(msg, archiveId);
        store.put(sanitized);
      }
    });
  } catch (err) {
    // Cleanup attachments if messages save failed
    await deleteArchiveAttachments(archiveId).catch(() => {});
    throw new Error(`Failed to persist chat messages: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 3. Save archive metadata
  const metadata: ChatArchiveMetadata = {
    id: archiveId,
    title,
    fingerprint,
    participants: chat.participants || [],
    startDate: chat.startDate,
    endDate: chat.endDate,
    messageCount: chat.messages.length,
    mediaCount: chat.mediaCount || 0,
    documentCount,
    linkCount: (chat.links || []).length,
    links: chat.links || [],
    createdAt: now,
    importedAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    source: {
      type: 'whatsapp-export',
      originalFileName,
      chatFileName: chat.title || originalFileName,
    },
    totalMediaSizeBytes: totalMediaBytes,
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.ARCHIVES], 'readwrite');
      const store = transaction.objectStore(STORES.ARCHIVES);

      transaction.onerror = () => {
        reject(transaction.error || new Error('Failed to save archive metadata'));
      };

      transaction.oncomplete = () => {
        resolve();
      };

      store.put(metadata);
    });
  } catch (err) {
    // Cleanup on failure
    await deleteArchive(archiveId).catch(() => {});
    throw new Error(`Failed to persist archive metadata: ${err instanceof Error ? err.message : String(err)}`);
  }

  return metadata;
}

/**
 * Checks if an archive with the same fingerprint already exists (for duplicate warnings).
 */
export async function checkDuplicateArchive(
  chat: ParsedChat,
  originalFileName: string
): Promise<ChatArchiveMetadata | null> {
  const db = await getDb();
  const fingerprint = generateFingerprint(chat, originalFileName);

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORES.ARCHIVES], 'readonly');
      const store = transaction.objectStore(STORES.ARCHIVES);
      const index = store.index('fingerprint');
      const request = index.get(fingerprint);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Retrieves all stored archive metadata records (lightweight, for Archive Library).
 * Does NOT load heavy messages or media blobs into memory.
 */
export async function getArchiveList(): Promise<ChatArchiveMetadata[]> {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.ARCHIVES], 'readonly');
    const store = transaction.objectStore(STORES.ARCHIVES);
    const request = store.getAll();

    request.onsuccess = () => {
      const archives: ChatArchiveMetadata[] = request.result || [];
      // Sort by updatedAt descending (most recent first)
      archives.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(archives);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to retrieve archive list'));
    };
  });
}

/**
 * Retrieves metadata for a single archive.
 */
export async function getArchiveMetadata(id: string): Promise<ChatArchiveMetadata | null> {
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.ARCHIVES], 'readonly');
    const store = transaction.objectStore(STORES.ARCHIVES);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to load archive metadata for ${id}`));
    };
  });
}

/**
 * Renames an archive. Modifies ONLY the archive title and updatedAt.
 * Complies with Requirement 12: does not alter messages, timestamps, senders, or attachments.
 */
export async function renameArchive(archiveId: string, newTitle: string): Promise<ChatArchiveMetadata> {
  const db = await getDb();
  const trimmed = newTitle.trim();
  if (!trimmed) {
    throw new Error('Archive title cannot be empty.');
  }

  const metadata = await getArchiveMetadata(archiveId);
  if (!metadata) {
    throw new Error(`Archive not found: ${archiveId}`);
  }

  metadata.title = trimmed;
  metadata.updatedAt = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.ARCHIVES], 'readwrite');
    const store = transaction.objectStore(STORES.ARCHIVES);
    const request = store.put(metadata);

    request.onsuccess = () => {
      resolve(metadata);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to rename archive ${archiveId}`));
    };
  });
}

/**
 * Loads a full archive and reconstructs ParsedChat with live media URLs.
 * Returns parsedChat, metadata, and a cleanup function to revoke created Object URLs.
 */
export async function loadFullChat(
  archiveId: string
): Promise<{ chat: ParsedChat; metadata: ChatArchiveMetadata; cleanupUrls: () => void } | null> {
  const db = await getDb();
  const metadata = await getArchiveMetadata(archiveId);
  if (!metadata) return null;

  // 1. Fetch messages
  const messages: Message[] = await new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MESSAGES], 'readonly');
    const store = transaction.objectStore(STORES.MESSAGES);
    const index = store.index('chatId');
    const request = index.getAll(archiveId);

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to load messages for archive ${archiveId}`));
    };
  });

  // Sort messages chronologically
  const allValidDates = messages.every((m) => !isNaN(new Date(m.timestamp).getTime()));
  if (allValidDates) {
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // 2. Fetch attachments
  let attachments: StoredAttachment[] = [];
  try {
    attachments = await getArchiveAttachments(archiveId);
  } catch (err) {
    console.warn(`Could not load media attachments for ${archiveId}:`, err);
  }

  // 3. Construct ParsedChat
  const chat: ParsedChat = {
    chatId: archiveId,
    title: metadata.title,
    participants: metadata.participants || [],
    messages,
    links: metadata.links || [],
    startDate: metadata.startDate,
    endDate: metadata.endDate,
    messageCount: messages.length,
    mediaCount: metadata.mediaCount,
    unrecognizedLines: 0,
  };

  // 4. Hydrate media URLs
  const activeBlobUrls = hydrateChatMediaUrls(chat, attachments);

  // Update lastOpenedAt in background
  try {
    metadata.lastOpenedAt = new Date().toISOString();
    const updateTx = db.transaction([STORES.ARCHIVES], 'readwrite');
    updateTx.objectStore(STORES.ARCHIVES).put(metadata);
  } catch {
    // Non-fatal
  }

  return {
    chat,
    metadata,
    cleanupUrls: () => revokeMediaUrls(activeBlobUrls),
  };
}

/**
 * Permanently deletes an archive, its messages, and its stored attachments.
 * Complies with Requirement 13 & 14: atomic removal with no orphaned records.
 */
export async function deleteArchive(archiveId: string): Promise<void> {
  const db = await getDb();

  // 1. Delete attachments
  await deleteArchiveAttachments(archiveId);

  // 2. Delete messages
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORES.MESSAGES], 'readwrite');
    const store = transaction.objectStore(STORES.MESSAGES);
    const index = store.index('chatId');
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

  // 3. Delete archive metadata
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORES.ARCHIVES], 'readwrite');
    const store = transaction.objectStore(STORES.ARCHIVES);
    const request = store.delete(archiveId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Toggles or sets the starred status of a message in IndexedDB.
 */
export async function toggleMessageStarred(
  archiveId: string,
  messageId: string,
  forceStarred?: boolean
): Promise<boolean> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MESSAGES], 'readwrite');
    const store = transaction.objectStore(STORES.MESSAGES);
    const request = store.get(messageId);

    request.onsuccess = () => {
      const msg: Message | undefined = request.result;
      if (!msg) {
        resolve(false);
        return;
      }
      const newStatus = forceStarred !== undefined ? forceStarred : !msg.isStarred;
      msg.isStarred = newStatus;
      const putRequest = store.put(msg);
      putRequest.onsuccess = () => resolve(newStatus);
      putRequest.onerror = () => reject(putRequest.error || new Error('Failed to update message star status'));
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to retrieve message for starring'));
    };
  });
}

/**
 * Retrieves all starred messages for a given archive from IndexedDB.
 */
export async function getStarredMessages(archiveId: string): Promise<Message[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.MESSAGES], 'readonly');
    const store = transaction.objectStore(STORES.MESSAGES);
    const index = store.index('chatId');
    const request = index.getAll(archiveId);

    request.onsuccess = () => {
      const all: Message[] = request.result || [];
      const starred = all.filter((m) => m.isStarred);
      resolve(starred);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to load starred messages'));
    };
  });
}

