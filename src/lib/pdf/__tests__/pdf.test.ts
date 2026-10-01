import { describe, it, expect } from 'vitest';
import { getSafeFilename, filterMessagesByDate } from '../pdfGenerator';
import { Message } from '../../../types/chat';
import { ExportOptions } from '../../../components/export/ExportModal';

describe('pdfGenerator', () => {
  describe('getSafeFilename', () => {
    it('generates fallback filename if title is empty or null', () => {
      expect(getSafeFilename(null)).toBe('chat-archive.pdf');
      expect(getSafeFilename('')).toBe('chat-archive.pdf');
      expect(getSafeFilename('   ')).toBe('chat-archive.pdf');
    });

    it('generates a safe filename for normal titles', () => {
      expect(getSafeFilename('Alice & Bob')).toBe('alice-&-bob-chat-archive.pdf');
    });

    it('removes invalid filesystem characters', () => {
      expect(getSafeFilename('Project <Secret> : V1/V2')).toBe('project-secret-v1v2-chat-archive.pdf');
      expect(getSafeFilename('A\\B|C?D*E"F')).toBe('abcdef-chat-archive.pdf');
    });
  });

  describe('filterMessagesByDate', () => {
    const mockMessages: Message[] = [
      { id: '1', timestamp: '2026-09-17T09:00:00Z', senderId: '1', senderName: 'A', text: '1', attachments: [], isSystemMessage: false, type: 'text' as const, chatId: '1', isEdited: false },
      { id: '2', timestamp: '2026-09-18T10:00:00Z', senderId: '1', senderName: 'A', text: '2', attachments: [], isSystemMessage: false, type: 'text' as const, chatId: '1', isEdited: false },
      { id: '3', timestamp: '2026-09-19T11:00:00Z', senderId: '1', senderName: 'A', text: '3', attachments: [], isSystemMessage: false, type: 'text' as const, chatId: '1', isEdited: false },
    ];

    it('returns all messages if dateRange is "all"', () => {
      const options: ExportOptions = {
        dateRange: 'all',
        fromDate: '',
        toDate: '',
        includeImages: true,
        includeConversationInfo: true
      };
      const result = filterMessagesByDate(mockMessages, options);
      expect(result.length).toBe(3);
    });

    it('filters messages strictly within custom date range', () => {
      const options: ExportOptions = {
        dateRange: 'custom',
        fromDate: '2026-09-18', // middle day
        toDate: '2026-09-18',
        includeImages: true,
        includeConversationInfo: true
      };
      
      const result = filterMessagesByDate(mockMessages, options);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });

    it('returns empty array if no messages match', () => {
      const options: ExportOptions = {
        dateRange: 'custom',
        fromDate: '2026-09-20',
        toDate: '2026-09-21',
        includeImages: true,
        includeConversationInfo: true
      };
      
      const result = filterMessagesByDate(mockMessages, options);
      expect(result.length).toBe(0);
    });
    
    it('handles boundary timestamps properly (00:00:00 to 23:59:59)', () => {
      // Suppose a message happens exactly at midnight local time. 
      // JavaScript's new Date('YYYY-MM-DD') parses as midnight UTC, 
      // but if the user picks '2026-09-17' it filters correctly by local midnight bounds.
      
      const msgMidnight: Message = { 
        id: '4', 
        timestamp: new Date(new Date('2026-09-17T00:00:00').getTime()).toISOString(), // local midnight
        senderId: '1', senderName: 'A', text: '4', attachments: [], isSystemMessage: false, type: 'text' as const, chatId: '1', isEdited: false 
      };
      const msgEnd: Message = { 
        id: '5', 
        timestamp: new Date(new Date('2026-09-17T23:59:59').getTime()).toISOString(), 
        senderId: '1', senderName: 'A', text: '5', attachments: [], isSystemMessage: false, type: 'text' as const, chatId: '1', isEdited: false 
      };
      const messages = [msgMidnight, msgEnd];
      
      const options: ExportOptions = {
        dateRange: 'custom',
        fromDate: '2026-09-17',
        toDate: '2026-09-17',
        includeImages: true,
        includeConversationInfo: true
      };
      
      const result = filterMessagesByDate(messages, options);
      expect(result.length).toBe(2);
    });
  });
});
