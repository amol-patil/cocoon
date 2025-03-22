'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderService } from '@/lib/services/folderService';
import type { Folder } from '@/lib/types';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const allFolders = await FolderService.getAllFolders();
      setFolders(allFolders);
      setError(null);
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

  const createFolder = async (name: string, parentId: string | null = null) => {
    try {
      const newFolder = await FolderService.createFolder(name, parentId);
      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    } catch (err) {
      console.error('Failed to create folder:', err);
      throw err;
    }
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    try {
      const updatedFolder = await FolderService.updateFolder(id, updates);
      setFolders((prev) =>
        prev.map((folder) => (folder.id === id ? updatedFolder : folder))
      );
      return updatedFolder;
    } catch (err) {
      console.error('Failed to update folder:', err);
      throw err;
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      await FolderService.deleteFolder(id);
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
    } catch (err) {
      console.error('Failed to delete folder:', err);
      throw err;
    }
  };

  return {
    folders,
    loading,
    error,
    selectedFolderId,
    setSelectedFolderId,
    createFolder,
    updateFolder,
    deleteFolder,
    refresh: loadFolders,
  };
} 