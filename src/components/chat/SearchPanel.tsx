import React, { useState, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { ParsedChat } from '../../types/chat';
import { searchChat, SearchResult } from '../../lib/search/search';
import { formatMessageTime } from '../../lib/chat-utils';

interface SearchPanelProps {
  chat: ParsedChat;
  onClose: () => void;
  onResultSelect: (result: SearchResult) => void;
  onActiveIndexChange?: (index: number) => void;
}

export function SearchPanel({ chat, onClose, onResultSelect, onActiveIndexChange }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Group results by date string
  const groupedResults = React.useMemo(() => {
    const groups: { dateStr: string; items: { result: SearchResult; globalIndex: number }[] }[] = [];
    let currentGroup: { dateStr: string; items: { result: SearchResult; globalIndex: number }[] } | null = null;

    results.forEach((result, globalIndex) => {
      const dateStr = new Date(result.timestamp).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      if (!currentGroup || currentGroup.dateStr !== dateStr) {
        currentGroup = { dateStr, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push({ result, globalIndex });
    });
    return groups;
  }, [results]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        const res = searchChat(chat, query);
        setResults(res);
        if (res.length > 0) {
           setActiveIndex(0);
           onResultSelect(res[0]);
        } else {
           setActiveIndex(-1);
        }
      } else {
        setResults([]);
        setActiveIndex(-1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, chat]);

  useEffect(() => {
    if (onActiveIndexChange) {
       onActiveIndexChange(activeIndex);
    }
  }, [activeIndex, onActiveIndexChange]);

  const handleNext = () => {
    if (results.length === 0) return;
    const next = (activeIndex + 1) % results.length;
    setActiveIndex(next);
    onResultSelect(results[next]);
  };

  const handlePrev = () => {
    if (results.length === 0) return;
    const prev = (activeIndex - 1 + results.length) % results.length;
    setActiveIndex(prev);
    onResultSelect(results[prev]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="w-full sm:w-80 md:w-96 border-l border-slate-200 dark:border-[#222e35] bg-white dark:bg-[#111b21] flex flex-col h-full z-20 shadow-lg select-text transition-colors">
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-[#222e35] bg-slate-50 dark:bg-[#202c33] shrink-0">
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-200 dark:hover:bg-[#2a3942] rounded-full text-slate-500 dark:text-[#8696a0] hover:text-slate-800 dark:hover:text-[#e9edef] transition-colors"
          title="Close Search"
        >
          <X size={20} />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-[#e9edef]">Search Messages</h2>
      </div>

      <div className="p-3 border-b border-slate-100 dark:border-[#222e35] shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#8696a0]">
            <Search size={16} />
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-[#202c33] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white dark:focus:bg-[#202c33] transition-all text-slate-800 dark:text-[#e9edef] placeholder:text-slate-400 dark:placeholder:text-[#8696a0] border border-transparent dark:border-[#2a3942]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21] p-0 m-0">
        {query.trim().length > 0 && results.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-[#8696a0]">
            <p className="text-sm font-medium">No messages found</p>
            <p className="text-xs mt-1">Try another word or phrase.</p>
          </div>
        ) : (
          groupedResults.map((group) => (
            <div key={group.dateStr}>
              <div className="sticky top-0 bg-slate-100/90 dark:bg-[#202c33]/90 backdrop-blur-sm px-4 py-1.5 border-y border-slate-200 dark:border-[#222e35] z-10">
                <span className="text-xs font-bold text-slate-500 dark:text-[#8696a0] uppercase tracking-wider">{group.dateStr}</span>
              </div>
              {group.items.map(({ result, globalIndex }) => {
                const isSelected = globalIndex === activeIndex;
                return (
                  <div 
                    key={`${result.messageId}-${globalIndex}`}
                    onClick={() => {
                      setActiveIndex(globalIndex);
                      onResultSelect(result);
                    }}
                    className={`p-4 border-b border-slate-100 dark:border-[#222e35] cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40' 
                        : 'hover:bg-slate-50 dark:hover:bg-[#202c33]'
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-[#e9edef] truncate mr-2">
                        {result.senderName || 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-[#8696a0] shrink-0">
                        {formatMessageTime(result.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-[#8696a0] line-clamp-3">
                      {/* Highlight the match in snippet */}
                      {result.snippet.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi')).map((part, i) => 
                         part.toLowerCase() === query.toLowerCase().trim() ? (
                            <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-yellow-100 rounded px-0.5">{part}</mark>
                         ) : (
                            <React.Fragment key={i}>{part}</React.Fragment>
                         )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {results.length > 0 && (
        <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-[#222e35] bg-slate-50 dark:bg-[#202c33] shrink-0">
          <span className="text-xs text-slate-500 dark:text-[#8696a0] font-medium">
            {activeIndex + 1} of {results.length} results
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrev}
              title="Previous (Shift+Enter)"
              className="p-1.5 rounded-lg bg-white dark:bg-[#111b21] border border-slate-200 dark:border-[#2a3942] text-slate-600 dark:text-[#e9edef] hover:bg-slate-100 dark:hover:bg-[#2a3942] transition-colors"
            >
              <ChevronUp size={16} />
            </button>
            <button 
              onClick={handleNext}
              title="Next (Enter)"
              className="p-1.5 rounded-lg bg-white dark:bg-[#111b21] border border-slate-200 dark:border-[#2a3942] text-slate-600 dark:text-[#e9edef] hover:bg-slate-100 dark:hover:bg-[#2a3942] transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
