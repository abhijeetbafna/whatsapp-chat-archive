import { ParsedChat } from '../../types/chat';

export interface SearchResult {
  messageId: string;
  timestamp: string;
  senderName?: string;
  snippet: string;
  type: string;
}

export const searchChat = (chat: ParsedChat, query: string, filter?: 'all' | 'media' | 'links' | 'documents'): SearchResult[] => {
  if (!query || query.trim().length === 0) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const msg of chat.messages) {
    if (msg.isSystemMessage) continue;
    
    // Apply optional filter
    if (filter && filter !== 'all') {
      if (filter === 'media' && (!msg.attachments || !msg.attachments.some(a => a.type === 'image' || a.type === 'video' || a.type === 'audio'))) {
        continue;
      }
      if (filter === 'documents' && (!msg.attachments || !msg.attachments.some(a => a.type === 'document'))) {
        continue;
      }
      if (filter === 'links') {
        const hasLink = chat.links.some(l => l.messageId === msg.id);
        if (!hasLink) continue;
      }
    }

    let match = false;
    let matchIdx = -1;
    
    // Check text
    if (msg.text) {
      matchIdx = msg.text.toLowerCase().indexOf(normalizedQuery);
      if (matchIdx !== -1) match = true;
    }
    
    // Check sender
    if (!match && msg.senderName && msg.senderName.toLowerCase().includes(normalizedQuery)) {
      match = true;
    }
    
    // Check attachments
    let matchedAttachmentName = '';
    if (!match && msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.fileName && att.fileName.toLowerCase().includes(normalizedQuery)) {
          match = true;
          matchedAttachmentName = att.fileName;
          break;
        }
      }
    }
    
    if (match) {
      // Create a snippet around the match
      let snippet = msg.text || '';
      
      if (matchIdx !== -1) {
         if (snippet.length > 150) {
            const start = Math.max(0, matchIdx - 75);
            const end = Math.min(snippet.length, matchIdx + normalizedQuery.length + 75);
            snippet = (start > 0 ? '...' : '') + snippet.substring(start, end) + (end < snippet.length ? '...' : '');
         }
      } else if (snippet.length > 150) {
         snippet = snippet.substring(0, 150) + '...';
      }

      if (!snippet && matchedAttachmentName) {
         snippet = `[Attachment: ${matchedAttachmentName}]`;
      } else if (!snippet && msg.attachments && msg.attachments.length > 0) {
         snippet = `[Attachment: ${msg.attachments[0].fileName || 'file'}]`;
      }

      results.push({
        messageId: msg.id,
        timestamp: msg.timestamp,
        senderName: msg.senderName,
        snippet,
        type: msg.type
      });
    }
  }

  return results;
};
