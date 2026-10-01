import React, { useState, useMemo } from 'react';
import { 
  X, 
  BarChart3, 
  Flame, 
  Clock, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Smile, 
  Sparkles,
  TrendingUp,
  Volume2,
  Users
} from 'lucide-react';
import { ParsedChat } from '../../types/chat';
import { analyzeChat, ChatAnalyticsData } from '../../lib/analytics/chatAnalytics';

interface AnalyticsModalProps {
  chat: ParsedChat;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'activity' | 'participants' | 'vocabulary';

export function AnalyticsModal({ chat, isOpen, onClose }: AnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const analytics: ChatAnalyticsData = useMemo(() => {
    return analyzeChat(chat);
  }, [chat]);

  if (!isOpen) return null;

  const maxHourlyCount = Math.max(1, ...analytics.hourlyActivity.map((h) => h.count));
  const maxDayCount = Math.max(1, ...analytics.dayOfWeekActivity.map((d) => d.count));
  const maxMonthCount = Math.max(1, ...analytics.monthlyActivity.map((m) => m.count));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
      <div 
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#222e35] flex flex-col overflow-hidden text-slate-800 dark:text-[#e9edef] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-[#222e35] bg-[#f0f2f5]/90 dark:bg-[#202c33]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs">
              <BarChart3 size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#e9edef] truncate">
                Conversation Analytics & Insights
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8696a0] truncate">
                {chat.title || 'WhatsApp ChatBook'} • {analytics.totalMessages.toLocaleString()} messages analyzed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 dark:text-[#8696a0] hover:text-slate-800 dark:hover:text-[#e9edef] hover:bg-slate-200/70 dark:hover:bg-[#2a3942] transition-colors"
            title="Close"
            aria-label="Close Analytics Dashboard"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200/80 dark:border-[#222e35] bg-white dark:bg-[#111b21] shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-[#8696a0] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Overview & Streaks</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-[#8696a0] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>Activity Patterns</span>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'participants'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-[#8696a0] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Participants</span>
          </button>

          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'vocabulary'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-[#8696a0] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Smile size={14} />
            <span>Emojis & Words</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & STREAKS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {/* Total Messages */}
                <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-[#8696a0] mb-1">
                    <span className="text-xs font-medium">Total Messages</span>
                    <MessageSquare size={15} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">
                    {analytics.totalMessages.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8696a0] mt-0.5">
                    {analytics.avgMessagesPerActiveDay} msg / active day
                  </div>
                </div>

                {/* Longest Chat Streak */}
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-1">
                    <span className="text-xs font-semibold">Longest Streak</span>
                    <Flame size={16} className="text-amber-600 dark:text-amber-400 fill-amber-500" />
                  </div>
                  <div className="text-xl font-bold text-amber-900 dark:text-amber-200">
                    {analytics.longestStreakDays} {analytics.longestStreakDays === 1 ? 'Day' : 'Days'}
                  </div>
                  <div className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 truncate" title={analytics.longestStreakRange}>
                    {analytics.longestStreakRange || 'Consecutive messaging'}
                  </div>
                </div>

                {/* Longest Silence Gap */}
                <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-[#8696a0] mb-1">
                    <span className="text-xs font-medium">Longest Silence</span>
                    <Calendar size={15} className="text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">
                    {analytics.longestSilenceDays} {analytics.longestSilenceDays === 1 ? 'Day' : 'Days'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8696a0] mt-0.5 truncate" title={analytics.longestSilenceRange}>
                    {analytics.longestSilenceRange || 'No gaps detected'}
                  </div>
                </div>

                {/* Active Days */}
                <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-[#8696a0] mb-1">
                    <span className="text-xs font-medium">Active Days</span>
                    <TrendingUp size={15} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">
                    {analytics.activeDaysCount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8696a0] mt-0.5">
                    out of {analytics.totalDaysSpan.toLocaleString()} calendar days
                  </div>
                </div>

                {/* Total Words */}
                <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-[#8696a0] mb-1">
                    <span className="text-xs font-medium">Total Words</span>
                    <FileText size={15} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">
                    {analytics.totalWords.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8696a0] mt-0.5">
                    {analytics.totalMessages > 0 ? Math.round(analytics.totalWords / analytics.totalMessages) : 0} words / msg
                  </div>
                </div>

                {/* Total Media */}
                <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-[#8696a0] mb-1">
                    <span className="text-xs font-medium">Media Shared</span>
                    <Volume2 size={15} className="text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">
                    {analytics.totalMedia.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8696a0] mt-0.5">
                    photos, videos, audio, docs
                  </div>
                </div>

                {/* Peak Hour */}
                <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-[#8696a0] mb-1">
                    <span className="text-xs font-medium">Peak Hour</span>
                    <Clock size={15} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">
                    {analytics.busiestHour.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8696a0] mt-0.5">
                    {analytics.busiestHour.count.toLocaleString()} messages
                  </div>
                </div>

                {/* Busiest Day */}
                <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-[#8696a0] mb-1">
                    <span className="text-xs font-medium">Busiest Day</span>
                    <Calendar size={15} className="text-amber-500 dark:text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">
                    {analytics.busiestDay.dayName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8696a0] mt-0.5">
                    {analytics.busiestDay.count.toLocaleString()} messages
                  </div>
                </div>
              </div>

              {/* Quick Participant Share Bar */}
              <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-4 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 dark:text-[#e9edef] uppercase tracking-wider mb-2.5">
                  Message Contribution Share
                </h3>
                {/* Stacked bar */}
                <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-200 dark:bg-[#2a3942]">
                  {analytics.participants.map((p, idx) => {
                    const colors = [
                      'bg-emerald-500',
                      'bg-blue-500',
                      'bg-amber-500',
                      'bg-purple-500',
                      'bg-rose-500',
                      'bg-indigo-500',
                      'bg-teal-500',
                    ];
                    const barColor = colors[idx % colors.length];
                    return (
                      <div
                        key={p.name}
                        style={{ width: `${Math.max(1, p.percentage)}%` }}
                        className={`${barColor} h-full transition-all`}
                        title={`${p.name}: ${p.messageCount.toLocaleString()} msgs (${p.percentage}%)`}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {analytics.participants.map((p, idx) => {
                    const dotColors = [
                      'bg-emerald-500',
                      'bg-blue-500',
                      'bg-amber-500',
                      'bg-purple-500',
                      'bg-rose-500',
                      'bg-indigo-500',
                      'bg-teal-500',
                    ];
                    const dotColor = dotColors[idx % dotColors.length];
                    return (
                      <div key={p.name} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-[#e9edef]">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <span className="font-semibold">{p.name}:</span>
                        <span className="text-slate-500 dark:text-[#8696a0]">
                          {p.messageCount.toLocaleString()} ({p.percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITY PATTERNS */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* 24-Hour Activity Bar Chart */}
              <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#e9edef]">24-Hour Activity Clock</h3>
                    <p className="text-xs text-slate-500 dark:text-[#8696a0]">
                      Distribution of messages by hour of the day (Peak: {analytics.busiestHour.label})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 items-end h-44 pt-4 pb-2 border-b border-slate-200 dark:border-[#2a3942]">
                  {analytics.hourlyActivity.map((h) => {
                    const heightPercent = maxHourlyCount > 0 ? (h.count / maxHourlyCount) * 100 : 0;
                    const isPeak = h.count === analytics.busiestHour.count && h.count > 0;

                    return (
                      <div key={h.hour} className="group relative flex flex-col items-center h-full justify-end">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-md">
                          {h.label}: {h.count.toLocaleString()} msgs
                        </div>
                        {/* Bar */}
                        <div
                          style={{ height: `${Math.max(4, heightPercent)}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            isPeak
                              ? 'bg-emerald-500 dark:bg-emerald-400 ring-2 ring-emerald-300 dark:ring-emerald-700'
                              : 'bg-slate-300 dark:bg-[#2a3942] group-hover:bg-emerald-400 dark:group-hover:bg-emerald-500'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="grid grid-cols-4 sm:grid-cols-8 text-[10px] text-slate-400 dark:text-[#8696a0] pt-2 text-center">
                  <span>12 AM</span>
                  <span className="hidden sm:inline">3 AM</span>
                  <span>6 AM</span>
                  <span className="hidden sm:inline">9 AM</span>
                  <span>12 PM</span>
                  <span className="hidden sm:inline">3 PM</span>
                  <span>6 PM</span>
                  <span>9 PM</span>
                </div>
              </div>

              {/* Day of the Week Chart */}
              <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#e9edef]">Day of the Week Pattern</h3>
                    <p className="text-xs text-slate-500 dark:text-[#8696a0]">
                      Which days of the week have the highest messaging volume
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-3 items-end h-36 pt-3 pb-2 border-b border-slate-200 dark:border-[#2a3942]">
                  {analytics.dayOfWeekActivity.map((d) => {
                    const heightPercent = maxDayCount > 0 ? (d.count / maxDayCount) * 100 : 0;
                    const isPeak = d.count === analytics.busiestDay.count && d.count > 0;

                    return (
                      <div key={d.dayName} className="group relative flex flex-col items-center h-full justify-end">
                        <div className="absolute -top-7 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-md">
                          {d.count.toLocaleString()} msgs ({d.percentage}%)
                        </div>
                        <div
                          style={{ height: `${Math.max(6, heightPercent)}%` }}
                          className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                            isPeak
                              ? 'bg-amber-500 dark:bg-amber-400 ring-2 ring-amber-300 dark:ring-amber-700'
                              : 'bg-slate-300 dark:bg-[#2a3942] group-hover:bg-amber-400 dark:group-hover:bg-amber-500'
                          }`}
                        />
                        <span className="mt-2 text-xs font-semibold text-slate-700 dark:text-[#e9edef]">
                          {d.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Activity Timeline */}
              {analytics.monthlyActivity.length > 1 && (
                <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-4 sm:p-5 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#e9edef] mb-1">
                    Monthly Activity Volume
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#8696a0] mb-4">
                    Historical message trend over the conversation lifetime
                  </p>

                  <div className="flex items-end gap-1.5 h-36 pt-3 pb-2 border-b border-slate-200 dark:border-[#2a3942] overflow-x-auto">
                    {analytics.monthlyActivity.map((m) => {
                      const heightPercent = maxMonthCount > 0 ? (m.count / maxMonthCount) * 100 : 0;
                      return (
                        <div key={m.monthKey} className="group relative flex flex-col items-center h-full justify-end min-w-[38px] flex-1">
                          <div className="absolute -top-7 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-md">
                            {m.label}: {m.count.toLocaleString()}
                          </div>
                          <div
                            style={{ height: `${Math.max(6, heightPercent)}%` }}
                            className="w-full rounded-t-sm bg-teal-500 dark:bg-teal-400 group-hover:bg-teal-600 transition-all duration-200"
                          />
                          <span className="mt-2 text-[10px] text-slate-500 dark:text-[#8696a0] truncate w-full text-center">
                            {m.label.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PARTICIPANTS */}
          {activeTab === 'participants' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.participants.map((p) => (
                  <div
                    key={p.name}
                    className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-4 shadow-2xs space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-[#e9edef]">
                          {p.name}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {p.percentage}% of chat
                      </span>
                    </div>

                    {/* Detailed Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111b21] border border-slate-100 dark:border-[#2a3942]">
                        <span className="text-slate-400 dark:text-[#8696a0] block text-[10.5px]">Messages Sent</span>
                        <span className="font-bold text-slate-800 dark:text-[#e9edef] text-sm">
                          {p.messageCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111b21] border border-slate-100 dark:border-[#2a3942]">
                        <span className="text-slate-400 dark:text-[#8696a0] block text-[10.5px]">Words Written</span>
                        <span className="font-bold text-slate-800 dark:text-[#e9edef] text-sm">
                          {p.wordCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111b21] border border-slate-100 dark:border-[#2a3942]">
                        <span className="text-slate-400 dark:text-[#8696a0] block text-[10.5px]">Avg Words / Msg</span>
                        <span className="font-bold text-slate-800 dark:text-[#e9edef] text-sm">
                          {p.avgWordsPerMessage}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111b21] border border-slate-100 dark:border-[#2a3942]">
                        <span className="text-slate-400 dark:text-[#8696a0] block text-[10.5px]">Conversations Started</span>
                        <span className="font-bold text-slate-800 dark:text-[#e9edef] text-sm">
                          {p.conversationsStarted} times
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111b21] border border-slate-100 dark:border-[#2a3942]">
                        <span className="text-slate-400 dark:text-[#8696a0] block text-[10.5px]">Media Attachments</span>
                        <span className="font-bold text-slate-800 dark:text-[#e9edef] text-sm">
                          {p.mediaCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111b21] border border-slate-100 dark:border-[#2a3942]">
                        <span className="text-slate-400 dark:text-[#8696a0] block text-[10.5px]">Emojis Used</span>
                        <span className="font-bold text-slate-800 dark:text-[#e9edef] text-sm">
                          {p.emojiCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: VOCABULARY & EMOJIS */}
          {activeTab === 'vocabulary' && (
            <div className="space-y-6">
              {/* Top Emojis */}
              <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                  <Smile size={18} className="text-amber-500 fill-amber-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#e9edef]">Top 10 Emojis</h3>
                </div>

                {analytics.topEmojis.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-[#8696a0]">No emojis found in this conversation.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {analytics.topEmojis.map((e, idx) => (
                      <div
                        key={e.emoji}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-[#111b21] rounded-xl border border-slate-200/70 dark:border-[#2a3942] shadow-2xs"
                      >
                        <span className="text-2xl select-none">{e.emoji}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 dark:text-[#e9edef] block">
                            #{idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-[#8696a0]">
                            {e.count.toLocaleString()}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Words */}
              <div className="bg-slate-50 dark:bg-[#182229] border border-slate-200/70 dark:border-[#2a3942] rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={18} className="text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#e9edef]">Top Characteristic Words</h3>
                  <span className="text-[11px] text-slate-400 dark:text-[#8696a0]">(common stopwords excluded)</span>
                </div>

                {analytics.topWords.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-[#8696a0]">No text words available to index.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {analytics.topWords.map((w, idx) => {
                      const scale = idx < 3 ? 'text-sm font-bold bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700' :
                        idx < 7 ? 'text-xs font-semibold bg-slate-100 text-slate-800 border-slate-200 dark:bg-[#202c33] dark:text-[#e9edef] dark:border-[#2a3942]' :
                        'text-xs bg-slate-50 text-slate-600 border-slate-200/60 dark:bg-[#111b21] dark:text-[#8696a0] dark:border-[#2a3942]';

                      return (
                        <div
                          key={w.word}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-2xs transition-transform hover:scale-105 ${scale}`}
                        >
                          <span>{w.word}</span>
                          <span className="opacity-70 text-[10px] font-mono">({w.count})</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-[#222e35] bg-[#f0f2f5]/90 dark:bg-[#202c33]/90 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 dark:text-[#8696a0]">
            100% Client-Side Analytics • Processed locally in your browser
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors shadow-2xs"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
