import { Participant, ConversationLink, MessageType } from './chat';

export interface ChatArchiveMetadata {
  id: string;
  title: string;
  fingerprint: string;
  participants: Participant[];
  startDate?: string;
  endDate?: string;
  messageCount: number;
  mediaCount: number;
  documentCount: number;
  linkCount: number;
  links: ConversationLink[];
  createdAt: string;
  importedAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  source: {
    type: 'whatsapp-export' | 'backup-restore' | 'merged-archive';
    originalFileName?: string;
    chatFileName?: string;
    sourceArchives?: string[];
  };
  totalMediaSizeBytes?: number;
}

export interface MergeCompatibility {
  confidence: 'high' | 'medium' | 'low';
  title: string;
  reasons: string[];
  isWarning: boolean;
}

export interface MergePreviewData {
  sourceArchives: ChatArchiveMetadata[];
  totalOriginalMessages: number;
  totalUniqueMessages: number;
  duplicateCount: number;
  totalMediaCount: number;
  startDate?: string;
  endDate?: string;
  suggestedTitle: string;
  compatibility: MergeCompatibility;
  participants: Participant[];
}

export interface StoredAttachment {
  id: string; // archiveId + '::' + fileName
  archiveId: string;
  fileName: string;
  mimeType?: string;
  size: number;
  type: MessageType;
  blob?: Blob;
  data?: ArrayBuffer;
  originalPath?: string;
}

export interface ArchiveBackupManifest {
  format: 'whatsapp-chat-archive';
  version: 1;
  createdAt: string;
  archive: ChatArchiveMetadata;
  attachmentFileNames: string[];
}

export interface StorageEstimate {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentageUsed: number;
}
