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

      {/* Document Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Empty state */}
        <div className="col-span-full">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No documents
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading a document
            </p>
            <div className="mt-6">
              <Link
                href="/documents/upload"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Upload Document
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 