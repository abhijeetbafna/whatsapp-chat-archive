import { getDb, STORES } from './db';
import {
  ChatArchiveMetadata,
  MergeCompatibility,
  MergePreviewData,
  StoredAttachment,
} from '../../types/storage';
import { Message, ParsedChat, Participant, ConversationLink } from '../../types/chat';
import { getArchiveMetadata, deleteArchive } from './archive-repository';
import { getArchiveAttachments, createAttachmentId } from './attachment-repository';
import { generateFingerprint, deriveDefaultTitle } from './storage-utils';
import { cleanInvisibleUnicode } from '../parser/whatsapp-parser';

export interface MergeOptions {
  customTitle?: string;
  onProgress?: (status: string) => void;
}

/**
 * Assesses the compatibility between two or more archives to detect whether
 * they plausibly represent the same conversation or different ones.
 * Complies with Requirements 7 & 8: never silently merge different conversations.
 */
export function assessCompatibility(archives: ChatArchiveMetadata[]): MergeCompatibility {
  if (archives.length < 2) {
    return {
      confidence: 'high',
      title: 'Single Archive',
      reasons: ['No comparison needed.'],
      isWarning: false,
    };
  }

  const reasons: string[] = [];
  let score = 0;

  // 1. Participant Overlap Check
  const participantSets = archives.map(
    (a) => new Set((a.participants || []).map((p) => p.name.toLowerCase().trim()))
  );

  // Check intersection of all participant sets
  const commonParticipants: string[] = [];
  participantSets[0].forEach((name) => {
    if (participantSets.every((set) => set.has(name))) {
      commonParticipants.push(name);
    }
  });

  if (commonParticipants.length > 0) {
    score += 40;
    reasons.push(
      `Shared participants detected: ${commonParticipants.slice(0, 3).join(', ')}${
        commonParticipants.length > 3 ? '...' : ''
      }`
    );
  } else {
    score -= 30;
    reasons.push('No shared participant names found between the selected archives.');
  }

  // 2. Title Similarity Check
  const titles = archives.map((a) => a.title.toLowerCase().trim());
  const cleanTitle = (t: string) =>
    t
      .replace(/(?:whatsapp chat with|whatsapp chat|chat with|phone [a-z0-9]|copy|part [0-9]|export|archive)/gi, '')
      .replace(/[-_–—()]/g, ' ')
      .trim();

  const cleanedTitles = titles.map(cleanTitle);
  const titlesMatch = cleanedTitles.every((t) => t === cleanedTitles[0] && t.length > 0);

  if (titlesMatch) {
    score += 40;
    reasons.push('Archive titles indicate the same contact or conversation.');
  } else {
    // Check partial substring match
    const someTitleMatch = cleanedTitles.some(
      (t1, i) => cleanedTitles.some((t2, j) => i !== j && t1.length > 2 && (t2.includes(t1) || t1.includes(t2)))
    );
    if (someTitleMatch) {
      score += 20;
      reasons.push('Titles share common conversation keywords.');
    } else {
      score -= 20;
      reasons.push('Titles are noticeably different.');
    }
  }

  // 3. Date Sequence / Overlap Check
  const dateRanges = archives.map((a) => ({
    start: a.startDate ? new Date(a.startDate).getTime() : 0,
    end: a.endDate ? new Date(a.endDate).getTime() : 0,
  }));

  const allHaveDates = dateRanges.every((d) => d.start > 0 && d.end > 0);
  if (allHaveDates) {
    dateRanges.sort((a, b) => a.start - b.start);
    let hasContinuity = true;
    for (let i = 0; i < dateRanges.length - 1; i++) {
      // Check if overlapping or within 30 days gap
      const gap = dateRanges[i + 1].start - dateRanges[i].end;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (gap > thirtyDays) {
        hasContinuity = false;
        break;
      }
    }
    if (hasContinuity) {
      score += 20;
      reasons.push('Date ranges are continuous or overlapping.');
    }
  }

  if (score >= 60) {
    return {
      confidence: 'high',
      title: 'High Confidence Match',
      reasons,
      isWarning: false,
    };
  } else if (score >= 20) {
    return {
      confidence: 'medium',
      title: 'Moderate Match',
      reasons,
      isWarning: false,
    };
  } else {
    return {
      confidence: 'low',
      title: 'Potential Mismatch Warning',
      reasons,
      isWarning: true,
    };
  }
}

/**
 * Normalizes message text for duplicate comparison.
 */
function normalizeMessageText(text?: string): string {
  if (!text) return '';
  return cleanInvisibleUnicode(text).toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Generates a high-confidence signature for duplicate detection.
 * Complies with Requirements 14, 15, and 17:
 * Requires same timestamp, same sender, same normalized text, same attachment count & names.
 */
function createMessageDuplicateSignature(msg: Message): string {
  const normTime = msg.timestamp ? new Date(msg.timestamp).toISOString() : '';
  const normSender = (msg.senderName || '').toLowerCase().trim();
  const normText = normalizeMessageText(msg.text);
  const attCount = msg.attachments ? msg.attachments.length : 0;
  const attNames = (msg.attachments || [])
    .map((a) => (a.fileName || '').toLowerCase().trim())
    .sort()
    .join(',');

  return `${normTime}|#|${normSender}|#|${normText}|#|${attCount}:${attNames}|#|${msg.isSystemMessage}|#|${msg.isDeleted || false}`;
}

/**
 * Derives a default unified title for the merged archive.
 */
function deriveMergedTitle(archives: ChatArchiveMetadata[]): string {
  // If all share a base name
  const titles = archives.map((a) => a.title.trim());
  const cleanTitle = (t: string) =>
    t
      .replace(/\s*[-–—(].*(?:phone|copy|part|export|backup|merged|combined).*/gi, '')
      .trim();

  const baseTitles = titles.map(cleanTitle).filter((t) => t.length > 0);
  if (baseTitles.length > 0 && baseTitles.every((t) => t.toLowerCase() === baseTitles[0].toLowerCase())) {
    return `${baseTitles[0]} — Combined`;
  }

  if (titles.length === 2) {
    return `${titles[0]} & ${titles[1]} (Merged)`;
  }

  return `Combined WhatsApp Archive (${archives.length} sources)`;
}

interface LoadedArchiveData {
  metadata: ChatArchiveMetadata;
  messages: Message[];
  attachments: StoredAttachment[];
}

/**
 * Loads all data for a set of archives from IndexedDB for merging.
 */
async function loadSourceArchivesData(archiveIds: string[]): Promise<LoadedArchiveData[]> {
  const db = await getDb();
  const results: LoadedArchiveData[] = [];

  for (const archiveId of archiveIds) {
    const metadata = await getArchiveMetadata(archiveId);
    if (!metadata) {
      throw new Error(`Source archive not found: ${archiveId}`);
    }

    // Load messages
    const messages: Message[] = await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.MESSAGES], 'readonly');
      const store = transaction.objectStore(STORES.MESSAGES);
      const index = store.index('chatId');
      const request = index.getAll(archiveId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error(`Failed to load messages for ${archiveId}`));
    });

    // Load attachments
    const attachments = await getArchiveAttachments(archiveId);

    results.push({
      metadata,
      messages,
      attachments,
    });
  }

  return results;
}

/**
 * Computes a preview of the merge result without writing to the database.
 * Complies with Requirements 16 & 27: calculates actual values for preview.
 */
export async function computeMergePreview(archiveIds: string[]): Promise<MergePreviewData> {
  if (archiveIds.length < 2) {
    throw new Error('Please select at least two archives to merge.');
  }

  const loadedData = await loadSourceArchivesData(archiveIds);
  const sourceArchives = loadedData.map((d) => d.metadata);
  const compatibility = assessCompatibility(sourceArchives);

  let totalOriginalMessages = 0;
  const seenSignatures = new Set<string>();
  let duplicateCount = 0;
  const allMessages: Message[] = [];

  for (let archiveIndex = 0; archiveIndex < loadedData.length; archiveIndex++) {
    const { messages } = loadedData[archiveIndex];
    totalOriginalMessages += messages.length;

    for (let msgIndex = 0; msgIndex < messages.length; msgIndex++) {
      const msg = messages[msgIndex];
      const sig = createMessageDuplicateSignature(msg);

      if (seenSignatures.has(sig)) {
        duplicateCount++;
      } else {
        seenSignatures.add(sig);
        allMessages.push(msg);
      }
    }
  }

  // Deduplicated media count
  const seenAttachments = new Set<string>();
  let totalMediaCount = 0;
  for (const { attachments } of loadedData) {
    for (const att of attachments) {
      const key = `${att.fileName.toLowerCase()}::${att.size}`;
      if (!seenAttachments.has(key)) {
        seenAttachments.add(key);
        totalMediaCount++;
      }
    }
  }

  // Date range
  const validTimestamps = allMessages
    .map((m) => new Date(m.timestamp).getTime())
    .filter((t) => !isNaN(t));

  const minTime = validTimestamps.length > 0 ? Math.min(...validTimestamps) : undefined;
  const maxTime = validTimestamps.length > 0 ? Math.max(...validTimestamps) : undefined;

  // Reconciled participants
  const participantMap = new Map<string, Participant>();
  for (const { metadata } of loadedData) {
    for (const p of metadata.participants || []) {
      const key = p.name.trim().toLowerCase();
      const existing = participantMap.get(key);
      if (existing) {
        existing.messageCount += p.messageCount;
      } else {
        participantMap.set(key, { ...p });
      }
    }
  }

  return {
    sourceArchives,
    totalOriginalMessages,
    totalUniqueMessages: allMessages.length,
    duplicateCount,
    totalMediaCount,
    startDate: minTime ? new Date(minTime).toISOString() : undefined,
    endDate: maxTime ? new Date(maxTime).toISOString() : undefined,
    suggestedTitle: deriveMergedTitle(sourceArchives),
    compatibility,
    participants: Array.from(participantMap.values()),
  };
}

/**
 * Merges multiple WhatsApp archives into a NEW unified archive.
 * Complies with Requirements 1-46:
 * - Source archives are NOT modified or deleted (Requirement 9 & 35)
 * - Chronological message ordering with deterministic tie-breaking (Requirements 12 & 13)
 * - Source provenance tracked on every message (Requirement 10)
 * - High-confidence deduplication with conservative preservation (Requirements 14, 15, 17)
 * - Atomic transaction safety (Requirement 31)
 */
export async function mergeArchives(
  archiveIds: string[],
  options: MergeOptions = {}
): Promise<ChatArchiveMetadata> {
  const { customTitle, onProgress } = options;

  if (archiveIds.length < 2) {
    throw new Error('At least two archives are required to perform a merge.');
  }

  onProgress?.('Reading source archives...');
  const loadedData = await loadSourceArchivesData(archiveIds);
  const sourceArchives = loadedData.map((d) => d.metadata);

  const newArchiveId = `archive_merged_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const title = (customTitle && customTitle.trim()) || deriveMergedTitle(sourceArchives);
  const now = new Date().toISOString();

  // 1. Deduplicate & Collect Messages with Provenance
  onProgress?.('Reconciling and deduplicating messages...');
  const seenSignatures = new Set<string>();
  const mergedMessages: (Message & {
    sourceArchiveOrder: number;
    sourceMessageIndex: number;
  })[] = [];

  for (let archiveIndex = 0; archiveIndex < loadedData.length; archiveIndex++) {
    const { metadata: srcMeta, messages } = loadedData[archiveIndex];

    for (let msgIndex = 0; msgIndex < messages.length; msgIndex++) {
      const msg = messages[msgIndex];
      const sig = createMessageDuplicateSignature(msg);

      if (seenSignatures.has(sig)) {
        // High-confidence duplicate: skip adding duplicate copy
        continue;
      }

      seenSignatures.add(sig);

      // Preserve provenance (Requirement 10)
      const provenanceMsg = {
        ...msg,
        sourceArchiveId: msg.sourceArchiveId || srcMeta.id,
        sourceMessageId: msg.sourceMessageId || msg.id,
        sourceArchiveOrder: archiveIndex,
        sourceMessageIndex: msgIndex,
      };

      mergedMessages.push(provenanceMsg);
    }
  }

  // 2. Strict Chronological Ordering with Deterministic Tie-Breaking (Requirements 12 & 13)
  onProgress?.('Sorting messages chronologically...');
  mergedMessages.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();

    const isValA = !isNaN(timeA);
    const isValB = !isNaN(timeB);

    if (isValA && isValB) {
      if (timeA !== timeB) return timeA - timeB;
    } else if (isValA) {
      return -1;
    } else if (isValB) {
      return 1;
    }

    // Deterministic tie-breaking for identical timestamps (Requirement 13)
    if (a.sourceArchiveOrder !== b.sourceArchiveOrder) {
      return a.sourceArchiveOrder - b.sourceArchiveOrder;
    }
    return a.sourceMessageIndex - b.sourceMessageIndex;
  });

  // Assign stable, unique message IDs for the merged archive (Requirement 11)
  const finalMessages: Message[] = mergedMessages.map((m, index) => {
    return {
      id: `${newArchiveId}_m${index + 1}`,
      chatId: newArchiveId,
      timestamp: m.timestamp,
      senderId: m.senderId,
      senderName: m.senderName,
      text: m.text,
      caption: m.caption,
      type: m.type,
      attachments: (m.attachments || []).map((att) => ({ ...att })),
      isEdited: m.isEdited,
      isDeleted: m.isDeleted,
      isSystemMessage: m.isSystemMessage,
      rawText: m.rawText,
      sourceArchiveId: m.sourceArchiveId,
      sourceMessageId: m.sourceMessageId,
    };
  });

  // 3. Media Deduplication and Attachment Storage (Requirements 20 & 21)
  onProgress?.('Processing media attachments...');
  const db = await getDb();
  const seenAttachmentKeys = new Set<string>();
  const mergedAttachments: StoredAttachment[] = [];
  let totalMediaBytes = 0;

  for (const { attachments } of loadedData) {
    for (const att of attachments) {
      const dedupKey = `${att.fileName.toLowerCase()}::${att.size}`;
      if (seenAttachmentKeys.has(dedupKey)) {
        continue;
      }
      seenAttachmentKeys.add(dedupKey);

      totalMediaBytes += att.size || 0;
      mergedAttachments.push({
        id: createAttachmentId(newArchiveId, att.fileName),
        archiveId: newArchiveId,
        fileName: att.fileName,
        mimeType: att.mimeType,
        size: att.size,
        type: att.type,
        blob: att.blob,
        data: att.data,
        originalPath: att.originalPath,
      });
    }
  }

  // 4. Participant Reconciliation (Requirement 19)
  onProgress?.('Reconciling conversation participants...');
  const participantMap = new Map<string, Participant>();
  let documentCount = 0;

  for (const msg of finalMessages) {
    if (!msg.isSystemMessage && msg.senderName) {
      const key = msg.senderName.trim().toLowerCase();
      const existing = participantMap.get(key);
      if (existing) {
        existing.messageCount++;
      } else {
        participantMap.set(key, {
          id: msg.senderName,
          name: msg.senderName,
          messageCount: 1,
        });
      }
    }

    if (msg.attachments) {
      for (const att of msg.attachments) {
        if (att.type === 'document') documentCount++;
      }
    }
  }

  // 5. Links Collection
  const links: ConversationLink[] = [];
  for (const { metadata } of loadedData) {
    for (const link of metadata.links || []) {
      if (!links.some((l) => l.url === link.url && l.timestamp === link.timestamp)) {
        links.push(link);
      }
    }
  }

  // 6. Atomic Persistence into IndexedDB (Requirement 31)
  onProgress?.('Saving unified archive...');
  try {
    // a) Save attachments
    if (mergedAttachments.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORES.ATTACHMENTS], 'readwrite');
        const store = transaction.objectStore(STORES.ATTACHMENTS);

        transaction.onerror = () => reject(transaction.error || new Error('Failed to save merged attachments'));
        transaction.oncomplete = () => resolve();

        for (const att of mergedAttachments) {
          store.put(att);
        }
      });
    }

    // b) Save messages
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.MESSAGES], 'readwrite');
      const store = transaction.objectStore(STORES.MESSAGES);

      transaction.onerror = () => reject(transaction.error || new Error('Failed to save merged messages'));
      transaction.oncomplete = () => resolve();

      for (const msg of finalMessages) {
        store.put(msg);
      }
    });

    // c) Save archive metadata
    const startDate = finalMessages.length > 0 ? finalMessages[0].timestamp : undefined;
    const endDate = finalMessages.length > 0 ? finalMessages[finalMessages.length - 1].timestamp : undefined;

    const mergedArchiveMetadata: ChatArchiveMetadata = {
      id: newArchiveId,
      title,
      fingerprint: generateFingerprint(
        {
          chatId: newArchiveId,
          title,
          participants: Array.from(participantMap.values()),
          messages: finalMessages,
          links,
          messageCount: finalMessages.length,
          mediaCount: mergedAttachments.length,
          unrecognizedLines: 0,
        },
        title
      ),
      participants: Array.from(participantMap.values()),
      startDate,
      endDate,
      messageCount: finalMessages.length,
      mediaCount: mergedAttachments.length,
      documentCount,
      linkCount: links.length,
      links,
      createdAt: now,
      importedAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      source: {
        type: 'merged-archive',
        chatFileName: title,
        sourceArchives: archiveIds,
      },
      totalMediaSizeBytes: totalMediaBytes,
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.ARCHIVES], 'readwrite');
      const store = transaction.objectStore(STORES.ARCHIVES);

      transaction.onerror = () => reject(transaction.error || new Error('Failed to save merged archive metadata'));
      transaction.oncomplete = () => resolve();

      store.put(mergedArchiveMetadata);
    });

    return mergedArchiveMetadata;
  } catch (err) {
    // Atomically roll back by cleaning up any partial records
    await deleteArchive(newArchiveId).catch(() => {});
    throw new Error(`Merge failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
