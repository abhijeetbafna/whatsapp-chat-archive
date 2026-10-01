import React from 'react';
import { Message } from '../../types/chat';
import { 
  formatMessageTime, 
  getSenderColorClass, 
  renderFormattedText 
} from '../../lib/chat-utils';
import { MediaMessagePlaceholder } from './MediaMessagePlaceholder';
import { useTheme } from '../../context/ThemeContext';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  showSenderName: boolean;
  searchQuery?: string;
  isHighlighted?: boolean;
}

export function MessageBubble({ message, isOutgoing, showSenderName, searchQuery, isHighlighted }: MessageBubbleProps) {
  const { settings } = useTheme();
  const timeFormatted = formatMessageTime(message.timestamp);
  const attachments = message.attachments || [];
  
  // An image is "direct" if it's the only attachment and there's no text body
  const isDirectImageWithoutText = attachments.length === 1 && attachments[0].type === 'image' && attachments[0].mediaUrl && !message.text;

  // Font size styling
  const fontSizeClass = 
    settings.fontScale === 'sm' ? 'text-[13px] leading-[1.35]' :
    settings.fontScale === 'lg' ? 'text-[16px] leading-[1.45]' :
    'text-[14.5px] leading-[1.4]';

  // Highlight text logic
  const highlightText = (text: string) => {
    if (!searchQuery || !text) return renderFormattedText(text);
    
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-slate-900 dark:text-yellow-100 px-0.5 rounded">{part}</mark>
      ) : (
        <React.Fragment key={i}>{renderFormattedText(part)}</React.Fragment>
      )
    );
  };

  return (
    <div
      className={`flex flex-col my-1 px-2 sm:px-4 ${
        isOutgoing ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[88%] sm:max-w-[72%] md:max-w-[62%] transition-all shadow-[0_1px_0.5px_rgba(11,20,26,0.12)] ${
          isDirectImageWithoutText ? 'p-1' : 'px-3 py-2'
        } ${
          isOutgoing
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tr-xs border border-[#c7e9b0]/50 dark:border-[#025143]'
            : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tl-xs border border-slate-100 dark:border-[#2a3942]/60'
        } ${isHighlighted ? 'ring-2 ring-emerald-500 ring-offset-1 scale-[1.02]' : ''}`}
      >
        {/* Sender Name in Group Chats */}
        {showSenderName && message.senderName && !isOutgoing && (
          <div className={`mb-1 text-xs font-semibold ${getSenderColorClass(message.senderName)}`}>
            {message.senderName}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className={`flex flex-wrap gap-1 ${attachments.length > 1 ? 'mb-2' : ''}`}>
             {attachments.map((att, idx) => (
                <div key={idx} className={attachments.length > 1 ? 'w-full max-w-[240px]' : 'w-full'}>
                  <MediaMessagePlaceholder
                    type={att.type}
                    fileName={att.fileName}
                    mediaUrl={att.mediaUrl}
                    mediaSize={att.mediaSize}
                    mediaStatus={att.mediaStatus}
                    rawText={message.rawText}
                    caption={undefined}
                    timestampFormatted={isDirectImageWithoutText ? timeFormatted : undefined}
                  />
                </div>
             ))}
          </div>
        )}

        {/* Text Content */}
        {message.text && (
          <div className={`whitespace-pre-wrap break-words select-text ${fontSizeClass} ${attachments.length > 0 ? 'mt-1' : ''} ${
            message.isDeleted 
              ? 'italic text-[#667781] dark:text-[#8696a0]' 
              : 'text-[#111b21] dark:text-[#e9edef]'
          }`}>
            {message.isDeleted && (
              <span className="inline-block align-text-bottom mr-1 opacity-70">
                <svg viewBox="0 0 24 24" height="14" width="14" preserveAspectRatio="xMidYMid meet" className="fill-current">
                   <path d="M12,2C6.5,2,2,6.5,2,12c0,5.5,4.5,10,10,10s10-4.5,10-10C22,6.5,17.5,2,12,2z M12,20.2c-4.5,0-8.2-3.7-8.2-8.2 c0-1.9,0.7-3.7,1.8-5.1l11.6,11.6C15.7,19.6,13.9,20.2,12,20.2z M18.4,17.1L6.9,5.6C8.3,4.5,10.1,3.8,12,3.8c4.5,0,8.2,3.7,8.2,8.2 C20.2,13.9,19.6,15.7,18.4,17.1z"></path>
                </svg>
              </span>
            )}
            {highlightText(message.text)}
          </div>
        )}

        {/* Timestamp & Edited status */}
        {!isDirectImageWithoutText && (
          <div className="mt-1 flex items-center justify-end gap-1">
            {message.isEdited && (
              <span className="text-[10px] text-slate-400 dark:text-[#8696a0] font-medium select-none italic mr-1">
                Edited
              </span>
            )}
            <span className="text-[10.5px] text-slate-500 dark:text-[#8696a0] font-medium select-none">
              {timeFormatted}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
