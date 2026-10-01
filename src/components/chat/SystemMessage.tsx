import React from 'react';
import { Message } from '../../types/chat';
import { Shield, Info } from 'lucide-react';

interface SystemMessageProps {
  message: Message;
}

export function SystemMessage({ message }: SystemMessageProps) {
  const text = message.text?.trim() || '';
  
  // Guard against any lone punctuation or empty strings
  if (!text || /^[-_.~,;:!?'"“”‘’/\\]+$/.test(text)) {
    return null;
  }

  const isEncryptionNotice = text.toLowerCase().includes('end-to-end encrypted');

  return (
    <div className="flex justify-center my-2.5 px-4 select-none">
      <div className="flex items-center gap-2 max-w-lg rounded-xl bg-[#fff8e5] dark:bg-[#182229] border border-[#fbe5a7]/80 dark:border-[#222e35] px-3.5 py-1.5 text-center text-[12px] text-[#745316] dark:text-[#ffd279] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors">
        {isEncryptionNotice ? (
          <Shield size={13} className="shrink-0 text-[#b58105] dark:text-[#f5c451]" />
        ) : (
          <Info size={13} className="shrink-0 text-[#b58105] dark:text-[#f5c451]" />
        )}
        <span className="leading-relaxed break-words">{text}</span>
      </div>
    </div>
  );
}
