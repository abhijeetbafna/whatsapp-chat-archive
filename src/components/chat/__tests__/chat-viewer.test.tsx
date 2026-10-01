import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatViewer } from '../ChatViewer';
import { ParsedChat, Message } from '../../../types/chat';

describe('ChatViewer Component Suite', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const baseChat: ParsedChat = {
    chatId: 'test-chat-1',
    title: 'Project Discussion',
    participants: [
      { id: 'Alice', name: 'Alice', messageCount: 2 },
      { id: 'Bob', name: 'Bob', messageCount: 2 },
      { id: 'Charlie', name: 'Charlie', messageCount: 1 },
    ],
    messages: [],
    messageCount: 0,
    mediaCount: 0, links: [],
    unrecognizedLines: 0,
  };

  it('Test 1 — Renders text messages in the conversation', () => {
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:30',
          senderName: 'Alice',
          text: 'Hello everyone!',
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
      ],
      messageCount: 1,
    };

    render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
  });

  it('Test 2 — Displays sender names in group conversations', () => {
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:30',
          senderName: 'Alice',
          text: 'Message from Alice',
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
        {
          id: '2',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:31',
          senderName: 'Charlie',
          text: 'Message from Charlie',
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
      ],
      messageCount: 2,
    };

    render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Charlie').length).toBeGreaterThanOrEqual(1);
  });

  it('Test 3 — Renders message timestamps properly', () => {
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:30',
          senderName: 'Alice',
          text: 'Timestamp check',
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
      ],
      messageCount: 1,
    };

    render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    expect(screen.getByText(/10:30/i)).toBeInTheDocument();
  });

  it('Test 4 — Produces separate date separators for different calendar days', () => {
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '2026-06-12T10:00:00.000Z',
          senderName: 'Alice',
          text: 'Day 1 message',
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
        {
          id: '2',
          chatId: 'test-chat-1',
          timestamp: '2026-06-13T10:00:00.000Z',
          senderName: 'Bob',
          text: 'Day 2 message',
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
      ],
      messageCount: 2,
    };

    render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    expect(screen.getByText(/12 June 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/13 June 2026/i)).toBeInTheDocument();
  });

  it('Test 5 — Renders system messages distinctly from normal message bubbles', () => {
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:00',
          text: 'Messages and calls are end-to-end encrypted.',
          type: 'system' as const, attachments: [],
          isSystemMessage: true,
        },
        {
          id: '2',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:01',
          text: 'Charlie was added to the group',
          type: 'system' as const, attachments: [],
          isSystemMessage: true,
        },
      ],
      messageCount: 2,
    };

    render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    expect(screen.getByText('Messages and calls are end-to-end encrypted.')).toBeInTheDocument();
    expect(screen.getByText('Charlie was added to the group')).toBeInTheDocument();
  });

  it('Test 6 — Renders media placeholders for image, video, audio, document', () => {
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:00',
          senderName: 'Alice',
          text: '<Media omitted>',
          type: 'image',
          attachments: [{ type: 'image' }],
          isSystemMessage: false,
        },
        {
          id: '2',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:01',
          senderName: 'Bob',
          text: '<Media omitted>',
          type: 'video',
          attachments: [{ type: 'video' }],
          isSystemMessage: false,
        },
        {
          id: '3',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:02',
          senderName: 'Alice',
          text: '<Media omitted>',
          type: 'audio',
          attachments: [{ type: 'audio' }],
          isSystemMessage: false,
        },
        {
          id: '4',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:03',
          senderName: 'Bob',
          text: 'contract.pdf (file attached)',
          type: 'document',
          attachments: [{ type: 'document' }],
          isSystemMessage: false,
        },
      ],
      messageCount: 4,
    };

    render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    expect(screen.getByText('Photo')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Voice Note')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
  });

  it('Test 7 — Preserves line breaks in multiline messages', () => {
    const multilineText = `Paragraph 1\n\nParagraph 2\nLine 3`;
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:00',
          senderName: 'Alice',
          text: multilineText,
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
      ],
      messageCount: 1,
    };

    const { container } = render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    const messageNode = container.querySelector('.whitespace-pre-wrap');
    expect(messageNode).toBeInTheDocument();
    expect(messageNode?.textContent).toBe(multilineText);
  });

  it('Test 8 — Correctly renders Emoji and Unicode/Hindi characters', () => {
    const unicodeText = 'नमस्ते दुनिया! 🚀 Welcome to the future 😊';
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:00',
          senderName: 'राहुल',
          text: unicodeText,
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
      ],
      messageCount: 1,
    };

    render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    expect(screen.getByText(unicodeText)).toBeInTheDocument();
  });

  it('Test 9 — Safe text rendering: Malicious script tags are rendered as plain text and not executed', () => {
    const maliciousScript = '<script>alert("XSS")</script>';
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:00',
          senderName: 'Alice',
          text: maliciousScript,
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
        },
      ],
      messageCount: 1,
    };

    const { container } = render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    // Verify that NO script element exists in the DOM
    const scripts = container.querySelectorAll('script');
    expect(scripts.length).toBe(0);
    // Verify the text content is safely displayed
    expect(screen.getByText(maliciousScript)).toBeInTheDocument();
  });

  it('Test 10 — Handles empty conversation gracefully', () => {
    const emptyChat: ParsedChat = {
      ...baseChat,
      messages: [],
      messageCount: 0,
    };

    render(<ChatViewer parsedChat={emptyChat} onBack={vi.fn()} />);
    expect(screen.getByText('No messages in this conversation')).toBeInTheDocument();
  });

  it('Test 11 — Renders large synthetic conversation smoothly without errors', () => {
    const largeMessageList: Message[] = [];
    for (let i = 0; i < 2000; i++) {
      largeMessageList.push({
        id: `msg-${i}`,
        chatId: 'test-chat-1',
        timestamp: '12/06/2026, 10:00',
        senderName: i % 2 === 0 ? 'Alice' : 'Bob',
        text: `Synthetic message index ${i}`,
        type: 'text' as const, attachments: [],
        isSystemMessage: false,
      });
    }

    const largeChat: ParsedChat = {
      ...baseChat,
      messages: largeMessageList,
      messageCount: largeMessageList.length,
    };

    const { container } = render(<ChatViewer parsedChat={largeChat} onBack={vi.fn()} />);
    expect(container).toBeInTheDocument();
    expect(screen.getAllByText(/2,000 messages/i).length).toBeGreaterThanOrEqual(1);
    // Verify the last message is rendered
    expect(screen.getByText('Synthetic message index 1999')).toBeInTheDocument();
  });

  it('Test 12 — Displays Edited status correctly in the UI', () => {
    const chat: ParsedChat = {
      ...baseChat,
      messages: [
        {
          id: '1',
          chatId: 'test-chat-1',
          timestamp: '12/06/2026, 10:30',
          senderName: 'Alice',
          text: 'This is an edited message',
          type: 'text' as const, attachments: [],
          isSystemMessage: false,
          isEdited: true,
        },
      ],
      messageCount: 1,
    };

    render(<ChatViewer parsedChat={chat} onBack={vi.fn()} />);
    expect(screen.getByText('Edited')).toBeInTheDocument();
  });
});
