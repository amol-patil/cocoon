export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  text: string;
  thumbnail?: string;
  folderId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, string>;
} 