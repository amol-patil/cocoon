'use client';

import { useState } from 'react';
import { 
  FolderIcon, 
  TagIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { FolderTree } from '@/components/folder/FolderTree';
import { useFolders } from '@/lib/hooks/useFolders';
import { CreateFolderDialog } from '@/components/folder/CreateFolderDialog';

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
    selectedFolderId,
    setSelectedFolderId,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useFolders();

  const handleCreateFolder = (parentId: string | null) => {
    setNewFolderParentId(parentId);
    setIsCreateFolderOpen(true);
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await updateFolder(folderId, { name: newName });
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder? All documents inside will be moved to root.')) {
      try {
        await deleteFolder(folderId);
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <h2 className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} text-lg font-semibold text-gray-900 transition-opacity`}>
            Organize
          </h2>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-1.5 hover:bg-gray-100"
          >
            {isSidebarOpen ? (
              <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        <div className={`${isSidebarOpen ? 'block' : 'hidden'} p-4`}>
          <div className="space-y-4">
            {/* Folders section */}
            <div>
              <div className="mb-2 flex items-center">
                <FolderIcon className="mr-2 h-5 w-5 text-gray-400" />
                <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0'} font-medium text-gray-700 transition-opacity`}>
                  Folders
                </span>
              </div>
              {foldersError ? (
                <div className="px-2 py-4 text-sm text-red-500">
                  Failed to load folders
                </div>
              ) : foldersLoading ? (
                <div className="px-2 py-4 text-sm text-gray-500">
                  Loading folders...
                </div>
              ) : (
                <FolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  onCreateFolder={handleCreateFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onRenameFolder={handleRenameFolder}
                />
              )}
            </div>

            {/* Tags section */}
            <div>
              <div className="mb-2 flex items-center">
                <TagIcon className="mr-2 h-5 w-5 text-gray-400" />
                <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0'} font-medium text-gray-700 transition-opacity`}>
                  Tags
                </span>
              </div>
              {/* Tag list will go here */}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="h-16 border-b border-gray-200 bg-white px-8">
          <div className="flex h-full items-center">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search documents..."
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>

      <CreateFolderDialog
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        parentId={newFolderParentId}
        onSubmit={createFolder}
      />
    </div>
  );
} 