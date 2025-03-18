'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentProcessor } from '@/lib/services/documentProcessor';
import type { ProcessingProgress } from '@/lib/services/documentProcessor';
import { getDB } from '@/lib/storage/indexeddb';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export function UploadZone() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);
    setProgress(null);

    try {
      const processor = new DocumentProcessor();
      const db = await getDB();

      for (const file of acceptedFiles) {
        const processedDoc = await processor.processDocument(file, (progress) => {
          setProgress(progress);
        });
        await db.put('documents', processedDoc);
      }

      // Redirect to documents page after successful upload
      window.location.href = '/documents';
    } catch (err) {
      console.error('Error processing document:', err);
      setError(err instanceof Error ? err.message : 'Failed to process document');
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`relative flex min-h-[200px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-12 text-center hover:bg-gray-50 ${
        isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
      }`}
    >
      <input {...getInputProps()} />
      <div>
        {isUploading ? (
          <div className="text-center">
            {progress ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {progress.message}
                  </h3>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-4 text-sm text-gray-500">Processing...</p>
              </>
            )}
          </div>
        ) : (
          <>
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm font-semibold text-gray-900">
              Drop your files here or click to upload
            </p>
            <p className="mt-2 text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
} 