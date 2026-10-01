'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileArchive, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { ArchiveLibrary } from '../../components/archive/ArchiveLibrary';
import { ChatViewer } from '../../components/chat/ChatViewer';
import { loadFullChat } from '../../lib/storage';
import { ParsedChat } from '../../types/chat';
import { ThemeToggle } from '../../components/ThemeToggle';

function ArchivesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeArchiveId = searchParams.get('id');

  const [loadedChat, setLoadedChat] = useState<ParsedChat | null>(null);
  const [loadedArchiveTitle, setLoadedArchiveTitle] = useState<string>('');
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [chatLoadError, setChatLoadError] = useState<string | null>(null);
  const [cleanupFn, setCleanupFn] = useState<(() => void) | null>(null);

  // When activeArchiveId changes (including on direct URL visit or refresh)
  useEffect(() => {
    let isCancelled = false;

    if (!activeArchiveId) {
      if (cleanupFn) {
        cleanupFn();
        setCleanupFn(null);
      }
      setLoadedChat(null);
      return;
    }

    const loadArchive = async () => {
      setIsLoadingChat(true);
      setChatLoadError(null);

      try {
        const result = await loadFullChat(activeArchiveId);
        if (isCancelled) return;

        if (!result) {
          setChatLoadError('Could not find or open this archive. It may have been deleted.');
          return;
        }

        setLoadedChat(result.chat);
        setLoadedArchiveTitle(result.metadata.title);
        setCleanupFn(() => result.cleanupUrls);
      } catch (err) {
        if (!isCancelled) {
          setChatLoadError(err instanceof Error ? err.message : 'An error occurred while loading this archive.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingChat(false);
        }
      }
    };

    loadArchive();

    return () => {
      isCancelled = true;
    };
  }, [activeArchiveId]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [cleanupFn]);

  const handleOpenArchive = (id: string) => {
    router.push(`/archives?id=${encodeURIComponent(id)}`);
  };

  const handleBackToLibrary = () => {
    if (cleanupFn) {
      cleanupFn();
      setCleanupFn(null);
    }
    setLoadedChat(null);
    router.push('/archives');
  };

  // 1. If an archive is currently opened and loaded in ChatViewer:
  if (activeArchiveId && loadedChat) {
    return (
      <div className="flex h-screen flex-col bg-[#e0ded8] dark:bg-[#0c1317] text-slate-900 dark:text-[#e9edef] overflow-hidden transition-colors">
        <main className="flex flex-1 items-center justify-center p-0 sm:p-2 md:p-4 overflow-hidden">
          <ChatViewer
            parsedChat={loadedChat}
            fallbackFileName={loadedArchiveTitle}
            onBack={handleBackToLibrary}
          />
        </main>
      </div>
    );
  }

  // 2. If loading an archive:
  if (activeArchiveId && isLoadingChat) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#0c1317] text-slate-900 dark:text-[#e9edef] transition-colors">
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-[#222e35] bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
            <button
              onClick={handleBackToLibrary}
              className="mr-4 inline-flex items-center justify-center rounded-full p-2 text-slate-500 dark:text-[#8696a0] hover:bg-slate-100 dark:hover:bg-[#202c33] hover:text-slate-900 dark:hover:text-[#e9edef] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="text-lg font-semibold text-slate-900 dark:text-[#e9edef]">Opening Archive...</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <Loader2 size={36} className="animate-spin text-emerald-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-[#e9edef]">Loading conversation...</h3>
          <p className="text-sm text-slate-500 dark:text-[#8696a0] mt-1">Reconstructing messages and local media</p>
        </main>
      </div>
    );
  }

  // 3. If loading failed:
  if (activeArchiveId && chatLoadError) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#0c1317] text-slate-900 dark:text-[#e9edef] transition-colors">
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-[#222e35] bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
            <button
              onClick={handleBackToLibrary}
              className="mr-4 inline-flex items-center justify-center rounded-full p-2 text-slate-500 dark:text-[#8696a0] hover:bg-slate-100 dark:hover:bg-[#202c33] hover:text-slate-900 dark:hover:text-[#e9edef] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="text-lg font-semibold text-slate-900 dark:text-[#e9edef]">Archive Error</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-[#e9edef]">Could not open this archive</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#8696a0] max-w-md mx-auto">{chatLoadError}</p>
          <button
            onClick={handleBackToLibrary}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors"
          >
            <span>Return to Library</span>
          </button>
        </main>
      </div>
    );
  }

  // 4. Default: Archive Library
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#0c1317] text-slate-900 dark:text-[#e9edef] transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-[#222e35] bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-md transition-colors">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 dark:text-[#8696a0] hover:bg-slate-100 dark:hover:bg-[#202c33] hover:text-slate-900 dark:hover:text-[#e9edef] transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <FileArchive size={18} />
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#e9edef]">WhatsApp Chat Archive</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 dark:text-[#8696a0] hover:text-slate-900 dark:hover:text-[#e9edef] transition-colors"
            >
              Home
            </Link>
            <ThemeToggle />
            <Link
              href="/import"
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Import
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <ArchiveLibrary onOpenArchive={handleOpenArchive} />
      </main>
    </div>
  );
}

export default function ArchivesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0c1317]">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
        </div>
      }
    >
      <ArchivesContent />
    </Suspense>
  );
}
