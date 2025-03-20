'use client';

import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and organize your documents
          </p>
        </div>
        <Link
          href="/documents/upload"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Upload
        </Link>
      </div>
    </div>
  );
} 