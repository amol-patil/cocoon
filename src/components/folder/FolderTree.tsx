import { useState, useEffect, useCallback } from 'react';
import { Folder } from '@/lib/types';
import { FolderService } from '@/lib/services/folderService';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface FolderTreeProps {
  selectedFolderId?: string;
  onFolderSelect: (folderId: string) => void;
}

export function FolderTree({ selectedFolderId, onFolderSelect }: FolderTreeProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<string | undefined>();

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const allFolders = await FolderService.getAllFolders();
      setFolders(allFolders);
    } catch (err) {
      console.error('Failed to load folders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  const handleFolderClick = async (folder: Folder) => {
    if (expandedFolders.has(folder.id)) {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        next.delete(folder.id);
        return next;
      });
    } else {
      setExpandedFolders(prev => new Set(prev).add(folder.id));
      const childFolders = await FolderService.getFolders(folder.id);
      setFolders(prev => [...prev, ...childFolders]);
    }
    onFolderSelect(folder.id);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const newFolder = await FolderService.createFolder(newFolderName, parentFolderId);
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setIsCreating(false);
      setParentFolderId(undefined);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      const updatedFolder = await FolderService.updateFolder(editingFolder.id, { name: newFolderName });
      setFolders(prev => prev.map(f => f.id === updatedFolder.id ? updatedFolder : f));
      setEditingFolder(null);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder and all its contents?')) return;

    try {
      await FolderService.deleteFolder(folderId);
      setFolders(prev => prev.filter(f => f.id !== folderId));
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const childFolders = folders.filter(f => f.parentId === folder.id);

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-gray-100' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          {childFolders.length > 0 && (
            <button
              onClick={() => handleFolderClick(folder)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          <FolderIcon className="w-4 h-4 text-gray-500" />
          {editingFolder?.id === folder.id ? (
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateFolder()}
              className="flex-1 px-2 py-1 text-sm border rounded"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 text-sm"
              onClick={() => handleFolderClick(folder)}
            >
              {folder.name}
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditingFolder(folder);
                setNewFolderName(folder.name);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteFolder(folder.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setParentFolderId(folder.id);
                setIsCreating(true);
                setNewFolderName('');
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isExpanded && childFolders.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <h3 className="text-sm font-medium text-gray-900">Folders</h3>
        <button
          onClick={() => {
            setParentFolderId(undefined);
            setIsCreating(true);
            setNewFolderName('');
          }}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
      {loading ? (
        <div className="px-2 py-4 text-center">
          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" />
          <p className="mt-2 text-sm text-gray-500">Loading folders...</p>
        </div>
      ) : error ? (
        <div className="px-2 py-4 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : (
        <>
          {isCreating && (
            <div className="px-2 py-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                placeholder="New folder name"
                className="w-full px-2 py-1 text-sm border rounded"
                autoFocus
              />
            </div>
          )}
          <div className="space-y-1">
            {folders
              .filter(f => !f.parentId)
              .map(folder => renderFolder(folder))}
          </div>
        </>
      )}
    </div>
  );
} 