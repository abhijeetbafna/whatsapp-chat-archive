import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { processWhatsAppExport } from '../index';

describe('processWhatsAppExport', () => {
  it('should process a valid .txt file correctly', async () => {
    const txtContent = '2/15/26, 12:00 PM - User: Hello';
    const file = new File([txtContent], 'WhatsApp Chat.txt', { type: 'text/plain' });
    
    const result = await processWhatsAppExport(file);
    
    expect(result.originalFileName).toBe('WhatsApp Chat.txt');
    expect(result.chatFileName).toBe('WhatsApp Chat.txt');
    expect(result.chatText).toBe(txtContent);
    expect(result.mediaFiles.length).toBe(0);
  });

  it('should throw an error for an empty .txt file', async () => {
    const file = new File(['  '], 'empty.txt', { type: 'text/plain' });
    await expect(processWhatsAppExport(file)).rejects.toThrow('The text file is empty.');
  });

  it('should process a valid .zip file with chat and media', async () => {
    // Generate synthetic ZIP in memory
    const zip = new JSZip();
    zip.file('_chat.txt', '12/12/26, 10:00 AM - User: Image attached <attached: image.jpg>');
    zip.file('image.jpg', 'fake-image-data');
    zip.file('video.mp4', 'fake-video-data');
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFile = new File([zipBlob], 'export.zip', { type: 'application/zip' });

    const result = await processWhatsAppExport(zipFile);
    
    expect(result.originalFileName).toBe('export.zip');
    expect(result.chatFileName).toBe('_chat.txt');
    expect(result.chatText).toContain('Image attached');
    expect(result.mediaFiles.length).toBe(2);
    
    const imageMedia = result.mediaFiles.find(m => m.fileName === 'image.jpg');
    expect(imageMedia).toBeDefined();
    expect(imageMedia?.type).toBe('image');
    expect(imageMedia?.mimeType).toBe('image/jpeg');

    const videoMedia = result.mediaFiles.find(m => m.fileName === 'video.mp4');
    expect(videoMedia).toBeDefined();
    expect(videoMedia?.type).toBe('video');
    expect(videoMedia?.mimeType).toBe('video/mp4');
  });

  it('should throw an error if no .txt file is found in the .zip', async () => {
    const zip = new JSZip();
    zip.file('image.jpg', 'fake-image-data');
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFile = new File([zipBlob], 'no-chat.zip', { type: 'application/zip' });

    await expect(processWhatsAppExport(zipFile)).rejects.toThrow('We could not find a WhatsApp conversation (.txt file) in this ZIP');
  });

  it('should ignore malicious path traversal in .zip', async () => {
    const zip = new JSZip();
    zip.file('_chat.txt', 'Chat content');
    zip.file('../malicious.txt', 'bad stuff');
    zip.file('..\\malicious2.txt', 'bad stuff');
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFile = new File([zipBlob], 'traversal.zip', { type: 'application/zip' });

    const result = await processWhatsAppExport(zipFile);
    
    // JSZip normalizes ../ to the root directory when adding files this way, 
    // so we just want to ensure that no extracted media file path contains '..'
    expect(result.chatFileName).toBe('_chat.txt');
    const maliciousPaths = result.mediaFiles.filter(m => m.path.includes('..') || m.path.startsWith('/') || m.path.startsWith('\\'));
    expect(maliciousPaths.length).toBe(0);
  });

  it('should throw an error for unsupported file extensions', async () => {
    const file = new File(['data'], 'export.pdf', { type: 'application/pdf' });
    await expect(processWhatsAppExport(file)).rejects.toThrow('Unsupported file format');
  });
});
