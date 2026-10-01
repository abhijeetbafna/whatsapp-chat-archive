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
    const nextIdx = (activeIndex + 1) % results.length;
    setActiveIndex(nextIdx);
    onResultSelect(results[nextIdx]);
  };

  const handlePrev = () => {
    if (results.length === 0) return;
    const prevIdx = (activeIndex - 1 + results.length) % results.length;
    setActiveIndex(prevIdx);
    onResultSelect(results[prevIdx]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) handlePrev();
      else handleNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-80 shrink-0 shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 h-[60px] px-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <X size={20} />
        </button>
        <h2 className="font-semibold text-slate-800">Search Messages</h2>
      </div>

      <div className="p-3 border-b border-slate-100 shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all text-slate-700 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-0 m-0">
        {query.trim().length > 0 && results.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <p className="text-sm font-medium">No messages found</p>
            <p className="text-xs mt-1">Try another word or phrase.</p>
          </div>
        ) : (
          groupedResults.map((group) => (
            <div key={group.dateStr}>
              <div className="sticky top-0 bg-slate-100/90 backdrop-blur-sm px-4 py-1.5 border-y border-slate-200 z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group.dateStr}</span>
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
                    className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-slate-700 truncate mr-2">
                        {result.senderName || 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatMessageTime(result.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 line-clamp-3">
                      {/* Highlight the match in snippet */}
                      {result.snippet.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi')).map((part, i) => 
                         part.toLowerCase() === query.toLowerCase().trim() ? (
                            <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5">{part}</mark>
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
        <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            {activeIndex + 1} of {results.length} results
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrev}
              title="Previous (Shift+Enter)"
              className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ChevronUp size={16} />
            </button>
            <button 
              onClick={handleNext}
              title="Next (Enter)"
              className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
