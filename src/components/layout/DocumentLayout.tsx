'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FolderTree } from '../folder/FolderTree';
import { TagList } from '../tag/TagList';
import { DocumentList } from '../document/DocumentList';
import { Bars3Icon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface DocumentLayoutProps {
  children?: ReactNode;
}

export function DocumentLayout({ children }: DocumentLayoutProps) {
  console.log('DocumentLayout: Rendering');
  const pathname = usePathname();
  
  const [selectedFolderId, setSelectedFolderId] = useState<string>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleFolderSelect = (folderId: string) => {
    console.log('DocumentLayout: Folder selected:', folderId);
    setSelectedFolderId(folderId);
  };

  const handleTagSelect = (tagId: string) => {
    console.log('DocumentLayout: Tag selected:', tagId);
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Only show children for specific routes
  const shouldShowChildren = pathname !== '/documents';

  console.log('DocumentLayout: Current state:', {
    selectedFolderId,
    selectedTags,
    viewMode,
    pathname,
    shouldShowChildren
  });

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Documents</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded md:hidden"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <FolderTree
                selectedFolderId={selectedFolderId}
                onFolderSelect={handleFolderSelect}
              />
            </div>
            <div className="p-4 border-t">
              <TagList
                selectedTags={selectedTags}
                onTagSelect={handleTagSelect}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 hover:bg-gray-100 rounded md:hidden"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
          {!shouldShowChildren && (
            <Link
              href="/documents/upload"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Upload
            </Link>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {shouldShowChildren ? children : (
            <DocumentList
              selectedFolderId={selectedFolderId}
              selectedTags={selectedTags}
              viewMode={viewMode}
            />
          )}
        </div>
      </div>
    </div>
  );
} 