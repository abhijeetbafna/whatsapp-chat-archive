import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatViewer } from '../ChatViewer';
import { ParsedChat } from '../../../types/chat';
import { filterMessagesByDate } from '../../../lib/pdf/pdfGenerator';
import { toggleMessageStarred, getStarredMessages, saveArchive } from '../../../lib/storage';

describe('Starred Messages & Bookmark Suite', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const testChat: ParsedChat = {
    chatId: 'chat-star-test',
    title: 'Work Team',
    participants: [
      { id: 'Alice', name: 'Alice', messageCount: 2 },
      { id: 'Bob', name: 'Bob', messageCount: 1 },
    ],
    messages: [
      {
        id: 'msg-1',
        chatId: 'chat-star-test',
        timestamp: '2026-05-10T10:00:00Z',
        senderName: 'Alice',
        text: 'Important client meeting link: https://meet.google.com/xyz',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
        isStarred: true,
      },
      {
        id: 'msg-2',
        chatId: 'chat-star-test',
        timestamp: '2026-05-10T10:05:00Z',
        senderName: 'Bob',
        text: 'Thanks, I will join shortly.',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
        isStarred: false,
      },
      {
        id: 'msg-3',
        chatId: 'chat-star-test',
        timestamp: '2026-05-10T10:10:00Z',
        senderName: 'Alice',
        text: 'Project credentials and docs attached.',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
        isStarred: false,
      },
    ],
    links: [],
    messageCount: 3,
    mediaCount: 0,
    unrecognizedLines: 0,
  };

  it('Test 1 — Renders star indicator for initially starred messages', () => {
    render(<ChatViewer parsedChat={testChat} onBack={vi.fn()} />);

    // Star icon button in header displays count '1'
    const starredHeaderBtn = screen.getByTitle('1 Starred Message');
    expect(starredHeaderBtn).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('Test 2 — Opens StarredMessagesPanel when Star button in header is clicked', () => {
    render(<ChatViewer parsedChat={testChat} onBack={vi.fn()} />);

    const starredHeaderBtn = screen.getByTitle('1 Starred Message');
    fireEvent.click(starredHeaderBtn);

    // Panel header should be visible
    expect(screen.getByRole('heading', { name: /starred messages/i })).toBeInTheDocument();
    // Starred message text should be inside the panel
    expect(screen.getAllByText(/Important client meeting link/i).length).toBeGreaterThan(0);
  });

  it('Test 3 — Toggles star on an unstarred message from the bubble action button', async () => {
    render(<ChatViewer parsedChat={testChat} onBack={vi.fn()} />);

    // Find star button for unstarred message
    const starButtons = screen.getAllByRole('button', { name: 'Star message' });
    expect(starButtons.length).toBeGreaterThan(0);

    // Click to star message 2
    fireEvent.click(starButtons[0]);

    // Starred count in header should now be 2
    await waitFor(() => {
      expect(screen.getByTitle('2 Starred Messages')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('Test 4 — Filters chat view to starred messages only and shows banner', () => {
    render(<ChatViewer parsedChat={testChat} onBack={vi.fn()} />);

    // Open starred panel
    const starredHeaderBtn = screen.getByTitle('1 Starred Message');
    fireEvent.click(starredHeaderBtn);

    // Click "Filter Chat View" button
    const filterBtn = screen.getByTitle(/filter the main chat view/i);
    fireEvent.click(filterBtn);

    // Filter banner should appear
    expect(screen.getByText(/Filtering chat by Starred Messages/i)).toBeInTheDocument();

    // Click "Show all messages" to reset
    const showAllBtn = screen.getByRole('button', { name: /show all messages/i });
    fireEvent.click(showAllBtn);
    expect(screen.queryByText(/Filtering chat by Starred Messages/i)).not.toBeInTheDocument();
  });

  it('Test 5 — filterMessagesByDate correctly isolates starred messages for PDF export', () => {
    const exportOptions = {
      dateRange: 'all' as const,
      fromDate: '',
      toDate: '',
      includeImages: true,
      includeConversationInfo: true,
      starredOnly: true,
    };

    const exported = filterMessagesByDate(testChat.messages, exportOptions);
    expect(exported.length).toBe(1);
    expect(exported[0].id).toBe('msg-1');
  });

  it('Test 6 — IndexedDB persists starred message status across repository calls', async () => {
    const archiveChat: ParsedChat = {
      ...testChat,
      chatId: 'db-star-test-archive',
    };

    // Save archive to IndexedDB
    await saveArchive(archiveChat, 'work-chat.txt');

    // Toggle star on msg-2
    const newStatus = await toggleMessageStarred('db-star-test-archive', 'msg-2');
    expect(newStatus).toBe(true);

    // Check getStarredMessages returns both msg-1 and msg-2
    const starred = await getStarredMessages('db-star-test-archive');
    expect(starred.length).toBe(2);
    expect(starred.some((m) => m.id === 'msg-2')).toBe(true);

    // Toggle back msg-2 to unstar
    const toggledOff = await toggleMessageStarred('db-star-test-archive', 'msg-2');
    expect(toggledOff).toBe(false);

    const remainingStarred = await getStarredMessages('db-star-test-archive');
    expect(remainingStarred.length).toBe(1);
    expect(remainingStarred[0].id).toBe('msg-1');
  });
});
