import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Mic, Download, AlertTriangle } from 'lucide-react';

interface AudioVoiceNotePlayerProps {
  mediaUrl: string;
  fileName?: string;
  mediaSize?: number;
  caption?: string;
}

const PLAYBACK_RATES = [1, 1.5, 2] as const;
const NUM_WAVEFORM_BARS = 30;

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generate a deterministic realistic-looking waveform fallback based on a string hash.
 */
function generateFallbackPeaks(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const peaks: number[] = [];
  for (let i = 0; i < NUM_WAVEFORM_BARS; i++) {
    const val = Math.abs(Math.sin((hash + i * 17) * 0.45));
    // Shape like speech: slightly lower at ends, dynamic peaks in middle
    const envelope = Math.sin((i / (NUM_WAVEFORM_BARS - 1)) * Math.PI) * 0.4 + 0.6;
    peaks.push(Math.max(0.2, Math.min(1.0, val * envelope)));
  }
  return peaks;
}

export function AudioVoiceNotePlayer({
  mediaUrl,
  fileName,
  mediaSize,
  caption,
}: AudioVoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [peaks, setPeaks] = useState<number[]>(() => generateFallbackPeaks(fileName || mediaUrl));
  const [isDragging, setIsDragging] = useState(false);

  // Extract actual audio peaks if AudioContext is available
  useEffect(() => {
    let isCancelled = false;

    const extractPeaks = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx || !mediaUrl.startsWith('blob:')) {
          return;
        }

        const response = await fetch(mediaUrl);
        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        const ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(channelData.length / NUM_WAVEFORM_BARS);
        const newPeaks: number[] = [];

        for (let i = 0; i < NUM_WAVEFORM_BARS; i++) {
          let sum = 0;
          const start = i * blockSize;
          const end = Math.min(start + blockSize, channelData.length);
          for (let j = start; j < end; j++) {
            sum += Math.abs(channelData[j]);
          }
          const avg = sum / (end - start || 1);
          // Scale and normalize
          newPeaks.push(Math.max(0.18, Math.min(1.0, avg * 3.5)));
        }

        if (!isCancelled && newPeaks.length === NUM_WAVEFORM_BARS) {
          setPeaks(newPeaks);
        }
        ctx.close().catch(() => {});
      } catch {
        // Fallback peaks remain active
      }
    };

    extractPeaks();

    return () => {
      isCancelled = true;
    };
  }, [mediaUrl]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setAudioError(true);
      });
    }
  };

  // Cycle playback speed: 1x -> 1.5x -> 2x
  const cyclePlaybackRate = () => {
    const nextIndex = (speedIndex + 1) % PLAYBACK_RATES.length;
    setSpeedIndex(nextIndex);
    const newRate = PLAYBACK_RATES[nextIndex];
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  // Seek calculation from mouse/touch event
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      if (!waveformRef.current || !audioRef.current || duration <= 0) return;
      const rect = waveformRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Drag-to-seek listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleSeek(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleSeek]);

  if (audioError) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-slate-50/90 dark:bg-[#182229] border border-slate-200/80 dark:border-[#2a3942] p-3 min-w-[270px] max-w-sm shadow-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-[#e9edef] truncate">
              {fileName || 'Voice Note'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-[#8696a0]">Audio codec unsupported</p>
          </div>
        </div>
        <a
          href={mediaUrl}
          download={fileName || 'voice-note.opus'}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-200/80 dark:bg-[#202c33] py-1.5 text-xs font-medium text-slate-700 dark:text-[#e9edef] hover:bg-slate-300 dark:hover:bg-[#2a3942] transition-colors"
        >
          <Download size={13} /> Download audio file
        </a>
      </div>
    );
  }

  const currentRate = PLAYBACK_RATES[speedIndex];
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const currentBarIndex = Math.floor(progressRatio * NUM_WAVEFORM_BARS);

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-[#f0f2f5]/90 dark:bg-[#182229] border border-slate-200/80 dark:border-[#2a3942] p-3 min-w-[280px] max-w-[340px] shadow-xs select-none transition-colors">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={mediaUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current && !isDragging) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => setAudioError(true)}
      />

      {/* Top Header: Voice Note label & size */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Mic size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11.5px] font-semibold text-slate-800 dark:text-[#e9edef] truncate">
            {fileName || 'Voice Note'}
          </span>
        </div>
        {mediaSize && (
          <span className="text-[10px] text-slate-500 dark:text-[#8696a0] shrink-0">
            {formatBytes(mediaSize)}
          </span>
        )}
      </div>

      {/* Main player controls: Play/Pause + Interactive Waveform */}
      <div className="flex items-center gap-3 mt-1">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-xs transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          title={isPlaying ? 'Pause' : 'Play Voice Note'}
          aria-label={isPlaying ? 'Pause' : 'Play Voice Note'}
        >
          {isPlaying ? <Pause size={17} className="fill-current" /> : <Play size={17} className="fill-current ml-0.5" />}
        </button>

        {/* Interactive Waveform Canvas / Bars */}
        <div
          ref={waveformRef}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleSeek(e);
          }}
          className="relative flex-1 flex items-center justify-between h-9 cursor-pointer py-1 group"
          title="Click or drag to seek"
        >
          {peaks.map((peak, idx) => {
            const isPlayed = idx <= currentBarIndex;
            const barHeight = Math.max(5, Math.round(peak * 26));

            return (
              <span
                key={idx}
                style={{ height: `${barHeight}px` }}
                className={`w-[3px] rounded-full transition-colors duration-100 ${
                  isPlayed
                    ? 'bg-emerald-600 dark:bg-emerald-400'
                    : 'bg-slate-300 dark:bg-[#3b4a54] group-hover:bg-slate-400 dark:group-hover:bg-[#4a5d69]'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Footer: Timers and Speed Switcher */}
      <div className="flex items-center justify-between px-0.5 text-[11px] font-medium text-slate-500 dark:text-[#8696a0]">
        <span>
          {isPlaying || currentTime > 0
            ? `${formatDuration(currentTime)} / ${formatDuration(duration)}`
            : formatDuration(duration)}
        </span>

        <button
          onClick={cyclePlaybackRate}
          className="inline-flex items-center justify-center rounded-full px-2 py-0.5 bg-slate-200/90 dark:bg-[#2a3942] text-slate-700 dark:text-[#e9edef] hover:bg-slate-300 dark:hover:bg-[#32424b] text-[10.5px] font-bold shadow-2xs transition-all active:scale-90"
          title="Change playback speed"
          aria-label={`Playback speed: ${currentRate}x`}
        >
          {currentRate}x
        </button>
      </div>

      {caption && (
        <p className="mt-1 text-xs text-slate-800 dark:text-[#e9edef] leading-relaxed break-words px-0.5">
          {caption}
        </p>
      )}
    </div>
  );
}
