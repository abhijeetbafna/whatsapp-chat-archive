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
  Download,
  Sliders,
  Star
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
  onToggleStarred: () => void;
  onToggleThemeSettings: () => void;
  onExportClick: () => void;
  isSearchOpen: boolean;
  isInfoOpen: boolean;
  isStarredOpen: boolean;
  starredCount: number;
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
  onToggleStarred,
  onToggleThemeSettings,
  onExportClick,
  isSearchOpen,
  isInfoOpen,
  isStarredOpen,
  starredCount,
}: ChatHeaderProps) {
  const isGroup = parsedChat.participants.length > 2;
  const title = getChatTitle(parsedChat, fallbackFileName);
  const participantCount = parsedChat.participants.length;
  const messageCount = parsedChat.messageCount;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-[#222e35] bg-[#f0f2f5]/95 dark:bg-[#202c33]/95 px-4 sm:px-6 backdrop-blur-md shadow-xs transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 dark:text-[#8696a0] transition-colors hover:bg-slate-200/70 dark:hover:bg-[#2a3942] hover:text-slate-900 dark:hover:text-[#e9edef] focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
          aria-label="Back"
          title="Back to Import / Library"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Chat Avatar with Gradient */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold shadow-xs">
          {isGroup ? <Users size={19} /> : <User size={19} />}
        </div>

        {/* Title & Subtitle */}
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-slate-900 dark:text-[#e9edef] truncate leading-snug" title={title}>
            {title}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#8696a0] truncate">
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
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600' 
              : 'bg-white dark:bg-[#111b21] text-slate-700 dark:text-[#e9edef] border border-slate-300/80 dark:border-[#222e35] hover:bg-slate-50 dark:hover:bg-[#2a3942]'
          }`}
          title="Search Conversation"
        >
          <SearchIcon size={14} />
          <span className="hidden md:inline">Search</span>
        </button>

        {/* Starred Messages Drawer Toggle */}
        <button
          onClick={onToggleStarred}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
            isStarredOpen
              ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700'
              : starredCount > 0
              ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-950/70'
              : 'bg-white dark:bg-[#111b21] text-slate-700 dark:text-[#e9edef] border border-slate-300/80 dark:border-[#222e35] hover:bg-slate-50 dark:hover:bg-[#2a3942]'
          }`}
          title={starredCount > 0 ? `${starredCount} Starred Message${starredCount !== 1 ? 's' : ''}` : 'Starred Messages'}
          aria-label="Open Starred Messages Drawer"
        >
          <Star size={14} className={starredCount > 0 || isStarredOpen ? 'fill-amber-500 text-amber-500' : ''} />
          {starredCount > 0 && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
              {starredCount}
            </span>
          )}
        </button>

        {/* "My Messages / Outgoing" Selector */}
        {parsedChat.participants.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-300/80 dark:border-[#222e35] bg-white dark:bg-[#111b21] px-3 py-1.5 text-xs shadow-2xs">
            <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-slate-500 dark:text-[#8696a0] font-medium">Me:</span>
            <select
              value={mySenderName || ''}
              onChange={(e) => onSelectMySender(e.target.value || null)}
              className="bg-transparent font-semibold text-slate-800 dark:text-[#e9edef] focus:outline-none cursor-pointer max-w-[120px] truncate"
              title="Choose which sender appears on the right as 'Me'"
            >
              <option value="" className="dark:bg-[#111b21] dark:text-[#e9edef]">(All Incoming)</option>
              {parsedChat.participants.map((p) => (
                <option key={p.id} value={p.name} className="dark:bg-[#111b21] dark:text-[#e9edef]">
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
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 dark:border-[#222e35] bg-white dark:bg-[#111b21] px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#e9edef] shadow-2xs hover:bg-slate-50 dark:hover:bg-[#2a3942] hover:text-slate-900 dark:hover:text-white transition-colors"
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
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600' 
              : 'bg-white dark:bg-[#111b21] text-slate-700 dark:text-[#e9edef] border border-slate-300/80 dark:border-[#222e35] hover:bg-slate-50 dark:hover:bg-[#2a3942]'
          }`}
          title="Conversation Info"
        >
          <Info size={16} />
        </button>

        {/* Theme & Display Customization Toggle */}
        <button
          onClick={onToggleThemeSettings}
          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white dark:bg-[#111b21] text-slate-700 dark:text-[#e9edef] border border-slate-300/80 dark:border-[#222e35] hover:bg-slate-50 dark:hover:bg-[#2a3942] shadow-2xs transition-colors"
          title="Display & Theme Settings"
        >
          <Sliders size={15} />
        </button>

        {/* Export Button */}
        <button
          onClick={onExportClick}
          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white dark:bg-[#111b21] text-slate-700 dark:text-[#e9edef] border border-slate-300/80 dark:border-[#222e35] hover:bg-slate-50 dark:hover:bg-[#2a3942] shadow-2xs transition-colors ml-0.5"
          title="Export Conversation to PDF"
        >
          <Download size={16} />
        </button>
      </div>
    </header>
  );
}
