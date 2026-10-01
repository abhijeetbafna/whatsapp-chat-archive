import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsModal } from '../AnalyticsModal';
import { analyzeChat } from '../../../lib/analytics/chatAnalytics';
import { ParsedChat } from '../../../types/chat';

describe('Conversation Analytics Suite', () => {
  const sampleChat: ParsedChat = {
    chatId: 'analytics-test-chat',
    title: 'Weekend Trip',
    participants: [
      { id: 'Alice', name: 'Alice', messageCount: 3 },
      { id: 'Bob', name: 'Bob', messageCount: 2 },
    ],
    messages: [
      {
        id: '1',
        chatId: 'analytics-test-chat',
        timestamp: '2026-06-01T10:00:00Z', // Monday
        senderName: 'Alice',
        text: 'Hey Bob! Are you ready for the trip? 🏖️🎉',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: '2',
        chatId: 'analytics-test-chat',
        timestamp: '2026-06-01T10:05:00Z',
        senderName: 'Bob',
        text: 'Yes! Booking the hotel now 🎉',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: '3',
        chatId: 'analytics-test-chat',
        timestamp: '2026-06-02T14:30:00Z', // Tuesday (Streak continues: Day 2)
        senderName: 'Alice',
        text: 'Super excited! Bringing snacks and drinks 🏖️',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: '4',
        chatId: 'analytics-test-chat',
        timestamp: '2026-06-07T18:00:00Z', // Sunday (Silence gap of 4 days)
        senderName: 'Bob',
        text: 'Packed everything! See you tomorrow.',
        type: 'text',
        attachments: [],
        isSystemMessage: false,
      },
      {
        id: '5',
        chatId: 'analytics-test-chat',
        timestamp: '2026-06-07T18:05:00Z',
        senderName: 'Alice',
        text: 'Hotel voucher attached',
        type: 'mixed',
        attachments: [
          { type: 'document', fileName: 'voucher.pdf' },
        ],
        isSystemMessage: false,
      },
    ],
    links: [],
    messageCount: 5,
    mediaCount: 1,
    unrecognizedLines: 0,
  };

  it('Test 1 — Correctly analyzes streak, silence, and volume metrics', () => {
    const data = analyzeChat(sampleChat);

    expect(data.totalMessages).toBe(5);
    expect(data.totalMedia).toBe(1);
    expect(data.longestStreakDays).toBe(2); // June 1 and June 2
    expect(data.longestSilenceDays).toBe(4); // June 3 to June 6
    expect(data.participants.length).toBe(2);
    expect(data.participants[0].name).toBe('Alice');
    expect(data.participants[0].messageCount).toBe(3);
    expect(data.participants[1].name).toBe('Bob');
    expect(data.participants[1].messageCount).toBe(2);
  });

  it('Test 2 — Detects top emojis and filters common stopwords from vocabulary', () => {
    const data = analyzeChat(sampleChat);

    // Emojis: 🎉 (2 times) and 🏖️ (2 times)
    expect(data.topEmojis.length).toBeGreaterThan(0);
    const emojiChars = data.topEmojis.map((e) => e.emoji);
    expect(emojiChars.some((e) => e.includes('🎉') || e.includes('🏖️'))).toBe(true);

    // Top words should include trip, hotel, booking, snacks, etc.
    const words = data.topWords.map((w) => w.word);
    expect(words).toContain('hotel');
    // Common stopwords like 'the', 'for', 'you' should be filtered
    expect(words).not.toContain('the');
    expect(words).not.toContain('for');
  });

  it('Test 3 — Renders AnalyticsModal overview cards and participant share', () => {
    render(<AnalyticsModal chat={sampleChat} isOpen={true} onClose={vi.fn()} />);

    // Header title
    expect(screen.getByText('Conversation Analytics & Insights')).toBeInTheDocument();

    // Stat cards
    expect(screen.getByText('5')).toBeInTheDocument(); // 5 total messages
    expect(screen.getByText(/2 Days/i)).toBeInTheDocument(); // 2 days streak
    expect(screen.getByText(/4 Days/i)).toBeInTheDocument(); // 4 days silence

    // Participant names
    expect(screen.getAllByText('Alice:').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob:').length).toBeGreaterThan(0);
  });

  it('Test 4 — Navigates between Activity, Participants, and Vocabulary tabs', () => {
    render(<AnalyticsModal chat={sampleChat} isOpen={true} onClose={vi.fn()} />);

    // Click Activity Patterns Tab
    const activityTab = screen.getByRole('button', { name: /activity patterns/i });
    fireEvent.click(activityTab);
    expect(screen.getByText('24-Hour Activity Clock')).toBeInTheDocument();
    expect(screen.getByText('Day of the Week Pattern')).toBeInTheDocument();

    // Click Participants Tab
    const participantsTab = screen.getByRole('button', { name: /participants/i });
    fireEvent.click(participantsTab);
    expect(screen.getByText('60% of chat')).toBeInTheDocument(); // Alice 3/5 = 60%
    expect(screen.getByText('40% of chat')).toBeInTheDocument(); // Bob 2/5 = 40%

    // Click Emojis & Words Tab
    const vocabTab = screen.getByRole('button', { name: /emojis & words/i });
    fireEvent.click(vocabTab);
    expect(screen.getByText('Top 10 Emojis')).toBeInTheDocument();
    expect(screen.getByText('Top Characteristic Words')).toBeInTheDocument();
  });

  it('Test 5 — Invokes onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<AnalyticsModal chat={sampleChat} isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /close analytics dashboard/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
