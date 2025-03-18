'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export default function UploadZone() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('File type not supported. Please upload a PDF, JPG, or PNG file.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size too large. Maximum size is 20MB.');
      return false;
    }

    return true;
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    if (!validateFile(file)) {
      return;
    }

    // TODO: Implement file processing and storage
    console.log('Processing file:', file.name);
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    []
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div
        className={`relative rounded-lg border-2 border-dashed p-12 text-center ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={onFileSelect}
        />

        <div className="text-center">
          <DocumentArrowUpIcon
            className="mx-auto h-12 w-12 text-gray-400"
            aria-hidden="true"
          />
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
            >
              <span>Upload a file</span>
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">
            PDF, JPG or PNG up to 20MB
          </p>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 