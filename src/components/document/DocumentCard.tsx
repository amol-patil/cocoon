'use client';

import { Document } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  console.log('DocumentCard: Rendering document:', document);
  
  return (
    <Link
      href={`/documents/${document.id}`}
      className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {document.thumbnail ? (
            <Image
              src={document.thumbnail}
              alt={document.name}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
              <DocumentIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {document.name}
          </h3>
          <p className="text-sm text-gray-500">
            {document.type} • {formatFileSize(document.size)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {document.tags.map(tagId => (
              <span
                key={tagId}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tagId}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 