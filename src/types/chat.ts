export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'system'
  | 'unknown'
  | 'mixed'; // Used when a message has multiple attachments or text+media

export interface Attachment {
  type: MessageType;
  fileName?: string;
  mediaUrl?: string; // Object URL for direct rendering and playback
  mediaMimeType?: string;
  mediaSize?: number;
  mediaStatus?: 'available' | 'missing' | 'unsupported' | 'error';
}

export interface ConversationLink {
  url: string;
  messageId: string;
  timestamp: string;
  senderName?: string;
  textContext?: string;
}

export interface Message {
  id: string;
  chatId: string;
  timestamp: string; // ISO format or formatted time
  senderId?: string;
  senderName?: string;
  text?: string;
  caption?: string; // Legacy support, though text handles most cases
  type: MessageType;
  attachments: Attachment[]; // Array of attachments instead of single fields
  isEdited?: boolean;
  isDeleted?: boolean;
  isSystemMessage: boolean;
  rawText?: string;
  sourceArchiveId?: string;
  sourceMessageId?: string;
}

export interface Participant {
  id: string;
  name: string;
  phoneNumber?: string;
  messageCount: number;
}

export interface ParsedChat {
  chatId: string;
  title?: string;
  participants: Participant[];
  messages: Message[];
  links: ConversationLink[];
  startDate?: string;
  endDate?: string;
  messageCount: number;
  mediaCount: number;
  unrecognizedLines: number;
}
