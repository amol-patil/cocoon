'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { DocumentProcessor } from '@/lib/services/documentProcessor';
import { DocumentService } from '@/lib/services/documentService';
import { useFolders } from '@/lib/hooks/useFolders';
import type { ProcessingProgress } from '@/lib/services/documentProcessor';
import { ArrowUpTrayIcon, FolderIcon } from '@heroicons/react/24/outline';

export function UploadZone() {
  const router = useRouter();
  const { folders } = useFolders();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

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
        documentType,
        folderId: selectedFolderId
      });

      const processor = new DocumentProcessor();
      const processedDoc = await processor.processDocument(selectedFile, documentType, (progress) => {
        setProgress(progress);
      });

      // Add folder ID if selected
      if (selectedFolderId) {
        processedDoc.folderId = selectedFolderId;
      }

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
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {selectedFile
              ? selectedFile.name
              : 'Drag and drop a file here, or click to select a file'}
          </p>
          <p className="mt-1 text-xs text-gray-500">PDF, PNG, or JPG up to 20MB</p>
        </div>
      </div>

      {selectedFile && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="documentType"
              className="block text-sm font-medium text-gray-700"
            >
              Document Type
            </label>
            <input
              type="text"
              id="documentType"
              name="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Invoice, Receipt, Contract"
              required
            />
          </div>

          <div>
            <label
              htmlFor="folder"
              className="block text-sm font-medium text-gray-700"
            >
              Folder (optional)
            </label>
            <div className="mt-1">
              <select
                id="folder"
                name="folder"
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.message}</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !documentType.trim()}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
} 