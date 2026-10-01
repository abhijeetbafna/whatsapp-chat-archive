import { Message, ParsedChat, Participant, MessageType, Attachment, ConversationLink } from '../../types/chat';
import { extractLinksFromText } from './link-extractor';
import { ImportedMediaFile } from '../../types';

// Generates a simple pseudo-random string for IDs
const generateId = () => Math.random().toString(36).substring(2, 10);

/**
 * Strips invisible Unicode directional marks, zero-width spaces, and control chars
 */
export const cleanInvisibleUnicode = (str: string): string => {
  return str
    .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF\u2060\u200B\u200C\u200D\u00AD]/g, '')
    .replace(/[\u202F\u00A0\u1680\u2000-\u200A\u205F\u3000]/g, ' ') // Replace varied whitespace with standard space
    .trim();
};

const KNOWN_SYSTEM_PHRASES = [
  'messages and calls are end-to-end encrypted',
  'created group',
  'created this group',
  'changed the group subject',
  'changed the subject',
  'changed the group description',
  'changed this group\'s icon',
  'changed the group icon',
  'added',
  'removed',
  'left',
  'joined using this group\'s invite link',
  'security code changed',
  'changed to',
  'you blocked this contact',
  'you unblocked this contact',
  'blocked this person',
  'unblocked this person',
  'tap to unblock',
  'you\'re now an admin',
  'pinned a message',
  'disappearing messages',
  'missed voice call',
  'missed video call',
  'missed group call',
  'call started',
  'call ended',
  'waiting for this message'
];

export const isDeletedMessageText = (text: string): boolean => {
  if (!text) return false;
  const cleaned = cleanInvisibleUnicode(text).toLowerCase();
  return cleaned === 'this message was deleted' || 
         cleaned === 'you deleted this message' ||
         cleaned === 'this message was deleted.' ||
         cleaned === 'you deleted this message.';
};

export const isSystemMessageText = (text: string): boolean => {
  const cleaned = cleanInvisibleUnicode(text).toLowerCase();
  if (cleaned.length === 0) return false;
  return KNOWN_SYSTEM_PHRASES.some(phrase => cleaned.includes(phrase));
};

const getExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

export const detectMediaTypeFromFileName = (fileName: string): MessageType => {
  const ext = getExtension(fileName);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp', 'svg'].includes(ext)) {
    if (fileName.toLowerCase().includes('sticker') || fileName.toUpperCase().startsWith('STK-')) {
      return 'sticker';
    }
    return 'image';
  }
  if (['mp4', 'mov', 'avi', 'mkv', '3gp', 'webm', 'm4v'].includes(ext)) return 'video';
  if (['opus', 'mp3', 'm4a', 'aac', 'ogg', 'wav', 'amr', 'wma'].includes(ext)) return 'audio';
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', 'vcf'].includes(ext)) return 'document';
  return 'unknown';
};

interface ExtractedMediaInfo {
  isMedia: boolean;
  type: MessageType;
  fileName?: string;
  caption?: string;
}

export const extractMediaInfo = (text: string): ExtractedMediaInfo => {
  const cleaned = cleanInvisibleUnicode(text);

  // Pattern 1: iOS attached format: <attached: 00000001-PHOTO-2023-01-01.jpg>
  const iosAttachedMatch = cleaned.match(/^<attached:\s*([^>]+)>(?:\s*([\s\S]*))?$/i);
  if (iosAttachedMatch) {
    const fileName = cleanInvisibleUnicode(iosAttachedMatch[1]);
    const caption = iosAttachedMatch[2]?.trim() || undefined;
    return {
      isMedia: true,
      type: detectMediaTypeFromFileName(fileName),
      fileName,
      caption,
    };
  }

  // Pattern 2: Android / iOS file attached format: IMG-20230101-WA0001.jpg (file attached)
  const fileAttachedMatch = cleaned.match(/^([^\n(]+?\.[a-zA-Z0-9]{2,5})\s*\((?:file\s+)?attached\)(?:\s*([\s\S]*))?$/i);
  if (fileAttachedMatch) {
    const fileName = cleanInvisibleUnicode(fileAttachedMatch[1]);
    const caption = fileAttachedMatch[2]?.trim() || undefined;
    return {
      isMedia: true,
      type: detectMediaTypeFromFileName(fileName),
      fileName,
      caption,
    };
  }

  // Pattern 3: Direct media filename on a line (e.g. IMG-20230101-WA0001.jpg or photo.png)
  const directFileMatch = cleaned.match(/^((?:IMG|VID|PTT|AUD|DOC|STK)-[0-9A-Za-z-]+\.[a-zA-Z0-9]{2,5})(?:\s*([\s\S]*))?$/i);
  if (directFileMatch) {
    const fileName = cleanInvisibleUnicode(directFileMatch[1]);
    const caption = directFileMatch[2]?.trim() || undefined;
    return {
      isMedia: true,
      type: detectMediaTypeFromFileName(fileName),
      fileName,
      caption,
    };
  }

  // Pattern 4: WhatsApp Omitted Media Placeholders
  const lower = cleaned.toLowerCase();
  if (lower === '<media omitted>' || lower === 'media omitted') {
    return { isMedia: true, type: 'unknown' };
  }
  if (lower === 'image omitted' || lower === '<image omitted>') {
    return { isMedia: true, type: 'image' };
  }
  if (lower === 'video omitted' || lower === '<video omitted>') {
    return { isMedia: true, type: 'video' };
  }
  if (lower === 'audio omitted' || lower === '<audio omitted>') {
    return { isMedia: true, type: 'audio' };
  }
  if (lower === 'sticker omitted' || lower === '<sticker omitted>') {
    return { isMedia: true, type: 'sticker' };
  }
  if (lower === 'document omitted' || lower === '<document omitted>') {
    return { isMedia: true, type: 'document' };
  }

  return { isMedia: false, type: 'text' };
};

const normalizeTimestamp = (dateStr: string, timeStr: string, format: 'auto' | 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'auto'): string => {
  const cleanDate = cleanInvisibleUnicode(dateStr).replace(/[-.]/g, '/');
  const cleanTime = cleanInvisibleUnicode(timeStr);
  
  const parts = cleanDate.split('/');
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    let p2 = parseInt(parts[2], 10);
    
    if (p2 < 100) p2 += 2000;
    
    let month = p0, day = p1;
    const year = p2;
    
    if (format === 'DD/MM/YYYY' || (format === 'auto' && p0 > 12)) {
      day = p0;
      month = p1;
    }
    
    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    const yyyy = year.toString().padStart(4, '0');
    
    try {
      const parsed = new Date(`${mm}/${dd}/${yyyy} ${cleanTime}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {
      // fallback
    }
  }
  
  try {
    const parsed = new Date(`${cleanDate} ${cleanTime}`);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {
    // fallback
  }
  
  return `${cleanDate} ${cleanTime}`;
};

export const parseWhatsAppChat = (
  chatText: string,
  chatId: string = generateId(),
  mediaFiles?: ImportedMediaFile[],
  dateFormat: 'auto' | 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'auto'
): ParsedChat => {
  // Create a lookup map for media files from ZIP
  const mediaMap = new Map<string, ImportedMediaFile>();
  if (mediaFiles && mediaFiles.length > 0) {
    for (const file of mediaFiles) {
      const cleanName = cleanInvisibleUnicode(file.fileName).toLowerCase();
      mediaMap.set(cleanName, file);
      
      const baseName = cleanInvisibleUnicode(file.path.split('/').pop() || '').toLowerCase();
      if (baseName) {
        mediaMap.set(baseName, file);
      }

      // Add decoded versions
      try {
        const decoded = decodeURIComponent(baseName);
        if (decoded !== baseName) mediaMap.set(decoded, file);
      } catch {
        // If native URL parsing fails, we'll try a regex fallback or just leave as is
      }

      // Add variations with spaces replaced by dashes/underscores and vice versa
      mediaMap.set(baseName.replace(/ /g, '-'), file);
      mediaMap.set(baseName.replace(/ /g, '_'), file);
      mediaMap.set(baseName.replace(/[-_]/g, ' '), file);
    }
  }

  const lines = chatText.split('\n');
  const messages: Message[] = [];
  const links: ConversationLink[] = [];
  let currentMessage: Message | null = null;
  let unrecognizedLines = 0;

  // Regex matching start of a message
  const messageStartRegex = /^[\u200E\u200F\uFEFF]?\[?(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})[, ]+(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202F\u00A0]*[apAP][mM])?)\]?\s*(?:-\s*)?(.*)/;

  const checkEdited = (text: string): { cleanedText: string, isEdited: boolean } => {
    let isEdited = false;
    let cleanedText = text || '';
    
    const editedPatterns = [
      /<This message was edited\.?>/i,
      /\[This message was edited\.?\]/i,
      /\(This message was edited\.?\)/i,
      /This message was edited\.?/i,
      /<\s*Edited\s*>/i,
      /\[\s*Edited\s*\]/i,
      /\(\s*Edited\s*\)/i,
      /<This message has been edited\.?>/i,
      /\[This message has been edited\.?\]/i,
      /\(This message has been edited\.?\)/i,
      /This message has been edited\.?/i,
      /<यह संदेश संपादित किया गया था\.?>/i,
      /\[यह संदेश संपादित किया गया था\.?\]/i,
      /\(यह संदेश संपादित किया गया था\.?\)/i,
      /यह संदेश संपादित किया गया था\.?/i
    ];

    for (const pattern of editedPatterns) {
      if (pattern.test(cleanedText)) {
        isEdited = true;
        cleanedText = cleanedText.replace(pattern, '').trim();
        break;
      }
    }
    
    return { cleanedText, isEdited };
  };

  const finalizeMessage = (msg: Message | null) => {
    if (!msg) return;
    
    // Check if edited or deleted
    const { cleanedText, isEdited } = checkEdited(msg.text || '');
    msg.text = cleanedText;
    if (isEdited) msg.isEdited = true;
    
    if (isDeletedMessageText(msg.text || '') || (msg.rawText && isDeletedMessageText(msg.rawText))) {
      msg.isDeleted = true;
      msg.type = 'text'; // Force deleted message to be text type
      msg.isSystemMessage = false; // Never a system message
      
      // If it's a deleted message without a sender but says "You deleted", it's from the owner
      if (!msg.senderName && (msg.text?.toLowerCase().includes('you deleted') || msg.rawText?.toLowerCase().includes('you deleted'))) {
         // We can't know the exact name here easily, but we can set a dummy name that will be handled by UI
         // or just leave it empty and let the UI check the text. We will just leave it empty.
      }
    }
    
    // Set type based on attachments and text (only if not already set or deleted)
    if (!msg.isSystemMessage && !msg.isDeleted) {
      if (msg.attachments && msg.attachments.length > 0) {
         if (msg.text || msg.attachments.length > 1) {
           msg.type = 'mixed';
         } else {
           msg.type = msg.attachments[0].type;
         }
      } else {
         msg.type = 'text';
      }
    }
    
    messages.push(msg);
    
    // Extract links
    if (msg.text && !msg.isSystemMessage) {
      const extractedLinks = extractLinksFromText(msg.text, msg.id, msg.timestamp, msg.senderName);
      links.push(...extractedLinks);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanedLine = cleanInvisibleUnicode(rawLine);

    if (cleanedLine.length === 0 && !currentMessage) continue;

    const match = rawLine.match(messageStartRegex);

    if (match) {
      const dateStr = match[1];
      const timeStr = match[2];
      const rest = cleanInvisibleUnicode(match[3]);

      let senderName = '';
      let text = '';
      let isSystem = false;

      const colonMatch = rest.match(/^(.*?):\s*(.*)$/);
      
      if (colonMatch) {
        const potentialSender = colonMatch[1].trim();
        const potentialText = colonMatch[2];
        
        // Only check the potential sender for system phrases. Checking the full 'rest' string
        // causes false positives if a user's message text contains words like 'left' or 'added'.
        if (isSystemMessageText(potentialSender)) {
          isSystem = true;
          text = rest;
        } else {
          senderName = potentialSender;
          text = potentialText;
        }
      } else {
        // Line without colon. Unless it's completely empty punctuation, 
        // it is almost universally a system message in WhatsApp exports.
        const stripped = cleanInvisibleUnicode(rest).trim();
        if (stripped.length === 0 || /^[-_.~,;:!?'"“”‘’/\\]+$/.test(stripped)) {
          continue; // Skip these completely
        }
        isSystem = true;
        text = rest;
      }

      const timestamp = normalizeTimestamp(dateStr, timeStr, dateFormat);
      const mediaInfo = isSystem ? { isMedia: false, type: 'system' as MessageType } : extractMediaInfo(text);

      let attachment: Attachment | null = null;

      if (mediaInfo.isMedia) {
        let mediaFileName = mediaInfo.fileName;
        let mediaType = mediaInfo.type;
        let mediaUrl: string | undefined = undefined;
        let mediaMimeType: string | undefined = undefined;
        let mediaSize: number | undefined = undefined;
        let mediaStatus: 'available' | 'missing' | 'unsupported' | 'error' | undefined = undefined;

        if (mediaFileName && mediaMap.size > 0) {
          const cleanName = cleanInvisibleUnicode(mediaFileName).toLowerCase();
          
          let decodedName = cleanName;
          try {
            decodedName = decodeURIComponent(cleanName);
          } catch {
            // Ignore parse errors, will be treated as text
          }

          const lookupKeys = [
            cleanName,
            decodedName,
            cleanName.replace(/ /g, '-'),
            cleanName.replace(/ /g, '_'),
            cleanName.replace(/[-_]/g, ' ')
          ];

          let matchedMedia: ImportedMediaFile | undefined;
          for (const key of lookupKeys) {
            if (mediaMap.has(key)) {
              matchedMedia = mediaMap.get(key);
              break;
            }
          }

          if (matchedMedia) {
            mediaFileName = matchedMedia.fileName;
            mediaMimeType = matchedMedia.mimeType;
            mediaSize = matchedMedia.size;
            if (matchedMedia.type && matchedMedia.type !== 'other') {
              mediaType = matchedMedia.type;
            }
            if (matchedMedia.blob && typeof window !== 'undefined' && window.URL) {
              mediaUrl = URL.createObjectURL(matchedMedia.blob);
            }
            mediaStatus = 'available';
          } else {
            mediaStatus = 'missing';
          }
        } else if (mediaInfo.isMedia && !mediaUrl) {
           mediaStatus = 'missing';
        }

        attachment = {
          type: mediaType,
          fileName: mediaFileName,
          mediaUrl,
          mediaMimeType,
          mediaSize,
          mediaStatus
        };
      }

      const textBody = mediaInfo.caption || (mediaInfo.isMedia ? '' : text);

      const canMergeMedia = (type: MessageType | undefined) => type === 'image' || type === 'video';
      
      const isCurrentMergeableMedia = currentMessage && 
                                      currentMessage.attachments.length > 0 && 
                                      currentMessage.attachments.every(a => canMergeMedia(a.type));
                                      
      const isNewMergeableMedia = attachment && canMergeMedia(attachment.type);

      if (
        currentMessage &&
        !currentMessage.isSystemMessage &&
        !isSystem &&
        currentMessage.senderName === senderName &&
        currentMessage.timestamp === timestamp &&
        isCurrentMergeableMedia &&
        isNewMergeableMedia
      ) {
        // Merge into currentMessage (forming an album)
        if (attachment) {
          currentMessage.attachments.push(attachment);
        }
        if (textBody) {
          currentMessage.text = currentMessage.text ? currentMessage.text + '\n' + textBody : textBody;
        }
        currentMessage.rawText += '\n' + rawLine;
      } else {
        finalizeMessage(currentMessage);
        
        currentMessage = {
          id: `${chatId}-${i}-${generateId()}`,
          chatId,
          timestamp,
          senderName: isSystem ? undefined : senderName,
          text: textBody,
          type: isSystem ? 'system' : 'text',
          attachments: attachment ? [attachment] : [],
          isSystemMessage: isSystem,
          rawText: rawLine,
        };
      }
    } else {
      if (currentMessage) {
        currentMessage.text += '\n' + rawLine;
        currentMessage.rawText += '\n' + rawLine;
      } else {
        if (cleanedLine.length > 0) {
          unrecognizedLines++;
        }
      }
    }
  }

  finalizeMessage(currentMessage);

  // Participants & Media Count
  const participantMap = new Map<string, Participant>();
  let mediaCount = 0;

  for (const msg of messages) {
    if (!msg.isSystemMessage && msg.senderName) {
      const existing = participantMap.get(msg.senderName);
      if (existing) {
        existing.messageCount++;
      } else {
        participantMap.set(msg.senderName, {
          id: msg.senderName,
          name: msg.senderName,
          messageCount: 1,
        });
      }
    }
    
    if (msg.attachments && msg.attachments.length > 0) {
      mediaCount += msg.attachments.length;
    }
  }

  // Sort messages chronologically
  const allValidDates = messages.every(m => !isNaN(new Date(m.timestamp).getTime()));
  if (allValidDates) {
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  return {
    chatId,
    participants: Array.from(participantMap.values()),
    messages,
    links,
    startDate: messages.length > 0 ? messages[0].timestamp : undefined,
    endDate: messages.length > 0 ? messages[messages.length - 1].timestamp : undefined,
    messageCount: messages.length,
    mediaCount,
    unrecognizedLines,
  };
};
