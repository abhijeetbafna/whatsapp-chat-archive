import { ParsedChat, Message } from '../../types/chat';
import { ExportOptions } from '../../components/export/ExportModal';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { PdfDocument } from './PdfDocument';

export function getSafeFilename(title: string | null): string {
  if (!title) return 'chat-archive.pdf';
  // Sanitize filename to prevent invalid characters
  const sanitized = title.replace(/[<>:"/\\|?*]/g, '').trim();
  if (sanitized.length === 0) return 'chat-archive.pdf';
  
  // Format as <conversation-name>-chat-archive.pdf
  return `${sanitized.toLowerCase().replace(/\s+/g, '-')}-chat-archive.pdf`;
}

export function filterMessagesByDate(messages: Message[], options: ExportOptions): Message[] {
  if (options.dateRange !== 'custom') {
    return messages;
  }
  
  const start = new Date(options.fromDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(options.toDate);
  end.setHours(23, 59, 59, 999);

  return messages.filter((msg) => {
    const msgDate = new Date(msg.timestamp);
    return msgDate >= start && msgDate <= end;
  });
}

const blobToBase64 = async (blobUrl: string, expectedMime?: string, originalFileName?: string): Promise<string> => {
  try {
    // If the expected mime is JPEG or PNG, but the file is originally WebP or GIF,
    // React-PDF will crash. We must convert it natively using HTML5 Canvas.
    const isWebpOrGif = originalFileName?.toLowerCase().endsWith('.webp') || originalFileName?.toLowerCase().endsWith('.gif');
    if (expectedMime && (isWebpOrGif || expectedMime === 'image/jpeg' || expectedMime === 'image/png')) {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      // If it's explicitly webp or gif, convert it
      if (blob.type === 'image/webp' || blob.type === 'image/gif' || isWebpOrGif || (!blob.type && expectedMime)) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No canvas context');
            
            // Fill white background for transparent WebP/GIFs
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            resolve(canvas.toDataURL(expectedMime || 'image/jpeg', 0.9));
          };
          img.onerror = () => {
             // Fallback to normal filereader if canvas fails
             fallbackReader(blob, expectedMime, resolve, reject);
          };
          // JSZip blobs often have empty types. The browser will reject the img.src if it doesn't know it's a WebP.
          // We must explicitly construct a new Blob with the correct MIME type to force the browser to decode it.
          let actualMime = blob.type || expectedMime || 'image/webp';
          if (originalFileName?.toLowerCase().endsWith('.webp')) actualMime = 'image/webp';
          if (originalFileName?.toLowerCase().endsWith('.gif')) actualMime = 'image/gif';
          
          const typedBlob = new Blob([blob], { type: actualMime });
          img.src = URL.createObjectURL(typedBlob);
        });
      } else {
        return new Promise((resolve, reject) => fallbackReader(blob, expectedMime, resolve, reject));
      }
    } else {
       const response = await fetch(blobUrl);
       const blob = await response.blob();
       return new Promise((resolve, reject) => fallbackReader(blob, expectedMime, resolve, reject));
    }
  } catch (err) {
    console.warn('Failed to convert blob to base64:', err);
    return blobUrl; // Fallback
  }
};

const fallbackReader = (blob: Blob, expectedMime: string | undefined, resolve: (v: string) => void, reject: (err: any) => void) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    let result = reader.result as string;
    if (expectedMime && result.startsWith('data:') && !result.startsWith(`data:${expectedMime}`)) {
      result = result.replace(/^data:[^;]*;/, `data:${expectedMime};`);
    }
    resolve(result);
  };
  reader.onerror = reject;
  reader.readAsDataURL(blob);
};

export async function generatePdfArchive(chat: ParsedChat, options: ExportOptions): Promise<void> {
  // 1. Filter Messages
  const filteredMessages = filterMessagesByDate(chat.messages, options);

  // Handle case where custom range returns 0 messages
  if (filteredMessages.length === 0) {
    throw new Error('No messages found in the selected date range. Ensure the chat date format was parsed correctly.');
  }

  // Pre-process blob URLs into base64 for React-PDF compatibility
  const processedMessages = await Promise.all(filteredMessages.map(async (msg) => {
    if (!options.includeImages || !msg.attachments || msg.attachments.length === 0) {
      return msg;
    }
    const newAttachments = await Promise.all(msg.attachments.map(async (att) => {
      if (att.mediaUrl && att.mediaUrl.startsWith('blob:')) {
        let expectedMime = undefined;
        
        if (att.type === 'image' || att.type === 'sticker') {
           expectedMime = 'image/jpeg';
           if (att.fileName?.toLowerCase().endsWith('.png')) expectedMime = 'image/png';
        }
        
        if (expectedMime) {
           return {
             ...att,
             mediaUrl: await blobToBase64(att.mediaUrl, expectedMime, att.fileName),
             // Force type to image if we successfully converted a sticker
             type: 'image' as any
           };
        }
      }
      return att;
    }));
    return { ...msg, attachments: newAttachments };
  }));

  // 2. Generate PDF Document
  // We use pdf() to generate the Blob on the client side without mounting an Iframe
  const doc = React.createElement(PdfDocument, { chat, options, filteredMessages: processedMessages });
  const asPdf = pdf(doc as any);
  
  const blob = await asPdf.toBlob();
  
  // 3. Trigger Download
  const filename = getSafeFilename(chat.title || null);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
