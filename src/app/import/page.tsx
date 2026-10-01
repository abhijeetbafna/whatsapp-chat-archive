'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Upload, FileArchive, ArrowLeft, Shield, CheckCircle2, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { processWhatsAppExport } from '../../lib/zip';
import { ImportedWhatsAppExport } from '../../types';
import { parseWhatsAppChat } from '../../lib/parser/whatsapp-parser';
import { ParsedChat } from '../../types/chat';
import { ParserPreview } from '../../components/ParserPreview';
import { ChatViewer } from '../../components/chat/ChatViewer';
import { saveArchive, checkDuplicateArchive } from '../../lib/storage';
import { ChatArchiveMetadata } from '../../types/storage';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportedWhatsAppExport | null>(null);
  const [parsedChat, setParsedChat] = useState<ParsedChat | null>(null);
  const [viewMode, setViewMode] = useState<'import' | 'preview' | 'chat'>('import');
  const [dateFormat, setDateFormat] = useState<'auto' | 'DD/MM/YYYY' | 'MM/DD/YYYY'>('auto');

  // Archive persistence states
  const [savedArchive, setSavedArchive] = useState<ChatArchiveMetadata | null>(null);
  const [savingStatus, setSavingStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<ChatArchiveMetadata | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs to prevent memory leaks
  const cleanupMediaUrls = (chat: ParsedChat | null) => {
    if (!chat) return;
    chat.messages.forEach(msg => {
      if (msg.attachments) {
        msg.attachments.forEach(att => {
          if (att.mediaUrl && att.mediaUrl.startsWith('blob:')) {
            URL.revokeObjectURL(att.mediaUrl);
          }
        });
      }
    });
  };

  useEffect(() => {
    return () => {
      cleanupMediaUrls(parsedChat);
    };
  }, [parsedChat]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (file.name.endsWith('.zip') || file.name.endsWith('.txt')) {
      setSelectedFile(file);
    } else {
      setError('Please upload a .zip or .txt file exported from WhatsApp.');
    }
  };

  const saveChatLocally = async (chat: ParsedChat, exportData: ImportedWhatsAppExport) => {
    setIsSaving(true);
    setSavingStatus('Saving archive locally...');
    try {
      const meta = await saveArchive(chat, exportData.originalFileName, exportData.mediaFiles);
      setSavedArchive(meta);
      setSavingStatus('Archive saved in local browser storage');
    } catch (err) {
      console.warn('Could not save archive to IndexedDB:', err);
      setSavingStatus('Note: Unable to save locally (storage quota or private browsing restriction)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProcessArchive = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setError(null);
    setDuplicateWarning(null);
    
    try {
      const parsedExport = await processWhatsAppExport(selectedFile, (status) => {
        setProgressStatus(status);
      });
      setResult(parsedExport);
      
      // Auto parse right away with media files
      const parsed = parseWhatsAppChat(
        parsedExport.chatText, 
        parsedExport.chatFileName, 
        parsedExport.mediaFiles,
        dateFormat
      );
      setParsedChat(parsed);

      // Check for probable duplicate archive (Requirement 10)
      const existing = await checkDuplicateArchive(parsed, selectedFile.name);
      if (existing) {
        setDuplicateWarning(existing);
      } else {
        await saveChatLocally(parsed, parsedExport);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while processing the file.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseAndOpenPreview = () => {
    if (!result) return;
    try {
      if (!parsedChat) {
        const parsed = parseWhatsAppChat(result.chatText, result.chatFileName, result.mediaFiles, dateFormat);
        setParsedChat(parsed);
      }
      setViewMode('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse chat messages');
    }
  };

  const handleOpenChat = () => {
    if (!result) return;
    if (!parsedChat) {
      const parsed = parseWhatsAppChat(result.chatText, result.chatFileName, result.mediaFiles, dateFormat);
      setParsedChat(parsed);
    }
    setViewMode('chat');
  };

  const handleReset = () => {
    cleanupMediaUrls(parsedChat);
    setSelectedFile(null);
    setResult(null);
    setParsedChat(null);
    setViewMode('import');
    setError(null);
    setProgressStatus('');
    setSavedArchive(null);
    setSavingStatus('');
    setDuplicateWarning(null);
  };

  if (result) {
    if (viewMode === 'chat' && parsedChat) {
      return (
        <div className="flex h-screen flex-col bg-[#e0ded8] dark:bg-[#0c1317] text-slate-900 dark:text-[#e9edef] overflow-hidden transition-colors">
          <main className="flex flex-1 items-center justify-center p-0 sm:p-2 md:p-4 overflow-hidden">
            <ChatViewer
              parsedChat={parsedChat}
              fallbackFileName={result.chatFileName}
              onBack={() => setViewMode('preview')}
              onSwitchToPreview={() => setViewMode('preview')}
            />
          </main>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#0c1317] text-slate-900 dark:text-[#e9edef] transition-colors">
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-[#222e35] bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-md transition-colors">
          <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button 
                onClick={handleReset}
                className="mr-4 inline-flex items-center justify-center rounded-full p-2 text-slate-500 dark:text-[#8696a0] transition-colors hover:bg-slate-100 dark:hover:bg-[#202c33] hover:text-slate-900 dark:hover:text-[#e9edef]"
                aria-label="Back to upload"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <FileArchive size={20} />
                </div>
                <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#e9edef]">WhatsApp ChatBook</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
          {viewMode === 'preview' && parsedChat ? (
            <ParserPreview 
              parsedChat={parsedChat} 
              fileName={result.chatFileName} 
              onReset={handleReset}
              onOpenChat={handleOpenChat}
            />
          ) : duplicateWarning ? (
            /* Duplicate archive detected modal */
            <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Archive May Already Exist</h2>
              <p className="mt-2 text-sm text-slate-600">
                We detected that an archive matching this export already exists in your local browser storage:
              </p>
              
              <div className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 text-left">
                <p className="font-bold text-slate-900 text-base">{duplicateWarning.title}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span>{duplicateWarning.messageCount.toLocaleString()} messages</span>
                  {duplicateWarning.mediaCount > 0 && <span>• {duplicateWarning.mediaCount} media</span>}
                  {duplicateWarning.startDate && (
                    <span>• {new Date(duplicateWarning.startDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={`/archives?id=${encodeURIComponent(duplicateWarning.id)}`}
                  className="w-full rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-700 shadow-sm"
                >
                  Open Existing Archive
                </Link>
                <button 
                  className="w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={async () => {
                    setDuplicateWarning(null);
                    if (parsedChat && result) {
                      await saveChatLocally(parsedChat, result);
                    }
                  }}
                >
                  Import Anyway (Save As New Copy)
                </button>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 mt-1"
                  onClick={handleReset}
                >
                  Cancel and choose another file
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Import successful</h2>
              
              <div className="mt-8 space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-6 text-left">
                <div>
                  <p className="text-sm font-medium text-slate-500">Chat file</p>
                  <p className="font-semibold text-slate-900">{result.chatFileName}</p>
                </div>
                <div className="h-px w-full bg-slate-200"></div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Files found</p>
                    <p className="font-semibold text-slate-900">{result.mediaFiles.length + 1}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Potential media</p>
                    <p className="font-semibold text-slate-900">{result.mediaFiles.length}</p>
                  </div>
                </div>
              </div>
              
              {/* Local persistence status banner */}
              {savingStatus && (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  {isSaving ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <CheckCircle2 size={14} className="text-emerald-600" />}
                  <span>{savingStatus}</span>
                </div>
              )}
              
              <div className="mt-6 flex flex-col gap-3">
                <button 
                  className="w-full rounded-full bg-emerald-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-sm"
                  onClick={handleOpenChat}
                >
                  Open Chat Viewer
                </button>
                <Link
                  href="/archives"
                  className="w-full rounded-full border border-emerald-600 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  View in Archive Library
                </Link>
                <button 
                  className="w-full rounded-full border border-slate-300 bg-white px-6 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none"
                  onClick={handleParseAndOpenPreview}
                >
                  View Parsed Data Table
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#0c1317] text-slate-900 dark:text-[#e9edef] transition-colors">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-[#222e35] bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-md transition-colors">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link 
              href="/"
              className="mr-4 inline-flex items-center justify-center rounded-full p-2 text-slate-500 dark:text-[#8696a0] transition-colors hover:bg-slate-100 dark:hover:bg-[#202c33] hover:text-slate-900 dark:hover:text-[#e9edef]"
              aria-label="Back to home"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <FileArchive size={20} />
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#e9edef]">WhatsApp ChatBook</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/archives"
              className="text-sm font-semibold text-slate-600 dark:text-[#8696a0] hover:text-slate-900 dark:hover:text-[#e9edef] transition-colors"
            >
              Library
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Import your chat
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Select a WhatsApp chat export from your computer. Your file is processed locally in your browser.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <h4 className="font-medium text-red-900">We could not process this file</h4>
                <p className="mt-1 text-sm">{error}</p>
                <button 
                  onClick={() => { setError(null); setSelectedFile(null); }}
                  className="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900"
                >
                  Try another file
                </button>
              </div>
            </div>
          )}
          
          <div className="mb-6 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="font-medium text-slate-900">Date Format</h3>
            <p className="text-sm text-slate-500 mb-2 text-center max-w-md">Select the date format used in your chat file. Usually, auto-detect works fine, but you can override it here if dates are showing incorrectly.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { id: 'auto', label: 'Auto Detect' },
                { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. India/UK)' },
                { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. US)' },
              ].map((format) => (
                <label 
                  key={format.id} 
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${dateFormat === format.id ? 'border-green-500 bg-green-50 text-green-700 font-medium' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <input
                    type="radio"
                    name="dateFormat"
                    value={format.id}
                    checked={dateFormat === format.id}
                    onChange={(e) => setDateFormat(e.target.value as 'auto' | 'DD/MM/YYYY' | 'MM/DD/YYYY')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <span>{format.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div 
            className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 transition-colors ${
              isDragging 
                ? 'border-green-500 bg-green-50' 
                : selectedFile
                  ? 'border-slate-300 bg-white'
                  : 'border-slate-300 bg-white hover:border-slate-400'
            } ${isProcessing ? 'opacity-80 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".zip,.txt" 
              className="hidden" 
              disabled={isProcessing}
            />

            {!selectedFile ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Upload className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  Drop your WhatsApp export here
                </h3>
                <p className="mt-2 text-slate-500">
                  Supports .zip and .txt exports
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="h-px w-16 bg-slate-200"></div>
                  <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">OR</span>
                  <div className="h-px w-16 bg-slate-200"></div>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="mt-8 rounded-full bg-slate-900 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50"
                >
                  Choose a ZIP file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  {isProcessing ? (
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                  ) : selectedFile.name.endsWith('.zip') ? (
                    <FileArchive className="h-10 w-10" />
                  ) : (
                    <FileText className="h-10 w-10" />
                  )}
                </div>
                
                <h3 className="text-2xl font-semibold text-slate-900">
                  {selectedFile.name}
                </h3>
                
                {isProcessing ? (
                  <p className="mt-2 text-blue-600 font-medium animate-pulse">
                    {progressStatus || 'Processing...'}
                  </p>
                ) : (
                  <p className="mt-2 text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
                
                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => { setSelectedFile(null); setError(null); }}
                    disabled={isProcessing}
                    className="rounded-full border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleProcessArchive}
                    disabled={isProcessing}
                    className="flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    {isProcessing ? 'Processing...' : 'Process Archive'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-start sm:items-center justify-center gap-3 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
            <Shield className="mt-0.5 sm:mt-0 h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <strong className="font-semibold text-slate-900">Your conversation stays on your device.</strong>
              <span className="block sm:inline sm:ml-1">This archive is processed locally in your browser. Your chat is not uploaded to a server.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
