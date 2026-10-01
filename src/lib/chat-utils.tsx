import React from 'react';
import { Message, ParsedChat } from '../types/chat';

/**
 * Palette of colors for participant names in group chats
 */
const SENDER_COLORS = [
  'text-emerald-700 font-semibold',
  'text-sky-700 font-semibold',
  'text-violet-700 font-semibold',
  'text-amber-700 font-semibold',
  'text-rose-700 font-semibold',
  'text-teal-700 font-semibold',
  'text-indigo-700 font-semibold',
  'text-pink-700 font-semibold',
  'text-orange-700 font-semibold',
  'text-cyan-700 font-semibold',
];

/**
 * Deterministically assigns a distinct color class to a sender name
 */
export function getSenderColorClass(senderName: string): string {
  let hash = 0;
  for (let i = 0; i < senderName.length; i++) {
    hash = (hash << 5) - hash + senderName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

/**
 * Formats a message timestamp into a clean, human-readable time (e.g., "10:32 AM" or "22:15")
 */
export function formatMessageTime(timestamp: string): string {
  if (!timestamp) return '';

  // If already an ISO string or valid date string
  const parsedDate = new Date(timestamp);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // Fallback: extract time part using regex if it's like "12/06/2026, 10:32:00 AM" or "2026-06-12 10:32"
  const timeMatch = timestamp.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?)/);
  if (timeMatch) {
    return timeMatch[1];
  }

  return timestamp;
}

/**
 * Formats a date string into a friendly calendar date (e.g., "12 June 2026", "Today", "Yesterday")
 */
export function formatDateSeparator(dateStr: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // If it is DD/MM/YYYY or similar, return cleaned raw date part
    const cleanDate = dateStr.split(',')[0].split('T')[0];
    return cleanDate || dateStr;
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Extracts a calendar day key (e.g., "2026-06-12") from a timestamp
 */
export function getDateKey(timestamp: string): string {
  if (!timestamp) return 'unknown';

  const d = new Date(timestamp);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Fallback: take first token before comma or space
  const part = timestamp.split(',')[0].trim().split(' ')[0].trim();
  return part || 'unknown';
}

export interface DateGroup {
  dateKey: string;
  dateLabel: string;
  messages: Message[];
}

/**
 * Groups an array of messages into date-separated sections
 */
export function groupMessagesByDate(messages: Message[]): DateGroup[] {
  const groups: DateGroup[] = [];
  let currentGroup: DateGroup | null = null;

  for (const msg of messages) {
    const key = getDateKey(msg.timestamp);
    if (!currentGroup || currentGroup.dateKey !== key) {
      currentGroup = {
        dateKey: key,
        dateLabel: formatDateSeparator(msg.timestamp),
        messages: [],
      };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  }

  return groups;
}

/**
 * Safely parses message text and returns React elements with active external URLs.
 * Text is always rendered safely via standard React text nodes (NO dangerouslySetInnerHTML).
 */
export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  // URL matching regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 break-all transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Returns a human-friendly title for the chat
 */
export function getChatTitle(parsedChat: ParsedChat, fallbackFileName?: string): string {
  if (parsedChat.title && parsedChat.title.trim().length > 0) {
    return parsedChat.title;
  }

  if (parsedChat.participants.length === 1) {
    return parsedChat.participants[0].name;
  }

  if (parsedChat.participants.length === 2) {
    return `${parsedChat.participants[0].name} & ${parsedChat.participants[1].name}`;
  }

  if (parsedChat.participants.length > 2) {
    return `${parsedChat.participants[0].name}, ${parsedChat.participants[1].name} +${parsedChat.participants.length - 2}`;
  }

  if (fallbackFileName) {
    return fallbackFileName.replace(/\.(txt|zip)$/i, '').replace(/^WhatsApp Chat - /i, '');
  }

  return 'WhatsApp Conversation';
}
