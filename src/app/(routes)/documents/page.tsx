'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { Document } from '@/lib/types';

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function DocumentsPage() {
  const { documents, loading, error } = useDocuments();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedDocuments = [...(documents || [])].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'name') {
      return modifier * a.name.localeCompare(b.name);
    }
    return modifier * (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime());
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

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

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* View mode toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="mr-1.5 h-5 w-5" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
              }`}
            >
              <ListBulletIcon className="mr-1.5 h-5 w-5" />
              List
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const menu = document.getElementById('sort-menu');
                if (menu) menu.classList.toggle('hidden');
              }}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Sort by: {sortField} ({sortOrder})
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </button>
            <div
              id="sort-menu"
              className="absolute right-0 z-10 mt-2 hidden w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div className="py-1">
                {(['name', 'createdAt', 'updatedAt'] as SortField[]).map((field) => (
                  <button
                    key={field}
                    onClick={() => {
                      setSortField(field);
                      document.getElementById('sort-menu')?.classList.add('hidden');
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {field}
                  </button>
                ))}
                <div className="my-1 border-t border-gray-100" />
                {(['asc', 'desc'] as SortOrder[]).map((order) => (
                  <button
                    key={order}
                    onClick={() => {
                      setSortOrder(order);
                      document.getElementById('sort-menu')?.classList.add('hidden');
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {order === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Document grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedDocuments.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedDocuments.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DocumentCard({ document }: { document: Document }) {
  return (
    <Link
      href={`/documents/${document.id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
    >
      <div className="aspect-[4/3] bg-gray-100 group-hover:opacity-75">
        {document.thumbnail ? (
          <img
            src={document.thumbnail}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <DocumentIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="text-sm font-medium text-gray-900">{document.name}</h3>
        <p className="text-sm text-gray-500">
          {new Date(document.createdAt).toLocaleDateString()}
        </p>
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {document.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function DocumentRow({ document }: { document: Document }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-6 py-4">
        <Link
          href={`/documents/${document.id}`}
          className="flex items-center"
        >
          <span className="text-sm font-medium text-gray-900">{document.name}</span>
        </Link>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {document.type}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {new Date(document.createdAt).toLocaleDateString()}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {new Date(document.updatedAt).toLocaleDateString()}
      </td>
    </tr>
  );
} 