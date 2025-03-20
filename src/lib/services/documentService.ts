import { Document } from '@/lib/types';
import { getDB } from '@/lib/storage/indexeddb';

export class DocumentService {
  static async createDocument(document: Document): Promise<Document> {
    console.log('DocumentService: Creating document:', document);
    const db = await getDB();
    console.log('DocumentService: Got database connection');
    
    try {
      const id = await db.add('documents', document);
      console.log('DocumentService: Document added with ID:', id);
      
      const savedDoc = await db.get('documents', id);
      console.log('DocumentService: Retrieved saved document:', savedDoc);
      
      return savedDoc;
    } catch (error) {
      console.error('DocumentService: Error creating document:', error);
      throw error;
    }
  }

  static async getDocument(id: string): Promise<Document | undefined> {
    console.log('DocumentService: Getting document with ID:', id);
    const db = await getDB();
    
    try {
      const doc = await db.get('documents', id);
      console.log('DocumentService: Retrieved document:', doc);
      return doc;
    } catch (error) {
      console.error('DocumentService: Error getting document:', error);
      throw error;
    }
  }

  static async getAllDocuments(): Promise<Document[]> {
    console.log('DocumentService: Getting all documents');
    const db = await getDB();
    
    try {
      const docs = await db.getAll('documents');
      console.log('DocumentService: Retrieved all documents:', docs);
      return docs;
    } catch (error) {
      console.error('DocumentService: Error getting all documents:', error);
      throw error;
    }
  }

  static async getDocumentsByFolder(folderId?: string): Promise<Document[]> {
    console.log('DocumentService: Getting documents for folder:', folderId);
    const db = await getDB();
    
    try {
      if (folderId) {
        // If folderId is provided, get documents from that folder
        const docs = await db.getAllFromIndex('documents', 'by-folder', folderId);
        console.log('DocumentService: Retrieved documents for folder:', docs);
        return docs;
      } else {
        // If no folderId, get all documents and filter for root documents
        const allDocs = await db.getAll('documents');
        console.log('DocumentService: Total documents:', allDocs.length);
        const rootDocs = allDocs.filter(doc => !doc.folderId);
        console.log('DocumentService: Found root documents:', rootDocs);
        return rootDocs;
      }
    } catch (error) {
      console.error('DocumentService: Error getting documents by folder:', error);
      throw error;
    }
  }

  static async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    console.log('DocumentService: Updating document:', { id, updates });
    const db = await getDB();
    
    try {
      const doc = await db.get('documents', id);
      if (!doc) {
        console.error('DocumentService: Document not found:', id);
        throw new Error('Document not found');
      }

      const updatedDoc = { ...doc, ...updates };
      await db.put('documents', updatedDoc);
      console.log('DocumentService: Document updated successfully:', updatedDoc);
      
      return updatedDoc;
    } catch (error) {
      console.error('DocumentService: Error updating document:', error);
      throw error;
    }
  }

  static async deleteDocument(id: string): Promise<void> {
    console.log('DocumentService: Deleting document:', id);
    const db = await getDB();
    
    try {
      await db.delete('documents', id);
      console.log('DocumentService: Document deleted successfully');
    } catch (error) {
      console.error('DocumentService: Error deleting document:', error);
      throw error;
    }
  }

  static async getDocumentsByTag(tagId: string): Promise<Document[]> {
    console.log('DocumentService: Getting documents for tag:', tagId);
    const db = await getDB();
    
    try {
      const docs = await db.getAllFromIndex('documents', 'by-tag', tagId);
      console.log('DocumentService: Retrieved documents for tag:', docs);
      return docs;
    } catch (error) {
      console.error('DocumentService: Error getting documents by tag:', error);
      throw error;
    }
  }
} 