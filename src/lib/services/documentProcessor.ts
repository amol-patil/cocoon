import { createWorker } from 'tesseract.js';
import type { Worker } from 'tesseract.js';
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
  text: string;  // OCR extracted text
  thumbnail?: string;
  tags: string[];
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OCRProgress {
  status: 'loading' | 'processing' | 'storing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export class DocumentProcessor {
  private worker: Worker | null = null;

  private async getWorker() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/',
      });
    }
    return this.worker;
  }

  private async preprocessImage(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Convert to grayscale
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Increase contrast
          const contrast = 1.5; // Adjust this value to increase/decrease contrast
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const color = factor * (gray - 128) + 128;
          
          // Apply threshold for better text separation
          const threshold = 128;
          const final = color > threshold ? 255 : 0;
          
          data[i] = final;
          data[i + 1] = final;
          data[i + 2] = final;
        }
        
        // Put processed image back on canvas
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  public async processImage(file: File, onProgress?: (progress: OCRProgress) => void): Promise<string> {
    try {
      if (onProgress) {
        onProgress({
          status: 'loading',
          progress: 0,
          message: 'Starting OCR...'
        });
      }

      const canvas = await this.preprocessImage(file);
      if (onProgress) {
        onProgress({
          status: 'processing',
          progress: 25,
          message: 'Pre-processing image...'
        });
      }

      const worker = await this.getWorker();
      if (onProgress) {
        onProgress({
          status: 'processing',
          progress: 50,
          message: 'Recognizing text...'
        });
      }

      const { data: { text } } = await worker.recognize(canvas);
      if (onProgress) {
        onProgress({
          status: 'processing',
          progress: 75,
          message: 'Cleaning up text...'
        });
      }

      // Clean up the text
      const cleanedText = text
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/[^\w\s-/]/g, '')  // Remove special characters except hyphen and forward slash
        .trim();

      if (onProgress) {
        onProgress({
          status: 'complete',
          progress: 100,
          message: 'OCR complete'
        });
      }

      return cleanedText;
    } catch (error) {
      if (onProgress) {
        onProgress({
          status: 'error',
          progress: 0,
          message: 'OCR failed'
        });
      }
      throw error;
    }
  }

  private async storeDocument(doc: ProcessedDocument): Promise<void> {
    const db = await getDB();
    await db.put('documents', doc);
  }

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

  public async processDocument(
    file: File,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ProcessedDocument> {
    try {
      onProgress({
        status: 'loading',
        progress: 0,
        message: 'Preparing document...'
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

      onProgress({
        status: 'processing',
        progress: 20,
        message: 'Reading file...'
      });

      doc.content = await contentPromise;

      onProgress({
        status: 'processing',
        progress: 40,
        message: 'Starting OCR...'
      });

      // Process image with OCR
      doc.text = await this.processImage(file, (ocrProgress) => {
        // Map OCR progress to overall progress (40-80%)
        const overallProgress = 40 + (ocrProgress.progress * 0.4);
        onProgress({
          status: 'processing',
          progress: overallProgress,
          message: ocrProgress.message
        });
      });

      onProgress({
        status: 'processing',
        progress: 80,
        message: 'Creating thumbnail...'
      });

      doc.thumbnail = await this.createThumbnail(file);

      onProgress({
        status: 'storing',
        progress: 90,
        message: 'Storing document...'
      });

      await this.storeDocument(doc);

      onProgress({
        status: 'complete',
        progress: 100,
        message: 'Document processed successfully'
      });

      return doc;
    } catch (error) {
      onProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to process document'
      });
      throw error;
    }
  }

  public async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
} 