import { v4 as uuidv4 } from 'uuid';
import { getDB } from '@/lib/storage/indexeddb';
import { Folder } from '@/lib/types';

export class FolderService {
  static async createFolder(name: string, parentId: string | null = null): Promise<Folder> {
    console.log('FolderService: Creating folder:', { name, parentId });
    const db = await getDB();

    const folder: Folder = {
      id: uuidv4(),
      name,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await db.add('folders', folder);
      console.log('FolderService: Folder created successfully:', folder);
      return folder;
    } catch (error) {
      console.error('FolderService: Error creating folder:', error);
      throw error;
    }
  }

  static async getFolder(id: string): Promise<Folder | undefined> {
    console.log('Getting folder:', id);
    const db = await getDB();
    return db.get('folders', id);
  }

  static async getAllFolders(): Promise<Folder[]> {
    console.log('FolderService: Getting all folders');
    const db = await getDB();

    try {
      const folders = await db.getAll('folders');
      console.log('FolderService: Retrieved all folders:', folders);
      return folders;
    } catch (error) {
      console.error('FolderService: Error getting all folders:', error);
      throw error;
    }
  }

  static async getFolders(parentId: string | null = null): Promise<Folder[]> {
    console.log('FolderService: Getting folders with parentId:', parentId);
    const db = await getDB();

    try {
      if (parentId === null) {
        // Get root folders
        const folders = await db.getAllFromIndex('folders', 'by-parent', null);
        console.log('FolderService: Retrieved root folders:', folders);
        return folders;
      } else {
        // Get subfolders
        const folders = await db.getAllFromIndex('folders', 'by-parent', parentId);
        console.log('FolderService: Retrieved subfolders:', folders);
        return folders;
      }
    } catch (error) {
      console.error('FolderService: Error getting folders:', error);
      throw error;
    }
  }

  static async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    console.log('FolderService: Updating folder:', { id, updates });
    const db = await getDB();

    try {
      const folder = await db.get('folders', id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      const updatedFolder = {
        ...folder,
        ...updates,
        updatedAt: new Date(),
      };

      await db.put('folders', updatedFolder);
      console.log('FolderService: Folder updated successfully:', updatedFolder);
      return updatedFolder;
    } catch (error) {
      console.error('FolderService: Error updating folder:', error);
      throw error;
    }
  }

  static async deleteFolder(id: string): Promise<void> {
    console.log('FolderService: Deleting folder:', id);
    const db = await getDB();

    try {
      // Get all documents in this folder
      const documents = await db.getAllFromIndex('documents', 'by-folder', id);
      
      // Delete all documents in this folder
      for (const doc of documents) {
        await db.delete('documents', doc.id);
      }

      // Get all subfolders
      const subfolders = await db.getAllFromIndex('folders', 'by-parent', id);
      
      // Recursively delete subfolders
      for (const subfolder of subfolders) {
        await this.deleteFolder(subfolder.id);
      }

      // Delete the folder itself
      await db.delete('folders', id);
      console.log('FolderService: Folder and contents deleted successfully');
    } catch (error) {
      console.error('FolderService: Error deleting folder:', error);
      throw error;
    }
  }

  async getFolderPath(folderId: string): Promise<Folder[]> {
    console.log('Getting folder path for:', folderId);
    const path: Folder[] = [];
    let currentId = folderId;
    
    while (currentId) {
      const folder = await this.getFolder(currentId);
      if (!folder) break;
      path.unshift(folder);
      currentId = folder.parentId || '';
    }
    
    console.log('Retrieved folder path:', path);
    return path;
  }
} 