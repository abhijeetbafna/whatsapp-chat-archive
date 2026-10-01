import JSZip from 'jszip';
import { ImportedWhatsAppExport, ImportedMediaFile, MediaType } from '../../types';

const getMediaType = (extension: string): MediaType => {
  const ext = extension.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'ogg', 'wav', 'm4a', 'aac', 'opus'].includes(ext)) return 'audio';
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext)) return 'document';
  return 'other';
};

const getMimeType = (extension: string): string | undefined => {
  const ext = extension.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg',
    'wav': 'audio/wav',
    'opus': 'audio/opus',
    'pdf': 'application/pdf',
  };
  return mimeTypes[ext];
};

export const processWhatsAppExport = async (
  file: File,
  onProgress?: (status: string) => void
): Promise<ImportedWhatsAppExport> => {
  const isZip = file.name.toLowerCase().endsWith('.zip');
  const isTxt = file.name.toLowerCase().endsWith('.txt');

  if (!isZip && !isTxt) {
    throw new Error('Unsupported file format. Please upload a .zip or .txt file.');
  }

  if (isTxt) {
    onProgress?.('Reading your export...');
    const text = await file.text();
    
    if (text.trim().length === 0) {
      throw new Error('The text file is empty.');
    }

    onProgress?.('Preparing archive...');
    return {
      originalFileName: file.name,
      chatFileName: file.name,
      chatText: text,
      mediaFiles: [],
      importedAt: new Date().toISOString(),
    };
  }

  // Handle ZIP
  onProgress?.('Reading your export...');
  const zip = new JSZip();
  
  let loadedZip: JSZip;
  try {
    loadedZip = await zip.loadAsync(file);
  } catch (error) {
    throw new Error('Failed to read the ZIP file. It might be corrupt or invalid.');
  }

  onProgress?.('Finding conversation...');
  let chatFileEntry: JSZip.JSZipObject | null = null;
  const mediaFiles: ImportedMediaFile[] = [];
  
  // To avoid Zip slip / malicious paths, we sanitize or ignore relative paths traversing up
  const entries = Object.values(loadedZip.files).filter(entry => 
    !entry.dir && 
    !entry.name.includes('..') && 
    !entry.name.startsWith('/') &&
    !entry.name.startsWith('\\')
  );
  
  // Find potential chat files
  const txtFiles = entries.filter(e => e.name.toLowerCase().endsWith('.txt'));
  
  if (txtFiles.length === 0) {
    throw new Error('We could not find a WhatsApp conversation (.txt file) in this ZIP. Please make sure you selected a chat export created by WhatsApp.');
  }

  // Best guess for the chat file: iOS uses _chat.txt, Android uses "WhatsApp Chat with ...txt"
  chatFileEntry = txtFiles.find(e => e.name.includes('_chat') || e.name.toLowerCase().includes('whatsapp chat')) || txtFiles[0];

  onProgress?.('Reading messages...');
  const chatText = await chatFileEntry.async('string');
  
  if (chatText.trim().length === 0) {
    throw new Error('The chat file found in the ZIP is empty.');
  }

  onProgress?.('Checking media...');
  // Process remaining files as media
  for (const entry of entries) {
    if (entry === chatFileEntry) continue;
    
    // Skip hidden files or macosx metadata
    if (entry.name.startsWith('__MACOSX/') || entry.name.split('/').pop()?.startsWith('.')) {
      continue;
    }

    const extension = entry.name.split('.').pop()?.toLowerCase() || '';
    const blob = await entry.async('blob');
    
    mediaFiles.push({
      fileName: entry.name.split('/').pop() || entry.name,
      path: entry.name,
      size: blob.size,
      mimeType: getMimeType(extension),
      type: getMediaType(extension),
      blob: blob,
    });
  }

  onProgress?.('Preparing archive...');
  return {
    originalFileName: file.name,
    chatFileName: chatFileEntry.name,
    chatText: chatText,
    mediaFiles,
    importedAt: new Date().toISOString(),
  };
};
