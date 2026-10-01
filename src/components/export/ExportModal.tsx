import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { ParsedChat } from '../../types/chat';

export interface ExportOptions {
  dateRange: 'all' | 'custom';
  fromDate: string;
  toDate: string;
  includeImages: boolean;
  includeConversationInfo: boolean;
}

interface ExportModalProps {
  chat: ParsedChat;
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export function ExportModal({ chat, isOpen, onClose, onExport }: ExportModalProps) {
  const [dateRange, setDateRange] = useState<'all' | 'custom'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeInfo, setIncludeInfo] = useState(true);
  
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize dates to bounds of chat
  useEffect(() => {
    if (chat.messages.length > 0 && isOpen) {
      const firstDate = new Date(chat.messages[0].timestamp).toISOString().split('T')[0];
      const lastDate = new Date(chat.messages[chat.messages.length - 1].timestamp).toISOString().split('T')[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFromDate(firstDate);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToDate(lastDate);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDateRange('all');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExporting(false);
    }
  }, [chat, isOpen]);

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

    setIsExporting(true);
    try {
      await onExport({
        dateRange,
        fromDate,
        toDate,
        includeImages,
        includeConversationInfo: includeInfo
      });
      onClose(); // Close on success
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      setError(`Failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <FileText size={18} />
            </div>
            <h2 className="text-base font-semibold text-slate-800">Export PDF Archive</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Date Range Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Date Range</h3>
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
                <span className="text-sm text-slate-700">Entire conversation</span>
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
                <span className="text-sm text-slate-700">Custom date range</span>
              </label>
            </div>
            
            {/* Custom Date Pickers */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-3 mt-2 ml-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex flex-col flex-1">
                  <label className="text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">From</label>
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)}
                    disabled={isExporting}
                    className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">To</label>
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)}
                    disabled={isExporting}
                    className="w-full text-sm rounded-lg border border-slate-300 py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content Options */}
          <div className="space-y-3 pt-2">
             <h3 className="text-sm font-semibold text-slate-800">Content Options</h3>
             <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeInfo} 
                  onChange={(e) => setIncludeInfo(e.target.checked)}
                  disabled={isExporting}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 disabled:opacity-50"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Conversation Information</span>
                  <span className="text-[12px] text-slate-500">Include a cover page with participants, dates, and archive statistics.</span>
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
                  <span className="text-sm font-medium text-slate-700">Include Images</span>
                  <span className="text-[12px] text-slate-500">Embed photos directly in the PDF. Video and audio are always represented as text tags.</span>
                </div>
             </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
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
                <span>Generating PDF...</span>
              </>
            ) : (
              <span>Download PDF</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
