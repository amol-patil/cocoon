import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../storage/indexeddb';
import type { Folder } from '../types';

export class FolderService {
  static async createFolder(name: string, parentId?: string): Promise<Folder> {
    console.log('Creating folder:', { name, parentId });
    const db = await getDB();
    const folder: Folder = {
      id: uuidv4(),
      name,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.add('folders', folder);
    return folder;
  }

  static async getFolder(id: string): Promise<Folder | undefined> {
    console.log('Getting folder:', id);
    const db = await getDB();
    return db.get('folders', id);
  }

  static async getAllFolders(): Promise<Folder[]> {
    console.log('Getting all folders');
    const db = await getDB();
    return db.getAll('folders');
  }

  static async getFolders(parentId?: string): Promise<Folder[]> {
    console.log('Getting folders for parent:', parentId);
    const db = await getDB();
    if (parentId) {
      const folders = await db.getAllFromIndex('folders', 'by-parent', parentId);
      console.log('Retrieved folders:', folders);
      return folders;
    } else {
      // Get root folders (those without a parent)
      const allFolders = await db.getAll('folders');
      const rootFolders = allFolders.filter(folder => !folder.parentId);
      console.log('Retrieved root folders:', rootFolders);
      return rootFolders;
    }
  }

  static async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    console.log('Updating folder:', { id, updates });
    const db = await getDB();
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
    return updatedFolder;
  }

  static async deleteFolder(id: string): Promise<void> {
    console.log('Deleting folder:', id);
    const db = await getDB();
    await db.delete('folders', id);
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