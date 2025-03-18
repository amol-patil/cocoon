'use client';

import { UploadZone } from '@/components/document/UploadZone';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/documents"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to documents
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Upload Document
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a document to process and store it in your library
        </p>
      </div>

      <UploadZone />
    </div>
  );
} 