'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileArchive, Calendar, MessageSquare, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { ChatArchiveMetadata } from '../../types/storage';
import { getArchiveList } from '../../lib/storage';

export function YourArchivesSection() {
  const [archives, setArchives] = useState<ChatArchiveMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    getArchiveList()
      .then((list) => {
        if (!isCancelled) {
          setArchives(list);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading) return null;

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return null;
    const format = (dStr?: string) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? dStr : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    };
    if (start && end && start !== end) {
      return `${format(start)} – ${format(end)}`;
    }
    return format(start || end);
  };

  return (
    <section className="bg-slate-50 border-y border-slate-200 py-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileArchive size={15} />
              <span>Persistent Browser Storage</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Your Archives</h2>
            <p className="mt-1 text-sm text-slate-500">
              Conversations saved on this device. Reopen anytime without re-uploading.
            </p>
          </div>

          {archives.length > 0 && (
            <Link
              href="/archives"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <span>View full library ({archives.length})</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {archives.length === 0 ? (
          /* Empty Archives State (Requirement 8) */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="text-base font-semibold text-slate-800">No archives yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Import a WhatsApp export to create your first archive. It will persist locally in your browser.
            </p>
            <Link
              href="/import"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <span>Import a WhatsApp Export</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {archives.slice(0, 3).map((archive) => {
              const dateRange = formatDateRange(archive.startDate, archive.endDate);
              return (
                <div
                  key={archive.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-base">
                        {archive.title.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate text-base" title={archive.title}>
                          {archive.title}
                        </h4>
                        {dateRange && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate">
                            <Calendar size={12} className="flex-shrink-0 text-slate-400" />
                            <span className="truncate">{dateRange}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        <MessageSquare size={11} className="text-slate-500" />
                        {archive.messageCount.toLocaleString()} msgs
                      </span>
                      {archive.mediaCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          <ImageIcon size={11} className="text-slate-500" />
                          {archive.mediaCount.toLocaleString()} media
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/archives?id=${encodeURIComponent(archive.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                    >
                      <span>Open</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
