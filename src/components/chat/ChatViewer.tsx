import React, { useState } from 'react';
import { ParsedChat } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { SearchPanel } from './SearchPanel';
import { ConversationInfo } from './ConversationInfo';
import { SearchResult } from '../../lib/search/search';
import { ExportModal, ExportOptions } from '../export/ExportModal';
import { generatePdfArchive } from '../../lib/pdf/pdfGenerator';
import { ThemeSettingsModal } from './ThemeSettingsModal';

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
  // Determine an initial default "Me" sender if exactly 2 participants, else null
  const [mySenderName, setMySenderName] = useState<string | null>(() => {
    if (!parsedChat) return null;
    if (parsedChat.participants.length === 2) {
      // In 1-on-1 chats, we default to the second participant or null so incoming/outgoing is differentiated
      return parsedChat.participants[1]?.name || null;
    }
    return null;
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  
  const [activeSearchResult, setActiveSearchResult] = useState<SearchResult | null>(null);
  const [highlightId, setHighlightId] = useState<string | undefined>(undefined);

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

  const handleToggleSearch = () => {
    setIsSearchOpen(prev => !prev);
    if (isInfoOpen) setIsInfoOpen(false);
    if (isSearchOpen) setActiveSearchResult(null); // Clear active result when closing
  };

  const handleToggleInfo = () => {
    setIsInfoOpen(prev => !prev);
    if (isSearchOpen) setIsSearchOpen(false);
  };

  const jumpToMessage = (messageId: string) => {
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
    }
  };

  const handleExport = async (options: ExportOptions) => {
    if (!parsedChat) return;
    await generatePdfArchive(parsedChat, options);
  };

  return (
    <div className="flex h-full w-full max-w-[1400px] overflow-hidden sm:rounded-2xl border border-slate-300/70 dark:border-[#222e35] bg-white dark:bg-[#111b21] shadow-xl transition-colors">
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <ChatHeader
          parsedChat={parsedChat}
          fallbackFileName={fallbackFileName}
          mySenderName={mySenderName}
          onSelectMySender={setMySenderName}
          onBack={onBack}
          onSwitchToPreview={onSwitchToPreview}
          onToggleSearch={handleToggleSearch}
          onToggleInfo={handleToggleInfo}
          onToggleThemeSettings={() => setIsThemeModalOpen(true)}
          onExportClick={() => setIsExportOpen(true)}
          isSearchOpen={isSearchOpen}
          isInfoOpen={isInfoOpen}
        />
        <MessageList
          messages={parsedChat.messages}
          isGroup={isGroup}
          mySenderName={mySenderName}
          highlightMessageId={highlightId}
          searchQuery={activeSearchResult?.snippet}
        />
      </div>

      {/* Side Panels */}
      {isSearchOpen && (
        <SearchPanel 
           chat={parsedChat} 
           onClose={() => { setIsSearchOpen(false); setActiveSearchResult(null); }}
           onResultSelect={(res) => {
             setActiveSearchResult(res);
             jumpToMessage(res.messageId);
           }}
        />
      )}
      
      {isInfoOpen && (
        <ConversationInfo 
           chat={parsedChat} 
           onClose={() => setIsInfoOpen(false)}
           onJumpToMessage={jumpToMessage}
        />
      )}

      {/* PDF Export Modal */}
      <ExportModal 
        chat={parsedChat}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
      />

      {/* Display & Theme Customization Modal */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}
