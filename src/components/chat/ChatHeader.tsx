import React from 'react';
import { ParsedChat } from '../../types/chat';
import { getChatTitle } from '../../lib/chat-utils';
import { 
  ArrowLeft, 
  Users, 
  User, 
  Table, 
  UserCheck,
  Search as SearchIcon,
  Info,
  Download
} from 'lucide-react';

interface ChatHeaderProps {
  parsedChat: ParsedChat;
  fallbackFileName?: string;
  mySenderName: string | null;
  onSelectMySender: (name: string | null) => void;
  onBack: () => void;
  onSwitchToPreview?: () => void;
  onToggleSearch: () => void;
  onToggleInfo: () => void;
  onExportClick: () => void;
  isSearchOpen: boolean;
  isInfoOpen: boolean;
}

export function ChatHeader({
  parsedChat,
  fallbackFileName,
  mySenderName,
  onSelectMySender,
  onBack,
  onSwitchToPreview,
  onToggleSearch,
  onToggleInfo,
  onExportClick,
  isSearchOpen,
  isInfoOpen,
}: ChatHeaderProps) {
  const isGroup = parsedChat.participants.length > 2;
  const title = getChatTitle(parsedChat, fallbackFileName);
  const participantCount = parsedChat.participants.length;
  const messageCount = parsedChat.messageCount;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-[#f0f2f5]/95 px-4 sm:px-6 backdrop-blur-md shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          aria-label="Back"
          title="Back to Import / Preview"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Chat Avatar with Gradient */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold shadow-xs">
          {isGroup ? <Users size={19} /> : <User size={19} />}
        </div>

        {/* Title & Subtitle */}
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-slate-900 truncate leading-snug" title={title}>
            {title}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>
              {participantCount} participant{participantCount !== 1 ? 's' : ''} •{' '}
              {messageCount.toLocaleString()} messages
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onToggleSearch}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
            isSearchOpen 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
              : 'bg-white text-slate-700 border border-slate-300/80 hover:bg-slate-50'
          }`}
          title="Search Conversation"
        >
          <SearchIcon size={14} />
          <span className="hidden md:inline">Search</span>
        </button>

        {/* "My Messages / Outgoing" Selector */}
        {parsedChat.participants.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white px-3 py-1.5 text-xs shadow-2xs">
            <UserCheck size={14} className="text-emerald-600 shrink-0" />
            <span className="text-slate-500 font-medium">Me:</span>
            <select
              value={mySenderName || ''}
              onChange={(e) => onSelectMySender(e.target.value || null)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[120px] truncate"
              title="Choose which sender appears on the right as 'Me'"
            >
              <option value="">(All Incoming)</option>
              {parsedChat.participants.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Switch to Raw / Table Preview */}
        {onSwitchToPreview && (
          <button
            onClick={onSwitchToPreview}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Inspect Parsed Table Data"
          >
            <Table size={14} />
            <span className="hidden lg:inline">Data Table</span>
          </button>
        )}

        {/* Conversation Info Toggle */}
        <button
          onClick={onToggleInfo}
          className={`inline-flex items-center justify-center h-8 w-8 rounded-full shadow-2xs transition-colors ${
            isInfoOpen 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
              : 'bg-white text-slate-700 border border-slate-300/80 hover:bg-slate-50'
          }`}
          title="Conversation Info"
        >
          <Info size={16} />
        </button>

        {/* Export Button */}
        <button
          onClick={onExportClick}
          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-slate-700 border border-slate-300/80 hover:bg-slate-50 shadow-2xs transition-colors ml-1"
          title="Export Conversation to PDF"
        >
          <Download size={16} />
        </button>
      </div>
    </header>
  );
}
