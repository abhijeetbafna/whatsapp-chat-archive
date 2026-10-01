import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, AlertCircle, Star, Globe } from 'lucide-react';
import { ParsedChat } from '../../types/chat';

export interface ExportOptions {
  exportFormat?: 'pdf' | 'html';
  dateRange: 'all' | 'custom';
  fromDate: string;
  toDate: string;
  includeImages: boolean;
  includeConversationInfo: boolean;
  starredOnly?: boolean;
}

interface ExportModalProps {
  chat: ParsedChat;
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  initialStarredOnly?: boolean;
}

export function ExportModal({ chat, isOpen, onClose, onExport, initialStarredOnly = false }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'html'>('pdf');
  const [dateRange, setDateRange] = useState<'all' | 'custom'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeInfo, setIncludeInfo] = useState(true);
  const [starredOnly, setStarredOnly] = useState(initialStarredOnly);
  
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const starredCount = chat.messages.filter((m) => m.isStarred).length;

  // Initialize dates to bounds of chat
  useEffect(() => {
    if (chat.messages.length > 0 && isOpen) {
      const firstDate = new Date(chat.messages[0].timestamp).toISOString().split('T')[0];
      const lastDate = new Date(chat.messages[chat.messages.length - 1].timestamp).toISOString().split('T')[0];
      setFromDate(firstDate);
      setToDate(lastDate);
      setError(null);
      setDateRange('all');
      setStarredOnly(initialStarredOnly);
      setIsExporting(false);
    }
  }, [chat, isOpen, initialStarredOnly]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setError(null);
    if (dateRange === 'custom') {
      if (!fromDate || !toDate) {
        setError('Please select both start and end dates.');
        return;
      }
      if (new Date(fromDate) > new Date(toDate)) {
        setError('Start date cannot be after end date.');
        return;
      }
      
      // Validate that there are messages in this range
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      
      const hasMessages = chat.messages.some((msg) => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= start && msgDate <= end;
      });
      
      if (!hasMessages) {
        setError('No messages found in the selected date range.');
        return;
      }
    }

    if (starredOnly && starredCount === 0) {
      setError('No starred messages found in this chat to export.');
      return;
    }

    setIsExporting(true);
    try {
      await onExport({
        dateRange,
        fromDate,
        toDate,
        includeImages,
        includeConversationInfo: includeInfo,
        starredOnly,
        exportFormat,
      });
      onClose(); // Close on success
    } catch (err: any) {
      console.error('Export Error:', err);
      setError(`Failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-transparent dark:border-[#222e35]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#222e35] bg-slate-50/80 dark:bg-[#202c33]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-lg">
              {exportFormat === 'html' ? <Globe size={18} /> : <FileText size={18} />}
            </div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-[#e9edef]">
              {exportFormat === 'html' ? 'Export Offline Webpage' : 'Export PDF Archive'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#e9edef] hover:bg-slate-200 dark:hover:bg-[#2a3942] rounded-full transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 p-3 rounded-xl border border-red-100 dark:border-red-900/50 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Format Selector */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-700 dark:text-[#e9edef] uppercase tracking-wider">
              Export Format
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  exportFormat === 'pdf'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-600 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-[#2a3942] bg-white dark:bg-[#202c33] text-slate-600 dark:text-[#8696a0] hover:bg-slate-50 dark:hover:bg-[#2a3942]'
                }`}
              >
                <FileText size={15} />
                <span>PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('html')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  exportFormat === 'html'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-600 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-[#2a3942] bg-white dark:bg-[#202c33] text-slate-600 dark:text-[#8696a0] hover:bg-slate-50 dark:hover:bg-[#2a3942]'
                }`}
              >
                <Globe size={15} />
                <span>Offline HTML</span>
              </button>
            </div>
          </div>

          {/* Starred Messages Filter Option */}
          {starredCount > 0 && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/40">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={starredOnly} 
                  onChange={(e) => setStarredOnly(e.target.checked)}
                  disabled={isExporting}
                  className="mt-1 w-4 h-4 rounded text-amber-500 border-amber-300 focus:ring-amber-500 disabled:opacity-50"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800 dark:text-[#e9edef] flex items-center gap-1.5">
                    <Star size={13} className="fill-amber-500 text-amber-500" />
                    <span>Export Starred Messages Only ({starredCount})</span>
                  </span>
                  <span className="text-[12px] text-slate-500 dark:text-[#8696a0]">
                    Only include bookmarked messages in the exported PDF document.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Date Range Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-[#e9edef]">Date Range</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="dateRange" 
                  value="all" 
                  checked={dateRange === 'all'} 
                  onChange={() => setDateRange('all')}
                  disabled={isExporting}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-[#e9edef]">Entire conversation</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="dateRange" 
                  value="custom" 
                  checked={dateRange === 'custom'} 
                  onChange={() => setDateRange('custom')}
                  disabled={isExporting}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-[#e9edef]">Custom date range</span>
              </label>
            </div>
            
            {/* Custom Date Pickers */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-3 mt-2 ml-6 p-3 bg-slate-50 dark:bg-[#202c33] rounded-xl border border-slate-100 dark:border-[#2a3942]">
                <div className="flex flex-col flex-1">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-[#8696a0] mb-1 uppercase tracking-wider">From</label>
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)}
                    disabled={isExporting}
                    className="w-full text-sm rounded-lg border border-slate-300 dark:border-[#2a3942] bg-white dark:bg-[#111b21] text-slate-800 dark:text-[#e9edef] py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-[#8696a0] mb-1 uppercase tracking-wider">To</label>
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)}
                    disabled={isExporting}
                    className="w-full text-sm rounded-lg border border-slate-300 dark:border-[#2a3942] bg-white dark:bg-[#111b21] text-slate-800 dark:text-[#e9edef] py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content Options */}
          <div className="space-y-3 pt-2">
             <h3 className="text-sm font-semibold text-slate-800 dark:text-[#e9edef]">Content Options</h3>
             <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeInfo} 
                  onChange={(e) => setIncludeInfo(e.target.checked)}
                  disabled={isExporting}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 disabled:opacity-50"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 dark:text-[#e9edef]">Conversation Information</span>
                  <span className="text-[12px] text-slate-500 dark:text-[#8696a0]">Include a cover page with participants, dates, and archive statistics.</span>
                </div>
             </label>
             <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeImages} 
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  disabled={isExporting}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 disabled:opacity-50"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 dark:text-[#e9edef]">Include Images</span>
                  <span className="text-[12px] text-slate-500 dark:text-[#8696a0]">Embed photos directly in the PDF. Video and audio are always represented as text tags.</span>
                </div>
             </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-[#222e35] bg-slate-50 dark:bg-[#202c33] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-[#8696a0] hover:bg-slate-200 dark:hover:bg-[#2a3942] dark:hover:text-[#e9edef] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{exportFormat === 'html' ? 'Compiling HTML...' : 'Generating PDF...'}</span>
              </>
            ) : (
              <span>{exportFormat === 'html' ? 'Download Offline HTML' : 'Download PDF'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
