'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileArchive,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Link2,
  Download,
  Edit2,
  Trash2,
  HardDrive,
  Search,
  UploadCloud,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus,
  RefreshCw,
  Layers,
  CheckSquare,
  Square,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ChatArchiveMetadata,
  StorageEstimate,
  MergePreviewData,
} from '../../types/storage';
import {
  getArchiveList,
  renameArchive,
  deleteArchive,
  getStorageEstimate,
  createArchiveBackupZip,
  downloadBackupBlob,
  restoreArchiveFromBackup,
  mergeArchives,
  computeMergePreview,
} from '../../lib/storage';

interface ArchiveLibraryProps {
  onOpenArchive: (archiveId: string) => void;
  onRefreshList?: () => void;
}

export function ArchiveLibrary({ onOpenArchive, onRefreshList }: ArchiveLibraryProps) {
  const [archives, setArchives] = useState<ChatArchiveMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Rename state
  const [editingArchive, setEditingArchive] = useState<ChatArchiveMetadata | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete state
  const [deletingArchive, setDeletingArchive] = useState<ChatArchiveMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Backup state
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [backupProgress, setBackupProgress] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Backup collision modal state
  const [collisionFile, setCollisionFile] = useState<File | null>(null);
  const [collisionInfo, setCollisionInfo] = useState<{ id: string; title: string } | null>(null);

  // Merge selection and modal states
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<string[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergePreview, setMergePreview] = useState<MergePreviewData | null>(null);
  const [isLoadingMergePreview, setIsLoadingMergePreview] = useState(false);
  const [mergedCustomTitle, setMergedCustomTitle] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState('');

  const fetchArchives = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await getArchiveList();
      setArchives(list);
      const est = await getStorageEstimate();
      setStorageEstimate(est);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local archives');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleToggleSelectArchive = (id: string) => {
    setSelectedArchiveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenMergeModal = async (initialIds?: string[]) => {
    const idsToMerge = initialIds || selectedArchiveIds;
    if (idsToMerge.length < 2) return;

    setIsMergeModalOpen(true);
    setIsLoadingMergePreview(true);
    setError(null);

    try {
      const preview = await computeMergePreview(idsToMerge);
      setMergePreview(preview);
      setMergedCustomTitle(preview.suggestedTitle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze archives for merge');
      setIsMergeModalOpen(false);
    } finally {
      setIsLoadingMergePreview(false);
    }
  };

  const handleExecuteMerge = async () => {
    if (!mergePreview) return;
    setIsMerging(true);
    setMergeProgress('Preparing merge...');

    try {
      const merged = await mergeArchives(
        mergePreview.sourceArchives.map((a) => a.id),
        {
          customTitle: mergedCustomTitle.trim() || undefined,
          onProgress: (status) => setMergeProgress(status),
        }
      );

      setIsMergeModalOpen(false);
      setMergePreview(null);
      setSelectedArchiveIds([]);
      setActionSuccess(`Successfully created unified archive "${merged.title}"!`);
      setTimeout(() => setActionSuccess(null), 4000);
      await fetchArchives();
      onRefreshList?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge operation failed');
    } finally {
      setIsMerging(false);
      setMergeProgress('');
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArchive || !newTitle.trim()) return;

    setIsRenaming(true);
    try {
      await renameArchive(editingArchive.id, newTitle.trim());
      setEditingArchive(null);
      setNewTitle('');
      setActionSuccess('Archive renamed successfully');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchArchives();
      onRefreshList?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename archive');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingArchive) return;

    setIsDeleting(true);
    try {
      await deleteArchive(deletingArchive.id);
      setSelectedArchiveIds((prev) => prev.filter((id) => id !== deletingArchive.id));
      setDeletingArchive(null);
      setActionSuccess('Archive permanently deleted from local browser storage');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchArchives();
      onRefreshList?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete archive');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportBackup = async (archive: ChatArchiveMetadata) => {
    setExportingId(archive.id);
    setBackupProgress('Packaging backup...');
    try {
      const blob = await createArchiveBackupZip(archive.id, (status) => {
        setBackupProgress(status);
      });
      downloadBackupBlob(blob, archive.title);
      setActionSuccess(`Exported backup for "${archive.title}"`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export backup archive');
    } finally {
      setExportingId(null);
      setBackupProgress('');
    }
  };

  const handleBackupFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsRestoring(true);
    setError(null);
    setBackupProgress('Validating backup...');

    try {
      const result = await restoreArchiveFromBackup(file, {
        mode: 'error-if-exists',
        onProgress: (status) => setBackupProgress(status),
      });

      setActionSuccess(`Archive "${result.restoredArchive.title}" restored successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      await fetchArchives();
      onRefreshList?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith('COLLISION:')) {
        const parts = msg.split(':');
        setCollisionInfo({ id: parts[1], title: parts[2] || 'Existing Archive' });
        setCollisionFile(file);
      } else {
        setError(msg);
      }
    } finally {
      setIsRestoring(false);
      setBackupProgress('');
    }
  };

  const handleResolveCollision = async (mode: 'copy' | 'replace') => {
    if (!collisionFile) return;

    setIsRestoring(true);
    setCollisionInfo(null);
    setBackupProgress(mode === 'copy' ? 'Restoring as copy...' : 'Replacing existing archive...');

    try {
      const result = await restoreArchiveFromBackup(collisionFile, {
        mode,
        onProgress: (status) => setBackupProgress(status),
      });

      setActionSuccess(
        mode === 'copy'
          ? `Restored as new copy: "${result.restoredArchive.title}"`
          : `Replaced archive: "${result.restoredArchive.title}"`
      );
      setTimeout(() => setActionSuccess(null), 4000);
      setCollisionFile(null);
      await fetchArchives();
      onRefreshList?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
      setBackupProgress('');
    }
  };

  // Filter archives by search query
  const filteredArchives = archives.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (a.title.toLowerCase().includes(q)) return true;
    return a.participants?.some((p) => p.name.toLowerCase().includes(q));
  });

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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Archive Library</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Your WhatsApp conversations stored 100% locally and privately in this browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={backupInputRef}
            onChange={handleBackupFileSelect}
            accept=".zip"
            className="hidden"
          />
          <button
            onClick={() => backupInputRef.current?.click()}
            disabled={isRestoring}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Restore a portable .zip backup into your local storage"
          >
            {isRestoring ? <Loader2 size={16} className="animate-spin text-emerald-600" /> : <UploadCloud size={16} />}
            <span>Restore Backup</span>
          </button>

          {archives.length >= 2 && (
            <button
              onClick={() => {
                if (selectedArchiveIds.length >= 2) {
                  handleOpenMergeModal();
                } else if (selectedArchiveIds.length === 0) {
                  // Select first two
                  setSelectedArchiveIds([archives[0].id, archives[1].id]);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/80 bg-emerald-50/50 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
              title="Merge multiple exports into one unified chronological conversation"
            >
              <Layers size={16} className="text-emerald-600" />
              <span>{selectedArchiveIds.length >= 2 ? `Merge Selected (${selectedArchiveIds.length})` : 'Merge Archives'}</span>
            </button>
          )}

          <Link
            href="/import"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Import Chat</span>
          </Link>
        </div>
      </div>

      {/* Storage Estimate & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archives by name or participant..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Local Storage Indicator */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <HardDrive size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <span className="font-medium text-slate-900">Local Browser Storage</span>
              <p className="text-slate-500">
                {storageEstimate ? `${storageEstimate.usageFormatted} used` : `${archives.length} archive${archives.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <button
            onClick={fetchArchives}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
            title="Refresh library"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-semibold text-red-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {backupProgress && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          <Loader2 size={16} className="animate-spin text-blue-600 flex-shrink-0" />
          <span>{backupProgress}</span>
        </div>
      )}

      {/* Archives Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium">Loading local archives...</p>
        </div>
      ) : archives.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FileArchive size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No archives yet</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Import a WhatsApp export (.zip or .txt) to save and explore your conversation anytime without re-uploading.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Import WhatsApp Export</span>
            </Link>
            <button
              onClick={() => backupInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UploadCloud size={16} />
              <span>Restore from Backup</span>
            </button>
          </div>
        </div>
      ) : filteredArchives.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          <p className="text-base font-medium text-slate-700">No archives matching &ldquo;{searchQuery}&rdquo;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-sm font-medium text-emerald-600 hover:underline"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArchives.map((archive) => {
            const dateRange = formatDateRange(archive.startDate, archive.endDate);
            const isThisExporting = exportingId === archive.id;
            const isSelected = selectedArchiveIds.includes(archive.id);
            const isMerged = archive.source?.type === 'merged-archive';

            return (
              <div
                key={archive.id}
                className={`group flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                    : 'border-slate-200/90 hover:border-emerald-300/70'
                }`}
              >
                <div>
                  {/* Header / Title & Select Checkbox */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Checkbox for merge selection */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelectArchive(archive.id)}
                        className={`mt-0.5 rounded-lg p-1 transition-colors ${
                          isSelected ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-600'
                        }`}
                        title={isSelected ? 'Deselect' : 'Select for merge'}
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            className="font-bold text-slate-900 truncate text-base group-hover:text-emerald-900 transition-colors cursor-pointer"
                            onClick={() => onOpenArchive(archive.id)}
                            title={archive.title}
                          >
                            {archive.title}
                          </h4>
                          {isMerged && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                              <Sparkles size={10} />
                              Merged
                            </span>
                          )}
                        </div>

                        {dateRange && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate">
                            <Calendar size={12} className="flex-shrink-0 text-slate-400" />
                            <span className="truncate">{dateRange}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions (Rename & Delete) */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingArchive(archive);
                          setNewTitle(archive.title);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Rename archive"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingArchive(archive)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete archive from storage"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                      <MessageSquare size={12} className="text-slate-500" />
                      {archive.messageCount.toLocaleString()} msgs
                    </span>

                    {archive.mediaCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        <ImageIcon size={12} className="text-slate-500" />
                        {archive.mediaCount.toLocaleString()} media
                      </span>
                    )}

                    {archive.documentCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        <FileText size={12} className="text-slate-500" />
                        {archive.documentCount} docs
                      </span>
                    )}

                    {archive.linkCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        <Link2 size={12} className="text-slate-500" />
                        {archive.linkCount} links
                      </span>
                    )}
                  </div>

                  {/* Participants summary */}
                  {archive.participants && archive.participants.length > 0 && (
                    <p className="mt-3 text-xs text-slate-400 truncate">
                      {archive.participants.length} participant{archive.participants.length === 1 ? '' : 's'}:{' '}
                      {archive.participants.map((p) => p.name).join(', ')}
                    </p>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportBackup(archive)}
                      disabled={isThisExporting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50"
                      title="Export portable backup (.zip)"
                    >
                      {isThisExporting ? (
                        <Loader2 size={13} className="animate-spin text-emerald-600" />
                      ) : (
                        <Download size={13} />
                      )}
                      <span>Backup</span>
                    </button>

                    <button
                      onClick={() => handleToggleSelectArchive(archive.id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                      title="Select for merging"
                    >
                      <Layers size={13} />
                      <span>{isSelected ? 'Selected' : 'Merge'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenArchive(archive.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <span>Open</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Merge Action Bar (When 2+ archives selected) */}
      {selectedArchiveIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl bg-slate-900/95 text-white px-5 py-3 shadow-2xl backdrop-blur-md border border-slate-700 animate-slideUp">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers size={18} className="text-emerald-400" />
            <span>{selectedArchiveIds.length} archives selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedArchiveIds([])}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => handleOpenMergeModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <Layers size={14} />
              <span>Merge Archives</span>
            </button>
          </div>
        </div>
      )}

      {/* Merge Preview & Execution Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                    <Layers size={20} className="text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Merge WhatsApp Archives</h3>
                    <p className="text-xs text-slate-500">Combine exports into a unified chronological archive</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!isMerging) {
                      setIsMergeModalOpen(false);
                      setMergePreview(null);
                    }
                  }}
                  disabled={isMerging}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {isLoadingMergePreview ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center">
                  <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
                  <p className="text-sm font-medium">Analyzing selected archives and checking compatibility...</p>
                </div>
              ) : mergePreview ? (
                <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Compatibility Assessment Banner (Requirement 7 & 8) */}
                  <div
                    className={`rounded-2xl p-4 border text-xs ${
                      mergePreview.compatibility.isWarning
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {mergePreview.compatibility.isWarning ? (
                        <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold text-sm">{mergePreview.compatibility.title}</p>
                        <ul className="mt-1.5 list-disc list-inside space-y-0.5 opacity-90">
                          {mergePreview.compatibility.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                        {mergePreview.compatibility.isWarning && (
                          <p className="mt-2 font-medium text-amber-800">
                            You can still merge them if you are sure, but verify they belong together.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selected Source Archives List */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Selected Sources (Will remain unchanged):
                    </p>
                    <div className="space-y-2">
                      {mergePreview.sourceArchives.map((src) => (
                        <div
                          key={src.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-slate-900 block truncate">{src.title}</span>
                            <span className="text-slate-400 text-[11px]">
                              {formatDateRange(src.startDate, src.endDate) || 'Dates unavailable'}
                            </span>
                          </div>
                          <span className="font-medium text-slate-600 flex-shrink-0">
                            {src.messageCount.toLocaleString()} msgs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculated Stats Grid (Requirement 27) */}
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                      <span className="text-slate-400 block text-[11px]">Original msgs</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {mergePreview.totalOriginalMessages.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
                      <span className="text-emerald-700 block text-[11px]">Unified msgs</span>
                      <span className="font-bold text-emerald-800 text-sm">
                        {mergePreview.totalUniqueMessages.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5">
                      <span className="text-blue-700 block text-[11px]">Duplicates removed</span>
                      <span className="font-bold text-blue-800 text-sm">
                        {mergePreview.duplicateCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* New Merged Archive Title Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Unified Archive Title:
                    </label>
                    <input
                      type="text"
                      value={mergedCustomTitle}
                      onChange={(e) => setMergedCustomTitle(e.target.value)}
                      placeholder="e.g. Project Chat — Merged"
                      disabled={isMerging}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Source archives will be preserved intact. A new unified archive will be created.
                    </p>
                  </div>

                  {/* Progress status during merge */}
                  {isMerging && (
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2.5 text-xs text-blue-800">
                      <Loader2 size={14} className="animate-spin text-blue-600 flex-shrink-0" />
                      <span>{mergeProgress}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsMergeModalOpen(false);
                  setMergePreview(null);
                }}
                disabled={isMerging}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteMerge}
                disabled={isMerging || isLoadingMergePreview || !mergedCustomTitle.trim()}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ${
                  mergePreview?.compatibility.isWarning
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isMerging ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Merging...</span>
                  </>
                ) : (
                  <>
                    <Layers size={14} />
                    <span>{mergePreview?.compatibility.isWarning ? 'Merge Anyway' : 'Create Merged Archive'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {editingArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Rename Archive</h3>
            <p className="text-xs text-slate-500 mt-1">
              Change the display title of this archive. Message timestamps, senders, and media are completely preserved.
            </p>

            <form onSubmit={handleRenameSubmit} className="mt-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                placeholder="Enter archive title"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingArchive(null)}
                  disabled={isRenaming}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !newTitle.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isRenaming && <Loader2 size={14} className="animate-spin" />}
                  <span>Save Title</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Requirement 13 & 14) */}
      {deletingArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete archive?</h3>
            <p className="text-sm text-slate-600 mt-2">
              This will permanently remove <span className="font-semibold text-slate-900">&ldquo;{deletingArchive.title}&rdquo;</span> and its locally stored media from this browser.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              No files will be left behind. This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingArchive(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                <span>Delete Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Collision Modal (Requirement 31) */}
      {collisionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Archive Already Exists</h3>
            <p className="text-sm text-slate-600 mt-2">
              An archive with this identity already exists in your local storage:{' '}
              <span className="font-semibold text-slate-900">&ldquo;{collisionInfo.title}&rdquo;</span>.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              How would you like to proceed with this backup restore?
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleResolveCollision('copy')}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Restore as Copy (Recommended)
              </button>
              <button
                type="button"
                onClick={() => handleResolveCollision('replace')}
                className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Replace Existing Archive
              </button>
              <button
                type="button"
                onClick={() => {
                  setCollisionInfo(null);
                  setCollisionFile(null);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
