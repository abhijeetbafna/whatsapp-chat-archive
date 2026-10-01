'use client';

import React, { useState } from 'react';
import { ParsedChat, Message } from '../types/chat';
import { 
  Users, 
  MessageSquare, 
  Image as ImageIcon, 
  Calendar, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  RotateCcw,
  CheckCircle2,
  FileCode,
  Tag,
  MessageCircle
} from 'lucide-react';

interface ParserPreviewProps {
  parsedChat: ParsedChat;
  fileName: string;
  onReset: () => void;
  onOpenChat?: () => void;
}

export function ParserPreview({ parsedChat, fileName, onReset, onOpenChat }: ParserPreviewProps) {
  const [expandedRawId, setExpandedRawId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'participants'>('messages');
  const [messageLimit, setMessageLimit] = useState<number>(50);

  const displayedMessages = parsedChat.messages.slice(0, messageLimit);

  const toggleRaw = (id: string) => {
    setExpandedRawId(prev => (prev === id ? null : id));
  };

  const getBadgeColor = (type: Message['type']) => {
    switch (type) {
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
      case 'sticker':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'system':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'text':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <CheckCircle2 size={14} />
              <span>Parsed Successfully</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{fileName}</h2>
            <p className="text-sm text-slate-500">
              Verified local parsing in browser • Ready to view conversation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <RotateCcw size={16} />
              <span>Import Another</span>
            </button>
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <MessageCircle size={18} />
                <span>Open Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <MessageSquare size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Messages</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {parsedChat.messageCount.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Users size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Participants</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {parsedChat.participants.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <ImageIcon size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Media</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {parsedChat.mediaCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 col-span-2 sm:col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 text-slate-500">
              <AlertTriangle size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Unparsed Lines</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {parsedChat.unrecognizedLines}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Date Span</span>
            </div>
            <p className="mt-1 text-xs text-slate-700 truncate">
              {parsedChat.startDate ? parsedChat.startDate.split('T')[0] : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              to {parsedChat.endDate ? parsedChat.endDate.split('T')[0] : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('messages')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Message Preview ({Math.min(messageLimit, parsedChat.messages.length)} of {parsedChat.messages.length})
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'participants'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Participants ({parsedChat.participants.length})
            </button>
          </div>

          {activeTab === 'messages' && parsedChat.messages.length > 50 && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Show:</span>
              <select
                value={messageLimit}
                onChange={(e) => setMessageLimit(Number(e.target.value))}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value={50}>50 messages</option>
                <option value={100}>100 messages</option>
                <option value={500}>500 messages</option>
                <option value={parsedChat.messages.length}>All ({parsedChat.messages.length})</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Content: Messages */}
        {activeTab === 'messages' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3 w-12">#</th>
                  <th scope="col" className="px-4 py-3 w-40">Timestamp</th>
                  <th scope="col" className="px-4 py-3 w-44">Sender</th>
                  <th scope="col" className="px-4 py-3 w-28">Type</th>
                  <th scope="col" className="px-4 py-3">Parsed Content</th>
                  <th scope="col" className="px-4 py-3 w-16 text-right">Raw</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedMessages.map((msg, index) => {
                  const isExpanded = expandedRawId === msg.id;
                  return (
                    <React.Fragment key={msg.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${msg.isSystemMessage ? 'bg-slate-50/40' : ''}`}>
                        <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {msg.timestamp}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {msg.isSystemMessage ? (
                            <span className="italic text-slate-400 text-xs">System</span>
                          ) : (
                            <span className="truncate block max-w-[170px]" title={msg.senderName}>
                              {msg.senderName || 'Unknown'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${getBadgeColor(msg.type)}`}>
                            <Tag size={10} />
                            {msg.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-slate-800 whitespace-pre-wrap max-w-xl ${msg.isSystemMessage ? 'italic text-slate-500 text-xs' : ''}`}>
                            {msg.text || <span className="text-slate-400 italic">(Empty)</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggleRaw(msg.id)}
                            title="Inspect Raw Line"
                            className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Raw Line Inspector Dropdown */}
                      {isExpanded && (
                        <tr className="bg-slate-900 text-slate-200 text-xs font-mono">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="flex items-center gap-2 mb-2 text-slate-400 font-semibold uppercase tracking-wider">
                              <FileCode size={14} />
                              <span>Raw Input Line:</span>
                            </div>
                            <pre className="p-3 bg-slate-950 rounded-lg overflow-x-auto whitespace-pre-wrap border border-slate-800">
                              {msg.rawText || 'No raw line data'}
                            </pre>
                            <div className="mt-2 text-[11px] text-slate-400">
                              ID: {msg.id} • IsSystem: {msg.isSystemMessage ? 'true' : 'false'} • Type: {msg.type}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Participants */}
        {activeTab === 'participants' && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {parsedChat.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 truncate max-w-[160px]" title={p.name}>{p.name}</h4>
                      <p className="text-xs text-slate-500">{p.phoneNumber || 'Contact'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                      {p.messageCount} msg{p.messageCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
