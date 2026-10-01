import { ParsedChat } from '../../types/chat';
import { StorageEstimate } from '../../types/storage';

/**
 * Generates a deterministic fingerprint for an archive to detect duplicate imports
 * without doing expensive hashing of multi-gigabyte media blobs.
 */
export function generateFingerprint(chat: ParsedChat, originalFileName: string): string {
  const msgCount = chat.messages.length;
  const firstMsg = msgCount > 0 ? chat.messages[0] : null;
  const lastMsg = msgCount > 0 ? chat.messages[msgCount - 1] : null;
  const midMsg = msgCount > 2 ? chat.messages[Math.floor(msgCount / 2)] : null;

  const components = [
    originalFileName.toLowerCase().trim(),
    msgCount.toString(),
    firstMsg ? `${firstMsg.timestamp}_${firstMsg.senderName || ''}_${(firstMsg.text || '').slice(0, 30)}` : '',
    midMsg ? `${midMsg.timestamp}_${midMsg.senderName || ''}_${(midMsg.text || '').slice(0, 30)}` : '',
    lastMsg ? `${lastMsg.timestamp}_${lastMsg.senderName || ''}_${(lastMsg.text || '').slice(0, 30)}` : '',
  ];

  // Simple string hash
  let hash = 0;
  const str = components.join('|#|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  return `fp_${Math.abs(hash).toString(36)}_${msgCount}`;
}

/**
 * Derives a human-friendly default title for a parsed chat.
 * Complies with Requirement 11:
 * "The application should generate a sensible default archive name.
 * If a reliable participant/chat name is unavailable, use something like:
 * WhatsApp Archive — 18 Sep 2026. Do not expose raw filenames as the only title."
 */
export function deriveDefaultTitle(chat: ParsedChat, fallbackFileName?: string): string {
  // If title was parsed and is not raw generic file
  if (chat.title && !chat.title.toLowerCase().endsWith('.txt') && !chat.title.toLowerCase().endsWith('.zip')) {
    return chat.title;
  }

  // Check fallbackFileName for "WhatsApp Chat with <Name>"
  if (fallbackFileName) {
    const nameMatch = fallbackFileName.match(/WhatsApp Chat (?:with|con|avec|mit)\s+([^.]+)/i);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
  }

  // If 2 participants (1-on-1 chat)
  if (chat.participants.length === 2) {
    // If one is named, pick the prominent one
    return chat.participants[0].name;
  }

  // If 1 participant
  if (chat.participants.length === 1) {
    return chat.participants[0].name;
  }

  // If group chat with 3+ participants
  if (chat.participants.length > 2) {
    const names = chat.participants.slice(0, 2).map((p) => p.name).join(', ');
    return `${names} & ${chat.participants.length - 2} others`;
  }

  // Fallback to formatted date
  if (chat.startDate) {
    try {
      const d = new Date(chat.startDate);
      if (!isNaN(d.getTime())) {
        const formatted = d.toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        return `WhatsApp Archive — ${formatted}`;
      }
    } catch {
      // Fallback
    }
  }

  return 'WhatsApp Archive';
}

/**
 * Formats byte counts into human-readable strings (e.g., 2.4 MB, 1.2 GB)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Retrieves browser storage usage and quota estimate using navigator.storage.estimate().
 */
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage || 0;
    const quotaBytes = estimate.quota || 0;
    const percentageUsed = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;

    return {
      usageBytes,
      quotaBytes,
      usageFormatted: formatBytes(usageBytes),
      quotaFormatted: formatBytes(quotaBytes),
      percentageUsed: Math.min(100, Math.round(percentageUsed * 10) / 10),
    };
  } catch (err) {
    console.warn('Failed to retrieve storage estimate:', err);
    return null;
  }
}
