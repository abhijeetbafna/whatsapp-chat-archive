import { ConversationLink } from '../../types/chat';

// A secure regex for finding http and https URLs only
// It matches URLs starting with http:// or https:// and avoids trailing punctuation
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/ig;

export const extractLinksFromText = (
  text: string, 
  messageId: string, 
  timestamp: string, 
  senderName?: string
): ConversationLink[] => {
  if (!text) return [];
  
  const links: ConversationLink[] = [];
  const matches = text.match(URL_REGEX);
  
  if (matches) {
    // Deduplicate URLs within the same message to avoid clutter
    const uniqueUrls = Array.from(new Set(matches));
    
    uniqueUrls.forEach(url => {
      links.push({
        url,
        messageId,
        timestamp,
        senderName,
        // Provide a snippet of context for the link (max 150 chars)
        textContext: text.length > 150 ? text.substring(0, 150) + '...' : text
      });
    });
  }
  
  return links;
};
