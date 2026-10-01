import React, { useState, useEffect, useMemo } from 'react';
import { ParsedChat, Message } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { AlertCircle, RotateCcw, Star } from 'lucide-react';
import { SearchPanel } from './SearchPanel';
import { ConversationInfo } from './ConversationInfo';
import { StarredMessagesPanel } from './StarredMessagesPanel';
import { SearchResult } from '../../lib/search/search';
import { ExportModal, ExportOptions } from '../export/ExportModal';
import { generatePdfArchive } from '../../lib/pdf/pdfGenerator';
import { ThemeSettingsModal } from './ThemeSettingsModal';
import { toggleMessageStarred } from '../../lib/storage/archive-repository';

interface ChatViewerProps {
  parsedChat: ParsedChat | null;
  fallbackFileName?: string;
  onBack: () => void;
  onSwitchToPreview?: () => void;
}

export function ChatViewer({
  parsedChat,
  fallbackFileName,
  onBack,
  onSwitchToPreview,
}: ChatViewerProps) {
  // Local messages state to allow immediate reactive star/unstar toggling
  const [messages, setMessages] = useState<Message[]>(parsedChat?.messages || []);

  useEffect(() => {
    if (parsedChat) {
      setMessages(parsedChat.messages);
    }
  }, [parsedChat]);

  // Determine an initial default "Me" sender if exactly 2 participants, else null
  const [mySenderName, setMySenderName] = useState<string | null>(() => {
    if (!parsedChat) return null;
    if (parsedChat.participants.length === 2) {
      return parsedChat.participants[1]?.name || null;
    }
    return null;
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isStarredOpen, setIsStarredOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportStarredOnly, setIsExportStarredOnly] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  
  const [activeSearchResult, setActiveSearchResult] = useState<SearchResult | null>(null);
  const [highlightId, setHighlightId] = useState<string | undefined>(undefined);

  // Starred messages list
  const starredMessages = useMemo(() => {
    return messages.filter((m) => Boolean(m.isStarred));
  }, [messages]);

  // Handle toggling star state for a message
  const handleToggleStar = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return { ...msg, isStarred: !msg.isStarred };
        }
        return msg;
      })
    );

    // Asynchronously update IndexedDB if this conversation is an archive in local storage
    if (parsedChat?.chatId) {
      try {
        await toggleMessageStarred(parsedChat.chatId, messageId);
      } catch (err) {
        console.warn('Could not persist starred message in local storage:', err);
      }
    }
  };

  if (!parsedChat) {
    return (
      <div className="flex min-h-[500px] flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">No conversation loaded</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#8696a0] max-w-md">
          We could not open this conversation archive. Please try importing the file again.
        </p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors"
        >
          <RotateCcw size={16} />
          <span>Return to import</span>
        </button>
      </div>
    );
  }

  const isGroup = parsedChat.participants.length > 2;

  // Filter messages for display in the viewer if starred filtering is enabled
  const displayedMessages = filterStarredOnly ? starredMessages : messages;

  const handleToggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
    if (isInfoOpen) setIsInfoOpen(false);
    if (isStarredOpen) setIsStarredOpen(false);
    if (isSearchOpen) setActiveSearchResult(null);
  };

  const handleToggleInfo = () => {
    setIsInfoOpen((prev) => !prev);
    if (isSearchOpen) setIsSearchOpen(false);
    if (isStarredOpen) setIsStarredOpen(false);
  };

  const handleToggleStarred = () => {
    setIsStarredOpen((prev) => !prev);
    if (isSearchOpen) setIsSearchOpen(false);
    if (isInfoOpen) setIsInfoOpen(false);
  };

  const jumpToMessage = (messageId: string) => {
    // If we're filtering by starred only, reset to show all messages so target is guaranteed visible
    if (filterStarredOnly) {
      setFilterStarredOnly(false);
    }
    setHighlightId(messageId);
    setTimeout(() => {
       const el = document.getElementById(`msg-${messageId}`);
       if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const innerEl = el.firstElementChild;
          if (innerEl) {
             innerEl.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-1', 'scale-[1.02]');
             setTimeout(() => {
                innerEl.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-1', 'scale-[1.02]');
             }, 2000);
          }
       }
    }, 150);
    
    if (window.innerWidth < 768) {
       setIsSearchOpen(false);
       setIsInfoOpen(false);
       setIsStarredOpen(false);
    }
  };

  const handleExport = async (options: ExportOptions) => {
    if (!parsedChat) return;
    const chatToExport = {
      ...parsedChat,
      messages,
    };
    await generatePdfArchive(chatToExport, options);
  };

  const currentChatWithMessages = {
    ...parsedChat,
    messages,
  };

  return (
    <div className="flex h-full w-full max-w-[1400px] overflow-hidden sm:rounded-2xl border border-slate-300/70 dark:border-[#222e35] bg-white dark:bg-[#111b21] shadow-xl transition-colors">
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <ChatHeader
          parsedChat={currentChatWithMessages}
          fallbackFileName={fallbackFileName}
          mySenderName={mySenderName}
          onSelectMySender={setMySenderName}
          onBack={onBack}
          onSwitchToPreview={onSwitchToPreview}
          onToggleSearch={handleToggleSearch}
          onToggleInfo={handleToggleInfo}
          onToggleStarred={handleToggleStarred}
          onToggleThemeSettings={() => setIsThemeModalOpen(true)}
          onExportClick={() => {
            setIsExportStarredOnly(false);
            setIsExportOpen(true);
          }}
          isSearchOpen={isSearchOpen}
          isInfoOpen={isInfoOpen}
          isStarredOpen={isStarredOpen}
          starredCount={starredMessages.length}
        />

        {/* Starred Filter Banner */}
        {filterStarredOnly && (
          <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <Star size={13} className="fill-amber-500 text-amber-500" />
              <span>
                Filtering chat by Starred Messages ({displayedMessages.length} {displayedMessages.length === 1 ? 'message' : 'messages'} shown)
              </span>
            </div>
            <button
              onClick={() => setFilterStarredOnly(false)}
              className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline"
            >
              Show all messages
            </button>
          </div>
        )}

        <MessageList
          messages={displayedMessages}
          isGroup={isGroup}
          mySenderName={mySenderName}
          highlightMessageId={highlightId}
          searchQuery={activeSearchResult?.snippet}
          onToggleStar={handleToggleStar}
        />
      </div>

      {/* Side Panels */}
      {isSearchOpen && (
        <SearchPanel 
           chat={currentChatWithMessages} 
           onClose={() => { setIsSearchOpen(false); setActiveSearchResult(null); }}
           onResultSelect={(res) => {
             setActiveSearchResult(res);
             jumpToMessage(res.messageId);
           }}
        />
      )}
      
      {isInfoOpen && (
        <ConversationInfo 
           chat={currentChatWithMessages} 
           onClose={() => setIsInfoOpen(false)}
           onJumpToMessage={jumpToMessage}
        />
      )}

      {isStarredOpen && (
        <StarredMessagesPanel
          chat={currentChatWithMessages}
          starredMessages={starredMessages}
          onClose={() => setIsStarredOpen(false)}
          onJumpToMessage={jumpToMessage}
          onToggleStar={handleToggleStar}
          onExportStarredPdf={() => {
            setIsExportStarredOnly(true);
            setIsExportOpen(true);
          }}
          isFilterActive={filterStarredOnly}
          onToggleFilterStarred={() => setFilterStarredOnly((prev) => !prev)}
        />
      )}

      {/* PDF Export Modal */}
      <ExportModal 
        chat={currentChatWithMessages}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        initialStarredOnly={isExportStarredOnly}
      />

      {/* Display & Theme Customization Modal */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}

