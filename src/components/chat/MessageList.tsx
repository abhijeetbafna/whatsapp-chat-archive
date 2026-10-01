import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message } from '../../types/chat';
import { groupMessagesByDate } from '../../lib/chat-utils';
import { DateSeparator } from './DateSeparator';
import { SystemMessage } from './SystemMessage';
import { MessageBubble } from './MessageBubble';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MessageListProps {
  messages: Message[];
  isGroup: boolean;
  mySenderName: string | null;
  highlightMessageId?: string;
  searchQuery?: string;
  onToggleStar?: (messageId: string) => void;
}

const INITIAL_CHUNK_SIZE = 500;
const LOAD_MORE_STEP = 500;

export function MessageList({ messages, isGroup, mySenderName, highlightMessageId, searchQuery, onToggleStar }: MessageListProps) {
  const { settings, isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    Math.min(messages.length, INITIAL_CHUNK_SIZE)
  );

  // When messages array changes (e.g. new file loaded), reset visible count
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(Math.min(messages.length, INITIAL_CHUNK_SIZE));
  }, [messages]);

  // Handle highlighting message and expanding visible count if needed
  useEffect(() => {
    if (highlightMessageId) {
      const idx = messages.findIndex(m => m.id === highlightMessageId);
      if (idx !== -1) {
        const requiredCount = messages.length - idx;
        if (requiredCount > visibleCount) {
          setVisibleCount(requiredCount + LOAD_MORE_STEP);
        }
      }
    }
  }, [highlightMessageId, messages, visibleCount]);

  // Messages to render (taken from the end for natural chat view)
  const renderedMessages = useMemo(() => {
    if (messages.length <= visibleCount) {
      return messages;
    }
    return messages.slice(messages.length - visibleCount);
  }, [messages, visibleCount]);

  const hasEarlierMessages = messages.length > visibleCount;

  // Group rendered messages by date
  const dateGroups = useMemo(() => {
    return groupMessagesByDate(renderedMessages);
  }, [renderedMessages]);

  // Initial scroll to bottom
  useEffect(() => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages]);

  // Monitor scroll for "Scroll to bottom" button and auto-load on scroll top
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setShowScrollBottom(distanceFromBottom > 350);

    // If user scrolled near the top and there are earlier messages, auto load more
    if (scrollTop < 80 && hasEarlierMessages) {
      const prevScrollHeight = scrollHeight;
      setVisibleCount((prev) => Math.min(messages.length, prev + LOAD_MORE_STEP));
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const newScrollHeight = containerRef.current.scrollHeight;
          containerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    }
  };

  const scrollToBottom = () => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoadAll = () => {
    setVisibleCount(messages.length);
  };

  // Compute wallpaper styling
  const wallpaperStyle = useMemo(() => {
    if (settings.wallpaper === 'solid') {
      return {
        backgroundColor: isDark ? '#0b141a' : '#f8fafc',
      };
    }
    if (settings.wallpaper === 'slate') {
      return {
        backgroundColor: isDark ? '#0f172a' : '#e2e8f0',
      };
    }
    if (settings.wallpaper === 'dots') {
      const dotColor = isDark ? '#1f2c34' : '#dcd5ca';
      return {
        backgroundColor: isDark ? '#0b141a' : '#efeae2',
        backgroundImage: `radial-gradient(${dotColor} 0.75px, transparent 0.75px)`,
        backgroundSize: '13px 13px',
      };
    }
    // Default: authentic WhatsApp doodle wallpaper
    return {
      backgroundColor: isDark ? '#0b141a' : '#efeae2',
    };
  }, [settings.wallpaper, isDark]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-[#8696a0]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-[#202c33] text-slate-400 dark:text-[#8696a0]">
          <MessageSquare size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-[#e9edef]">No messages in this conversation</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#8696a0] max-w-sm">
          This archive does not contain any readable messages or text.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`relative flex-1 overflow-y-auto px-2 py-3 sm:px-4 md:px-6 space-y-1 select-text transition-colors ${
        settings.wallpaper === 'default' ? 'wa-wallpaper-doodle' : ''
      }`}
      style={wallpaperStyle}
    >
      {/* Load Earlier Messages Banner */}
      {hasEarlierMessages && (
        <div className="flex flex-col items-center justify-center gap-1.5 py-2.5">
          <button
            onClick={() => setVisibleCount((prev) => Math.min(messages.length, prev + LOAD_MORE_STEP))}
            className="rounded-full bg-white/95 dark:bg-[#202c33]/95 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#e9edef] shadow-xs border border-slate-300/70 dark:border-[#2a3942] hover:bg-white dark:hover:bg-[#2a3942] hover:text-slate-900 dark:hover:text-white transition-all"
          >
            Load Earlier Messages ({messages.length - visibleCount} remaining)
          </button>
          <button
            onClick={handleLoadAll}
            className="text-[11px] text-slate-600 dark:text-[#8696a0] hover:text-slate-900 dark:hover:text-white underline font-medium"
          >
            Load all {messages.length.toLocaleString()} messages
          </button>
        </div>
      )}

      {/* Date Groups & Messages */}
      {dateGroups.map((group) => (
        <React.Fragment key={group.dateKey}>
          <DateSeparator label={group.dateLabel} />
          {group.messages.map((msg) => {
            if (msg.isSystemMessage || msg.type === 'system') {
              return <SystemMessage key={msg.id} message={msg} />;
            }

            const isOutgoing = Boolean(
              mySenderName && msg.senderName && msg.senderName === mySenderName
            );

            return (
              <div id={`msg-${msg.id}`} key={msg.id}>
                <MessageBubble
                  message={msg}
                  isOutgoing={isOutgoing}
                  showSenderName={isGroup}
                  searchQuery={searchQuery}
                  isHighlighted={highlightMessageId === msg.id}
                  onToggleStar={onToggleStar}
                />
              </div>
            );
          })}
        </React.Fragment>
      ))}

      <div ref={bottomAnchorRef} className="h-2" />

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to latest messages"
          className="fixed bottom-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#202c33] text-slate-700 dark:text-[#e9edef] shadow-md border border-slate-200/80 dark:border-[#2a3942] hover:bg-slate-50 dark:hover:bg-[#2a3942] hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all transform hover:scale-105"
        >
          <ArrowDown size={17} />
        </button>
      )}
    </div>
  );
}
