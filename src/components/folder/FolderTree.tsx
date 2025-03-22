'use client';

import { useState } from 'react';
import { 
  FolderIcon, 
  FolderPlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Folder } from '@/lib/types';

interface FolderTreeProps {
  folders: Folder[];
  onCreateFolder: (parentId: string | null) => void;
  onSelectFolder: (folderId: string | null) => void;
  selectedFolderId: string | null;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
}

export function FolderTree({ 
  folders, 
  onCreateFolder, 
  onSelectFolder,
  selectedFolderId,
  onDeleteFolder,
  onRenameFolder
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleRename = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingName(currentName);
  };

  const handleRenameSubmit = (folderId: string) => {
    if (editingName.trim() && editingName !== folders.find(f => f.id === folderId)?.name) {
      onRenameFolder(folderId, editingName.trim());
    }
    setEditingFolderId(null);
    setEditingName('');
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const childFolders = folders.filter(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = childFolders.length > 0;
    const isEditing = editingFolderId === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`group flex items-center space-x-1 rounded-md px-2 py-1 ${
            selectedFolderId === folder.id
              ? 'bg-indigo-50 text-indigo-600'
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          <button
            onClick={() => hasChildren && toggleFolder(folder.id)}
            className={`${hasChildren ? 'visible' : 'invisible'} h-4 w-4 text-gray-400`}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleRenameSubmit(folder.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(folder.id);
                if (e.key === 'Escape') {
                  setEditingFolderId(null);
                  setEditingName('');
                }
              }}
              className="flex-1 rounded border-0 bg-white py-0.5 text-sm focus:ring-0"
              autoFocus
            />
          ) : (
            <>
              <button
                onClick={() => onSelectFolder(folder.id)}
                className="flex flex-1 items-center space-x-2 py-1"
              >
                <FolderIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{folder.name}</span>
              </button>
              <div className="invisible space-x-1 group-hover:visible">
                <button
                  onClick={() => onCreateFolder(folder.id)}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <PlusIcon className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => handleRename(folder.id, folder.name)}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <PencilIcon className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => onDeleteFolder(folder.id)}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <TrashIcon className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {childFolders.map(childFolder => renderFolder(childFolder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelectFolder(null)}
        className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 ${
          selectedFolderId === null
            ? 'bg-indigo-50 text-indigo-600'
            : 'hover:bg-gray-50'
        }`}
      >
        <FolderIcon className="h-4 w-4" />
        <span className="text-sm font-medium">All Documents</span>
      </button>
      {rootFolders.map(folder => renderFolder(folder))}
      <button
        onClick={() => onCreateFolder(null)}
        className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-gray-600 hover:bg-gray-50"
      >
        <FolderPlusIcon className="h-4 w-4" />
        <span className="text-sm">New Folder</span>
      </button>
    </div>
  );
} 