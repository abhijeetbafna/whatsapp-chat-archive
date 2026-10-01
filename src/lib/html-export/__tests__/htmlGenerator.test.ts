import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateHtmlArchive } from '../htmlGenerator';
import { ParsedChat } from '../../../types/chat';

describe('Standalone Single-File HTML Export Suite', () => {
  let createdBlobs: Blob[] = [];

  beforeEach(() => {
    createdBlobs = [];
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockImplementation((blob: Blob) => {
      createdBlobs.push(blob);
      return 'blob:mock-html-url';
    });
    global.URL.revokeObjectURL = vi.fn();
  });

  const testChat: ParsedChat = {
    chatId: 'html-export-chat',
    title: 'Family Vacation Planning',
    participants: [
      { id: 'Alice', name: 'Alice', messageCount: 2 },
      { id: 'Bob', name: 'Bob', messageCount: 1 },
    ],
    messages: [
      {
        id: 'msg-1',
        chatId: 'html-export-chat',
        timestamp: '2026-07-15T09:00:00Z',
        senderName: 'Alice',
        text: 'Packing sunscreen and beach towels! 🏖️',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
        isStarred: true,
      },
      {
        id: 'msg-2',
        chatId: 'html-export-chat',
        timestamp: '2026-07-15T09:05:00Z',
        senderName: 'Bob',
        text: 'Flight boarding passes downloaded.',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
        isStarred: false,
      },
      {
        id: 'msg-3',
        chatId: 'html-export-chat',
        timestamp: '2026-07-15T09:10:00Z',
        text: 'Messages and calls are end-to-end encrypted.',
        type: 'system',
        attachments: [],
        isSystemMessage: true,
      },
    ],
    links: [],
    messageCount: 3,
    mediaCount: 0,
    unrecognizedLines: 0,
  };

  it('Test 1 — Generates valid standalone HTML archive with all elements', async () => {
    const options = {
      exportFormat: 'html' as const,
      dateRange: 'all' as const,
      fromDate: '',
      toDate: '',
      includeImages: true,
      includeConversationInfo: true,
    };

    await generateHtmlArchive(testChat, options);

    expect(createdBlobs.length).toBe(1);
    const htmlBlob = createdBlobs[0];
    expect(htmlBlob.type).toContain('text/html');

    const htmlText = await htmlBlob.text();

    // Verify HTML structure
    expect(htmlText).toContain('<!DOCTYPE html>');
    expect(htmlText).toContain('Family Vacation Planning - Offline Archive');
    expect(htmlText).toContain('Packing sunscreen and beach towels! 🏖️');
    expect(htmlText).toContain('Flight boarding passes downloaded.');
    expect(htmlText).toContain('Messages and calls are end-to-end encrypted.');

    // Verify self-contained interactive features
    expect(htmlText).toContain('function toggleTheme()');
    expect(htmlText).toContain('function handleSearch(');
    expect(htmlText).toContain('Dark Mode');
  });

  it('Test 2 — Correctly filters to starred messages only when starredOnly is active', async () => {
    const options = {
      exportFormat: 'html' as const,
      dateRange: 'all' as const,
      fromDate: '',
      toDate: '',
      includeImages: true,
      includeConversationInfo: false,
      starredOnly: true,
    };

    await generateHtmlArchive(testChat, options);

    expect(createdBlobs.length).toBe(1);
    const htmlText = await createdBlobs[0].text();

    // Message 1 is starred
    expect(htmlText).toContain('Packing sunscreen and beach towels! 🏖️');
    // Message 2 is NOT starred
    expect(htmlText).not.toContain('Flight boarding passes downloaded.');
  });

  it('Test 3 — Throws descriptive error when no messages match export range', async () => {
    const emptyChat: ParsedChat = {
      ...testChat,
      messages: [],
    };

    const options = {
      exportFormat: 'html' as const,
      dateRange: 'all' as const,
      fromDate: '',
      toDate: '',
      includeImages: true,
      includeConversationInfo: true,
    };

    await expect(generateHtmlArchive(emptyChat, options)).rejects.toThrow(/No messages found/i);
  });
});
