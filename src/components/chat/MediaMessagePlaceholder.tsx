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
  Maximize2,
  AlertTriangle
} from 'lucide-react';

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
  rawText, 
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
  if (type === 'sticker' && mediaUrl && mediaStatus === 'available') {
    return (
      <div className="flex flex-col items-center py-1">
        <img
          src={mediaUrl}
          alt={fileName || 'Sticker'}
          className="max-h-36 max-w-36 object-contain drop-shadow-xs"
          loading="lazy"
        />
        {caption && (
          <p className="mt-1 text-xs text-slate-800 text-center">{caption}</p>
        )}
      </div>
    );
  }

  // Image with URL
  if (type === 'image' && mediaUrl && mediaStatus === 'available' && !imageError) {
    return (
      <>
        <div className="group relative overflow-hidden rounded-xl bg-slate-900/5">
          <img
            src={mediaUrl}
            alt={fileName || 'Photo'}
            onError={() => setImageError(true)}
            onClick={() => setShowLightbox(true)}
            className="w-full max-h-80 object-cover rounded-xl cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
            loading="lazy"
          />

          {/* Quick Expand Button on Hover */}
          <button
            onClick={() => setShowLightbox(true)}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70 backdrop-blur-xs"
            title="Enlarge photo"
          >
            <Maximize2 size={14} />
          </button>

          {/* Overlay timestamp if no caption */}
          {!caption && timestampFormatted && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs shadow-xs">
              {timestampFormatted}
            </div>
          )}
        </div>

        {caption && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-900 px-1 break-words">
            {caption}
          </p>
        )}

        {/* Full Image Lightbox Modal */}
        {showLightbox && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
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
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
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
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4 text-center shadow-xs">
             <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <AlertTriangle size={20} />
             </div>
             <div>
               <p className="text-sm font-semibold text-slate-900">Preview unavailable</p>
               <p className="text-xs text-slate-500 mt-1">This video format is not supported by your browser.</p>
             </div>
             <a
              href={mediaUrl}
              download={fileName || 'video'}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
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
          <p className="text-[13.5px] leading-relaxed text-slate-900 px-1 break-words">{caption}</p>
        )}
      </div>
    );
  }

  // Audio with URL
  if (type === 'audio' && mediaUrl && mediaStatus === 'available') {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-slate-50/90 border border-slate-200/80 p-3 min-w-[260px] max-w-sm shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
            <Mic size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {fileName || 'Voice Note'}
            </p>
            {mediaSize && (
              <p className="text-[10px] text-slate-500">{formatBytes(mediaSize)}</p>
            )}
          </div>
        </div>
        
        {audioError ? (
           <div className="mt-2 flex flex-col gap-2 text-center text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100">
             <p>This audio file cannot be played in your browser.</p>
             <a
              href={mediaUrl}
              download={fileName || 'audio'}
              className="inline-flex items-center justify-center gap-1.5 rounded bg-slate-100 py-1.5 text-slate-700 hover:bg-slate-200 transition-colors"
             >
               <Download size={14} /> Download audio
             </a>
           </div>
        ) : (
          <audio controls src={mediaUrl} className="w-full h-8" preload="metadata" onError={() => setAudioError(true)} />
        )}

        {caption && (
          <p className="text-xs text-slate-800 leading-relaxed break-words">{caption}</p>
        )}
      </div>
    );
  }

  // Document with URL
  if (type === 'document' && mediaUrl && mediaStatus === 'available') {
    const ext = fileName?.split('.').pop()?.toUpperCase() || 'DOC';
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-white border border-slate-200/90 p-3 min-w-[240px] max-w-sm shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold border border-blue-100">
            <span className="text-[10px] uppercase">{ext}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate" title={fileName}>
              {fileName || 'Document'}
            </p>
            <p className="text-[11px] text-slate-500">
              {formatBytes(mediaSize) || 'Attached document'}
            </p>
          </div>
          <a
            href={mediaUrl}
            download={fileName || 'document'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors shadow-xs"
            title="Download document"
          >
            <Download size={16} />
          </a>
        </div>
        {caption && (
          <p className="text-xs text-slate-800 leading-relaxed break-words">{caption}</p>
        )}
      </div>
    );
  }

  // Fallback placeholder when file is omitted from export, missing, or unknown format
  const getMediaMeta = () => {
    switch (type) {
      case 'image':
        return { icon: <ImageIcon size={20} className="text-emerald-600" />, label: 'Photo' };
      case 'video':
        return { icon: <Video size={20} className="text-indigo-600" />, label: 'Video' };
      case 'audio':
        return { icon: <Mic size={20} className="text-amber-600" />, label: 'Voice Note' };
      case 'document':
        return { icon: <FileText size={20} className="text-blue-600" />, label: 'Document' };
      case 'sticker':
        return { icon: <Smile size={20} className="text-purple-600" />, label: 'Sticker' };
      default:
        return { icon: <Paperclip size={20} className="text-slate-600" />, label: 'File' };
    }
  };

  const meta = getMediaMeta();
  const isMissing = mediaStatus === 'missing' || !mediaUrl || imageError;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 min-w-[200px] max-w-xs shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs border border-slate-100">
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 truncate">{fileName || meta.label}</p>
          <p className="text-[11px] text-slate-500 truncate font-mono">
            {isMissing ? 'Media not available' : 'Preview unavailable'}
          </p>
        </div>
        {mediaUrl && !isMissing && (
           <a
             href={mediaUrl}
             download={fileName || 'file'}
             className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
             title="Download"
           >
             <Download size={14} />
           </a>
        )}
      </div>
      {caption && (
        <p className="text-xs text-slate-800 leading-relaxed break-words">{caption}</p>
      )}
      <div className="text-[10px] text-slate-400 italic">
        {isMissing 
          ? (fileName ? 'File referenced in chat' : 'Media omitted in export')
          : 'This file type cannot be previewed.'}
      </div>
    </div>
  );
}
