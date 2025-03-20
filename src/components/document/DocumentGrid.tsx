'use client';

import { Document } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface DocumentGridProps {
  documents: Document[];
}

export function DocumentGrid({ documents }: DocumentGridProps) {
  console.log('DocumentGrid: Rendering with documents:', documents);
  
  if (documents.length === 0) {
    return (
      <div className="col-span-full">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <DocumentIcon className="h-12 w-12" aria-hidden="true" />
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No documents
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading a document
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map(doc => (
        <Link
          key={doc.id}
          href={`/documents/${doc.id}`}
          className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="aspect-square relative">
            {doc.thumbnail ? (
              <Image
                src={doc.thumbnail}
                alt={doc.name}
                width={400}
                height={300}
                className="w-full h-full object-cover rounded-t-lg"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-t-lg flex items-center justify-center">
                <DocumentIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {doc.name}
            </h3>
            <p className="text-sm text-gray-500">
              {doc.type} • {formatFileSize(doc.size)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {doc.tags.map(tagId => (
                <span
                  key={tagId}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tagId}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default DocumentGrid; 