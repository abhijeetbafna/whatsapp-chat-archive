import React, { useState, useMemo } from 'react';
import { Star, X, Search, FileText, Image, Video, Music, ArrowRight, Download, Filter } from 'lucide-react';
import { Message, ParsedChat } from '../../types/chat';
import { formatMessageTime, getSenderColorClass } from '../../lib/chat-utils';

interface StarredMessagesPanelProps {
  chat: ParsedChat;
  starredMessages: Message[];
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  onToggleStar: (messageId: string) => void;
  onExportStarredPdf: () => void;
  isFilterActive: boolean;
  onToggleFilterStarred: () => void;
}

export function StarredMessagesPanel({
  starredMessages,
  onClose,
  onJumpToMessage,
  onToggleStar,
  onExportStarredPdf,
  isFilterActive,
  onToggleFilterStarred,
}: StarredMessagesPanelProps) {
  const [filterQuery, setFilterQuery] = useState('');

  // Filter starred messages by search query if user types in panel search
  const filteredStarred = useMemo(() => {
    if (!filterQuery.trim()) return starredMessages;
    const q = filterQuery.toLowerCase().trim();
    return starredMessages.filter((msg) => {
      const matchText = msg.text?.toLowerCase().includes(q);
      const matchSender = msg.senderName?.toLowerCase().includes(q);
      const matchAttachment = msg.attachments?.some((att) => att.fileName?.toLowerCase().includes(q));
      return Boolean(matchText || matchSender || matchAttachment);
    });
  }, [starredMessages, filterQuery]);

  const formatDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 border-l border-slate-200/80 dark:border-[#222e35] bg-[#f0f2f5] dark:bg-[#111b21] flex flex-col h-full z-20 shrink-0 shadow-lg md:shadow-none transition-colors">
      {/* Header */}
      <div className="h-16 border-b border-slate-200/80 dark:border-[#222e35] bg-white dark:bg-[#202c33] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Star size={16} className="fill-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-[#e9edef]">Starred Messages</h2>
            <p className="text-[11px] text-slate-500 dark:text-[#8696a0]">
              {starredMessages.length} {starredMessages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-500 dark:text-[#8696a0] hover:text-slate-800 dark:hover:text-[#e9edef] hover:bg-slate-100 dark:hover:bg-[#2a3942] transition-colors"
          title="Close panel"
          aria-label="Close Starred Messages"
        >
          <X size={18} />
        </button>
      </div>

      {/* Control bar: search + filter toggle */}
      <div className="p-3 bg-white dark:bg-[#202c33] border-b border-slate-200/80 dark:border-[#222e35] flex flex-col gap-2">
        {starredMessages.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-[#8696a0]" size={14} />
            <input
              type="text"
              placeholder="Search in starred..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-[#f0f2f5] dark:bg-[#111b21] border border-slate-200 dark:border-[#2a3942] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-[#e9edef] placeholder-slate-400 dark:placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            onClick={onToggleFilterStarred}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              isFilterActive
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#2a3942] dark:text-[#e9edef] dark:hover:bg-[#32424b]'
            }`}
            title="Filter the main chat view to show only starred messages"
          >
            <Filter size={12} className={isFilterActive ? 'text-amber-600 dark:text-amber-400' : ''} />
            <span>{isFilterActive ? 'Chat Filtered: Starred' : 'Filter Chat View'}</span>
          </button>

          {starredMessages.length > 0 && (
            <button
              onClick={onExportStarredPdf}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors border border-emerald-200 dark:border-emerald-800"
              title="Export only starred messages to PDF"
            >
              <Download size={12} />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {starredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-[#8696a0]">
            <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-3">
              <Star size={24} className="stroke-current stroke-2" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#e9edef]">No Starred Messages</h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-[#8696a0] max-w-[220px] leading-relaxed">
              Hover over any message bubble in the conversation and click the star icon to bookmark it here for quick access.
            </p>
          </div>
        ) : filteredStarred.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-[#8696a0]">
            No starred messages matching &ldquo;{filterQuery}&rdquo;
          </div>
        ) : (
          filteredStarred.map((msg) => {
            const hasAttachments = msg.attachments && msg.attachments.length > 0;
            const firstAttachment = hasAttachments ? msg.attachments[0] : null;

            return (
              <div
                key={msg.id}
                onClick={() => onJumpToMessage(msg.id)}
                className="group relative bg-white dark:bg-[#202c33] rounded-xl p-3 border border-slate-200/80 dark:border-[#2a3942] shadow-2xs hover:border-amber-400 dark:hover:border-amber-600/80 transition-all cursor-pointer text-left"
              >
                {/* Header row: sender + date + unstar */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-xs font-semibold truncate ${
                        msg.senderName ? getSenderColorClass(msg.senderName) : 'text-slate-700 dark:text-[#e9edef]'
                      }`}
                    >
                      {msg.senderName || 'System'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 dark:text-[#8696a0]">
                      {formatDateLabel(msg.timestamp)} • {formatMessageTime(msg.timestamp)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(msg.id);
                      }}
                      className="p-1 rounded-full text-amber-500 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a3942] transition-colors"
                      title="Unstar message"
                      aria-label="Unstar message"
                    >
                      <Star size={13} className="fill-amber-500" />
                    </button>
                  </div>
                </div>

                {/* Media preview badge if any */}
                {hasAttachments && firstAttachment && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-[#111b21] p-1.5 border border-slate-200/60 dark:border-[#2a3942]">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-200 dark:bg-[#2a3942] text-slate-700 dark:text-[#e9edef] shrink-0">
                      {firstAttachment.type === 'image' && <Image size={13} />}
                      {firstAttachment.type === 'video' && <Video size={13} />}
                      {firstAttachment.type === 'audio' && <Music size={13} />}
                      {firstAttachment.type === 'document' && <FileText size={13} />}
                    </div>
                    <span className="text-xs text-slate-700 dark:text-[#e9edef] truncate font-medium">
                      {firstAttachment.fileName || firstAttachment.type}
                    </span>
                  </div>
                )}

                {/* Message text */}
                {msg.text && (
                  <p className="text-xs text-slate-800 dark:text-[#e9edef] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                )}

                {/* Jump prompt on hover */}
                <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#2a3942]/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-[#8696a0] group-hover:text-amber-600 dark:group-hover:text-amber-400 font-medium transition-colors">
                  <span>Click to view in chat</span>
                  <ArrowRight size={12} className="transform transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
