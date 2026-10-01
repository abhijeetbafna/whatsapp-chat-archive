export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface ImportedMediaFile {
  fileName: string;
  path: string;
  size: number;
  mimeType?: string;
  type: MediaType;
  // Store the actual file blob for later use when parsing or displaying
  blob?: Blob; 
}

export interface ImportedWhatsAppExport {
  originalFileName: string;
  chatFileName: string;
  chatText: string;
  mediaFiles: ImportedMediaFile[];
  importedAt: string;
}
