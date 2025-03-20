'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { DocumentProcessor } from '@/lib/services/documentProcessor';
import { DocumentService } from '@/lib/services/documentService';
import type { ProcessingProgress } from '@/lib/services/documentProcessor';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export function UploadZone() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setSelectedFile(acceptedFiles[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentType.trim()) return;

    setIsUploading(true);
    setError(null);
    setProgress(null);

    try {
      console.log('UploadZone: Starting document upload:', {
        fileName: selectedFile.name,
        documentType
      });

      const processor = new DocumentProcessor();
      const processedDoc = await processor.processDocument(selectedFile, documentType, (progress) => {
        setProgress(progress);
      });

      console.log('UploadZone: Document processed, saving to database:', processedDoc);

      // Use DocumentService to save the document
      const savedDoc = await DocumentService.createDocument(processedDoc);
      console.log('UploadZone: Document saved successfully:', savedDoc);

      // Force a re-render of the document list
      router.refresh();
      
      // Navigate to documents page
      router.push('/documents');
    } catch (err) {
      console.error('UploadZone: Error processing document:', err);
      setError(err instanceof Error ? err.message : 'Failed to process document');
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                {selectedFile ? selectedFile.name : 'Drop your file here or click to upload'}
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

      <div className="space-y-2">
        <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
          What type of document is this? (required)
        </label>
        <input
          type="text"
          id="documentType"
          name="documentType"
          required
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          placeholder="e.g. Driver's License, Passport, Bank Statement..."
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <p className="text-xs text-gray-500">
          Please be as specific as possible to help with document processing
        </p>
      </div>

      <button
        type="submit"
        disabled={!selectedFile || !documentType.trim() || isUploading}
        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Processing...' : 'Upload Document'}
      </button>
    </form>
  );
} 