import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../storage/indexeddb';
import type { Tag } from '../types';

export class TagService {
  static async createTag(name: string, color?: string): Promise<Tag> {
    const db = await getDB();
    const tag: Tag = {
      id: uuidv4(),
      name,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.add('tags', tag);
    return tag;
  }

  static async getTag(id: string): Promise<Tag | undefined> {
    const db = await getDB();
    return db.get('tags', id);
  }

  static async getAllTags(): Promise<Tag[]> {
    const db = await getDB();
    return db.getAll('tags');
  }

  static async updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    const db = await getDB();
    const tag = await TagService.getTag(id);
    if (!tag) {
      throw new Error('Tag not found');
    }
    const updatedTag = {
      ...tag,
      ...updates,
      updatedAt: new Date(),
    };
    await db.put('tags', updatedTag);
    return updatedTag;
  }

  static async deleteTag(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('tags', id);
  }

  static async getTagsByIds(ids: string[]): Promise<Tag[]> {
    const db = await getDB();
    const tags = await Promise.all(ids.map(id => db.get('tags', id)));
    return tags.filter((tag): tag is Tag => tag !== undefined);
  }
} 