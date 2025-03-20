import { useState, useEffect, useCallback } from 'react';
import { Document } from '@/lib/types';
import { DocumentService } from '@/lib/services/documentService';
import { DocumentCard } from './DocumentCard';
import { DocumentGrid } from './DocumentGrid';

interface DocumentListProps {
  selectedFolderId?: string;
  selectedTags: string[];
  viewMode?: 'list' | 'grid';
}

export function DocumentList({ selectedFolderId, selectedTags, viewMode = 'grid' }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      console.log('DocumentList: Starting to load documents');
      setLoading(true);
      
      const docs = await DocumentService.getDocumentsByFolder(selectedFolderId);
      console.log('DocumentList: Loaded documents:', docs);
      
      // Sort documents by creation date, newest first
      docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      console.log('DocumentList: Final sorted documents:', docs);
      setDocuments(docs);
    } catch (err) {
      console.error('DocumentList: Failed to load documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [selectedFolderId]);

  const filterDocuments = useCallback(() => {
    console.log('DocumentList: Starting to filter documents');
    if (selectedTags.length === 0) {
      console.log('DocumentList: No tags selected, showing all documents');
      setFilteredDocuments(documents);
      return;
    }

    // Filter documents that have all selected tags
    const filtered = documents.filter(doc =>
      selectedTags.every(tagId => doc.tags.includes(tagId))
    );
    console.log('DocumentList: Filtered documents by tags:', filtered);

    setFilteredDocuments(filtered);
  }, [documents, selectedTags]);

  useEffect(() => {
    console.log('DocumentList: Component mounted');
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    console.log('DocumentList: selectedFolderId changed:', selectedFolderId);
    void loadDocuments();
  }, [selectedFolderId, loadDocuments]);

  useEffect(() => {
    console.log('DocumentList: documents or selectedTags changed:', {
      documentsCount: documents.length,
      selectedTags
    });
    filterDocuments();
  }, [documents, selectedTags, filterDocuments]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="mt-2 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('DocumentList: Rendering with filtered documents:', filteredDocuments);

  if (filteredDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No documents found</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return <DocumentGrid documents={filteredDocuments} />;
  }

  return (
    <div className="space-y-4">
      {filteredDocuments.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
} 