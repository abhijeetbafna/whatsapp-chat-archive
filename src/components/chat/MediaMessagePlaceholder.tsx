import React, { useState, useEffect } from 'react';
import { MessageType } from '../../types/chat';
import { 
  Image as ImageIcon, 
  Video, 
  Mic, 
  FileText, 
  Smile, 
  Paperclip,
  Download,
  X,
  AlertTriangle
} from 'lucide-react';
import { AudioVoiceNotePlayer } from './AudioVoiceNotePlayer';

interface MediaMessagePlaceholderProps {
  type: MessageType;
  fileName?: string;
  mediaUrl?: string;
  mediaSize?: number;
  mediaStatus?: 'available' | 'missing' | 'unsupported' | 'error';
  rawText?: string;
  caption?: string;
  timestampFormatted?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function MediaMessagePlaceholder({ 
  type, 
  fileName, 
  mediaUrl, 
  mediaSize, 
  mediaStatus, 
  caption, 
  timestampFormatted 
}: MediaMessagePlaceholderProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLightbox) {
        setShowLightbox(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox]);

  // Sticker
  if (type === 'sticker' && mediaUrl && mediaStatus === 'available' && !imageError) {
    return (
      <div className="relative inline-block my-1 max-w-[150px] max-h-[150px]">
        <img
          src={mediaUrl}
          alt="Sticker"
          className="h-auto w-full object-contain filter drop-shadow-sm select-none"
          loading="lazy"
          onError={() => setImageError(true)}
        />
        {timestampFormatted && (
          <span className="text-[10px] text-slate-400 dark:text-[#8696a0] absolute bottom-0 right-1 bg-white/70 dark:bg-black/60 px-1 rounded backdrop-blur-2xs">
            {timestampFormatted}
          </span>
        )}
      </div>
    );
  }

  // Image with URL
  if (type === 'image' && mediaUrl && mediaStatus === 'available' && !imageError) {
    return (
      <>
        <div 
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-slate-100 dark:bg-[#111b21] max-w-sm transition-transform duration-200 hover:scale-[1.008]"
          onClick={() => setShowLightbox(true)}
          title="Click to view full image"
        >
          <img
            src={mediaUrl}
            alt={fileName || 'Photo'}
            className="max-h-72 w-full object-cover transition-opacity duration-200 group-hover:opacity-95"
            loading="lazy"
            onError={() => setImageError(true)}
          />
          {/* Subtle hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          
          {/* Overlay timestamp if no caption */}
          {!caption && timestampFormatted && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs shadow-xs">
              {timestampFormatted}
            </div>
          )}
        </div>

        {caption && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-900 dark:text-[#e9edef] px-1 break-words">
            {caption}
          </p>
        )}

        {/* Full Image Lightbox Modal */}
        {showLightbox && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowLightbox(false)}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              title="Close"
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>
            <img
              src={mediaUrl}
              alt={fileName || 'Photo Preview'}
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {fileName && (
               <div className="absolute bottom-4 left-4 right-4 text-center text-white text-sm font-medium drop-shadow-md">
                 {fileName}
               </div>
            )}
          </div>
        )}
      </>
    );
  }

  // Video with URL
  if (type === 'video' && mediaUrl && mediaStatus === 'available') {
    return (
      <div className="flex flex-col gap-1.5 overflow-hidden rounded-xl">
        {videoError ? (
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-[#2a3942] p-4 text-center shadow-xs">
             <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
                <AlertTriangle size={20} />
             </div>
             <div>
               <p className="text-sm font-semibold text-slate-900 dark:text-[#e9edef]">Preview unavailable</p>
               <p className="text-xs text-slate-500 dark:text-[#8696a0] mt-1">This video format is not supported by your browser.</p>
             </div>
             <a
              href={mediaUrl}
              download={fileName || 'video'}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-[#202c33] px-4 py-2 text-sm font-medium text-slate-700 dark:text-[#e9edef] hover:bg-slate-200 dark:hover:bg-[#2a3942] transition-colors"
            >
              <Download size={16} />
              Download video
            </a>
          </div>
        ) : (
          <video
            controls
            src={mediaUrl}
            className="max-h-72 w-full rounded-xl bg-black shadow-inner"
            preload="metadata"
            onError={() => setVideoError(true)}
          />
        )}
        {caption && (
          <p className="text-[13.5px] leading-relaxed text-slate-900 dark:text-[#e9edef] px-1 break-words">{caption}</p>
        )}
      </div>
    );
  }

  // Audio with URL - Rich WhatsApp Voice Note Player
  if (type === 'audio' && mediaUrl && mediaStatus === 'available') {
    return (
      <AudioVoiceNotePlayer
        mediaUrl={mediaUrl}
        fileName={fileName}
        mediaSize={mediaSize}
        caption={caption}
      />
    );
  }

  // Document with URL
  if (type === 'document' && mediaUrl && mediaStatus === 'available') {
    const ext = fileName?.split('.').pop()?.toUpperCase() || 'DOC';
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-white dark:bg-[#182229] border border-slate-200/90 dark:border-[#2a3942] p-3 min-w-[240px] max-w-sm shadow-xs hover:border-slate-300 dark:hover:border-[#374248] transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/40">
            <span className="text-[10px] uppercase">{ext}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-[#e9edef] truncate" title={fileName}>
              {fileName || 'Document'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-[#8696a0]">
              {formatBytes(mediaSize) || 'Attached document'}
            </p>
          </div>
          <a
            href={mediaUrl}
            download={fileName || 'document'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-[#202c33] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-600 dark:text-[#e9edef] transition-colors shadow-xs"
            title="Download document"
          >
            <Download size={16} />
          </a>
        </div>
        {caption && (
          <p className="text-xs text-slate-800 dark:text-[#e9edef] leading-relaxed break-words">{caption}</p>
        )}
      </div>
    );
  }

  // Fallback placeholder when file is omitted from export, missing, or unknown format
  const getMediaMeta = () => {
    switch (type) {
      case 'image':
        return { icon: <ImageIcon size={20} className="text-emerald-600 dark:text-emerald-400" />, label: 'Photo' };
      case 'video':
        return { icon: <Video size={20} className="text-indigo-600 dark:text-indigo-400" />, label: 'Video' };
      case 'audio':
        return { icon: <Mic size={20} className="text-amber-600 dark:text-amber-400" />, label: 'Voice Note' };
      case 'document':
        return { icon: <FileText size={20} className="text-blue-600 dark:text-blue-400" />, label: 'Document' };
      case 'sticker':
        return { icon: <Smile size={20} className="text-purple-600 dark:text-purple-400" />, label: 'Sticker' };
      default:
        return { icon: <Paperclip size={20} className="text-slate-600 dark:text-[#8696a0]" />, label: 'File' };
    }
  };

  const meta = getMediaMeta();
  const isMissing = mediaStatus === 'missing' || !mediaUrl || imageError;

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 dark:border-[#2a3942] bg-slate-50/80 dark:bg-[#182229]/80 p-3 min-w-[200px] max-w-xs shadow-xs transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-[#202c33] shadow-xs border border-slate-100 dark:border-[#2a3942]">
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 dark:text-[#e9edef] truncate">{fileName || meta.label}</p>
          <p className="text-[11px] text-slate-500 dark:text-[#8696a0] truncate font-mono">
            {isMissing ? 'Media not available' : 'Preview unavailable'}
          </p>
        </div>
        {mediaUrl && !isMissing && (
           <a
             href={mediaUrl}
             download={fileName || 'file'}
             className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-[#202c33] text-slate-600 dark:text-[#e9edef] hover:bg-slate-300 dark:hover:bg-[#2a3942] transition-colors"
             title="Download"
           >
             <Download size={14} />
           </a>
        )}
      </div>
      {caption && (
        <p className="text-xs text-slate-800 dark:text-[#e9edef] leading-relaxed break-words">{caption}</p>
      )}
      <div className="text-[10px] text-slate-400 dark:text-[#8696a0] italic">
        {isMissing 
          ? (fileName ? 'File referenced in chat' : 'Media omitted in export')
          : 'This file type cannot be previewed.'}
      </div>
    </div>
  );
}
