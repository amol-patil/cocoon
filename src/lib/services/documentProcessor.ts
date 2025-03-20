import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../storage/indexeddb';

export interface ProcessingProgress {
  status: 'loading' | 'processing' | 'storing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  folderId?: string;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  text: string;
  thumbnail?: string;
  tags: string[];
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, string>;
}

export class DocumentProcessor {
  private async createThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate thumbnail dimensions (max 200px)
          const maxSize = 200;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async processWithGemini(file: File, documentType: string): Promise<{ text: string; metadata: Record<string, string> }> {
    console.log('Processing document with Gemini:', { fileName: file.name, documentType });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await fetch('/api/gemini', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini processing failed:', error);
      throw new Error('Failed to process image with Gemini');
    }

    const result = await response.json();
    console.log('Received result from Gemini:', result);
    return result;
  }

  private async storeDocument(doc: ProcessedDocument): Promise<void> {
    console.log('DocumentProcessor: Starting to store document:', {
      id: doc.id,
      name: doc.name,
      type: doc.type
    });

    try {
      const db = await getDB();
      console.log('DocumentProcessor: Got database connection');

      // Verify the documents store exists
      const stores = Array.from(db.objectStoreNames);
      console.log('DocumentProcessor: Available stores:', stores);

      if (!stores.includes('documents')) {
        console.error('DocumentProcessor: documents store not found');
        throw new Error('Database store not found');
      }

      await db.put('documents', doc);
      console.log('DocumentProcessor: Document stored successfully');

      // Verify the document was stored
      const storedDoc = await db.get('documents', doc.id);
      console.log('DocumentProcessor: Verified stored document:', storedDoc);

      if (!storedDoc) {
        console.error('DocumentProcessor: Document not found after storage');
        throw new Error('Failed to verify document storage');
      }
    } catch (error) {
      console.error('DocumentProcessor: Error storing document:', error);
      throw error;
    }
  }

  public async processDocument(
    file: File,
    documentType: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessedDocument> {
    try {
      console.log('Starting document processing:', { fileName: file.name, documentType });
      
      onProgress?.({
        status: 'loading',
        progress: 0,
        message: 'Preparing document...',
      });

      const doc: ProcessedDocument = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: '',
        text: '',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Convert file to base64 for storage
      const reader = new FileReader();
      const contentPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onProgress?.({
        status: 'processing',
        progress: 20,
        message: 'Reading file...',
      });

      doc.content = await contentPromise;

      onProgress?.({
        status: 'processing',
        progress: 40,
        message: 'Processing with AI...',
      });

      // Process image with Gemini
      const { text, metadata } = await this.processWithGemini(file, documentType);
      console.log('Document processed successfully:', { text: text?.substring(0, 100), metadata });
      
      // Store the raw text and metadata separately
      doc.text = text;
      doc.metadata = metadata;

      onProgress?.({
        status: 'processing',
        progress: 90,
        message: 'Creating thumbnail...',
      });

      doc.thumbnail = await this.createThumbnail(file);

      onProgress?.({
        status: 'complete',
        progress: 100,
        message: 'Document processed successfully',
      });

      return doc;
    } catch (error) {
      console.error('Document processing failed:', error);
      onProgress?.({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to process document',
      });
      throw error;
    }
  }
} 