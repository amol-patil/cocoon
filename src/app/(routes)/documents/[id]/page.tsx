'use client';

import { useEffect, useState, use } from 'react';
import { ArrowLeftIcon, TagIcon, CalendarIcon, DocumentIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getDB } from '@/lib/storage/indexeddb';
import { DocumentProcessor } from '@/lib/services/documentProcessor';
import type { ProcessedDocument, ProcessingProgress } from '@/lib/services/documentProcessor';

function base64ToBlob(base64: string): Blob {
  // Get the base64 data part (remove data:image/jpeg;base64, etc.)
  const base64Data = base64.split(',')[1];
  // Convert base64 to raw binary data
  const binaryString = window.atob(base64Data);
  // Convert binary data to byte array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // Create blob from byte array
  return new Blob([bytes]);
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [document, setDocument] = useState<ProcessedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const db = await getDB();
        const doc = await db.get('documents', id);
        if (!doc) {
          throw new Error('Document not found');
        }
        setDocument(doc);
        setEditedMetadata(doc.metadata || {});
      } catch (err) {
        console.error('Failed to load document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id]);

  const handleDelete = async () => {
    if (!document) return;
    
    try {
      const db = await getDB();
      await db.delete('documents', document.id);
      router.push('/documents');
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleReprocess = async () => {
    if (!document) return;

    try {
      setProcessing(true);
      setProgress({
        status: 'loading',
        progress: 0,
        message: 'Converting document...',
      });

      // Convert base64 back to file
      const blob = await base64ToBlob(document.content);
      const file = new File([blob], document.name, { type: document.type });

      console.log('Reprocessing document:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      // Process with Gemini
      const processor = new DocumentProcessor();
      const processedDoc = await processor.processDocument(
        file,
        'Document', // Default to generic document type for reprocessing
        setProgress
      );

      console.log('Document reprocessed:', {
        text: processedDoc.text?.substring(0, 100),
        metadata: processedDoc.metadata
      });

      // Update the UI
      setDocument(processedDoc);
      setProcessing(false);
      setProgress({
        status: 'complete',
        progress: 100,
        message: 'Document processed successfully',
      });
    } catch (error) {
      console.error('Failed to reprocess document:', error);
      setError(error instanceof Error ? error.message : 'Failed to process document');
      setProcessing(false);
      setProgress(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!document) return;

    try {
      const db = await getDB();
      const updatedDoc = {
        ...document,
        metadata: editedMetadata
      };
      await db.put('documents', updatedDoc);
      setDocument(updatedDoc);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleMetadataChange = (key: string, value: string) => {
    setEditedMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-gray-200" />
        <div className="h-64 rounded bg-gray-200" />
        <div className="h-32 rounded bg-gray-200" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Document not found'}</p>
            </div>
            <div className="mt-4">
              <Link
                href="/documents"
                className="text-sm font-medium text-red-800 hover:text-red-700"
              >
                ← Back to documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/documents"
              className="rounded-full bg-white p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">{document.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              onClick={() => {
                if (!document?.content) return;
                const blob = base64ToBlob(document.content);
                const url = URL.createObjectURL(blob);
                const a = window.document.createElement('a');
                a.href = url;
                a.download = document.name;
                window.document.body.appendChild(a);
                a.click();
                window.document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              Download
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {new Date(document.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <TagIcon className="mr-2 h-4 w-4" />
            {document.tags.length} tags
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Document</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this document? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Document preview */}
        <div className="col-span-2 flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4">
          {document.thumbnail ? (
            <Image
              src={document.thumbnail}
              alt={document.name}
              width={600}
              height={400}
              className="max-h-[600px] w-auto rounded-lg object-contain"
              unoptimized // Since we're using data URLs
            />
          ) : (
            <div className="flex h-96 items-center justify-center">
              <DocumentIcon className="h-24 w-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {document.tags.length > 0 ? (
                document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tags added yet</p>
              )}
            </div>
          </div>

          {/* Extracted Information */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Extracted Information</h3>
              <div className="flex items-center space-x-2">
                {document.text && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(document.text);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1 rounded-md bg-white px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
                {document.metadata && Object.keys(document.metadata).length > 0 && (
                  <>
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveChanges}
                          className="flex items-center space-x-1 rounded-md bg-indigo-600 px-2 py-1 text-sm text-white hover:bg-indigo-700"
                        >
                          <CheckIcon className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditedMetadata(document.metadata || {});
                          }}
                          className="flex items-center space-x-1 rounded-md bg-white px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          <span>Cancel</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-1 rounded-md bg-white px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        <span>Edit</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mt-2 rounded-md bg-gray-50 p-4">
              {document.text ? (
                <>
                  {/* Metadata Section */}
                  {document.metadata && Object.keys(document.metadata).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(isEditing ? editedMetadata : document.metadata)
                        .filter(([key]) => key !== 'text') // Exclude the text field
                        .map(([key, value]) => (
                          <div key={key} className="bg-white p-4 rounded-lg shadow">
                            <div className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                            {isEditing ? (
                              <textarea
                                value={value as string}
                                onChange={(e) => handleMetadataChange(key, e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                rows={3}
                              />
                            ) : (
                              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                {value}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  {processing ? (
                    <div className="w-full space-y-3">
                      <p className="text-sm font-medium text-gray-900">{progress?.message || 'Processing...'}</p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div 
                          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${progress?.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">No information extracted</p>
                      <button 
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                        onClick={handleReprocess}
                      >
                        Process Document
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 